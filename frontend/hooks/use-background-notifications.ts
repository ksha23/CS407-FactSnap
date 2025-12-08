import { useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { useAuth } from "@clerk/clerk-expo";
import {
    registerForPushNotificationsAsync,
    sendPushTokenToBackend,
    deletePushTokenFromBackend,
    sendLocationToBackend,
} from "@/services/notification-service";

import { getCurrentLocation } from "@/services/location-service";

const NOTIFICATION_ENABLED_KEY = 'notifications_enabled';

export function useBackgroundLocationNotifications() {
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const { isSignedIn } = useAuth();
    const appState = useRef(AppState.currentState);
    
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
                if (location && appState.current === 'active') {
                    sendLocationToBackend(location.coordinates.latitude, location.coordinates.longitude).catch(err => 
                        console.error("Error sending location in background:", err)
                    );
                }
            }).catch(err => {
                // Only log if we are still active; otherwise this is expected when backgrounding/killing
                if (appState.current === 'active') {
                    console.error("Error getting location in background:", err);
                }
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

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    // 4. INTERVAL: Depends on isSignedIn so it cuts immediately on logout
    useEffect(() => {
        // CLEANUP FIRST: Always try to clear before potentially setting a new one
        if (intervalRef.current) {
            console.log("Cleaning up existing interval before starting new one");
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Only start if active AND signed in
        if (isActive && isSignedIn) {
            console.log("Initializing tracking interval ID:", Date.now()); // Unique ID for debugging
            
            // Execute IMMEDIATE update so we don't wait 10s for the first hit
            const runUpdate = async () => {
                if (appState.current !== 'active') return;
                try {
                    const location = await getCurrentLocation();
                    if (appState.current !== 'active') return;
                    
                    if (location) {
                        await sendLocationToBackend(location.coordinates.latitude, location.coordinates.longitude);
                    }
                } catch (e) {
                    if (appState.current === 'active') {
                        console.error("Location update failed", e);
                    }
                }
            };
            
            intervalRef.current = setInterval(async () => {
                if (appState.current === 'active') {
                    await runUpdate();
                }
            }, 30000);
        }

        // Cleanup function for when component unmounts or deps change
        return () => {
            if (intervalRef.current) {
                console.log("Tearing down interval on effect cleanup");
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