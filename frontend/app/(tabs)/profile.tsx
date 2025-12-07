import { Avatar, Button, Text, View, YStack, ScrollView, Spinner, XStack, Input } from "tamagui";
import { useClerk } from "@clerk/clerk-expo";
import { useGetAuthUser, useGetUserStatistics, useEditAuthUser } from "@/hooks/tanstack/user";
import { useEffect, useState } from "react";
import { Alert, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LocationNotificationSettings from "@/components/settings/location-notification-settings";
import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import QuestionCard from "@/components/card/question-card";

export default function ProfilePage() {
    const authUserQuery = useGetAuthUser();
    const statisticsQuery = useGetUserStatistics();
    const { signOut } = useClerk();
    const router = useRouter();

    const editUserMutation = useEditAuthUser();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState("");

    useEffect(() => {
        if (authUserQuery.data?.display_name) {
            setNewDisplayName(authUserQuery.data.display_name);
        }
    }, [authUserQuery.data?.display_name]);

    useEffect(() => {
        if (authUserQuery.error) {
            Alert.alert("Error loading profile", authUserQuery.error.message);
        }
        if (statisticsQuery.error) {
            Alert.alert("Error loading statistics", statisticsQuery.error.message);
        }
    }, [authUserQuery.error, statisticsQuery.error]);

    if (
        authUserQuery.isPending ||
        authUserQuery.isFetching ||
        statisticsQuery.isPending ||
        statisticsQuery.isFetching
    ) {
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
                        refreshing={authUserQuery.isRefetching || statisticsQuery.isRefetching}
                        enabled={true}
                        onRefresh={() => {
                            authUserQuery.refetch();
                            statisticsQuery.refetch();
                        }}
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
                                <YStack alignItems="center" gap="$2">
                                    {/* 显示名 + 编辑 */}
                                    {!isEditingName ? (
                                        <XStack alignItems="center" gap="$2">
                                            <Text fontSize="$6" fontWeight="bold">
                                                {authUserQuery.data.display_name}
                                            </Text>
                                            <Button
                                                size="$2"
                                                backgroundColor="$gray3"
                                                onPress={() => setIsEditingName(true)}
                                            >
                                                <Text fontSize="$2">Edit</Text>
                                            </Button>
                                        </XStack>
                                    ) : (
                                        <YStack alignItems="center" gap="$2">
                                            <Input
                                                value={newDisplayName}
                                                onChangeText={setNewDisplayName}
                                                width={220}
                                                textAlign="center"
                                                maxLength={40}
                                                placeholder="Enter display name"
                                            />
                                            <XStack gap="$2">
                                                <Button
                                                    size="$2"
                                                    backgroundColor="$gray3"
                                                    onPress={() => {
                                                        setIsEditingName(false);
                                                        setNewDisplayName(authUserQuery.data.display_name ?? "");
                                                    }}
                                                >
                                                    <Text>Cancel</Text>
                                                </Button>
                                                <Button
                                                    size="$2"
                                                    backgroundColor="$blue8"
                                                    disabled={
                                                        editUserMutation.isPending ||
                                                        newDisplayName.trim().length === 0
                                                    }
                                                    onPress={() => {
                                                        const trimmed = newDisplayName.trim();
                                                        if (!trimmed) return;
                                                        editUserMutation.mutate(
                                                            { display_name: trimmed },
                                                            {
                                                                onSuccess: () => {
                                                                    // 成功后退出编辑态
                                                                    setIsEditingName(false);
                                                                },
                                                                onError: (err: any) => {
                                                                    Alert.alert(
                                                                        "Failed to update name",
                                                                        err?.message ?? "Unknown error",
                                                                    );
                                                                },
                                                            },
                                                        );
                                                    }}
                                                >
                                                    {editUserMutation.isPending ? (
                                                        <Spinner size="small" />
                                                    ) : (
                                                        <Text>Save</Text>
                                                    )}
                                                </Button>
                                            </XStack>
                                        </YStack>
                                    )}

                                    {/* 下面两行保持不变 */}
                                    <Text fontSize="$4" color="$gray11">
                                        @{authUserQuery.data.username}
                                    </Text>
                                    <Text fontSize="$3" color="$gray11">
                                        {authUserQuery.data.email}
                                    </Text>
                                </YStack>
                            </View>

                            {/* === Statistics card === */}
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
                                    <Text fontSize="$3" color="$gray11">
                                        Overview
                                    </Text>
                                </XStack>

                                {statisticsQuery.isError ? (
                                    <Text color={"$red10"} fontSize="$3">
                                        Could not load statistics
                                    </Text>
                                ) : (
                                    <>
                                        {/* Questions Asked row - clickable */}
                                        <Pressable
                                            onPress={() => router.push("/statistics/my-questions")}
                                        >
                                            <XStack
                                                alignItems="center"
                                                justifyContent="space-between"
                                                paddingVertical="$2"
                                                borderBottomWidth={1}
                                                borderBottomColor="$gray4"
                                            >
                                                <Text fontSize="$4">Questions Asked</Text>
                                                <XStack alignItems="center" gap="$2">
                                                    <Text fontSize="$4" fontWeight="bold">
                                                        {statisticsQuery.data?.question_count ?? 0}
                                                    </Text>
                                                    <Text fontSize="$3" color="$gray10">
                                                      View
                                                    </Text>
                                                </XStack>
                                            </XStack>
                                        </Pressable>

                                        {/* Responses Given row */}
                                        <Pressable onPress={() => router.push("/statistics/my-responses")}>
                                            <XStack
                                                alignItems="center"
                                                justifyContent="space-between"
                                                paddingVertical="$2"
                                            >
                                                <Text fontSize="$4">Responses Given</Text>
                                                <XStack alignItems="center" gap="$2">
                                                    <Text fontSize="$4" fontWeight="bold">
                                                        {statisticsQuery.data?.response_count ?? 0}
                                                    </Text>
                                                    <Text fontSize="$3" color="$gray10">
                                                      View
                                                    </Text>
                                                </XStack>
                                            </XStack>
                                        </Pressable>
                                    </>
                                )}
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
