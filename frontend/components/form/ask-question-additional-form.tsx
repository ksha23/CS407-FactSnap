import {Label, RadioGroup, Text, XStack, YStack} from "tamagui";
import QuestionPollForm from "@/components/form/question-poll-form";
import {useState} from "react";
import {ContentType} from "@/models/question";
import {z} from "zod";
import {CreateQuestionContentSchema, CreateQuestionFormSchema} from "@/validation/validation";

type Content = z.infer<typeof CreateQuestionContentSchema>;


type Props = {
    content: Content,
    onChange: (newContent: Content) => void;
}

export default function AskQuestionAdditionalForm(props: Props) {
    return (
        <YStack>
            <RadioGroup
                value={props.content.content_type}
                onValueChange={(newContentType) => {
                    // @ts-ignore
                    props.onChange({content_type: newContentType as ContentType})
                }}
            >
                <XStack
                    gap={"10"}
                >
                    <XStack alignItems="center" gap={"5"}>
                        <RadioGroup.Item value={ContentType.POLL}>
                            <RadioGroup.Indicator />
                        </RadioGroup.Item>
                        <Label>Poll</Label>
                    </XStack>
                    <XStack alignItems="center" gap={"5"}>
                        <RadioGroup.Item value={ContentType.NONE}>
                            <RadioGroup.Indicator />
                        </RadioGroup.Item>
                        <Label>None</Label>
                    </XStack>
                </XStack>
            </RadioGroup>


            {props.content.content_type && (() => {
                switch (props.content.content_type) {
                    case ContentType.POLL:
                        return <QuestionPollForm onChange={props.onChange}/>
                    default:
                        return null;
                }
            })()}
        </YStack>
    )
}