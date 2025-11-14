import {useEffect, useRef, useState} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import {Button, Spinner, Text, View, YStack} from "tamagui";
import FeedMap, {MapLocation} from "@/components/map/feed-map";
import {Coordinates} from "@/services/location-service";
import {Alert, FlatList, RefreshControl} from "react-native";
import {resetInfiniteQuestionsList, useGetQuestionsFeed} from "@/hooks/tanstack/question";
import {PageFilterType} from "@/services/axios-client";
import {useQueryClient} from "@tanstack/react-query";
import {Question} from "@/models/question";
import {useRouter} from "expo-router";
import {questionKeys} from "@/hooks/tanstack/query-keys";
import QuestionCard from "@/components/card/question-card";
import {ArrowUp} from "@tamagui/lucide-icons";

export default function FeedPage() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [currentRegion, setCurrentRegion] = useState<{
    center: Coordinates;
    radius: number;
  } | null>(null);

  // TODO: page filtering for question category, etc
  const [pageFilterType, setPageFilterType] = useState<PageFilterType>(PageFilterType.NONE)
  const [pageFilter, setPageFilter] = useState<string>("")

  // for refresh control
  const [refreshEnabled, setRefreshEnabled] = useState(true);

  // for "scroll to top" functionality
  const listRef = useRef<FlatList<string>>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  function scrollToTop() {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }

  const router = useRouter()

  const queryClient = useQueryClient()
  const query = useGetQuestionsFeed(
      currentRegion?.center ?? null,
      currentRegion?.radius ?? 0,
      pageFilterType,
      pageFilter,
  )

  useEffect(() => {
    if (query.error) {
      Alert.alert("Could not fetch questions feed", query.error.message)
    }
  }, [query.error]);


  // Fetch locations when map region changes (we only update currentRegion here)
  const handleRegionChange = (center: Coordinates, radiusMiles: number) => {
    // Store current region for manual refresh and for the query hook
    console.log(
      "Region changed: center =",
      center,
      "radiusMiles =",
      radiusMiles
    );
    setCurrentRegion({ center, radius: radiusMiles });
  };


  // Handle marker press
  const handleMarkerPress = (location: MapLocation) => {
    console.log("Marker pressed:", location);
    router.push({
      pathname: "/question/[id]",
      params: {id: location.questionId},
    })
  };

  function handleQuestionsUpdate(questions: Question[]) {
    const newLocations: MapLocation[] = []
    questions.forEach(question => {
      newLocations.push({
        id: question.location.id,
        questionId: question.id,
        coordinates: {latitude: question.location.latitude, longitude: question.location.longitude},
        title: question.location.name ?? "Unknown",
        description: question.location.address?? "Unknown"
      })
    })
    setLocations(newLocations)
  }

  function handleFeedRefresh() {
    resetInfiniteQuestionsList(queryClient, {queryKey: questionKeys.lists()})
    query.refetch()
  }

  function isLoading() {
    return query.isPending || (!query.isFetchingNextPage && query.isFetching)
  }

  const pages = query.data?.pages ?? [];
  const questionIds = pages.flatMap((p) => p.questionIds);

  // when feed changes, invoke handleQuestionsUpdate with new question list
  useEffect(() => {
    const questions = questionIds
        .map((id) => queryClient.getQueryData(questionKeys.getQuestionById(id)))
        .filter(Boolean) as Question[];
    handleQuestionsUpdate(questions)
  }, [questionIds.length, query.data]);

  return (
      <SafeAreaView edges={["left", "right"]}>
        <FlatList
            ref={listRef}
            onScroll={(e) => {
              const offsetY = e.nativeEvent.contentOffset.y;
              setShowScrollTop(offsetY > 400); // show after 400px scroll
            }}
            scrollEventThrottle={16}
            data={questionIds}
            keyExtractor={(id) => id}
            renderItem={({ item }) => <QuestionCard questionId={item} showDetails={false} /> }
            contentContainerStyle={{gap: 5}} // gap between rows
            onEndReached={() => {
              if (!query.isFetchingNextPage && query.hasNextPage) {
                query.fetchNextPage();
              }
            }}
            onEndReachedThreshold={null}
            refreshControl={
              <RefreshControl
                  refreshing={query.isRefetching}
                  enabled={refreshEnabled}
                  onRefresh={handleFeedRefresh}
              />
            }
            refreshing={query.isRefetching}
            ListHeaderComponent={
              <YStack>
                {/* Page title */}
                <View
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    padding="$4"
                    gap="$4"
                >
                  <YStack>
                    <Text fontSize="$8" fontWeight="bold">
                      Feed
                    </Text>
                    <Text fontSize="$4" color="$gray11">
                      Questions near you
                    </Text>
                  </YStack>
                </View>

                {/* Feed Map */}
                <View
                    // to disable refresh control when interacting with the map
                    onTouchStart={() => setRefreshEnabled(false)}
                    onTouchEnd={() => setRefreshEnabled(true)}
                >
                  <FeedMap
                      locations={locations}
                      onRegionChange={handleRegionChange}
                      onMarkerPress={handleMarkerPress}
                      showRadiusCircle={true}
                      disableAutoFetch={false}
                      height={300}
                  />
                </View>
              </YStack>
            }
            ListHeaderComponentStyle={{paddingBottom: 5}}
            ListEmptyComponent={
              query.error ? (
                  <YStack f={1} jc="center" ai="center" p="$4">
                    <Text color={"red"}>Error fetching questions feed</Text>
                  </YStack>
              ) : !isLoading() ? (
                  <YStack f={1} jc="center" ai="center" p="$4">
                    <Text>No questions found</Text>
                  </YStack>
              ) : null
            }
            ListFooterComponent={
              query.isFetchingNextPage || isLoading() ? (
                  <YStack py="$3" ai="center">
                    <Spinner size={"large"}/>
                  </YStack>
              ) : null
            }
        />
        {/* floating scroll-to-top button */}
        {showScrollTop && (
            <View
                position="absolute"
                bottom="$4"
                right="$4"
            >
              <Button
                  circular
                  size="$4"
                  onPress={scrollToTop}
              >
                <ArrowUp size={20}/>
              </Button>
            </View>
        )}
      </SafeAreaView>
  );
}
