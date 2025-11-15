import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Spinner, Text, View, YStack } from "tamagui";
import FeedMap, { MapLocation } from "@/components/map/feed-map";
import { Coordinates } from "@/services/location-service";
import { Alert, FlatList, RefreshControl } from "react-native";
import {
    resetInfiniteQuestionsList,
    useGetQuestionsFeed,
} from "@/hooks/tanstack/question";
import { PageFilterType } from "@/services/axios-client";
import { useQueryClient } from "@tanstack/react-query";
import { Question } from "@/models/question";
import { useRouter } from "expo-router";
import { questionKeys } from "@/hooks/tanstack/query-keys";
import QuestionCard from "@/components/card/question-card";
import { ArrowUp } from "@tamagui/lucide-icons";

export default function FeedPage() {
    // Feature flag: when true we only remount MapView when the set of question IDs
    // changes (items added/removed). Set to false to revert to original behavior
    // where mapKey was `questionIds.join(",")` on every update.

    // derive locations from questions (no separate state) to keep map and list in sync
    const [currentRegion, setCurrentRegion] = useState<{
        center: Coordinates;
        radius: number;
    } | null>(null);

    // TODO: page filtering for question category, etc
    const [pageFilterType, setPageFilterType] = useState<PageFilterType>(
        PageFilterType.NONE,
    );
    const [pageFilter, setPageFilter] = useState<string>("");

    // for refresh control
    const [refreshEnabled, setRefreshEnabled] = useState(true);

    // for "scroll to top" functionality
    const listRef = useRef<FlatList<string>>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    function scrollToTop() {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }

    const router = useRouter();

    const queryClient = useQueryClient();
    const query = useGetQuestionsFeed(
        currentRegion?.center ?? null,
        currentRegion?.radius ?? 0,
        pageFilterType,
        pageFilter,
    );

    useEffect(() => {
        if (query.error) {
            Alert.alert("Could not fetch questions feed", query.error.message);
        }
    }, [query.error]);

    // Fetch locations when map region changes (we only update currentRegion here)
    // Only update state when the region meaningfully changes to prevent feedback loops
    const lastSentRegionRef = useRef<{ center: Coordinates; radius: number } | null>(
        null,
    );
    const handleRegionChange = useCallback((center: Coordinates, radiusMiles: number) => {
        const last = lastSentRegionRef.current;
        const nearlyEqual = (a: number, b: number) => Math.abs(a - b) < 1e-6;

        // If we have a last region and nothing changed significantly, skip update
        if (last) {
            const sameCenter =
                nearlyEqual(last.center.latitude, center.latitude) &&
                nearlyEqual(last.center.longitude, center.longitude);
            const sameRadius = nearlyEqual(last.radius, radiusMiles);
            if (sameCenter && sameRadius) {
                return;
            }
        }

        console.log("Region changed: center =", center, "radiusMiles =", radiusMiles);
        const newRegion = { center, radius: radiusMiles };
        lastSentRegionRef.current = newRegion;
        setCurrentRegion(newRegion);
    }, []);

    // Handle marker press (memoized to avoid re-renders)
    const handleMarkerPress = useCallback(
        (location: MapLocation) => {
            console.log("Marker pressed:", location);
            router.push({
                pathname: "/question/[id]",
                params: { id: location.questionId },
            });
        },
        [router],
    );

    // keep a ref to the last non-empty questions so transient empty fetches don't clear the UI
    const lastKnownQuestionsRef = useRef<Question[] | null>(null);

    function handleFeedRefresh() {
        resetInfiniteQuestionsList(queryClient, { queryKey: questionKeys.lists() });
        query.refetch();
    }

    function isLoading() {
        return query.isPending || (!query.isFetchingNextPage && query.isFetching);
    }

    const pages = query.data?.pages ?? [];
    const questions = pages.flatMap((p) => p.questions ?? []);
    const questionIdsKey = questions.map((q) => q.id).join(",");

    // update last-known non-empty questions
    useEffect(() => {
        if (questions.length > 0) {
            lastKnownQuestionsRef.current = questions;
        }
    }, [questionIdsKey, questions.length]);

    // effective questions: prefer current pages, but fall back to last-known during transient fetches
    // Only display the last-known questions while a new fetch is in-flight; once the
    // request settles (including empty responses) the UI should reflect the new result.
    const shouldUseLastKnown =
        questions.length === 0 &&
        !!lastKnownQuestionsRef.current &&
        (query.isFetching || query.isPending);

    const effectiveQuestions = useMemo(() => {
        if (questions.length > 0) return questions;
        if (shouldUseLastKnown && lastKnownQuestionsRef.current)
            return lastKnownQuestionsRef.current;
        return [] as Question[];
    }, [questionIdsKey, shouldUseLastKnown]);

    const questionIds = effectiveQuestions.map((q) => q.id);
    const effectiveQuestionIdsKey = questionIds.join(",");
    const locations = useMemo(() => {
        return effectiveQuestions.map(
            (question) =>
                ({
                    id: question.location.id,
                    questionId: question.id,
                    coordinates: {
                        latitude: question.location.latitude,
                        longitude: question.location.longitude,
                    },
                    title: question.location.name ?? "Unknown",
                    description: question.location.address ?? "Unknown",
                }) as MapLocation,
        );
    }, [effectiveQuestionIdsKey]);

    // Feature flag: when true we only remount MapView when the set of question IDs
    // changes (items added/removed). Set to false to revert to original behavior.
    const USE_SET_ONLY_REMOUNT = true;

    // ref to hold previous mapKey value as string
    const prevMapKeyRef = useRef<string | null>(null);
    const [mapKey, setMapKey] = useState<string>(questionIds.join(","));

    // Only update `mapKey` when the set of IDs changes (adds/removes), not on reorder
    useEffect(() => {
        if (!USE_SET_ONLY_REMOUNT) {
            setMapKey(questionIds.join(","));
            prevMapKeyRef.current = questionIds.join(",");
            return;
        }

        const sorted = questionIds.slice().sort();
        const prev = (prevMapKeyRef.current || "").split(",").filter(Boolean);
        console.debug("MapKeyEffect: prev=", prev.join(","), "sorted=", sorted.join(","));

        const prevSet = new Set(prev);

        let changed = false;
        if (prev.length !== sorted.length) changed = true;
        else {
            for (const id of sorted) {
                if (!prevSet.has(id)) {
                    changed = true;
                    break;
                }
            }
        }

        if (changed) {
            const newKey = sorted.join(",");
            prevMapKeyRef.current = newKey;
            console.debug("MapKeyEffect: setMapKey ->", newKey);
            setMapKey(newKey);
        }
    }, [questionIds]);

    useEffect(() => {
        console.debug("mapKey current value:", mapKey);
    }, [mapKey]);

    // Debug logging to trace sync between list and map
    useEffect(() => {
        try {
            console.debug("FeedPage: pages", pages.length, "questions", questions.length);
            console.debug(
                "FeedPage: effectiveQuestions",
                effectiveQuestions.length,
                "ids:",
                questionIds.join(","),
            );
            console.debug(
                "FeedPage: locations",
                locations.length,
                "coords:",
                locations
                    .map(
                        (l) =>
                            `${l.coordinates.latitude.toFixed(4)},${l.coordinates.longitude.toFixed(4)}`,
                    )
                    .join(" | "),
            );
        } catch (e) {
            // ignore logging errors
        }
    }, [questionIdsKey]);

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
                renderItem={({ item }) => (
                    <QuestionCard questionId={item} showDetails={false} />
                )}
                contentContainerStyle={{ gap: 5 }} // gap between rows
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
                        {/* Feed Map */}
                        <View
                            // to disable refresh control when interacting with the map
                            onTouchStart={() => setRefreshEnabled(false)}
                            onTouchEnd={() => setRefreshEnabled(true)}
                            paddingTop="$4"
                        >
                            <FeedMap
                                locations={locations}
                                onRegionChange={handleRegionChange}
                                onMarkerPress={handleMarkerPress}
                                showRadiusCircle={true}
                                disableAutoFetch={false}
                                height={300}
                                mapKey={mapKey}
                            />
                        </View>
                    </YStack>
                }
                ListHeaderComponentStyle={{ paddingBottom: 5 }}
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
                            <Spinner size={"large"} />
                        </YStack>
                    ) : null
                }
            />
            {/* floating scroll-to-top button */}
            {showScrollTop && (
                <View position="absolute" bottom="$4" right="$4">
                    <Button circular size="$4" onPress={scrollToTop}>
                        <ArrowUp size={20} />
                    </Button>
                </View>
            )}
        </SafeAreaView>
    );
}
