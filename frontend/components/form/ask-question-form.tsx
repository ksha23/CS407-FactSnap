import {useRouter} from "expo-router";
import {Controller, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {QuestionFormSchema} from "@/validation/validation";
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
import {KeyboardAvoidingView} from "react-native";
import {Category, QuestionType} from "@/models/question";
import {Check, ChevronDown, ChevronUp} from "@tamagui/lucide-icons";
import LocationPicker from "@/components/map/location-picker";
import {Location} from "@/models/location";

export default function AskQuestionForm() {
    const router = useRouter();

    const {control, handleSubmit: submit, formState: {errors, isSubmitting: isLoading}, reset} = useForm({
        defaultValues: {
            title: "",
            body: null,
            // @ts-ignore type
            type: null,
            // @ts-ignore type
            category: null,
            // @ts-ignore location
            location: null,
            image_urls: null,
        },
        resolver: zodResolver(QuestionFormSchema)
    })

    async function handleSubmit(values: any) {
        console.log("ask question form values", values)
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

                        {/* Question Type Select Dropdown Input */}
                        <YStack>
                            <Label>
                                <YStack>
                                    <Text>Type</Text>
                                    <SizableText size="$2" color="$gray10">
                                        What is your question about?
                                    </SizableText>
                                </YStack>
                            </Label>
                            <Controller
                                name={"type"}
                                control={control}
                                render={({field}) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        onOpenChange={(open) => !open && field.onBlur()}
                                        disablePreventBodyScroll
                                    >
                                        <Select.Trigger iconAfter={ChevronDown}>
                                            <Select.Value placeholder="Select type" />
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
                                                    {Object.values(QuestionType).map((c, idx) => (
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
                            {errors.type && (
                                <Text color={"red"}>{errors.type.message}</Text>
                            )}
                        </YStack>

                        {/* Question Category Select Input */}
                        <YStack>
                            <Label>
                                Category
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

                        {/* Clear + Submit buttons */}
                        <YStack paddingTop={20} rowGap={10}>
                            {isLoading ? (
                                <Button disabled={true} opacity={0.7}>
                                    <Spinner size="large"/>
                                </Button>
                            ) : (
                                <Button onPress={() => reset()} backgroundColor={"$red8"}>
                                    <Paragraph>Clear</Paragraph>
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