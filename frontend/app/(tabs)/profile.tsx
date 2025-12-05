import React, { useEffect } from "react";
import {
  Avatar,
  Button,
  Text,
  View,
  YStack,
  ScrollView,
  Spinner,
  Card,
  XStack,
} from "tamagui";
import { useClerk } from "@clerk/clerk-expo";
import { useGetAuthUser } from "@/hooks/tanstack/user";
import { Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LocationNotificationSettings from "@/components/settings/location-notification-settings";

/**
 * ProfilePage
 *
 * - Shows user avatar, display name, username and email (centered).
 * - Shows "Statistics" card (labels only; counts are intentionally not fetched here).
 * - Keeps LocationNotificationSettings component below Statistics.
 * - Shows "Sign Out" button with confirmation.
 */

export default function ProfilePage() {
  // query hook that fetches authenticated user info (from your existing hook)
  const authUserQuery = useGetAuthUser();

  // Clerk signOut helper
  const { signOut } = useClerk();

  // show alert if loading the profile resulted in an error
  useEffect(() => {
    if (authUserQuery.error) {
      Alert.alert(
        "Error loading profile",
        authUserQuery.error.message ?? "Unknown error"
      );
    }
  }, [authUserQuery.error]);

  // while fetching / pending, show centered spinner
  if (authUserQuery.isPending || authUserQuery.isFetching) {
    return (
      <View style={{ flex: 1 }}>
        <YStack rowGap={10} flex={1} justifyContent={"center"} alignItems={"center"}>
          <Spinner size={"large"} />
          <Text>Loading...</Text>
        </YStack>
      </View>
    );
  }

  // extract user object (may be undefined if query failed)
  const user = authUserQuery.data ?? {};

  /**
   * BACKEND API SPEC — please forward to backend devs:
   *
   * Endpoint:
   *   GET /api/users/:user_id/stats
   *
   * Purpose:
   *   Return simple numeric counts for the profile page.
   *
   * Example response (200 OK):
   * {
   *   "questions_count": 12,
   *   "responses_count": 34
   * }
   *
   * Notes:
   * - Frontend usage example: useGetUserStats(user.id)
   */

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={authUserQuery.isRefetching}
            enabled={true}
            onRefresh={authUserQuery.refetch}
          />
        }
      >
        <YStack padding="$4" gap="$4">
          {/* Page title */}
          <Text fontSize="$8" fontWeight="bold">
            Profile
          </Text>

          {/* If query errored — show message; otherwise show profile content */}
          {authUserQuery.isError ? (
            <Text color={"red"}>Could not load profile</Text>
          ) : (
            <YStack gap="$4">
              {/* Centered avatar + name block */}
              <View alignItems="center" gap="$3">
                <Avatar circular size={120}>
                  <Avatar.Image srcSet={user.avatar_url} />
                  <Avatar.Fallback backgroundColor={"$gray5"} />
                </Avatar>

                {/* Name + username + email (centered and larger) */}
                <YStack alignItems="center" gap="$1">
                  <Text fontSize="$7" fontWeight="bold">
                    {user.display_name ?? "Unknown User"}
                  </Text>

                  <Text fontSize="$4" color="$gray11">
                    @{user.username ?? "username"}
                  </Text>

                  <Text fontSize="$3" color="$gray11">
                    {user.email ?? ""}
                  </Text>
                </YStack>
              </View>

              {/* Statistics card (labels only) */}
              <Card borderRadius={10} padding="$3" elevation="$2" backgroundColor="$background">
                <YStack gap="$2">
                  <Text fontWeight="700" fontSize="$5">
                    Statistics
                  </Text>

                  <XStack justifyContent="space-between" alignItems="center" paddingVertical={8}>
                    <Text>Questions Asked</Text>
                    {/* Placeholder: replace with statsQuery.data.questions_count */}
                    <Text color="$gray10">—</Text>
                  </XStack>

                  <XStack justifyContent="space-between" alignItems="center" paddingVertical={8}>
                    <Text>Responses Given</Text>
                    {/* Placeholder: replace with statsQuery.data.responses_count */}
                    <Text color="$gray10">—</Text>
                  </XStack>
                </YStack>
              </Card>

              {/* Notification settings (keep existing component) */}
              <LocationNotificationSettings />

              {/* Sign Out button (kept as requested). Show confirmation first. */}
              <Button
                backgroundColor={"$red8"}
                onPress={() => {
                  Alert.alert("Sign out", "Are you sure you want to sign out?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Sign out", onPress: () => signOut() },
                  ]);
                }}
                theme="red"
                marginTop={6}
              >
                Sign Out
              </Button>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}