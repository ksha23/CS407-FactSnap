import {useDeleteQuestion, useGetQuestionById} from "@/hooks/tanstack/question";
import {Avatar, Card, XStack, YStack, Text, Image, Button, H2, H3, Label, View} from "tamagui";
import {Calendar, Clock, MapPin, MessageCircle, SquarePen, Trash, ChevronLeft} from "@tamagui/lucide-icons";
import {ContentType, Question} from "@/models/question";
import {Location} from "@/models/location"
import QuestionMap from "@/components/map/question-map";
import {Badge} from "@/components/card/badge";
import {formatDisplayNumber, formatExpirationDate, multiFormatDateString} from "@/utils/formatter";
import {QuestionPollCard} from "@/components/card/question-poll";
import {useRouter} from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { Alert, ScrollView } from "react-native";

// Jerry
import ResponseCard from "@/components/card/response-card";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator } from "react-native";
import { TextInput } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { ImageCarousel } from "@/components/carousel/image-carousel";

type Props = {
    questionId: string;
    showDetails?: boolean;
};

export default function QuestionCard(props: Props) {
    const questionQuery = useGetQuestionById(props.questionId);
    const deleteQuestionMutation = useDeleteQuestion();

    const question = questionQuery.data;
    const router = useRouter();
    const isDetails = !!props.showDetails;


    const handleCardPress = () => {
      router.push({
        pathname: "/question/[id]",
        params: { id: props.questionId },
      });
    };


    const isExpired = useMemo(() => {
        if (question) {
            const expiry = new Date(question.expired_at)
            const now = new Date()
            return now.getTime() >= expiry.getTime()
        } else {
            return false
        }
    }, [question])


    function handleDelete() {
        deleteQuestionMutation.mutate(question!!.id);
        if (isDetails) {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.navigate({ pathname: "/(tabs)" });
            }
        }
    }

    if (!question) {
        return null;
    }

    return (
        <Card
            padding="$4"
            {...(!props.showDetails ? { onPress: handleCardPress } : {})}
        >

            {/* Owner actions */}
            {question.is_owned && (
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
                                params: { id: props.questionId },
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
                                    {
                                        text: "Cancel",
                                        onPress: () => {},
                                        style: "cancel",
                                    },
                                    {
                                        text: "OK",
                                        onPress: handleDelete,
                                    },
                                ],
                            );
                        }}
                    >
                        <Trash size={20} color="$red11" />
                    </Button>
                </XStack>
            )}

            <YStack gap={isDetails ? "$3" : "$2"}>
                {/* Header: avatar + badges */}
                {isDetails ? (
                    <>
                        {/* Author info (detailed) */}
                        <XStack alignItems="center" gap="$3">
                            <Avatar circular>
                                <Avatar.Image srcSet={question.author.avatar_url} />
                                <Avatar.Fallback backgroundColor={"$gray5"} />
                            </Avatar>
                            <YStack>
                                <Text>{question.author.display_name}</Text>
                                <Text color="$gray10">@{question.author.username}</Text>
                            </YStack>
                        </XStack>

                        {/* Category + Expired At Badges */}
                        <XStack gap="$2">
                            <Badge label={question.category} />
                            <Badge
                                icon={<Clock size={15} color="$red9" />}
                                label={formatExpirationDate(question.expired_at)}
                            />
                        </XStack>
                    </>
                ) : (
                    // COMPACT HEADER (showDetails = false)
                    <XStack alignItems="center" gap="$2">
                        <Avatar circular size="$2">
                            <Avatar.Image srcSet={question.author.avatar_url} />
                            <Avatar.Fallback backgroundColor="$gray5" />
                        </Avatar>

                        <XStack gap="$1" flexShrink={1} flexWrap="wrap">
                            <Badge label={question.category} />
                            <Badge
                                icon={<Clock size={14} color="$red9" />}
                                label={formatExpirationDate(question.expired_at)}
                            />
                        </XStack>
                    </XStack>
                )}

                {/* Title (always shown, but clamp in compact) */}
                <YStack>
                    <H3 numberOfLines={isDetails ? undefined : 2}>{question.title}</H3>
                    {/* Description/body: ONLY in details mode */}
                    {isDetails && question.body && <Text>{question.body}</Text>}
                </YStack>

                {/* Images */}
                {question.image_urls && question.image_urls.length > 0 && (
                    <YStack marginTop="$3">
                        <ImageCarousel
                            height={300}
                            imageUrls={question.image_urls}
                        />
                    </YStack>
                )}

                {/* Map + Location */}
                {isDetails ? (
                    <YStack>
                        <View>
                            <QuestionMap
                                location={question.location}
                                height={undefined}
                            />
                        </View>
                        <Text color="$gray10">Location: {question.location.name}</Text>
                    </YStack>
                ) : (
                    <Text color="$gray10" numberOfLines={1}>
                        📍 {question.location.name}
                    </Text>
                )}

                {/* Content */}
                {question.content.type !== ContentType.NONE &&
                    (isDetails ? (
                        question.content.data ? (
                            question.content.type === ContentType.POLL ? (
                                <QuestionPollCard poll={question.content.data} />
                            ) : null
                        ) : (
                            <Text color={"red"}>
                                Error loading {question.content.type.toLowerCase()}
                            </Text>
                        )
                    ) : (
                        <Text fontWeight={600} fontStyle={"italic"}>This question contains a {question.content.type.toLowerCase()}</Text>
                    )
                )}
                {/* Section: Creation + Edited Date + Responses Amount */}
                <XStack gap={"$1"}>
                    <Text color="$gray10">
                        {multiFormatDateString(question.created_at)}
                    </Text>
                    {question.edited_at && question.created_at != question.edited_at && (
                        <Text color="$gray10">
                            (edited {multiFormatDateString(question.edited_at).toLowerCase()})
                        </Text>
                        
                    )} 
                    <Text color="$gray10"> | </Text>
                    <Text color="$gray10">
                        {formatDisplayNumber(question.responses_amount)} responses
                    </Text>  
                </XStack>


            </YStack>
        </Card>
    );
}
