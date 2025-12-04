import { Button, Paragraph, Spinner, Text, YStack } from "tamagui";
import { Sparkles } from "@tamagui/lucide-icons";
import { useGetQuestionSummary } from "@/hooks/tanstack/response";
import React, { useEffect } from "react";
import { Alert } from "react-native";

type Props = {
    questionId: string
}

export default function SummarizeResponsesButton(props: Props) {
    const summaryQuery = useGetQuestionSummary(props.questionId);
    const summary = summaryQuery.data;

    // useEffect(() => {
    //     if (summaryQuery.error) {
    //         Alert.alert("Error fetching summary", summaryQuery.error.message);
    //     }
    // }, [summaryQuery.error]);

    function handleClick() {
        summaryQuery.refetch();
    }

    function isLoading() {
        return summaryQuery.isFetching;
    }

    if (summaryQuery.error) {
        return (
            <YStack f={1} jc="center" ai="center" p="$4">
                <Text color={"red"}>
                    There was an error fetching summary of the responses. Please try again later...
                </Text>
            </YStack>
        )
    }

    return (
        <>
            {summary ? (
                    <YStack f={1} jc="center" ai="center" p="$4">
                        <Text>{summary}</Text>
                    </YStack>
            ) : (
                <Button
                    onPress={handleClick}
                    disabled={isLoading()}
                >
                    {isLoading() ? (
                        <Spinner size="large" />
                    ) : (
                        <>
                            <Button.Icon>
                                <Sparkles size={20} />
                            </Button.Icon>
                            <Button.Text>
                                <Paragraph>Summarize Responses</Paragraph>
                            </Button.Text>
                        </>
                    )}
                </Button>
            )}
        </>
    );
}