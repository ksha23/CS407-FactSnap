import { Avatar, Button, Text, View, YStack, ScrollView, Spinner, XStack } from "tamagui";
import { useClerk } from "@clerk/clerk-expo";
import { useGetAuthUser, useGetUserStatistics } from "@/hooks/tanstack/user";
import { useEffect, useState } from "react";
import { Alert, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LocationNotificationSettings from "@/components/settings/location-notification-settings";
import { isAxiosError } from "axios";
import { useGetMyQuestions, useGetRespondedQuestions } from "@/hooks/tanstack/question";
import QuestionCard from "@/components/card/question-card";

export default function ProfilePage() {
    const authUserQuery = useGetAuthUser();
    const statisticsQuery = useGetUserStatistics();
    const { signOut } = useClerk();

    const [showMyQuestions, setShowMyQuestions] = useState(false);
    const [showMyResponses, setShowMyResponses] = useState(false);

    const myQuestionsQuery = useGetMyQuestions();
    const myRespondedQuery = useGetRespondedQuestions();

    useEffect(() => {
        if (authUserQuery.error) {
            Alert.alert("Error loading profile", authUserQuery.error.message);
        }
        if (statisticsQuery.error) {
            Alert.alert("Error loading statistics", statisticsQuery.error.message);
        }
        if (myQuestionsQuery.error) {
            Alert.alert("Error loading questions", myQuestionsQuery.error.message);
        }
        if (myRespondedQuery.error) {
            Alert.alert("Error loading responded questions", myRespondedQuery.error.message);
        }
    }, [
        authUserQuery.error,
        statisticsQuery.error,
        myQuestionsQuery.error,
        myRespondedQuery.error,
    ]);


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
                                            onPress={() => setShowMyQuestions((prev) => !prev)}
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
                                                        {showMyQuestions ? "Hide" : "View"}
                                                    </Text>
                                                </XStack>
                                            </XStack>
                                        </Pressable>

                                        {/* Responses Given row */}
                                        <Pressable onPress={() => setShowMyResponses((prev) => !prev)}>
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
                                                        {showMyResponses ? "Hide" : "View"}
                                                    </Text>
                                                </XStack>
                                            </XStack>
                                        </Pressable>
                                    </>
                                )}
                            </YStack>

                            {showMyQuestions && (
                                <YStack
                                    backgroundColor="$gray1"
                                    borderRadius="$6"
                                    padding="$4"
                                    gap="$3"
                                >
                                    <Text fontSize="$5" fontWeight="bold">
                                        Your Questions
                                    </Text>

                                    {myQuestionsQuery.isPending || myQuestionsQuery.isFetching ? (
                                        <YStack alignItems="center" paddingVertical="$3" gap="$2">
                                            <Spinner size="small" />
                                            <Text fontSize="$3" color="$gray11">
                                                Loading your questions...
                                            </Text>
                                        </YStack>
                                    ) : myQuestionsQuery.data && myQuestionsQuery.data.length > 0 ? (
                                        <YStack gap="$2">
                                            {myQuestionsQuery.data.map((q) => (
                                                <QuestionCard
                                                    key={q.id}
                                                    questionId={q.id}
                                                    showDetails={false}
                                                />
                                            ))}
                                        </YStack>
                                    ) : (
                                        <Text fontSize="$3" color="$gray11">
                                            You haven't asked any questions yet.
                                        </Text>
                                    )}
                                </YStack>
                            )}

                            {showMyResponses && (
                                <YStack
                                    backgroundColor="$gray1"
                                    borderRadius="$6"
                                    padding="$4"
                                    gap="$3"
                                >
                                    <Text fontSize="$5" fontWeight="bold">
                                        Questions You Responded To
                                    </Text>

                                    {myRespondedQuery.isPending || myRespondedQuery.isFetching ? (
                                        <YStack alignItems="center" paddingVertical="$3" gap="$2">
                                            <Spinner size="small" />
                                            <Text fontSize="$3" color="$gray11">
                                                Loading questions you responded to...
                                            </Text>
                                        </YStack>
                                    ) : myRespondedQuery.data && myRespondedQuery.data.length > 0 ? (
                                        <YStack gap="$2">
                                            {myRespondedQuery.data.map((q) => (
                                                <QuestionCard
                                                    key={q.id}
                                                    questionId={q.id}
                                                    showDetails={false}
                                                />
                                            ))}
                                        </YStack>
                                    ) : (
                                        <Text fontSize="$3" color="$gray11">
                                            You haven't responded to any questions yet.
                                        </Text>
                                    )}
                                </YStack>
                            )}

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
