import { Button, Paragraph, Spinner, Text, XStack, YStack } from "tamagui";
import { Sparkles } from "@tamagui/lucide-icons";
import { useGetQuestionSummary } from "@/hooks/tanstack/response";
import React from "react";
import { LinearGradient } from "@tamagui/linear-gradient";
import { Badge } from "@/components/card/badge";

type Props = {
    questionId: string;
    disable: boolean;
};

export default function SummarizeResponsesButton(props: Props) {
    const summaryQuery = useGetQuestionSummary(props.questionId);
    const summary = summaryQuery.data;

    function handleClick() {
        summaryQuery.refetch();
    }

    function isLoading() {
        return summaryQuery.isFetching;
    }

    if (summaryQuery.error) {
        return (
            <YStack
                p="$4"
                borderWidth={1}
                borderColor="$gray8"
                borderRadius="$4"
                gap="$2"
            >
                <Text fontSize="$6" fontWeight="700">
                    Summary (AI)
                </Text>

                <Text color="red">
                    There was an error fetching summary of the responses. Please try again later...
                </Text>
            </YStack>
        );
    }

    return (
        <>
            {summary ? (
                <YStack
                    p="$4"
                    borderWidth={1}
                    borderColor="$gray8"
                    borderRadius="$4"
                    gap="$2"
                >
                    <Text fontSize="$6" fontWeight="700">
                        Summary (AI)
                    </Text>


                    <Text>{summary}</Text>
                </YStack>
            ) : (
                <LinearGradient
                    colors={["#6E54F6", "#A56CFF"]}
                    start={[0, 0]}
                    end={[1, 1]}
                    borderRadius="$4"
                >
                    <Button
                        onPress={handleClick}
                        disabled={isLoading() || props.disable}
                        bg="transparent"
                        borderWidth={0}
                        pressStyle={{ opacity: 0.7 }}
                    >
                        {isLoading() ? (
                            <XStack ai="center" jc="center" gap="$2">
                                <Spinner size="large" />
                                <Text>
                                    AI is generating...
                                </Text>
                            </XStack>
                        ) : (
                            <XStack gap="$2" ai="center">
                                <Button.Icon>
                                    <Sparkles size={20} />
                                </Button.Icon>
                                <Button.Text>Generate Summary</Button.Text>
                                <AIBadge />
                            </XStack>
                        )}
                    </Button>
                </LinearGradient>
            )}
        </>
    );
}

const AIBadge = () => (
    <YStack
        px="$2"
        py="$1"
        borderRadius="$2"
        bg="rgba(255,255,255,0.2)"
        animation="quick"
        enterStyle={{ scale: 0.8, opacity: 0 }}
        exitStyle={{ scale: 0.8, opacity: 0 }}
        hoverStyle={{ scale: 1.05 }}
        pressStyle={{ scale: 0.95 }}
        // pulse animation
        animateOnly={["scale", "opacity"]}
        scale={1}
        opacity={1}
    >
        <Text fontSize={10}>AI</Text>
    </YStack>
);
