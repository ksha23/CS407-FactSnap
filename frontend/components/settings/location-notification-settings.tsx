import React from "react";
import { Alert } from "react-native";
import { View, Text, YStack, XStack, Switch, Button, Spinner } from "tamagui";
import { useBackgroundLocationNotifications } from "@/hooks/use-background-notifications";
import { useLocationPermissions } from "@/hooks/use-location";

/**
 * Component to manage background location notification settings
 * Can be added to a settings page or profile page
 */
export default function LocationNotificationSettings() {
  const { isActive, loading, startTracking, stopTracking, checkStatus } =
    useBackgroundLocationNotifications();

  const {
    hasBackgroundPermission,
    requestBackgroundPermissions,
    loading: permissionLoading,
  } =
    useLocationPermissions();

  const handleToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        if (!hasBackgroundPermission) {
          const granted = await requestBackgroundPermissions();
          if (!granted) {
            Alert.alert(
              "Permission required",
              "Background location permission is required for notifications."
            );
            await checkStatus();
            return;
          }
        }

        const started = await startTracking();
        if (!started) {
          Alert.alert(
            "Unable to enable",
            "We couldn't enable background notifications. Please try again."
          );
          await checkStatus();
        }
      } else {
        await stopTracking();
        await checkStatus();
      }
    } catch (error) {
      console.error("Failed to toggle background notifications:", error);
      Alert.alert(
        "Error",
        "We ran into an issue updating your notification settings."
      );
      await checkStatus();
    }
  };

  return (
    <YStack
      gap="$4"
      padding="$4"
      backgroundColor="$background"
      borderRadius="$4"
    >
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
            {isActive ? "Active - tracking your location" : "Disabled"}
          </Text>
        </YStack>

        {loading ? (
          <Spinner size="small" />
        ) : (
          <Switch
            size="$4"
            checked={isActive}
            onCheckedChange={(value) => {
              void handleToggle(Boolean(value));
            }}
            disabled={loading}
          >
            <Switch.Thumb animation="quick" />
          </Switch>
        )}
      </XStack>

      {!hasBackgroundPermission && (
        <View
          padding="$3"
          backgroundColor="$yellow2"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$yellow6"
        >
          <Text fontSize="$3" color="$yellow11">
            ⚠️ Background location permission is required for this feature
          </Text>
          <Button
            size="$3"
            marginTop="$2"
            onPress={requestBackgroundPermissions}
            disabled={permissionLoading}
            theme="yellow"
          >
            Grant Permission
          </Button>
        </View>
      )}

      <View
        padding="$3"
        backgroundColor="$blue2"
        borderRadius="$3"
        borderWidth={1}
        borderColor="$blue6"
      >
        <Text fontSize="$2" color="$blue11">
          💡 This feature runs in the background and will notify you about
          nearby questions even when the app is closed.
        </Text>
      </View>
    </YStack>
  );
}
