import { useLocalSearchParams, useNavigation } from "expo-router";
import { Spinner, Text, View, YStack } from "tamagui";
import { useGetQuestionById } from "@/hooks/tanstack/question";
import { useEffect, useMemo } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { isAxiosError } from "axios";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AskQuestionForm from "@/components/form/ask-question-form";
import EditQuestionForm from "@/components/form/edit-question-form";

export default function EditQuestionPage() {
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const questionQuery = useGetQuestionById(id as string);

    useEffect(() => {
        if (questionQuery.error) {
            Alert.alert("Error loading question", questionQuery.error.message);
        }
    }, [questionQuery.error]);

    useEffect(() => {
        if (questionQuery.data && !questionQuery.data.is_owned) {
            Alert.alert("You cannot edit this question", "You are not the author");
        }
    }, [questionQuery.data]);

    if (questionQuery.isError) {
        if (isAxiosError(questionQuery.error) && questionQuery.error.status !== 404) {
            return <Text color={"red"}>Could not load question {id}</Text>;
        } else {
            return (
                <Text color={"red"}>
                    Question not found. It may have been removed or doesn't exist
                </Text>
            );
        }
    }

    if (questionQuery.isPending || questionQuery.isFetching) {
        return (
            <View style={{ flex: 1 }}>
                <YStack
                    rowGap={10}
                    flex={1}
                    justifyContent={"center"}
                    alignItems={"center"}
                >
                    <Spinner size={"large"} />
                    <Text>Loading...</Text>
                </YStack>
            </View>
        );
    }

    const question = questionQuery.data;

    if (!question.is_owned) {
        return (
            <Text color={"red"}>
                You cannot edit this question because you are not the author
            </Text>
        );
    }

    const isExpired = useMemo(() => {
        const expiry = new Date(question.expired_at);
        const now = new Date();
        return now.getTime() >= expiry.getTime();
    }, [question.expired_at]);

    if (isExpired) {
        return (
            <Text color={"red"}>
                You cannot edit this question because it has expired
            </Text>
        );
    }

    //  dynamically override the title of the current stack screen to the question title
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
                    <YStack padding="$4" gap="$4">
                        {/* Header */}
                        <Text fontSize="$8" fontWeight="bold">
                            Editing Question: {question.title}
                        </Text>

                        {/* Edit Question Form */}
                        <EditQuestionForm questionId={question.id} />
                    </YStack>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
