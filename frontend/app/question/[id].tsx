import { useLocalSearchParams, useNavigation } from "expo-router";
import { Button, Paragraph, ScrollView, Spinner, Text, View, XStack, YStack } from "tamagui";
import { useEffect, useRef, useState } from "react";
import { resetInfiniteQuestionsList, useGetQuestionById } from "@/hooks/tanstack/question";
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, RefreshControl, TextInput } from "react-native";
import { isAxiosError } from "axios";
import QuestionCard from "@/components/card/question-card";
import { SafeAreaView } from "react-native-safe-area-context";
import ResponsesFeed from "@/components/feed/responses-feed";
import ResponseCard from "@/components/card/response-card";
import { questionKeys, responseKeys } from "@/hooks/tanstack/query-keys";
import ResponseForm from "@/components/form/response-form";
import { ArrowUp, Sparkles } from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useGetResponsesByQuestionId, useUpdateResponse } from "@/hooks/tanstack/response";
import {Response} from "@/models/response"
import EmailVerificationDialog from "@/components/dialog/email-verification-dialog";
import EditResponseFormModal from "@/components/form/edit-response-form";

export default function QuestionDetailsPage() {
    const { id } = useLocalSearchParams();
    const navigation = useNavigation();

    // for "scroll to top" functionality
    const listRef = useRef<FlatList<string>>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    function scrollToTop() {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }

    const queryClient = useQueryClient();

    // always fetch the question
    const questionQuery = useGetQuestionById(id as string, true);

    //  dynamically override the title of the current stack screen to the question title
    useEffect(() => {
        if (questionQuery.data) {
            navigation.setOptions({
                title: `${questionQuery.data.title}`,
                // headerBackButton : true,
            });
        }
    }, [questionQuery.data, navigation]);

    // fetch responses (don't fetch on component mount)
    const responsesQuery = useGetResponsesByQuestionId(id as string)

    useEffect(() => {
        if (questionQuery.error) {
            Alert.alert("Error loading question", questionQuery.error.message);
        }
    }, [questionQuery.error]);

    useEffect(() => {
        if (responsesQuery.error) {
            Alert.alert("Could not fetch responses feed", responsesQuery.error.message);
        }
    }, [responsesQuery.error]);

    function isResponsesLoading() {
        return responsesQuery.isPending || (!responsesQuery.isFetchingNextPage && responsesQuery.isFetching);
    }

    function isRefetching() {
        return questionQuery.isRefetching || responsesQuery.isRefetching
    }


    if (questionQuery.isError) {
        if (isAxiosError(questionQuery.error) && questionQuery.error.status !== 404) {
            return <Text color={"red"}>Could not load question {id}</Text>;
        } else {
            return (
                <Text color={"red"}>
                    Question not found. It may have been removed or doesn't exist
                </Text>
            );
        }
    }

    if (questionQuery.isPending || questionQuery.isFetching) {
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

    const question = questionQuery.data;

    const responseIds = (responsesQuery.data?.pages ?? [])
        .flatMap((p) => p.responseIds);

    return (
        <>
            <SafeAreaView edges={["left", "right", "bottom"]}>
                <FlatList
                    ref={listRef}
                    onScroll={(e) => {
                        const offsetY = e.nativeEvent.contentOffset.y;
                        setShowScrollTop(offsetY > 400); // show after 400px scroll
                    }}
                    scrollEventThrottle={16}
                    data={responseIds}
                    keyExtractor={(id) => id}
                    renderItem={({ item }) => (
                        <ResponseCard questionId={id as string} responseId={item} />
                    )}
                    contentContainerStyle={{ gap: 5 }} // gap between rows
                    onEndReached={() => {
                        if (!responsesQuery.isFetchingNextPage && responsesQuery.hasNextPage) {
                            responsesQuery.fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.6}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching()}
                            enabled={true}
                            onRefresh={() => {
                                // reset responses feed then refetch both the question and responses
                                resetInfiniteQuestionsList(queryClient, { queryKey: responseKeys.getResponsesByQuestionId(id as string)});
                                questionQuery.refetch()
                                responsesQuery.refetch()
                            }}
                        />
                    }
                    refreshing={isRefetching()}
                    ListHeaderComponent={
                        // Question Card + Response Form + Summarize Response Button
                        <YStack>
                            <QuestionCard questionId={question.id} showDetails={true} />
                            <YStack gap={"$2"} mt={"$2"}>
                                <ResponseForm question_id={question.id} />
                                <Button>
                                    <Button.Icon>
                                        <Sparkles size={20} />
                                    </Button.Icon>
                                    <Button.Text>
                                        <Paragraph>Summarize Responses</Paragraph>
                                    </Button.Text>
                                </Button>
                            </YStack>
                        </YStack>
                    }
                    ListHeaderComponentStyle={{ paddingBottom: 5 }}
                    ListEmptyComponent={
                        responsesQuery.error ? (
                            <YStack f={1} jc="center" ai="center" p="$4">
                                <Text color={"red"}>Error fetching responses feed</Text>
                            </YStack>
                        ) : !isResponsesLoading() ? (
                            <YStack f={1} jc="center" ai="center" p="$4">
                                <Text>No responses found</Text>
                            </YStack>
                        ) : null
                    }
                    ListFooterComponent={
                        responsesQuery.isFetchingNextPage || isResponsesLoading() ? (
                            <YStack py="$3" ai="center">
                                <Spinner size={"large"} />
                            </YStack>
                        ) : null
                    }
                />
                {/* floating scroll-to-top button */}
                {showScrollTop && (
                    <View position="absolute" bottom="$4" right="$4">
                        <Button circular size="$4" onPress={scrollToTop}>
                            <ArrowUp size={20} />
                        </Button>
                    </View>
                )}
            </SafeAreaView>
        </>

    )
}
