import React, { ReactNode, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import {
    Button,
    Paragraph,
    Input,
    XStack,
    Text,
    YStack,
    Sheet, TextArea, Spinner, SizableText,
} from "tamagui";
import { ImageUploadField } from "../input/image-picker-input";
import { Pencil } from "@tamagui/lucide-icons";
import { useCreateResponse } from "@/hooks/tanstack/response";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateResponseFormSchema } from "@/validation/validation";
import { uploadMedia } from "@/services/media-service";
import { isAxiosError } from "axios";
import { CreateResponseReq } from "@/models/response";

type Props = {
    question_id: string;
};

export default function ResponseForm({ question_id }: Props) {
    const [open, setOpen] = useState(false);
    const createResponseMutation = useCreateResponse()

    const {
        control,
        handleSubmit: submit,
        formState: {errors, isSubmitting},
        reset,
    } = useForm({
        defaultValues: {
            body: "",
            image_urls: null,
        },
        resolver: zodResolver(CreateResponseFormSchema)
    })

    async function handleSubmit(values: any) {
        console.debug("CREATE_RESPONSE_FORM", values)

        // Upload all images
        // NOTE: we're assuming that the images are local files that haven't been uploaded yet
        const uploadedImageUrls: string[] = []
        if (values.image_urls && values.image_urls.length > 0) {
            console.debug("UPLOADING IMAGES...")

            // For now, we are uploading each image sequentially
            for (const uri of values.image_urls) {
                try {
                    const asset = await uploadMedia(uri)
                    console.debug("UPLOADED_IMAGE", asset)
                    uploadedImageUrls.push(asset.url)
                } catch (e) {
                    if (isAxiosError(e)) {
                        Alert.alert("Failed to upload images. Please try again.", e.message)
                    } else {
                        Alert.alert("Failed to upload images. Please try again.", JSON.stringify(e))
                    }
                    return;
                }
            }
        }

        try {
            const req: CreateResponseReq = {
                question_id: question_id,
                body: values.body,
                image_urls: uploadedImageUrls,
            }
            await createResponseMutation.mutateAsync(req)
        } catch {
            // error notification will be shown
            return;
        }

        setOpen(false);
        reset()
    }

    return (
        <>
            {/* Trigger button above Responses feed */}
            <Button onPress={() => setOpen(true)}>
                <Button.Icon>
                    <Pencil size={20}/>
                </Button.Icon>
                <Button.Text>
                    <Paragraph>Create Response</Paragraph>
                </Button.Text>
            </Button>

            <Sheet
                modal={true}
                open={open}
                onOpenChange={setOpen}
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

                                {/* Images Input */}
                                <Field>
                                    <Controller
                                        name={"image_urls"}
                                        control={control}
                                        render={({ field }) => (
                                            <ImageUploadField
                                                value={field.value ?? []}
                                                onChange={field.onChange}
                                                disabled={isSubmitting}
                                            />
                                        )}

                                    />
                                    <HelperText>Share any images for additional context</HelperText>
                                    {errors.image_urls && <ErrorText>{errors.image_urls.message}</ErrorText>}
                                </Field>

                                {/* Reset + Submit buttons */}
                                <YStack gap={"$3"} mt="$2">
                                    {isSubmitting ? (
                                        <Button disabled={true} opacity={0.7}>
                                            <Spinner size="large" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onPress={() => reset()}
                                            backgroundColor="$red8"
                                        >
                                            <Paragraph>Reset</Paragraph>
                                        </Button>
                                    )}

                                    {isSubmitting ? (
                                        <Button disabled={true} opacity={0.7}>
                                            <Spinner size="large" />
                                        </Button>
                                    ) : (
                                        <Button onPress={submit(handleSubmit)}>
                                            <Paragraph>Create Response</Paragraph>
                                        </Button>
                                    )}
                                </YStack>
                            </YStack>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Sheet.Frame>
            </Sheet>
        </>
    );
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