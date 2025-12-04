import React, { useState } from "react";
import { Alert, useColorScheme } from "react-native";
import { Avatar, Button, Card, Text, XStack, YStack } from "tamagui";
import { SquarePen, Trash } from "@tamagui/lucide-icons";
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
    const responseQuery = useGetResponseById(props.responseId);
    const deleteResponseMutation = useDeleteResponse()
    const [editModalOpen, setEditModalOpen] = useState(false)

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
                onOpenChange={setEditModalOpen}
                responseId={response.id}
                initialResponseBody={response.body}
            />
            <Card
                backgroundColor={colorScheme === "dark" ? "$color.gray6Dark" : "$color.gray6Light"}
                padding="$4"
            >
                {/* Owner actions */}
                {response.is_owned && (
                    <XStack position="absolute" top="$3" right="$3" gap="$3">
                        <Button
                            size="$2"
                            backgroundColor="$blue4"
                            onPress={(e) => {
                                e.stopPropagation();
                                setEditModalOpen(true)
                            }}
                        >
                            <SquarePen size={20} color="$blue11" />
                        </Button>

                        <Button
                            size="$2"
                            backgroundColor="$red4"
                            onPress={(e) => {
                                e.stopPropagation();
                                Alert.alert(
                                    "Confirm Action",
                                    "Are you sure you want to delete this response?",
                                    [
                                        {
                                            text: "Cancel",
                                            onPress: () => {
                                            },
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
                            <Trash size={20} color="$red11" />
                        </Button>
                    </XStack>
                )}


                <YStack gap={"$3"}>

                    {/* Section: Avatar */}
                    <XStack alignItems="center" gap="$3">
                        <Avatar circular>
                            <Avatar.Image srcSet={response.author.avatar_url} />
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