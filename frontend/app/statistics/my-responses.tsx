// app/statistics/my-responses.tsx
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, RefreshControl } from "react-native";
import { YStack, XStack, Text, Button, Spinner, View } from "tamagui";
import { useRouter } from "expo-router";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { useGetRespondedQuestions } from "@/hooks/tanstack/question";
import QuestionCard from "@/components/card/question-card";

export default function MyResponsesScreen() {
  const router = useRouter();
  const myRespondedQuery = useGetRespondedQuestions();

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
            My Responded Question
          </Text>

          <View width={32} />
        </XStack>

        {/* Content list */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={myRespondedQuery.isRefetching}
              onRefresh={() => myRespondedQuery.refetch()}
            />
          }
        >
          <YStack padding="$3" gap="$3">
            {myRespondedQuery.isPending || myRespondedQuery.isFetching ? (
              <YStack alignItems="center" paddingVertical="$4" gap="$2">
                <Spinner size="large" />
                <Text color="$gray10">
                  Loading questions you responded to...
                </Text>
              </YStack>
            ) : myRespondedQuery.isError ? (
              <Text color="$red10">
                Failed to load responded questions:{" "}
                {myRespondedQuery.error?.message}
              </Text>
            ) : myRespondedQuery.data && myRespondedQuery.data.length > 0 ? (
              myRespondedQuery.data.map((q) => (
                <QuestionCard
                  key={q.id}
                  questionId={q.id}
                  showDetails={false}
                />
              ))
            ) : (
              <Text color="$gray10">
                You haven't responded to any questions yet.
              </Text>
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}