import { useMemo } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useDeleteQuestion, useGetQuestionById } from "@/hooks/tanstack/question";
import { Avatar, Card, XStack, YStack, Text, Button, H3, View } from "tamagui";
import { Clock, MessageCircle, SquarePen, Trash } from "@tamagui/lucide-icons";
import { ContentType } from "@/models/question";
import QuestionMap from "@/components/map/question-map";
import { Badge } from "@/components/card/badge";
import {
    formatDisplayNumber,
    formatExpirationDate,
    multiFormatDateString,
} from "@/utils/formatter";
import { QuestionPollCard } from "@/components/card/question-poll";

type Props = {
    questionId: string;
    showDetails?: boolean;
};

export default function QuestionCard({ questionId, showDetails }: Props) {
    const { data: question } = useGetQuestionById(questionId);
    const deleteQuestionMutation = useDeleteQuestion();
    const router = useRouter();
    const isDetails = !!showDetails;

    const isExpired = useMemo(() => {
        if (!question) return false;
        return Date.now() >= new Date(question.expired_at).getTime();
    }, [question]);

    if (!question) return null;

    const handleDelete = () => {
        deleteQuestionMutation.mutate(question.id);
        if (isDetails) {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.navigate({ pathname: "/(tabs)" });
            }
        }
    };

    const handleCardPress = () => {
        if (isDetails) return;
        router.push({ pathname: "/question/[id]", params: { id: questionId } });
    };

    const renderLocation = () =>
        isDetails ? (
            <YStack>
                <View>
                    <QuestionMap location={question.location} />
                </View>
                <Text color="$gray10">Location: {question.location.name}</Text>
            </YStack>
        ) : (
            <Text color="$gray10" numberOfLines={1}>
                📍 {question.location.name}
            </Text>
        );

    const renderContent = () => {
        const { type, data } = question.content;
        if (type === ContentType.NONE) return null;

        // Details view: show actual content (e.g., poll, etc.)
        if (isDetails) {
            if (!data) {
                return <Text color="red">Error loading {type.toLowerCase()}</Text>;
            }
            if (type === ContentType.POLL) {
                return <QuestionPollCard poll={data} />;
            }
            return null;
        }

        // List view: no "this question contains a ..." text anymore
        return null;
    };

    const renderOwnerActions = () =>
        question.is_owned ? (
            <XStack position="absolute" top="$3" right="$3" gap="$3">
                <Button
                    size="$2"
                    backgroundColor="$blue4"
                    onPress={(e) => {
                        e.stopPropagation();
                        if (isExpired) {
                            Alert.alert(
                                "You cannot edit this question",
                                "This question has expired",
                            );
                            return;
                        }
                        router.push({
                            pathname: "/question/[id]/edit",
                            params: { id: questionId },
                        });
                    }}
                >
                    <SquarePen size={20} color="$blue11" />
                </Button>
                <Button
                    size="$2"
                    backgroundColor="$red4"
                    onPress={(e) => {
                        e.stopPropagation();
                        Alert.alert(
                            "Confirm Action",
                            "Are you sure you want to delete this question?",
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "OK", onPress: handleDelete },
                            ],
                        );
                    }}
                >
                    <Trash size={20} color="$red11" />
                </Button>
            </XStack>
        ) : null;

    const editedSuffix =
        question.edited_at && question.created_at !== question.edited_at
            ? ` (edited ${multiFormatDateString(question.edited_at).toLowerCase()})`
            : "";

    return (
        <Card padding="$4" onPress={handleCardPress}>
            {renderOwnerActions()}

            <YStack gap="$2">
                {/* Author, Category, Expiration */}
                <XStack gap="$2" alignItems="center">
                    <Avatar circular size="$2">
                        <Avatar.Image srcSet={question.author.avatar_url} />
                        <Avatar.Fallback backgroundColor="$gray5" />
                    </Avatar>

                    <YStack gap="$1">
                        {isDetails && <Text>{question.author.display_name}</Text>}

                        <XStack gap="$2" alignItems="center">
                            <Badge label={question.category} />
                            <Badge
                                icon={<Clock size={15} color="$red9" />}
                                label={formatExpirationDate(question.expired_at)}
                            />
                        </XStack>
                    </YStack>
                </XStack>

                {/* Title */}
                <H3 numberOfLines={isDetails ? undefined : 2} fontWeight="500">
                    {question.title}
                </H3>

                {/* Body: ONLY in details view */}
                {isDetails && !!question.body && <Text>{question.body}</Text>}

                {/* Location */}
                {renderLocation()}

                {/* Content (poll, etc.) */}
                {renderContent()}

                {/* Responses + time in one line */}
                <XStack gap="$1" alignItems="center">
                    <MessageCircle color="$gray10" size={20} />
                    <Text color="$gray10" numberOfLines={1}>
                        {formatDisplayNumber(question.responses_amount)} responses •{" "}
                        {multiFormatDateString(question.created_at)}
                        {editedSuffix}
                    </Text>
                </XStack>
            </YStack>
        </Card>
    );
}
