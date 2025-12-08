import React, { useEffect } from "react";
import { Alert, Linking } from "react-native";
import { View, Text, YStack, XStack, Switch, Button, Spinner } from "tamagui";
import { useLocationNotificationStore } from "@/hooks/zustand/location-notification-store";

/**
 * Component to manage background location notification settings
 * Can be added to a settings page or profile page
 */
export default function LocationNotificationSettings() {
    // const { isActive, loading, hasPermission: hasNotificationPermission, startTracking, stopTracking, checkStatus } =
    //     useBackgroundLocationNotifications();

    const settings = useLocationNotificationStore()
    const loading = settings.hasPermissions == null

    useEffect(() => {
        settings.checkPermissions()
    }, []);

    // const handleToggle = async (enabled: boolean) => {
    //     try {
    //         if (enabled) {
    //             const started = await startTracking();
    //             if (!started) {
    //                 if (!hasNotificationPermission) {
    //                      Alert.alert(
    //                         "Permission required",
    //                         "Notification permission is required. Please enable it in settings.",
    //                         [
    //                             { text: "Cancel", style: "cancel" },
    //                             { text: "Open Settings", onPress: () => Linking.openSettings() }
    //                         ]
    //                     );
    //                 } else {
    //                     Alert.alert(
    //                         "Unable to enable",
    //                         "We couldn't enable background notifications. Please try again.",
    //                     );
    //                 }
    //                 await checkStatus();
    //             }
    //         } else {
    //             await stopTracking();
    //             await checkStatus();
    //         }
    //     } catch (error) {
    //         console.error("Failed to toggle background notifications:", error);
    //         Alert.alert(
    //             "Error",
    //             "We ran into an issue updating your notification settings.",
    //         );
    //         await checkStatus();
    //     }
    // };

    async function handleToggle(enabled: boolean) {
        try {
            if (enabled) {
                await settings.startTracking()
            } else {
                settings.stopTracking()
            }
        } catch (e) {
            console.error("Failed to toggle background notifications:", e);
            Alert.alert(
                "Error",
                "We ran into an issue updating your notification settings.",
            );
        }
    }

    return (
        <YStack gap="$4" padding="$4" backgroundColor="$background" borderRadius="$4">
            <YStack gap="$2">
                <Text fontSize="$6" fontWeight="bold">
                    Location-Based Notifications
                </Text>
                <Text fontSize="$3" color="$gray11">
                    Get notified when questions are posted near you (within 10 miles)
                </Text>
            </YStack>

            <XStack alignItems="center" justifyContent="space-between">
                <YStack gap="$1" flex={1}>
                    <Text fontSize="$4" fontWeight="600">
                        Enable Notifications
                    </Text>
                    <Text fontSize="$2" color="$gray11">
                        {settings.isTracking ? "Active - tracking your location" : "Disabled"}
                    </Text>
                </YStack>

                {loading ? (
                    <Spinner size="small" />
                ) : (
                    <Switch
                        size="$4"
                        checked={settings.isTracking}
                        onCheckedChange={(value) => {
                            void handleToggle(Boolean(value));
                        }}
                        disabled={loading}
                    >
                        <Switch.Thumb animation="quick" />
                    </Switch>
                )}
            </XStack>

            {!settings.hasPermissions && (
                <View
                    padding="$3"
                    backgroundColor="$red2"
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor="$red6"
                    marginTop="$2"
                >
                    <Text fontSize="$3" color="$red11">
                        ⚠️ Notification permission is required to receive alerts
                    </Text>
                    <Button
                        size="$3"
                        marginTop="$2"
                        onPress={async () => {
                            await settings.startTracking();
                        }}
                        disabled={loading}
                        theme="red"
                    >
                        Enable Notifications
                    </Button>
                </View>
            )}
        </YStack>
    );
}
