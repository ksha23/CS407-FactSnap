import {useDeleteQuestion, useGetQuestionById} from "@/hooks/tanstack/question";
import {Avatar, Card, XStack, YStack, Text, Image, Button, H2, H3, Label, View} from "tamagui";
import {Calendar, Clock, MapPin, MessageCircle, SquarePen, Trash} from "@tamagui/lucide-icons";
import {ContentType, Question} from "@/models/question";
import {Location} from "@/models/location"
import QuestionMap from "@/components/map/question-map";
import {Badge} from "@/components/card/badge";
import {formatDisplayNumber, formatExpirationDate, multiFormatDateString} from "@/utils/formatter";
import {QuestionPollCard} from "@/components/card/question-poll";
import {useRouter} from "expo-router";
import {useMemo} from "react";
import {Alert} from "react-native";

type Props = {
    questionId: string;
    showDetails?: boolean;
}

export default function QuestionCard(props: Props) {
    const questionQuery = useGetQuestionById(props.questionId)
    const deleteQuestionMutation = useDeleteQuestion()

    const question = questionQuery.data
    const router = useRouter()

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
        // NOTE: this function is called after confirmation

        deleteQuestionMutation.mutate(question!!.id)
        if (props.showDetails) {
            if (router.canGoBack()) {
                router.back()
            } else {
                router.navigate({
                    pathname: "/(tabs)",
                })
            }
        }
    }

    if (!question) {
        return null
    }

    return (
        <Card
            padding="$4"
            onPress={() => {
                if (props.showDetails) {
                    return
                }
                router.push({
                    pathname: "/question/[id]",
                    params: {id: props.questionId},
                })
            }}
        >
            {/* Owner actions */}
            {question.is_owned && (
                <XStack position="absolute" top="$3" right="$3" gap="$3">
                    <Button
                        size="$2"
                        backgroundColor="$blue4"
                        onPress={(e) => {
                            e.stopPropagation()

                            // cant edit expired questions
                            if (isExpired) {
                                Alert.alert("You cannot edit this question", "This question has expired")
                                return
                            }

                            router.push({
                                pathname: "/question/[id]/edit",
                                params: { id: props.questionId },
                            })
                        }}
                    >
                        <SquarePen size={20} color="$blue11"/>
                    </Button>

                    <Button
                        size="$2"
                        backgroundColor="$red4"
                        onPress={(e) => {
                            e.stopPropagation()
                            Alert.alert(
                                "Confirm Action",
                                "Are you sure you want to delete this question?",
                                [
                                    {
                                        text: "Cancel",
                                        onPress: () => {},
                                        style: "cancel" // Optional: for iOS, makes the button appear as a cancel button
                                    },
                                    {
                                        text: "OK",
                                        onPress: handleDelete
                                    }
                                ]
                            );
                        }}
                    >
                        <Trash size={20} color="$red11"/>
                    </Button>
                </XStack>
            )}

            <YStack gap="$3">
                {/* Section: Author info */}
                <XStack alignItems="center" gap="$3">
                    <Avatar circular>
                        <Avatar.Image srcSet={question.author.avatar_url} />
                        <Avatar.Fallback backgroundColor={"$gray5"} />
                    </Avatar>
                    <YStack>
                        <Text>{question.author.display_name}</Text>
                        <Text color="$gray10">
                            @{question.author.username}
                        </Text>
                    </YStack>
                </XStack>

                {/* Section: Category + Expired At Badges */}
                <XStack gap={"$2"}>
                    <Badge label={question.category} />
                    <Badge icon={<Clock size={15} color={"$red9"}/>} label={formatExpirationDate(question.expired_at)} />
                </XStack>


                {/* Section: Title and Body */}
                <YStack>
                    <H3 numberOfLines={props.showDetails ? undefined : 2}>
                        {question.title}
                    </H3>
                    {question.body && (
                        <Text numberOfLines={props.showDetails ? undefined : 2}>
                            {question.body}
                        </Text>
                    )}
                </YStack>

                {/* TODO: Section: Images */}

                {/* Section: Map + Location */}
                {props.showDetails ? (
                    <YStack>
                        <View
                            onPress={() => {if (!props.showDetails) return}}
                        >
                            <QuestionMap
                                location={question.location}
                                height={props.showDetails ? undefined : 200}
                            />
                        </View>
                        <Text color="$gray10">Location: {question.location.name}</Text>
                    </YStack>

                ) : (
                    <YStack>
                        <Text color="$gray10">📍 {question.location.name}</Text>
                    </YStack>
                )}

                {/* Section: Content */}
                {question.content.type !== ContentType.NONE && (
                    props.showDetails ? (
                        question.content.data ? (
                            question.content.type === ContentType.POLL ? (
                                <QuestionPollCard poll={question.content.data}/>
                            ) : null
                        ) : <Text color={"red"}>Error loading {question.content.type.toLowerCase()}</Text>
                    ) : (
                        <Text fontWeight={600} fontStyle={"italic"}>This question contains a {question.content.type.toLowerCase()}</Text>
                    )
                )}

                {/* Section: Responses Amount */}
                <XStack gap={"$1"}>
                    <MessageCircle color="$gray10" size={20}/>
                    <Text color="$gray10">{formatDisplayNumber(question.responses_amount)} responses</Text>
                </XStack>

                {/* Section: Creation + Edited Date */}
                <XStack gap={"$1"}>
                    <Text color="$gray10">
                        {multiFormatDateString(question.created_at)}
                    </Text>
                    {question.edited_at && question.created_at != question.edited_at && (
                        <Text color="$gray10">
                            (edited {multiFormatDateString(question.edited_at).toLowerCase()})
                        </Text>
                    )}
                </XStack>

            </YStack>
        </Card>
    )
}