// app/statistics/my-questions.tsx
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, RefreshControl } from "react-native";
import { YStack, XStack, Text, Button, Spinner, View } from "tamagui";
import { useRouter } from "expo-router";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { useGetMyQuestions } from "@/hooks/tanstack/question";
import QuestionCard from "@/components/card/question-card";

export default function MyQuestionsScreen() {
  const router = useRouter();
  const myQuestionsQuery = useGetMyQuestions();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "$background" }}
      edges={["top", "left", "right", "bottom"]}
    >
      <YStack flex={1}>
        {/* Header */}
        <XStack
          alignItems="center"
          paddingHorizontal="$3"
          paddingVertical="$2"
          gap="$3"
          borderBottomWidth={1}
          borderBottomColor="$gray4"
        >
          <Button
            size="$2"
            circular
            backgroundColor="$gray3"
            onPress={() => router.back()}
          >
            <ChevronLeft size={18} />
          </Button>

          <Text flex={1} textAlign="center" fontSize="$6" fontWeight="700">
            My Questions
          </Text>

          <View width={32} />
        </XStack>

        {/* Content list */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={myQuestionsQuery.isRefetching}
              onRefresh={() => myQuestionsQuery.refetch()}
            />
          }
        >
          <YStack padding="$3" gap="$3">
            {myQuestionsQuery.isPending || myQuestionsQuery.isFetching ? (
              <YStack alignItems="center" paddingVertical="$4" gap="$2">
                <Spinner size="large" />
                <Text color="$gray10">Loading your questions...</Text>
              </YStack>
            ) : myQuestionsQuery.isError ? (
              <Text color="$red10">
                Failed to load your questions:{" "}
                {myQuestionsQuery.error?.message}
              </Text>
            ) : myQuestionsQuery.data && myQuestionsQuery.data.length > 0 ? (
              myQuestionsQuery.data.map((q) => (
                <QuestionCard
                  key={q.id}
                  questionId={q.id}
                  showDetails={false}
                />
              ))
            ) : (
              <Text color="$gray10">
                You haven't asked any questions yet.
              </Text>
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}