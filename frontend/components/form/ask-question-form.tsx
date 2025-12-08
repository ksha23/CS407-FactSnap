import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateQuestionFormSchema } from "@/validation/validation";
import {
    Adapt,
    Button,
    Input,
    Paragraph,
    SizableText,
    Spinner,
    Text,
    TextArea,
    View,
    YStack,
    XStack,
    Select,
    Sheet,
} from "tamagui";
import {
    Category,
    ContentType,
    CreatePollReq,
    CreateQuestionReq,
} from "@/models/question";
import { Check, ChevronDown } from "@tamagui/lucide-icons";
import LocationPicker from "@/components/map/location-picker";
import { Location } from "@/models/location";
import { ReactNode, useState } from "react";
import AskQuestionAdditionalForm from "@/components/form/ask-question-additional-form";
import { useCreatePoll, useCreateQuestion } from "@/hooks/tanstack/question";
import DurationInput from "@/components/input/duration-input";
import { ImageUploadField } from "@/components/input/image-picker-input";
import { uploadMedia } from "@/services/media-service";
import { Alert } from "react-native";
import { isAxiosError } from "axios";

export default function AskQuestionForm() {
    const router = useRouter();
    const [locPickerKey, setLocPickerKey] = useState(0);
    const createQuestionMutation = useCreateQuestion();
    const createPollMutation = useCreatePoll();

    const {
        control,
        handleSubmit: submit,
        formState: { errors, isSubmitting: isLoading },
        reset,
    } = useForm({
        defaultValues: {
            title: "",
            body: null,
            // @ts-ignore category
            category: null,
            // @ts-ignore location
            location: null,
            image_urls: null,
            content: { content_type: ContentType.NONE },
            duration: "1h",
        },
        resolver: zodResolver(CreateQuestionFormSchema),
    });

    async function handleSubmit(values: any) {
        console.log("ASK_QUESTION_FORM", values);

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

        let questionId;
        try {
            const req: CreateQuestionReq = {
                title: values.title,
                body: values.body,
                category: values.category,
                location: values.location,
                duration: values.duration,
                content_type: values.content.content_type,
                image_urls: uploadedImageUrls,
            };
            questionId = await createQuestionMutation.mutateAsync(req);
            // clear form
            reset();
        } catch {
            // error notification will be shown
            return;
        }

        switch (values.content.content_type as ContentType) {
            case ContentType.POLL:
                try {
                    const req: CreatePollReq = {
                        question_id: questionId,
                        option_labels: values.content.option_labels,
                    };
                    await createPollMutation.mutateAsync(req);
                } catch {
                    return;
                }
                break;
            default:
                break;
        }

        // Navigate to feed first so back button goes to feed
        router.navigate("/(tabs)");
        router.push({
            pathname: "/question/[id]",
            params: { id: questionId },
        });
    }

    return (
        <View>
            {/* size boosts text + inputs slightly; gap keeps things tight but readable */}
            <YStack paddingHorizontal="$3" paddingTop="$1" gap="$3">
                {/* Question Title */}
                <Field>
                    <XStack alignItems="center" justifyContent="space-between">
                        <LabelText>Question</LabelText>
                        <Button
                            size="$2"
                            chromeless
                            color="$red10"
                            onPress={() => {
                                setLocPickerKey((prev) => prev + 1);
                                reset();
                            }}
                            disabled={isLoading}
                        >
                            Reset Form
                        </Button>
                    </XStack>
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <Input
                                placeholder="What's your question?"
                                disabled={isLoading}
                                ref={field.ref}
                                value={field.value}
                                onChangeText={field.onChange}
                                onBlur={field.onBlur}
                                size="$4"
                                bg="$color3"
                                // borderWidth={0}
                                borderRadius="$4"
                                px="$3"
                                py="$2"
                            />
                        )}
                    />
                    {/* <HelperText>
                        Give everyone a clear headline for your question.
                    </HelperText> */}
                    {errors.title && <ErrorText>{errors.title.message}</ErrorText>}
                </Field>

                {/* Duration */}
                <Field>
                    <LabelText>Duration</LabelText>
                    <Controller
                        name="duration"
                        control={control}
                        render={({ field }) => (
                            <DurationInput
                                duration={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                            />
                        )}
                    />
                    <HelperText>How long should your question be up for?</HelperText>
                    {errors.duration && <ErrorText>{errors.duration.message}</ErrorText>}
                </Field>

                {/* Category */}
                <Field>
                    <LabelText>Category</LabelText>
                    <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                onOpenChange={(open) => !open && field.onBlur()}
                                disablePreventBodyScroll
                            >
                                <Select.Trigger
                                    iconAfter={ChevronDown}
                                    size="$4"
                                    bg="$color3"
                                    // borderWidth={0}
                                    borderRadius="$4"
                                >
                                    <Select.Value placeholder="Select category" />
                                </Select.Trigger>

                                <Adapt platform="touch">
                                    <Sheet
                                        native
                                        modal
                                        dismissOnSnapToBottom
                                        animation="medium"
                                    >
                                        <Sheet.Frame>
                                            <Sheet.ScrollView>
                                                <Adapt.Contents />
                                            </Sheet.ScrollView>
                                        </Sheet.Frame>
                                        <Sheet.Overlay
                                            backgroundColor="$shadowColor"
                                            animation="lazy"
                                            enterStyle={{ opacity: 0 }}
                                            exitStyle={{ opacity: 0 }}
                                        />
                                    </Sheet>
                                </Adapt>

                                <Select.Content zIndex={200000}>
                                    <Select.ScrollUpButton />
                                    <Select.Viewport minWidth={200}>
                                        <Select.Group>
                                            {Object.values(Category).map((c, idx) => (
                                                <Select.Item
                                                    index={idx}
                                                    key={c}
                                                    value={c}
                                                >
                                                    <Select.ItemText>
                                                        {c.toUpperCase()}
                                                    </Select.ItemText>
                                                    <Select.ItemIndicator marginLeft="auto">
                                                        <Check size={16} />
                                                    </Select.ItemIndicator>
                                                </Select.Item>
                                            ))}
                                        </Select.Group>
                                    </Select.Viewport>
                                    <Select.ScrollDownButton />
                                </Select.Content>
                            </Select>
                        )}
                    />
                    {/* <HelperText>What is your question about?</HelperText> */}
                    {errors.category && <ErrorText>{errors.category.message}</ErrorText>}
                </Field>

                {/* Details / Body */}
                <Field>
                    <LabelText>Details</LabelText>

                    <Controller
                        name="body"
                        control={control}
                        render={({ field }) => (
                            <TextArea
                                placeholder="Add additional details (optional)"
                                minHeight={100}
                                disabled={isLoading}
                                ref={field.ref}
                                value={field.value || ""}
                                onChangeText={(text) =>
                                    field.onChange(text !== "" ? text : null)
                                }
                                onBlur={field.onBlur}
                                size="$3"
                                bg="$color3"
                                // borderWidth={0}
                                borderRadius="$4"
                                px="$3"
                                py="$3"
                                verticalAlign="top"
                                textAlign="left"
                            />
                        )}
                    />
                    {/* <HelperText>Share more context to help locals answer.</HelperText> */}
                    {errors.body && <ErrorText>{errors.body.message}</ErrorText>}
                </Field>

                {/* Additional Content */}
                <Field>
                    <LabelText>Additional Content</LabelText>
                    <Controller
                        name="content"
                        control={control}
                        render={({ field }) => (
                            <AskQuestionAdditionalForm
                                content={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                    {/* <HelperText>You can add a poll or more.</HelperText> */}
                    {errors.content &&
                        Object.values(errors.content).map((value, i) => (
                            <ErrorText key={i}>
                                {/* @ts-ignore value */}
                                {"message" in value ? value.message : String(value)}
                            </ErrorText>
                        ))}
                </Field>

                {/* Location Picker */}
                <Field>
                    <LabelText>Location</LabelText>
                    <Controller
                        name="location"
                        control={control}
                        render={({ field }) => (
                            <LocationPicker
                                key={locPickerKey}
                                height={400}
                                onChange={(loc) => {
                                    // @ts-ignore dont need location id
                                    const newLoc: Location = {
                                        latitude: loc.coords.latitude,
                                        longitude: loc.coords.longitude,
                                        name: loc.label,
                                        address: loc.address,
                                    };
                                    field.onChange(newLoc);
                                }}
                            />
                        )}
                    />
                    {/* <HelperText>Where is this about?</HelperText> */}
                    {errors.location && <ErrorText>{errors.location.message}</ErrorText>}
                </Field>

                {/* Images */}
                <Field>
                    <LabelText>Images (optional)</LabelText>
                    <Controller
                        name={"image_urls"}
                        control={control}
                        render={({ field }) => (
                            <ImageUploadField
                                value={field.value ?? []}
                                onChange={field.onChange}
                                disabled={isLoading}
                            />
                        )}

                    />
                    {/* <HelperText>Share any images for additional context</HelperText> */}
                    {errors.image_urls && <ErrorText>{errors.image_urls.message}</ErrorText>}
                </Field>

                {/* Submit button */}
                <YStack marginBottom="$4">
                    {isLoading ? (
                        <Button disabled={true} opacity={0.7}>
                            <Spinner size="large" />
                        </Button>
                    ) : (
                        <Button 
                        onPress={submit(handleSubmit)}
                        bg="$green7"
                        >
                        <Paragraph>Post Question</Paragraph>
                        </Button>

                    )}
                </YStack>
            </YStack>
        </View>
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
