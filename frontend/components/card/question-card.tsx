import {useDeleteQuestion, useGetQuestionById} from "@/hooks/tanstack/question";
import {Avatar, Card, XStack, YStack, Text, Image, Button, H2, H3, Label, View, Popover, Adapt} from "tamagui";
import {Calendar, Clock, MapPin, MessageCircle, SquarePen, Trash, ChevronLeft, MoreVertical} from "@tamagui/lucide-icons";
import {ContentType, Question} from "@/models/question";
import {Location} from "@/models/location"
import QuestionMap from "@/components/map/question-map";
import {Badge} from "@/components/card/badge";
import {formatDisplayNumber, formatExpirationDate, multiFormatDateString} from "@/utils/formatter";
import {QuestionPollCard} from "@/components/card/question-poll";
import {useRouter} from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { Alert, ScrollView } from "react-native";


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
    const [menuOpen, setMenuOpen] = useState(false);


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

    const hasImages = question.image_urls && question.image_urls.length > 0;

    const HeaderContent = isDetails ? (
        <>
            {/* Author info (detailed) */}
            <XStack alignItems="center" gap="$3">
                <Avatar circular>
                    <Avatar.Image src={question.author.avatar_url} />
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
                <Avatar.Image src={question.author.avatar_url} />
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
    );

    const BodyContent = (
        <>
            {/* Title (always shown, but clamp in compact) */}
            <YStack>
                <H3 numberOfLines={isDetails ? undefined : 2}>{question.title}</H3>
                {/* Description/body: ONLY in details mode */}
                {isDetails && question.body && <Text>{question.body}</Text>}
            </YStack>

            {/* Images - ONLY IN DETAILS MODE HERE */}
            {isDetails && hasImages && (
                <YStack marginTop="$3">
                    <ImageCarousel
                        height={300}
                        imageUrls={question.image_urls!}
                    />
                </YStack>
            )}

            {/* Map + Location (Details) */}
            {isDetails &&
                <YStack>
                    <View>
                        <QuestionMap
                            location={question.location}
                            height={undefined}
                        />
                    </View>
                    <Text color="$gray10">Location: {question.location.name}</Text>
                </YStack>
            }



            {/* Content */}
            {question.content.type !== ContentType.NONE && (
                question.content.data ? (
                    question.content.type === ContentType.POLL ? (
                        <QuestionPollCard poll={question.content.data} />
                    ) : null
                ) : (
                    <Text color={"red"}>
                        Error loading {question.content.type.toLowerCase()}
                    </Text>
                )
            )}

            {/* Location (not details) */}
            {!isDetails && (
                <Text color="$gray10" numberOfLines={1}>
                    📍 {question.location.name}
                </Text>
            )}

        </>
    );

    const FooterContent = (
        <XStack gap={"$1"} flexWrap="wrap">
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
    );

    return (
        <Card
            padding="$4"
            {...(!props.showDetails ? { onPress: handleCardPress } : {})}
        >

            {/* Owner actions */}
            {question.is_owned && (
                <View position="absolute" top="$3" right="$3" zIndex={10}>
                    <Popover
                        size="$5"
                        allowFlip
                        placement="bottom-end"
                        open={menuOpen}
                        onOpenChange={setMenuOpen}
                    >
                        <Popover.Trigger asChild>
                            <Button
                                size="$4"
                                circular
                                chromeless
                                icon={MoreVertical}
                                onPress={(e) => {
                                    // Important: stop propagation so we don't navigate to details
                                    e.stopPropagation();
                                    setMenuOpen(true);
                                }}
                            />
                        </Popover.Trigger>

                        <Adapt when="sm" platform="touch">
                            <Popover.Sheet modal dismissOnSnapToBottom snapPoints={[25]}>
                                <Popover.Sheet.Frame padding="$4">
                                    <Adapt.Contents />
                                </Popover.Sheet.Frame>
                                <Popover.Sheet.Overlay
                                    animation="lazy"
                                    enterStyle={{ opacity: 0 }}
                                    exitStyle={{ opacity: 0 }}
                                />
                            </Popover.Sheet>
                        </Adapt>

                        <Popover.Content
                            borderWidth={1}
                            borderColor="$borderColor"
                            enterStyle={{ y: -10, opacity: 0 }}
                            exitStyle={{ y: -10, opacity: 0 }}
                            elevate
                            animation={[
                                'quick',
                                {
                                    opacity: {
                                        overshootClamping: true,
                                    },
                                },
                            ]}
                        >
                            <Popover.Arrow borderWidth={1} borderColor="$borderColor" />

                            <YStack gap="$2" minWidth={150}>
                                <Button
                                    size="$4"
                                    icon={SquarePen}
                                    justifyContent="flex-start"
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(false);

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
                                    Edit Question
                                </Button>

                                <Button
                                    size="$4"
                                    icon={Trash}
                                    theme="red"
                                    justifyContent="flex-start"
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(false);
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
                                    Delete Question
                                </Button>
                            </YStack>
                        </Popover.Content>
                    </Popover>
                </View>
            )}

            <YStack gap={isDetails ? "$3" : "$2"}>
                {HeaderContent}

                {!isDetails && hasImages ? (
                    <XStack gap="$3">
                        <Image
                            source={{ uri: question.image_urls![0] }}
                            width={100}
                            height={100}
                            borderRadius="$4"
                            objectFit="cover"
                        />
                        <YStack flex={1} gap="$2">
                            {BodyContent}
                        </YStack>
                    </XStack>
                ) : (
                    BodyContent
                )}

                {FooterContent}
            </YStack>
        </Card>
    );
}
