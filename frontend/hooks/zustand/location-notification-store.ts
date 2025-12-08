import { create } from "zustand/react";
import { getPermissionsAsync, requestPermissionsAsync } from "expo-notifications";
import {
    deletePushTokenFromBackend,
    getExpoPushToken,
    registerPushNotificationChannel,
    sendLocationToBackend, sendPushTokenToBackend,
} from "@/services/notification-service";
import { Alert, Linking } from "react-native";
import { getClerkInstance } from "@clerk/clerk-expo";
import { getCurrentLocation } from "@/services/location-service";

interface LocationNotificationState {
    hasPermissions: boolean | null;
    isTracking: boolean;
    checkPermissions: () => Promise<boolean>;
    requestNotificationPermissions: () => Promise<boolean>;
    startTracking: () => Promise<void>;
    stopTracking: () => void;
}

const POLL_MS = 30_000;

export const useLocationNotificationStore = create<LocationNotificationState>(
    (set, get) => {
        // Singleton loop control for the whole app
        let loopRunning = false;
        let stopRequested = false;
        let isStarting = false; // guard against concurrent startTracking calls

        const sleep = (ms: number) =>
            new Promise<void>((resolve) => setTimeout(resolve, ms));

        const locationLoop = async () => {
            if (stopRequested) {
                loopRunning = false;
                return;
            }

            try {
                const loc = await getCurrentLocation();
                if (loc) {
                    console.debug("locationLoop: sending location to backend...")
                    await sendLocationToBackend(loc.coordinates.latitude, loc.coordinates.latitude);
                }
            } catch (e) {
                console.error("locationLoop: failed to send location", e);
            }

            if (stopRequested) {
                loopRunning = false;
                return;
            }

            await sleep(POLL_MS);

            if (!stopRequested) {
                await locationLoop();
            } else {
                loopRunning = false;
            }
        };

        return {
            hasPermissions: null,
            isTracking: false,

            checkPermissions: async () => {
                const res = await getPermissionsAsync();
                set({ hasPermissions: res.granted });
                return res.granted;
            },

            requestNotificationPermissions: async () => {
                const already = await get().checkPermissions();
                if (already) return true;

                const res = await requestPermissionsAsync();
                set({ hasPermissions: res.granted });
                if (!res.granted) {
                    Alert.alert(
                        "Permission required",
                        "Notification permission is required. Please enable it in settings.",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Open Settings", onPress: () => Linking.openSettings() }
                        ]
                    );
                }
                return res.granted;
            },

            startTracking: async () => {
                const { requestNotificationPermissions, isTracking } = get();

                // HARD guard before any await
                if (loopRunning || isStarting || isTracking) {
                    console.debug("startTracking: already tracking or starting");
                    return;
                }

                isStarting = true;

                try {
                    const granted = await requestNotificationPermissions();
                    if (!granted) {
                        console.warn("startTracking: permissions not granted");
                        return;
                    }

                    const token = await getExpoPushToken();
                    if (!token) {
                        console.error("startTracking: missing push token");
                        return;
                    }

                    await sendPushTokenToBackend(token)

                    const registered = await registerPushNotificationChannel();
                    if (!registered) {
                        console.error("startTracking: channel registration failed");
                        return;
                    }

                    stopRequested = false;
                    loopRunning = true;
                    set({ isTracking: true });

                    console.debug("startTracking: starting async location loop");
                    void locationLoop();
                } finally {
                    isStarting = false;
                }
            },

            stopTracking: () => {
                console.debug("stopTracking: stopping async location loop");
                if (getClerkInstance().isSignedIn) {
                    deletePushTokenFromBackend().catch(err => {
                        console.error("stopTracking:: error deleting push token in background:", err)
                    })
                }
                stopRequested = true;
                loopRunning = false;
                set({ isTracking: false });
            },
        };
    }
);