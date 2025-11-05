import {useRouter} from "expo-router";
import {Controller, FieldError, FieldErrors, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {CreateQuestionFormSchema} from "@/validation/validation";
import {
    Adapt, Button,
    Card,
    Input,
    Label, Paragraph,
    ScrollView,
    Select,
    Sheet, SizableText, Spinner,
    Text,
    TextArea,
    View, XStack,
    YStack
} from "tamagui";
import {Category, ContentType, CreatePollReq, CreateQuestionReq} from "@/models/question";
import {Check, ChevronDown} from "@tamagui/lucide-icons";
import LocationPicker from "@/components/map/location-picker";
import {Location} from "@/models/location";
import {useState} from "react";
import AskQuestionAdditionalForm from "@/components/form/ask-question-additional-form";
import {useCreateQuestion} from "@/hooks/tanstack/question";
import DurationInput from "@/components/input/duration-input";

export default function AskQuestionForm() {
    const router = useRouter();
    const [locPickerKey, setLocPickerKey] = useState(0)
    const createQuestionMutation = useCreateQuestion()

    const {control, handleSubmit: submit, formState: {errors, isSubmitting: isLoading}, reset} = useForm({
        defaultValues: {
            title: "",
            body: null,
            // @ts-ignore category
            category: null,
            // @ts-ignore location
            location: null,
            image_urls: null,
            content: { content_type: ContentType.NONE},
            duration: "1h",
        },
        resolver: zodResolver(CreateQuestionFormSchema)
    })


    async function handleSubmit(values: any) {
        console.log("ASK_QUESTION_FORM", values)
        // TODO: upload any images first

        // make api request to backend to create the question
        let createdQuestion;
        try {
            const req : CreateQuestionReq = {
                title: values.title,
                body: values.body,
                category: values.category,
                location: values.location,
                duration: values.duration,
                // image_urls: values.image_urls,
            }
            createdQuestion = await createQuestionMutation.mutateAsync(req);
        } catch {
            // error notification will be shown
            return
        }

        // if there is additional content, then make api request to backend to create it too
        switch (values.content.content_type as ContentType) {
            case ContentType.POLL:
                try {
                    // TODO: FINISH IMPL
                    const req : CreatePollReq = {
                        question_id: createdQuestion.id,
                        option_labels: values.content.option_labels,
                    }

                } catch {
                    return
                }
                break;
            case ContentType.NONE:
                break;
            default:
                break;
        }

        // finally, navigate to question details page
        router.navigate({
            pathname: "/question/[id]",
            params: {id: createdQuestion.id},
        })

    }

    return (
        <>
            <View>
                <Card bordered>
                    <YStack
                        padding={20}
                        paddingTop={0}
                        rowGap={10}
                    >
                        {/* Question Title Input */}
                        <YStack>
                            <Label>
                                Title
                            </Label>
                            <Controller
                                name={"title"}
                                control={control}
                                render={({field}) => (
                                    <Input
                                        placeholder={"What's your question?"}
                                        disabled={isLoading}
                                        ref={field.ref}
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                            {errors.title && (
                                <Text color={"red"}>{errors.title.message}</Text>
                            )}
                        </YStack>

                        {/* Question Duration Input */}
                        <YStack>
                            <Label>
                                <YStack>
                                    <Text>Duration</Text>
                                    <SizableText size="$2" color="$gray10">
                                        How long should your question be up for?
                                    </SizableText>
                                </YStack>
                            </Label>
                            <Controller
                                name={"duration"}
                                control={control}
                                render={({field}) => (
                                   <DurationInput duration={field.value} onChange={field.onChange} onBlur={field.onBlur}/>
                                )}
                            />
                            {errors.duration && (
                                <Text color={"red"}>{errors.duration.message}</Text>
                            )}
                        </YStack>

                        {/* Question Category Select Input */}
                        <YStack>
                            <Label>
                                <YStack>
                                    <Text>Category</Text>
                                    <SizableText size="$2" color="$gray10">
                                        What is your question about?
                                    </SizableText>
                                </YStack>
                            </Label>
                            <Controller
                                name={"category"}
                                control={control}
                                render={({field}) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        onOpenChange={(open) => !open && field.onBlur()}
                                        disablePreventBodyScroll
                                    >
                                        <Select.Trigger iconAfter={ChevronDown}>
                                            <Select.Value placeholder="Select category" />
                                        </Select.Trigger>

                                        <Adapt platform="touch">
                                            <Sheet native modal dismissOnSnapToBottom animation="medium">
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
                                            <Select.ScrollUpButton/>
                                            <Select.Viewport minWidth={200}>
                                                <Select.Group>
                                                    {Object.values(Category).map((c, idx) => (
                                                        <Select.Item index={idx} key={c} value={c}>
                                                            <Select.ItemText>{c.toUpperCase()}</Select.ItemText>
                                                            <Select.ItemIndicator marginLeft="auto">
                                                                <Check size={16} />
                                                            </Select.ItemIndicator>
                                                        </Select.Item>
                                                    ))}
                                                </Select.Group>
                                            </Select.Viewport>
                                            <Select.ScrollDownButton/>
                                        </Select.Content>
                                    </Select>
                                )}
                            />
                            {errors.category && (
                                <Text color={"red"}>{errors.category.message}</Text>
                            )}
                        </YStack>

                        {/* Question Body Input */}
                        <YStack>
                            <Label>
                                Details (optional)
                            </Label>
                            <Controller
                                name={"body"}
                                control={control}
                                render={({field}) => (
                                    <TextArea
                                        placeholder={"Add additional details"}
                                        minHeight={100}
                                        disabled={isLoading}
                                        ref={field.ref}
                                        value={field.value || ""}
                                        onChangeText={(text) => field.onChange(text !== "" ? text : null)}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                            {errors.body && (
                                <Text color={"red"}>{errors.body.message}</Text>
                            )}
                        </YStack>


                        {/* Question Content Form */}
                        <YStack>
                            <Label>
                                <YStack>
                                    <Text>Additional Content</Text>
                                    <SizableText size="$2" color="$gray10">
                                        You can add a poll or more
                                    </SizableText>
                                </YStack>
                            </Label>
                            <Controller
                                name={"content"}
                                control={control}
                                render={({field}) => (
                                    <AskQuestionAdditionalForm
                                        content={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            {errors.content &&
                                Object.values(errors.content).map((value, i) => (
                                    <Text key={i} color="red">
                                        {/* @ts-ignore value */}
                                        {"message" in value ? value.message : String(value)}
                                    </Text>
                                ))
                            }
                        </YStack>

                        {/* Location Picker Input */}
                        <YStack rowGap={10}>
                            <Label>
                                <YStack>
                                    <Text>Location</Text>
                                    <SizableText size="$2" color="$gray10">
                                        Where is this about? You can tap on the map, search for a place,
                                        enter lat/lng, or use your current location.
                                    </SizableText>
                                </YStack>
                            </Label>
                            <Controller
                                name={"location"}
                                control={control}
                                render={({field}) => (
                                    <LocationPicker
                                        key={locPickerKey}
                                        height={400}
                                        onChange={(loc) => {
                                            const newLoc: Location = {
                                                latitude: loc.coords.latitude,
                                                longitude: loc.coords.longitude,
                                                name: loc.label,
                                                address: loc.address,
                                            }
                                            field.onChange(newLoc)
                                        }}
                                    />
                                )}
                            />
                            {errors.location && (
                                <Text color={"red"}>{errors.location.message}</Text>
                            )}
                        </YStack>

                        {/* Reset + Submit buttons */}
                        <YStack paddingTop={20} rowGap={10}>
                            {isLoading ? (
                                <Button disabled={true} opacity={0.7}>
                                    <Spinner size="large"/>
                                </Button>
                            ) : (
                                <Button
                                    onPress={() => {
                                        // set new key so that we can reset location picker map to initial state
                                        setLocPickerKey((prev) => prev+1)
                                        reset()
                                    }}
                                    backgroundColor={"$red8"}
                                >
                                    <Paragraph>Reset</Paragraph>
                                </Button>
                            )}
                            {isLoading ? (
                                <Button disabled={true} opacity={0.7}>
                                    <Spinner size="large"/>
                                </Button>
                            ) : (
                                <Button onPress={submit(handleSubmit)}>
                                    <Paragraph>Post Question</Paragraph>
                                </Button>
                            )}
                        </YStack>


                    </YStack>
                </Card>
            </View>
        </>
    )

}

function AdditionalContentInput() {

}