import {
  Avatar,
  Button,
  Text,
  View,
  YStack,
  ScrollView,
} from "tamagui";
import { useClerk } from "@clerk/clerk-expo";
import { useGetAuthUser } from "@/hooks/tanstack/user";
import { useEffect } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LocationNotificationSettings from "@/components/settings/location-notification-settings";

export default function ProfilePage() {
  const authUserQuery = useGetAuthUser();
  const { signOut } = useClerk();

  useEffect(() => {
    if (authUserQuery.error) {
      Alert.alert("Error loading profile", authUserQuery.error.message);
    }
  }, [authUserQuery.error]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
      <ScrollView>
        <YStack padding="$4" gap="$4">
          <Text fontSize="$8" fontWeight="bold">
            Profile
          </Text>

          {authUserQuery.isPending || authUserQuery.isFetching ? (
            <Text>Loading...</Text>
          ) : authUserQuery.isError ? (
            <Text color={"red"}>
              {authUserQuery.error ? authUserQuery.error.message : "Could not load profile"}
            </Text>
          ) : (
            <YStack gap="$4">
              <View alignItems="center" gap="$3">
                <Avatar circular size={100}>
                  <Avatar.Image srcSet={authUserQuery.data.avatar_url} />
                  <Avatar.Fallback backgroundColor={"$blue8"} />
                </Avatar>
                <YStack alignItems="center">
                  <Text fontSize="$6" fontWeight="bold">
                    {authUserQuery.data.display_name}
                  </Text>
                  <Text fontSize="$4" color="$gray11">
                    @{authUserQuery.data.username}
                  </Text>
                  <Text fontSize="$3" color="$gray11">
                    {authUserQuery.data.email}
                  </Text>
                </YStack>
              </View>

              <LocationNotificationSettings />
            </YStack>
          )}
          <YStack gap="$3">
            <Button onPress={() => authUserQuery.refetch()} theme="blue">
              Refresh Profile
            </Button>
            <Button backgroundColor={"$red8"} onPress={() => signOut()} theme="red">
              Sign Out
            </Button>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
