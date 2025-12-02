// Provides background location tracking and notification services

import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { Coordinates, isWithinRadius } from "./location-service";
import { queryClient } from "@/app/_layout";
import { fetchNearbyLocationsForNotifications } from "./location-api-service";

const LOCATION_TASK_NAME = "background-location-task";
const NOTIFICATION_RADIUS_MILES = 0.2; // Default 0.2 mile radius

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Interface for nearby locations from API
 */
export interface NearbyLocation {
    id: string;
    coordinates: Coordinates;
    title: string;
    description?: string;
    radiusMiles?: number;
}

/**
 * Callback type for fetching nearby locations
 * This should make an API call to your backend
 */
type FetchNearbyLocationsCallback = (
    currentLocation: Coordinates,
    radiusMiles: number,
) => Promise<NearbyLocation[]>;

// Store the callback globally (set when registering)
let fetchNearbyLocationsCallback: FetchNearbyLocationsCallback | null = null;

/**
 * Define the background location task
 * This runs even when the app is closed/backgrounded
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
    if (error) {
        console.error("Background location task error:", error);
        return;
    }

    if (data) {
        const { locations } = data;
        const location = locations[0];

        if (location) {
            const currentCoords: Coordinates = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            try {
                // Fetch nearby locations from API. Prefer the provided callback if set,
                // otherwise use the app's QueryClient to fetch via the service function so
                // background tasks go through TanStack Query's cache and retry rules.
                let nearbyLocations: NearbyLocation[] = [];

                if (fetchNearbyLocationsCallback) {
                    nearbyLocations = await fetchNearbyLocationsCallback(
                        currentCoords,
                        NOTIFICATION_RADIUS_MILES,
                    );
                } else {
                    // Use a simple query key based on coordinates and radius
                    const key = [
                        "backgroundNearby",
                        currentCoords.latitude,
                        currentCoords.longitude,
                        NOTIFICATION_RADIUS_MILES,
                    ];
                    try {
                        nearbyLocations = await queryClient.fetchQuery<NearbyLocation[]>({
                            queryKey: key,
                            queryFn: () =>
                                fetchNearbyLocationsForNotifications(
                                    currentCoords,
                                    NOTIFICATION_RADIUS_MILES,
                                ),
                        });
                    } catch (err) {
                        console.error(
                            "Error fetching nearby locations via queryClient in background task:",
                            err,
                        );
                        nearbyLocations = [];
                    }
                }

                // Check if there are any nearby locations
                if (nearbyLocations.length > 0) {
                    // Send notification about nearby locations
                    await sendNearbyLocationNotification(
                        nearbyLocations.length,
                        nearbyLocations[0],
                    );
                }
            } catch (error) {
                console.error("Error fetching nearby locations in background:", error);
            }
        }
    }
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            console.log("Notification permissions not granted");
            return false;
        }

        // Set up notification channel for Android
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("location-alerts", {
                name: "Location Alerts",
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#FF231F7C",
            });
        }

        return true;
    } catch (error) {
        console.error("Error requesting notification permissions:", error);
        return false;
    }
}

/**
 * Send a notification about nearby locations
 */
async function sendNearbyLocationNotification(
    count: number,
    firstLocation: NearbyLocation,
): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "📍 Nearby Activity",
            body:
                count === 1
                    ? `${firstLocation.title} is near you`
                    : `${count} locations are near you, including ${firstLocation.title}`,
            data: { locationId: firstLocation.id },
            sound: true,
        },
        trigger: null, // Send immediately
    });
}

/**
 * Start background location tracking for notifications
 * @param fetchCallback - Function to fetch nearby locations from your API
 */
export async function startBackgroundLocationTracking(
    fetchCallback?: FetchNearbyLocationsCallback,
): Promise<boolean> {
    try {
        // Request necessary permissions
        const notificationPermission = await requestNotificationPermissions();
        if (!notificationPermission) {
            console.log("Notification permissions required");
            return false;
        }

        // Note: Background location permissions should be requested separately
        // This is handled in location-service.ts via requestBackgroundLocationPermissions()
        const { status } = await Location.getBackgroundPermissionsAsync();
        if (status !== "granted") {
            console.log("Background location permissions required");
            return false;
        }

        // Store the callback if provided; if omitted the background task will use
        // the QueryClient + `fetchNearbyLocationsForNotifications` fallback.
        fetchNearbyLocationsCallback = fetchCallback ?? null;

        // Check if task is already registered
        const isTaskRegistered =
            await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);

        if (isTaskRegistered) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }

        // Start location updates
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 300000, // 5 minutes
            distanceInterval: 500, // 500 meters
            foregroundService: {
                notificationTitle: "FactSnap Location",
                notificationBody: "Tracking location for nearby notifications",
                notificationColor: "#FF231F7C",
            },
            showsBackgroundLocationIndicator: true,
            pausesUpdatesAutomatically: true,
        });

        console.log("Background location tracking started");
        return true;
    } catch (error) {
        console.error("Error starting background location tracking:", error);
        return false;
    }
}

/**
 * Stop background location tracking
 */
export async function stopBackgroundLocationTracking(): Promise<void> {
    try {
        const isTaskRegistered =
            await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);

        if (isTaskRegistered) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            console.log("Background location tracking stopped");
            fetchNearbyLocationsCallback = null;
        }
    } catch (error) {
        console.error("Error stopping background location tracking:", error);
    }
}

/**
 * Check if background location tracking is active
 */
export async function isBackgroundLocationTrackingActive(): Promise<boolean> {
    try {
        return await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    } catch (error) {
        console.error("Error checking background location tracking status:", error);
        return false;
    }
}

/**
 * Schedule a test notification (for testing purposes)
 */
export async function sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Test Notification",
            body: "Background location notifications are working!",
            data: { test: true },
        },
        trigger: null,
    });
}

/**
 * Manually trigger a location check (for foreground use)
 * This can be called when the app is open to check nearby locations
 */
export async function checkNearbyLocations(
    fetchCallback: FetchNearbyLocationsCallback,
): Promise<NearbyLocation[]> {
    try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") {
            console.log("Foreground location permissions required");
            return [];
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        const currentCoords: Coordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };

        const nearbyLocations = await fetchCallback(
            currentCoords,
            NOTIFICATION_RADIUS_MILES,
        );
        return nearbyLocations;
    } catch (error) {
        console.error("Error checking nearby locations:", error);
        return [];
    }
}
