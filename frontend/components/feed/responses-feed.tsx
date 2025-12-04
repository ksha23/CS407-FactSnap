import { Question } from "@/models/question";
import { Button, Paragraph, Text, XStack, YStack } from "tamagui";
import ResponseForm from "@/components/form/response-form";
import { KeyboardAvoidingView } from "react-native";
import { Sparkles } from "@tamagui/lucide-icons";

type Props = {
    question: Question
}

export default function ResponsesFeed(props: Props) {


    return (
        <YStack gap={"$3"}>
            <YStack gap={"$2"}>
                <ResponseForm question_id={props.question.id} />
                <Button>
                    <Button.Icon>
                        <Sparkles size={20} />
                    </Button.Icon>
                    <Button.Text>
                        <Paragraph>Summarize Responses</Paragraph>
                    </Button.Text>
                </Button>
            </YStack>
            <Text>Responses Feed</Text>
        </YStack>
    )
}