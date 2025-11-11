import {useGetQuestionById} from "@/hooks/tanstack/question";
import {Avatar, Card, XStack, YStack, Text, Image, Button, H2, H3, Label} from "tamagui";
import {Calendar, Clock, MapPin} from "@tamagui/lucide-icons";
import {ContentType, Question} from "@/models/question";
import {Location} from "@/models/location"
import QuestionMap from "@/components/map/question-map";
import {Badge} from "@/components/card/badge";
import {formatExpirationDate, multiFormatDateString} from "@/utils/formatter";
import {QuestionPollCard} from "@/components/card/question-poll";

type Props = {
    questionId: string;
    showDetails?: boolean;
}

export default function QuestionCard(props: Props) {
    const questionQuery = useGetQuestionById(props.questionId)
    const question = questionQuery.data!!

    return (
        <Card
            padding="$4"
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
                    <H3>
                        {question.title}
                    </H3>
                    {question.body && (
                        <Text>
                            {question.body}
                        </Text>
                    )}
                </YStack>

                {/* TODO: Section: Images */}

                {/* Section: Map + Location */}
                <YStack>
                    <QuestionMap location={question.location}/>
                    <Text color="$gray10">Location: {question.location.name}</Text>
                </YStack>

                {/* Section: Content */}
                {props.showDetails && question.content.type !== ContentType.NONE && (
                    question.content.type === ContentType.POLL ? (
                        <QuestionPollCard poll={question.content.data}/>
                    ) : null
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