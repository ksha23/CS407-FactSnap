import { useState, useEffect, useCallback, useRef } from "react";
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { useAuth } from "@clerk/clerk-expo";
import {
    registerForPushNotificationsAsync,
    sendPushTokenToBackend,
    deletePushTokenFromBackend,
    sendLocationToBackend,
    getCurrentLocation,
} from "@/services/notification-service";

const NOTIFICATION_ENABLED_KEY = 'notifications_enabled';

export function useBackgroundLocationNotifications() {
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const { isSignedIn } = useAuth();
    
    // Use a Ref to ensure we don't create duplicate intervals even if state flickers
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // 1. Wrap stopTracking in useCallback so it can be used in useEffect
    const stopTracking = useCallback(async () => {
        try {
            setLoading(true);
            await SecureStore.setItemAsync(NOTIFICATION_ENABLED_KEY, 'false');
            
            // Only attempt backend cleanup if we are still signed in
            if (isSignedIn) {
                deletePushTokenFromBackend().catch(err => 
                    console.error("Error deleting push token in background:", err)
                );
            }
            setIsActive(false);
            
            // Explicitly clear interval here as a safety measure
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        } catch (error) {
            console.error("Error stopping tracking:", error);
        } finally {
            setLoading(false);
        }
    }, [isSignedIn]);

    // 2. Wrap startTracking in useCallback
    const startTracking = useCallback(async () => {
        try {
            console.log("Starting background notification tracking...");
            setLoading(true);
            
            const token = await registerForPushNotificationsAsync();
            if (!token) {
                const { status } = await Notifications.getPermissionsAsync();
                setHasPermission(status === 'granted');
                return false;
            }

            await sendPushTokenToBackend(token);

            getCurrentLocation().then(location => {
                if (location) {
                    sendLocationToBackend(location.latitude, location.longitude).catch(err => 
                        console.error("Error sending location in background:", err)
                    );
                }
            }).catch(err => {
                console.error("Error getting location in background:", err);
            });

            await SecureStore.setItemAsync(NOTIFICATION_ENABLED_KEY, 'true');
            setIsActive(true);
            setHasPermission(true);
            return true;
        } catch (error) {
            console.error("Error starting tracking:", error);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const checkStatus = useCallback(async () => {
        try {
            const { status } = await Notifications.getPermissionsAsync();
            setHasPermission(status === 'granted');
            const enabled = await SecureStore.getItemAsync(NOTIFICATION_ENABLED_KEY);
            
            // Only set active if enabled AND currently signed in
            if (enabled === 'true' && status === 'granted' && isSignedIn) {
                setIsActive(true);
            } else {
                setIsActive(false);
            }
        } catch (error) {
            console.error("Error checking notification status:", error);
        } finally {
            setLoading(false);
        }
    }, [isSignedIn]); // Add isSignedIn as dependency

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    // 3. Force stop if user signs out
    useEffect(() => {
        if (!isSignedIn && isActive) {
            console.log("User signed out - forcing tracking stop");
            stopTracking();
        }
    }, [isSignedIn, isActive, stopTracking]);

    // 4. INTERVAL: Depends on isSignedIn so it cuts immediately on logout
    useEffect(() => {
        // Clear any existing interval first
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Only start if active AND signed in
        if (isActive && isSignedIn) {
            console.log("Initializing tracking interval");
            intervalRef.current = setInterval(async () => {
                const location = await getCurrentLocation();
                if (location) {
                    await sendLocationToBackend(location.latitude, location.longitude);
                }
            }, 30000);
        }

        // Cleanup function
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isActive, isSignedIn]);

    return {
        isActive,
        loading,
        hasPermission,
        startTracking,
        stopTracking,
        checkStatus,
    };
}