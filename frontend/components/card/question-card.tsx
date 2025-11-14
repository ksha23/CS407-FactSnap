import {useGetQuestionById} from "@/hooks/tanstack/question";
import {Avatar, Card, XStack, YStack, Text, Image, Button, H2, H3, Label, View} from "tamagui";
import {Calendar, Clock, MapPin} from "@tamagui/lucide-icons";
import {ContentType, Question} from "@/models/question";
import {Location} from "@/models/location"
import QuestionMap from "@/components/map/question-map";
import {Badge} from "@/components/card/badge";
import {formatExpirationDate, multiFormatDateString} from "@/utils/formatter";
import {QuestionPollCard} from "@/components/card/question-poll";
import {useRouter} from "expo-router";

type Props = {
    questionId: string;
    showDetails?: boolean;
}

export default function QuestionCard(props: Props) {
    const questionQuery = useGetQuestionById(props.questionId)
    const question = questionQuery.data!!
    const router = useRouter()


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
            <YStack gap="$3">
                {/* Section: Author info */}
                <XStack alignItems="center" gap="$3">
                    <Avatar circular>
                        <Avatar.Image src={question.author.avatar_url ?? ""} />
                        <Avatar.Fallback backgroundColor="$gray5" />
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