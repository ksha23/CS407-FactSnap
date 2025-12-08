import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiClient } from "./axios-client";

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function getExpoPushToken() {
    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            console.log("Project ID not found");
        }
        // Get the token that uniquely identifies this device
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });
        console.log("Push Token:", tokenData.data);
        return tokenData.data;
    } catch (error) {
        console.error("Error getting push token:", error);
        return undefined;
    }
}

export async function registerPushNotificationChannel() {
    if (!Device.isDevice) {
        console.log('WARNING: Must use physical device for Push Notifications');
        return false;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
        return true
    } else {
        return false
    }
}



export async function sendPushTokenToBackend(token: string) {
    try {
        console.log("Sending push token to backend:", token);
        await apiClient.post("/users/push-token", { token });
        console.log("Push token sent successfully");
    } catch (error) {
        console.error("Error sending push token:", error);
    }
}

export async function deletePushTokenFromBackend() {
    try {
        console.log("Deleting push token from backend...");
        await apiClient.delete("/users/push-token");
        console.log("Push token deleted successfully");
    } catch (error) {
        console.error("Error deleting push token:", error);
    }
}

export async function sendLocationToBackend(latitude: number, longitude: number) {
    try {
        await apiClient.post("/users/location", { latitude, longitude });
    } catch (error) {
        console.error("Error sending location:", error);
    }
}