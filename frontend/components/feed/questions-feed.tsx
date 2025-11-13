import {useGetQuestionsFeed} from "@/hooks/tanstack/question";
import {Coordinates} from "@/services/location-service";
import {PageFilterType} from "@/services/axios-client";
import {useEffect, useState} from "react";
import {Button, Spinner, Text, YStack} from "tamagui";
import {FlatList, RefreshControl} from "react-native";
import QuestionCard from "@/components/card/question-card";
import {Question} from "@/models/question";
import {useQueryClient} from "@tanstack/react-query";
import {questionKeys} from "@/hooks/tanstack/query-keys";

type Props = {
    region: { center: Coordinates; radius: number; } | null;
    onQuestionsChange?: (questions: Question[]) => void;
}

export default function QuestionsFeed(props: Props) {
    // TODO: page filtering for question category, etc
    const [pageFilterType, setPageFilterType] = useState<PageFilterType>(PageFilterType.NONE)
    const [pageFilter, setPageFilter] = useState<string>("")

    const queryClient = useQueryClient()
    const query = useGetQuestionsFeed(
        props.region?.center ?? null,
        props.region?.radius ?? 0,
        pageFilterType,
        pageFilter,
    )

    function handleFeedRefresh() {
        query.refetch()
    }

    // function isEmpty() {
    //     return query.data?.pages.length === 1
    //         && query.data?.pages[0].questionIds.length === 0
    //         && !query.data?.pages[0].nextPageParam;
    // }

    function isLoading() {
        return query.isPending || (!query.isFetchingNextPage && query.isFetching)
    }

    function onEndReached() {
        if (!query.isFetchingNextPage && query.hasNextPage) {
            query.fetchNextPage();
        }
    }

    const pages = query.data?.pages ?? [];
    const questionIds = pages.flatMap((p) => p.questionIds);

    // Push question list upward when it changes
    useEffect(() => {
        if (props.onQuestionsChange) {
            const questions = questionIds
                .map((id) => queryClient.getQueryData(questionKeys.getQuestionById(id)))
                .filter(Boolean) as Question[];
            props.onQuestionsChange(questions);
        }
    }, [questionIds.length, query.data]);


    return (
        <YStack paddingTop={10} gap={5}>
            <Button onPress={handleFeedRefresh}>Refresh Feed</Button>
            <FlatList
                data={questionIds}
                scrollEnabled={false} // we assume this feed is placed into outer ScrollView component
                keyExtractor={id => id}
                renderItem={({ item }) => <QuestionCard questionId={item} showDetails={false} /> }
                contentContainerStyle={{gap: 5}} // gap between rows
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    !isLoading() ? (
                        <YStack f={1} jc="center" ai="center" p="$4">
                            <Text>No questions found</Text>
                        </YStack>
                    ) : null
                }
                ListFooterComponent={
                    isLoading() ? (
                        <YStack py="$3" ai="center">
                            <Spinner size={"large"}/>
                        </YStack>
                    ) : null
                }
            />
        </YStack>
    )
}