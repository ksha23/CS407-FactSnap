import { useState, useEffect, useCallback } from "react";
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

/**
 * Hook to manage background location notifications
 */
export function useBackgroundLocationNotifications() {
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const { isSignedIn } = useAuth();

    const checkStatus = useCallback(async () => {
        try {
            // Check actual permissions
            const { status } = await Notifications.getPermissionsAsync();
            setHasPermission(status === 'granted');

            // Check if we have stored preference
            const enabled = await SecureStore.getItemAsync(NOTIFICATION_ENABLED_KEY);
            
            if (enabled === 'true' && status === 'granted') {
                setIsActive(true);
            } else {
                setIsActive(false);
            }
        } catch (error) {
            console.error("Error checking notification status:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    const startTracking = async () => {
        try {
            console.log("Starting background notification tracking...");
            setLoading(true);
            
            // 1. Register for push notifications
            console.log("Registering for push notifications...");
            const token = await registerForPushNotificationsAsync();
            if (!token) {
                console.log("Failed to get push token");
                const { status } = await Notifications.getPermissionsAsync();
                setHasPermission(status === 'granted');
                return false;
            }

            // 2. Send token to backend
            console.log("Got token, sending to backend...");
            await sendPushTokenToBackend(token);

            // 3. Send initial location (Async - don't await)
            console.log("Getting current location (async)...");
            getCurrentLocation().then(location => {
                if (location) {
                    console.log("Got location, sending to backend...", location.latitude, location.longitude);
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
            console.log("Tracking started successfully");
            return true;
        } catch (error) {
            console.error("Error starting tracking:", error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const stopTracking = async () => {
        try {
            setLoading(true);
            await SecureStore.setItemAsync(NOTIFICATION_ENABLED_KEY, 'false');
            if (isSignedIn) {
                deletePushTokenFromBackend().catch(err => 
                    console.error("Error deleting push token in background:", err)
                );
            }
            setIsActive(false);
        } catch (error) {
            console.error("Error stopping tracking:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;
        if (isActive) {
            intervalId = setInterval(async () => {
                const location = await getCurrentLocation();
                if (location) {
                    await sendLocationToBackend(location.latitude, location.longitude);
                }
            }, 30000); // 30 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isActive]);

    return {
        isActive,
        loading,
        hasPermission,
        startTracking,
        stopTracking,
        checkStatus,
    };
}
