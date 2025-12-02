// components/card/response-card.tsx
// Jerry: Add for response card ui
import React, { useState } from "react";
import { TextInput, Alert } from "react-native";
import { XStack, YStack, Avatar, Text, Button } from "tamagui";
import { SquarePen, Trash, Check } from "@tamagui/lucide-icons";

type Props = {
  response: any;
  currentUserId?: string | null;
  onEdit?: (responseId: string, newBody: string) => void;
  onDelete?: (responseId: string) => void;
};

export default function ResponseCard({ response, currentUserId, onEdit, onDelete }: Props) {

  const responseId: string | null =
    (response?.id ? String(response.id) :
     response?.ID ? String(response.ID) : null);


  const authorId: string | null =
    (response?.author?.id ? String(response.author.id) :
     response?.author?.ID ? String(response.author.ID) : null);


  const bodyText: string =
    (typeof response?.body === "string" ? response.body :
     typeof response?.Body === "string" ? response.Body :
     (response?.Body ?? response?.body ?? ""));

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(bodyText || "");


  const handleSave = async () => {
    if (!responseId) {
      Alert.alert("Edit error", "missing response id");
      return;
    }
    if (!editText || editText.trim() === "") {
      Alert.alert("Edit error", "response body cannot be empty");
      return;
    }

    if (onEdit) {
      onEdit(responseId, editText.trim());
    }
    setEditing(false);
  };

  const handleDelete = () => {
    if (!responseId) {
      Alert.alert("Delete error", "missing response id");
      return;
    }
    if (onDelete) {
      onDelete(responseId);
    }
  };

  const isOwner = currentUserId && authorId && currentUserId === authorId;

  return (
    <YStack
      padding="$3"
      borderRadius={8}
      backgroundColor="$background"
      elevation="$1"
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$3">
          <Avatar circular>
            <Avatar.Image srcSet={response?.author?.avatar_url ?? response?.author?.AvatarURL} />
            <Avatar.Fallback backgroundColor={"$gray5"}>
              <Text>{(response?.author?.display_name ?? response?.author?.DisplayName ?? "U").slice(0,1)}</Text>
            </Avatar.Fallback>
          </Avatar>
          <YStack>
            <Text fontWeight="700">{response?.author?.display_name ?? response?.author?.DisplayName ?? "Unknown"}</Text>
            <Text color="$gray10">@{response?.author?.username ?? response?.author?.Username ?? ""}</Text>
          </YStack>
        </XStack>

        {/* only show edit/delete icons if current user is the author */}
        {isOwner && (
          <XStack gap="$2">
            {!editing ? (
              <>
                <Button onPress={() => setEditing(true)} size="$2" backgroundColor="$gray3">
                  <SquarePen size={18} />
                </Button>
                <Button onPress={handleDelete} size="$2" backgroundColor="$red3">
                  <Trash size={18} />
                </Button>
              </>
            ) : (
              <>
                <Button onPress={handleSave} size="$2" backgroundColor="$green3">
                  <Check size={18} />
                </Button>
                <Button onPress={() => { setEditing(false); setEditText(bodyText || ""); }} size="$2" backgroundColor="$gray3">
                  <Text>Cancel</Text>
                </Button>
              </>
            )}
          </XStack>
        )}
      </XStack>

      <YStack marginTop="$2">
        {!editing ? (
          <Text>{bodyText}</Text>
        ) : (
          <TextInput
            value={editText}
            onChangeText={setEditText}
            placeholder="Edit your response..."
            style={{ minHeight: 40, borderRadius: 8, padding: 8, backgroundColor: "#fff" }}
          />
        )}
        <Text color="$gray10" marginTop="$2">{response?.created_at ?? response?.CreatedAt}</Text>
      </YStack>
    </YStack>
  );
}