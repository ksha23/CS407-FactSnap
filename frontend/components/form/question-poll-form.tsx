import {Button, Input, Label, Text, XStack, YStack} from "tamagui";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {CreatePollFormSchema, CreateQuestionContentSchema} from "@/validation/validation";
import {z} from "zod";
import {ContentType} from "@/models/question";
import {useState} from "react";
import {Minus, Plus} from "@tamagui/lucide-icons";

type Content = z.infer<typeof CreatePollFormSchema>;

type Props = {
    onChange: (newContent: Content) => void;
}

export default function QuestionPollForm(props: Props) {
    const [options, setOptions] = useState<string[]>([""]);

    const addOption = () => {
        if (options.length < 10) setOptions([...options, ""]);
    };

    const removeOption = (index: number) => {
        const next = options.filter((_, i) => i !== index);
        setOptions(next);
        props.onChange({content_type: ContentType.POLL, option_labels: next})
    };

    const updateOption = (index: number, value: string) => {
        const next = [...options];
        next[index] = value;
        setOptions(next);
        props.onChange({content_type: ContentType.POLL, option_labels: next})
    };


    return (
        <YStack>
            <Label>Create A Poll</Label>
            <YStack rowGap="$3">
                {options.map((opt, index) => (
                    <XStack key={index} alignItems="center" gap="$2">
                        <Input
                            flex={1}
                            size="$4"
                            placeholder={`Option ${index + 1}`}
                            value={opt}
                            onChangeText={(val) => updateOption(index, val)}
                        />
                        <Button
                            size="$3"
                            circular
                            icon={Minus}
                            disabled={options.length === 1}
                            onPress={() => removeOption(index)}
                        />
                    </XStack>
                ))}
                <Button
                    icon={Plus}
                    onPress={addOption}
                    disabled={options.length >= 10}
                    opacity={options.length >= 10 ? 0.5 : 1}
                >
                    Add Option
                </Button>
            </YStack>
        </YStack>
    );
}