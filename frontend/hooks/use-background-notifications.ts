import { useState, useEffect } from "react";
import {
    registerForPushNotificationsAsync,
    sendPushTokenToBackend,
    sendLocationToBackend,
    getCurrentLocation,
} from "@/services/notification-service";

/**
 * Hook to manage background location notifications
 */
export function useBackgroundLocationNotifications() {
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(false);

    const startTracking = async () => {
        try {
            console.log("Starting background notification tracking...");
            setLoading(true);
            
            // 1. Register for push notifications
            console.log("Registering for push notifications...");
            const token = await registerForPushNotificationsAsync();
            if (token) {
                console.log("Got token, sending to backend...");
                await sendPushTokenToBackend(token);
            } else {
                console.log("Failed to get push token");
            }

            // 2. Send initial location
            console.log("Getting current location...");
            const location = await getCurrentLocation();
            if (location) {
                console.log("Got location, sending to backend...", location.latitude, location.longitude);
                await sendLocationToBackend(location.latitude, location.longitude);
            }

            setIsActive(true);
            console.log("Tracking started successfully");
            return true;
        } catch (error) {
            console.error("Error starting tracking:", error);
            return false;
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
        startTracking,
        stopTracking: () => setIsActive(false),
        checkStatus: async () => isActive,
    };
}
