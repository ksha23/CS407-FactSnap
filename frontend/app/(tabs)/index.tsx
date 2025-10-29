import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, YStack, Spinner, Button } from "tamagui";
import { useClerkSyncUser } from "@/hooks/clerk-auth";
import FeedMap, { MapLocation } from "@/components/map/feed-map";
import { Coordinates } from "@/services/location-service";
import { Question } from "@/models/question";
import { useQuestionsInRadius } from "@/hooks/tanstack/use-questions";

export default function FeedPage() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [currentRegion, setCurrentRegion] = useState<{
    center: Coordinates;
    radius: number;
  } | null>(null);
  // Use mock data toggle. Default true while backend is not available.
  const [useMockData, setUseMockData] = useState<boolean>(true);

  useClerkSyncUser();

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

  // Generate mock locations inside radiusMiles of center
  const generateMockLocations = (
    center: Coordinates,
    radiusMiles: number,
    count = 8
  ): MapLocation[] => {
    if (!center || radiusMiles <= 0) return [];
    const results: MapLocation[] = [];
    const latRad = (center.latitude * Math.PI) / 180;
    for (let i = 0; i < count; i++) {
      // random distance in miles (uniform within circle)
      const r = Math.sqrt(Math.random()) * radiusMiles;
      const theta = Math.random() * 2 * Math.PI;
      // Approx degrees per mile
      const deltaLat = (r * Math.cos(theta)) / 69; // ~69 miles per degree lat
      const deltaLng = (r * Math.sin(theta)) / (69 * Math.cos(latRad) || 1); // adjust by latitude

      const coord: Coordinates = {
        latitude: center.latitude + deltaLat,
        longitude: center.longitude + deltaLng,
      };

      results.push({
        id: `mock-${Date.now()}-${i}`,
        coordinates: coord,
        title: `Mock Question ${i + 1}`,
        description: `This is a generated mock question ${i + 1}`,
      });
    }
    return results;
  };

  // Use the TanStack Query hook to fetch nearby questions. The hook will be enabled only when
  // auto-fetch is enabled and we have a current region.
  const previousUseMockData = useRef(useMockData);

  const {
    data: questionsData,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuestionsInRadius(
    currentRegion?.center ?? null,
    currentRegion?.radius ?? 0,
    // enable real query only when not using mock data
    !useMockData
  );

  const queryErrorMessage =
    !useMockData && isError
      ? error instanceof Error
        ? error.message
        : "Unable to load nearby questions."
      : null;

  // Update local map locations whenever the query returns data
  useEffect(() => {
    if (useMockData) {
      return;
    }
    if (!questionsData) {
      return;
    }
    const mapLocations: MapLocation[] = questionsData.map((q: Question) => ({
      id: q.id,
      coordinates: q.location,
      title: q.title,
      description: q.body ?? undefined,
    }));
    setLocations(mapLocations);
  }, [questionsData, useMockData]);

  // When using mock data, generate random points whenever region changes
  useEffect(() => {
    if (!useMockData) return;
    if (!currentRegion) return;
    console.debug(
      "[FeedPage] Generating mock locations for region:",
      currentRegion
    );
    const mocks = generateMockLocations(
      currentRegion.center,
      currentRegion.radius,
      8
    );
    setLocations(mocks);
  }, [currentRegion, useMockData]);

  // When switching from mock data to real data, clear the mock markers and refetch.
  useEffect(() => {
    if (!useMockData && previousUseMockData.current) {
      setLocations([]);
      if (currentRegion) {
        void refetch();
      }
    }
    previousUseMockData.current = useMockData;
  }, [useMockData, currentRegion, refetch]);

  // Manual refresh function - calls the query's refetch
  const handleManualRefresh = () => {
    if (useMockData) {
      // regenerate mocks
      if (currentRegion) {
        const mocks = generateMockLocations(
          currentRegion.center,
          currentRegion.radius,
          8
        );
        setLocations(mocks);
      }
    } else {
      void refetch();
    }
  };

  // Handle marker press
  const handleMarkerPress = (location: MapLocation) => {
    console.log("Marker pressed:", location);
    // TODO: Navigate to question details or show modal
    // Example: navigation.navigate('QuestionDetails', { questionId: location.id });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
      <YStack flex={1}>
        <View padding="$4" paddingBottom="$2">
          <View
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <YStack>
              <Text fontSize="$8" fontWeight="bold">
                Feed
              </Text>
              <Text fontSize="$4" color="$gray11">
                Questions near you
              </Text>
            </YStack>
            <Button
              size="$3"
              onPress={handleManualRefresh}
              disabled={isFetching || !currentRegion}
              theme="blue"
            >
              {isFetching ? "Loading..." : "Refresh"}
            </Button>
            <Button
              size="$3"
              onPress={() => setUseMockData((s) => !s)}
              theme={useMockData ? "gray" : "green"}
            >
              {useMockData ? "Using Mock" : "Using Real"}
            </Button>
          </View>
        </View>

        {isFetching && !useMockData && (
          <View padding="$2" alignItems="center">
            <Spinner size="small" />
          </View>
        )}

        {useMockData ? (
          <View paddingHorizontal="$4" paddingBottom="$2">
            <Text fontSize="$2" color="$gray11">
              Showing mock data while the backend endpoint is unavailable.
            </Text>
          </View>
        ) : null}

        {queryErrorMessage ? (
          <View paddingHorizontal="$4" paddingBottom="$2">
            <Text fontSize="$2" color="$red10">
              {queryErrorMessage}
            </Text>
          </View>
        ) : null}

        <FeedMap
          locations={locations}
          onRegionChange={handleRegionChange}
          onMarkerPress={handleMarkerPress}
          height={600}
          showRadiusCircle={false}
          disableAutoFetch={false}
        />
      </YStack>
    </SafeAreaView>
  );
}
