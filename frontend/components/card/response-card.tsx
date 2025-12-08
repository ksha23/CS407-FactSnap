import React, { useState } from "react";
import { Alert, useColorScheme } from "react-native";
import { Avatar, Button, Card, Text, XStack, YStack, Popover, Adapt, View } from "tamagui";
import { SquarePen, Trash, MoreVertical } from "@tamagui/lucide-icons";
import { useDeleteResponse, useGetResponseById } from "@/hooks/tanstack/response";
import { Response } from "@/models/response";
import { multiFormatDateString } from "@/utils/formatter";
import { ImageCarousel } from "@/components/carousel/image-carousel";
import EditResponseFormModal from "@/components/form/edit-response-form";

type Props = {
    questionId: string
    responseId: string
};

export default function ResponseCard(props: Props) {
    const responseQuery = useGetResponseById(props.responseId, props.questionId);
    const deleteResponseMutation = useDeleteResponse()
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false);

    const colorScheme = useColorScheme();
    const response = responseQuery.data as Response | undefined;

    if (!response) {
        return null;
    }

    function handleDelete() {
        deleteResponseMutation.mutate({questionId: props.questionId, responseId: props.responseId})
    }

    return (
        <>
            <EditResponseFormModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                responseId={response.id}
                questionId={response.question_id}
                initialResponseBody={response.body}
            />
            <Card
                backgroundColor={colorScheme === "dark" ? "$color.gray6Dark" : "$color.gray6Light"}
                padding="$4"
            >
                {/* Owner actions */}
                {response.is_owned && (
                    <View position="absolute" top="$3" right="$3" zIndex={10}>
                        <Popover 
                            size="$5" 
                            allowFlip 
                            placement="bottom-end"
                            open={menuOpen}
                            onOpenChange={setMenuOpen}
                        >
                            <Popover.Trigger asChild>
                                <Button 
                                    size="$3" 
                                    circular 
                                    chromeless 
                                    icon={MoreVertical} 
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(true);
                                    }}
                                />
                            </Popover.Trigger>

                            <Adapt when="sm" platform="touch">
                                <Popover.Sheet modal dismissOnSnapToBottom snapPoints={[25]}>
                                    <Popover.Sheet.Frame padding="$4">
                                        <Adapt.Contents />
                                    </Popover.Sheet.Frame>
                                    <Popover.Sheet.Overlay
                                        animation="lazy"
                                        enterStyle={{ opacity: 0 }}
                                        exitStyle={{ opacity: 0 }}
                                    />
                                </Popover.Sheet>
                            </Adapt>

                            <Popover.Content
                                borderWidth={1}
                                borderColor="$borderColor"
                                enterStyle={{ y: -10, opacity: 0 }}
                                exitStyle={{ y: -10, opacity: 0 }}
                                elevate
                                animation={[
                                    'quick',
                                    {
                                        opacity: {
                                            overshootClamping: true,
                                        },
                                    },
                                ]}
                            >
                                <Popover.Arrow borderWidth={1} borderColor="$borderColor" />

                                <YStack gap="$2" minWidth={150}>
                                    <Button
                                        size="$4"
                                        icon={SquarePen}
                                        justifyContent="flex-start"
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            setMenuOpen(false);
                                            setEditModalOpen(true);
                                        }}
                                    >
                                        Edit Response
                                    </Button>

                                    <Button
                                        size="$4"
                                        icon={Trash}
                                        theme="red"
                                        justifyContent="flex-start"
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            setMenuOpen(false);
                                            Alert.alert(
                                                "Confirm Action",
                                                "Are you sure you want to delete this response?",
                                                [
                                                    {
                                                        text: "Cancel",
                                                        onPress: () => {},
                                                        style: "cancel",
                                                    },
                                                    {
                                                        text: "OK",
                                                        onPress: handleDelete,
                                                    },
                                                ],
                                            );
                                        }}
                                    >
                                        Delete Response
                                    </Button>
                                </YStack>
                            </Popover.Content>
                        </Popover>
                    </View>
                )}


                <YStack gap={"$3"}>

                    {/* Section: Avatar */}
                    <XStack alignItems="center" gap="$3">
                        <Avatar circular>
                            <Avatar.Image src={response.author.avatar_url} />
                            <Avatar.Fallback backgroundColor={"$gray5"} />
                        </Avatar>
                        <YStack>
                            <Text>{response.author.display_name}</Text>
                            <Text color="$gray10">@{response.author.username}</Text>
                        </YStack>
                    </XStack>

                    {/* Section: Body */}
                    <YStack>
                        <Text>{response.body}</Text>
                    </YStack>

                    {/* Section: Images */}
                    {response.image_urls && response.image_urls.length > 0 && (
                        <YStack marginTop="$3">
                            <ImageCarousel
                                height={300}
                                imageUrls={response.image_urls}
                            />
                        </YStack>
                    )}

                    {/* Section: Creation + Edited Date  */}
                    <XStack gap={"$1"}>
                        <Text color="$gray10">
                            {multiFormatDateString(response.created_at)}
                        </Text>
                        {response.edited_at && response.created_at != response.edited_at && (
                            <Text color="$gray10">
                                (edited {multiFormatDateString(response.edited_at).toLowerCase()})
                            </Text>

                        )}
                    </XStack>
                </YStack>
            </Card>
        </>
    );
}