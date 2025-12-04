import React, { ReactNode, useState } from "react";
import { useUpdateResponse } from "@/hooks/tanstack/response";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditResponseFormSchema } from "@/validation/validation";
import { SizableText, YStack, Text, Button, Paragraph, Sheet, TextArea, Spinner } from "tamagui";
import { Pencil } from "@tamagui/lucide-icons";
import { KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from "react-native";
import { EditResponseReq, Response } from "@/models/response";
import { ImageUploadField } from "@/components/input/image-picker-input";

type Props = {
    open: boolean;
    onOpenChange: (isOpen: boolean) => void
    responseId: string;
    initialResponseBody: string;
}

export default function EditResponseFormModal(props: Props) {
    const updateResponseMutation = useUpdateResponse()
    const colorScheme = useColorScheme();

    const {
        control,
        handleSubmit: submit,
        formState: {errors, isSubmitting},
        reset,
    } = useForm({
        defaultValues: {
            body: props.initialResponseBody,
        },
        resolver: zodResolver(EditResponseFormSchema)
    })

    async function handleSubmit(values: any) {
        console.debug("EDIT_RESPONSE_FORM", values)

        try {
            const req: EditResponseReq = {
                response_id: props.responseId,
                body: values.body,
            }
            await updateResponseMutation.mutateAsync(req)
        } catch {
            // error notification will be shown
            return;
        }

        props.onOpenChange(false)
    }

    function handleCancel() {
        props.onOpenChange(false)
        reset({body: props.initialResponseBody})
    }

    return (
        <>
            <Sheet
                modal={true}
                open={props.open}
                onOpenChange={() => handleCancel()}
                snapPointsMode="percent"
                snapPoints={[80]}
                dismissOnSnapToBottom
                disableDrag={true}
            >
                <Sheet.Overlay />
                <Sheet.Handle />
                <Sheet.Frame
                    padding="$4"
                    gap="$3"
                    justifyContent="flex-start"
                >
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
                    >
                        <ScrollView
                            contentContainerStyle={{ paddingBottom: 24 }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <YStack gap="$3">

                                {/* Body Input */}
                                <Field>
                                    <Controller
                                        name={"body"}
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
                                    {errors.body && <ErrorText>{errors.body.message}</ErrorText>}
                                </Field>

                                {/* Reset + Submit buttons */}
                                <YStack gap={"$3"} mt="$2">
                                    {isSubmitting ? (
                                        <Button disabled={true} opacity={0.7}>
                                            <Spinner size="large" />
                                        </Button>
                                    ) : (
                                        <Button
                                            backgroundColor={colorScheme === "dark" ? "$color.gray6Dark" : "$color.gray6Light"}
                                            onPress={handleCancel}
                                        >
                                            <Paragraph>Cancel</Paragraph>
                                        </Button>
                                    )}

                                    {isSubmitting ? (
                                        <Button disabled={true} opacity={0.7}>
                                            <Spinner size="large" />
                                        </Button>
                                    ) : (
                                        <Button onPress={submit(handleSubmit)}>
                                            <Paragraph>Save Response</Paragraph>
                                        </Button>
                                    )}
                                </YStack>
                            </YStack>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Sheet.Frame>
            </Sheet>
        </>
    )

}

/* Small layout helpers */

function Field({ children }: { children: ReactNode }) {
    return <YStack gap="$2">{children}</YStack>;
}

function LabelText({ children }: { children: ReactNode }) {
    return (
        <SizableText size="$4" fontWeight="700" color="$color12">
            {children}
        </SizableText>
    );
}

function HelperText({ children }: { children: ReactNode }) {
    return (
        <SizableText size="$3" color="$gray10">
            {children}
        </SizableText>
    );
}

function ErrorText({ children }: { children: ReactNode }) {
    return <Text color="red">{children}</Text>;
}