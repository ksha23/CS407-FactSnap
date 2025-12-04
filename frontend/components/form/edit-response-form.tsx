import React, { ReactNode } from "react";
import { useUpdateResponse } from "@/hooks/tanstack/response";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditResponseFormSchema } from "@/validation/validation";
import {
    SizableText,
    YStack,
    Text,
    Button,
    Paragraph,
    TextArea,
    Spinner, Card, H1, H3, H4,
} from "tamagui";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    useColorScheme,
    View,
} from "react-native";
import { EditResponseReq } from "@/models/response";

type Props = {
    open: boolean;
    onClose: () => void;
    responseId: string;
    questionId: string;
    initialResponseBody: string;
};

export default function EditResponseFormModal(props: Props) {
    const updateResponseMutation = useUpdateResponse();
    const colorScheme = useColorScheme();

    const {
        control,
        handleSubmit: submit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm({
        defaultValues: {
            body: props.initialResponseBody,
        },
        resolver: zodResolver(EditResponseFormSchema),
        mode: "onSubmit",
        reValidateMode: "onSubmit",
    });

    async function handleSubmit(values: { body: string }) {
        try {
            const req: EditResponseReq = {
                response_id: props.responseId,
                question_id: props.questionId,
                body: values.body,
            };
            await updateResponseMutation.mutateAsync(req);
        } catch {
            // error notification is already shown
            return;
        }

        props.onClose();
        reset({ body: values.body });
    }

    function handleCancel() {
        props.onClose();
        reset({ body: props.initialResponseBody });
    }

    return (
        <Modal
            visible={props.open}
            animationType="slide"
            transparent
            onRequestClose={handleCancel}
        >
            <KeyboardAvoidingView
                style={{ flex: 1, justifyContent: "center", padding: 16 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
            >
                <Card
                    bordered
                    padding="$4"
                >
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 24 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <YStack gap="$3">
                            <H4 fontWeight={"$700"}>Edit Response</H4>

                            {/* Body Input */}
                            <Field>
                                <Controller
                                    name="body"
                                    control={control}
                                    render={({ field }) => (
                                        <TextArea
                                            placeholder="Write a response..."
                                            minHeight={100}
                                            disabled={isSubmitting}
                                            ref={field.ref}
                                            value={field.value || ""}
                                            onChangeText={field.onChange}
                                            size="$5"
                                            bg="$color3"
                                            borderWidth={0}
                                            borderRadius="$4"
                                            px="$3"
                                            py="$2"
                                        />
                                    )}
                                />
                                {errors.body && (
                                    <ErrorText>{errors.body.message as string}</ErrorText>
                                )}
                            </Field>

                            {/* Cancel + Submit buttons */}
                            <YStack gap="$3" mt="$2">
                                <Button
                                    backgroundColor={
                                        colorScheme === "dark"
                                            ? "$color.gray6Dark"
                                            : "$color.gray6Light"
                                    }
                                    onPress={handleCancel}
                                    disabled={isSubmitting}
                                    opacity={isSubmitting ? 0.7 : 1}
                                >
                                    {isSubmitting ? (
                                        <Spinner size="large" />
                                    ) : (
                                        <Paragraph>Cancel</Paragraph>
                                    )}
                                </Button>

                                <Button
                                    onPress={submit(handleSubmit)}
                                    disabled={isSubmitting}
                                    opacity={isSubmitting ? 0.7 : 1}
                                >
                                    {isSubmitting ? (
                                        <Spinner size="large" />
                                    ) : (
                                        <Paragraph>Save Response</Paragraph>
                                    )}
                                </Button>
                            </YStack>
                        </YStack>
                    </ScrollView>
                </Card>
            </KeyboardAvoidingView>
        </Modal>
    );
}

/* Small layout helpers */

function Field({ children }: { children: ReactNode }) {
    return <YStack gap="$2">{children}</YStack>;
}

function ErrorText({ children }: { children: ReactNode }) {
    return <Text color="red">{children}</Text>;
}
