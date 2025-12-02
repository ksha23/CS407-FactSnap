import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Button, Text, YStack, Input, TextArea } from "tamagui";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AskQuestionForm from "@/components/form/ask-question-form";

export default function AskPage() {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                // offset equals any fixed header height + safe-area top
                keyboardVerticalOffset={insets.top}
            >
                <ScrollView
                    // lets RN add the right bottom inset when keyboard shows
                    automaticallyAdjustKeyboardInsets
                    // don’t block taps inside inputs
                    keyboardShouldPersistTaps="handled"
                >
                    <YStack padding="$2" gap="$4">
                        {/* Ask Question Form */}
                        <AskQuestionForm />
                    </YStack>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
