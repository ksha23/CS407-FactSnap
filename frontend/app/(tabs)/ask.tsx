import { useState } from "react";
import {Alert, KeyboardAvoidingView, Platform, ScrollView} from "react-native";
import { Button, Text, YStack, Input, TextArea } from "tamagui";
import {SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import LocationPicker, {
  LocationSelection,
} from "@/components/map/location-picker";
import { useCreateQuestion } from "@/hooks/tanstack/use-questions";
import { Category, QuestionType } from "@/models/question";
import AskQuestionForm from "@/components/form/ask-question-form";

export default function AskPage() {
  // full selection object from LocationPicker
  const [locationSelection, setLocationSelection] =
    useState<LocationSelection | null>(null);
  const [pickerKey, setPickerKey] = useState(0);

  const insets = useSafeAreaInsets()


  // question form data
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionDescription, setQuestionDescription] = useState("");

  const createQuestionMutation = useCreateQuestion();

  // called whenever user picks/moves/edits location in the picker
  const handleLocationSelect = (sel: LocationSelection) => {
    console.log("Location selected:", sel);
    setLocationSelection(sel);
  };

  const handleSubmitQuestion = async () => {
    if (!questionTitle.trim()) {
      Alert.alert("Missing title", "Please enter a question title.");
      return;
    }

    if (!locationSelection) {
      Alert.alert("Missing location", "Please select where this question is about.");
      return;
    }

    try {
      await createQuestionMutation.mutateAsync({
        questionType: QuestionType.STATUS,
        category: Category.GENERAL,
        title: questionTitle.trim(),
        body: questionDescription.trim() || undefined,
        location: locationSelection.coords,
        imageUrls: [],
      });

      // reset form on success
      setQuestionTitle("");
      setQuestionDescription("");
      setLocationSelection(null);
      setPickerKey((prev) => prev + 1);

      Alert.alert("Success", "Question posted successfully!");
    } catch (error) {
      console.error("Error posting question:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to post question. Please try again.";
      Alert.alert("Unable to post question", message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          // offset equals any fixed header height + safe-area top
          keyboardVerticalOffset={insets.top}
      >
        <ScrollView
            // lets RN add the right bottom inset when keyboard shows
            automaticallyAdjustKeyboardInsets
            // don’t block taps inside inputs
            keyboardShouldPersistTaps="handled"
        >
          <YStack padding="$4" gap="$4">
            {/* Header */}
            <Text fontSize="$8" fontWeight="bold">
              Ask a Question
            </Text>

            {/* Ask Question Form */}
            <AskQuestionForm/>

            {/*/!* Question Content *!/*/}
            {/*<YStack gap="$3">*/}
            {/*  <Text fontSize="$5" fontWeight="600">*/}
            {/*    Question Details*/}
            {/*  </Text>*/}

            {/*  <Input*/}
            {/*    placeholder="Question title..."*/}
            {/*    value={questionTitle}*/}
            {/*    onChangeText={setQuestionTitle}*/}
            {/*    size="$4"*/}
            {/*  />*/}

            {/*  <TextArea*/}
            {/*    placeholder="Additional details (optional)..."*/}
            {/*    value={questionDescription}*/}
            {/*    onChangeText={setQuestionDescription}*/}
            {/*    minHeight={100}*/}
            {/*    size="$4"*/}
            {/*  />*/}
            {/*</YStack>*/}

            {/*/!* Location Picker *!/*/}
            {/*<YStack gap="$3">*/}
            {/*  <Text fontSize="$5" fontWeight="600">*/}
            {/*    Location*/}
            {/*  </Text>*/}

            {/*  <Text fontSize="$3" color="$gray11">*/}
            {/*    Where is this about? You can tap on the map, search for a place,*/}
            {/*    enter lat/lng, or use your current location.*/}
            {/*  </Text>*/}

            {/*  <LocationPicker*/}
            {/*    key={pickerKey}*/}
            {/*    onChange={handleLocationSelect}*/}
            {/*    height={400}*/}
            {/*  />*/}
            {/*</YStack>*/}

            {/*/!* Submit button *!/*/}
            {/*<Button*/}
            {/*  size="$5"*/}
            {/*  theme="blue"*/}
            {/*  onPress={handleSubmitQuestion}*/}
            {/*  disabled={*/}
            {/*    createQuestionMutation.isPending ||*/}
            {/*    !questionTitle.trim() ||*/}
            {/*    !locationSelection*/}
            {/*  }*/}
            {/*>*/}
            {/*  {createQuestionMutation.isPending ? "Posting..." : "Post Question"}*/}
            {/*</Button>*/}
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
