import { Avatar, Button, Text, View, YStack, ScrollView, Spinner, XStack } from "tamagui";
import { useClerk } from "@clerk/clerk-expo";
import { useGetAuthUser } from "@/hooks/tanstack/user";
import { useEffect } from "react";
import { Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LocationNotificationSettings from "@/components/settings/location-notification-settings";
import { isAxiosError } from "axios";

export default function ProfilePage() {
    const authUserQuery = useGetAuthUser();
    const { signOut } = useClerk();

    useEffect(() => {
        if (authUserQuery.error) {
            Alert.alert("Error loading profile", authUserQuery.error.message);
        }
    }, [authUserQuery.error]);

    if (authUserQuery.isPending || authUserQuery.isFetching) {
        return (
            <View style={{ flex: 1 }}>
                <YStack
                    rowGap={10}
                    flex={1}
                    justifyContent={"center"}
                    alignItems={"center"}
                >
                    <Spinner size={"large"} />
                    <Text>Loading...</Text>
                </YStack>
            </View>
        );
    }

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
                    {/* <Text fontSize="$8" fontWeight="bold">
            Profile
          </Text> */}

                    {authUserQuery.isError ? (
                        <Text color={"red"}>Could not load profile</Text>
                    ) : (
                        <YStack gap="$4">
                            <View alignItems="center" gap="$3">
                                <Avatar circular size={100}>
                                    <Avatar.Image
                                        srcSet={authUserQuery.data.avatar_url}
                                    />
                                    <Avatar.Fallback backgroundColor={"$gray5"} />
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

                           {/* === Fake statistics card (UI only) === */}
                            <YStack
                                backgroundColor="$gray2"
                                borderRadius="$6"
                                padding="$4"
                                gap="$3"
                            >
                                <XStack
                                    alignItems="center"
                                    justifyContent="space-between"
                                    marginBottom="$1"
                                >
                                    <Text fontSize="$5" fontWeight="bold">
                                        Statistics
                                    </Text>
                                    {/* simple arrow / trend text, can be changed later */}
                                    <Text fontSize="$3" color="$gray11">
                                        Overview
                                    </Text>
                                </XStack>

                                {/* Questions Asked row */}
                                <XStack
                                    alignItems="center"
                                    justifyContent="space-between"
                                    paddingVertical="$2"
                                    borderBottomWidth={1}
                                    borderBottomColor="$gray4"
                                >
                                    <Text fontSize="$4">Questions Asked</Text>
                                    {/* TODO: replace 0 with backend value from getQuestionNumber() */}
                                    <Text fontSize="$4" fontWeight="bold">
                                        0
                                    </Text>
                                </XStack>

                                {/* Responses Given row */}
                                <XStack
                                    alignItems="center"
                                    justifyContent="space-between"
                                    paddingVertical="$2"
                                >
                                    <Text fontSize="$4">Responses Given</Text>
                                    {/* TODO: replace 0 with backend value from getUserResponseNumber() */}
                                    <Text fontSize="$4" fontWeight="bold">
                                        0
                                    </Text>
                                </XStack>
                            </YStack>

                            <LocationNotificationSettings />
                        </YStack>
                    )}
                    <Button
                        backgroundColor={"$red8"}
                        onPress={() => signOut()}
                        theme="red"
                    >
                        Sign Out
                    </Button>
                </YStack>
            </ScrollView>
        </SafeAreaView>
    );
}
