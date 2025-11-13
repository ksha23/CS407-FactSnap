import {useState} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import {ScrollView, Text, View, YStack} from "tamagui";
import FeedMap, {MapLocation} from "@/components/map/feed-map";
import {Coordinates} from "@/services/location-service";
import {RefreshControl} from "react-native";
import {useGetQuestionsFeed} from "@/hooks/tanstack/question";
import {PageFilterType} from "@/services/axios-client";
import QuestionsFeed from "@/components/feed/questions-feed";
import {useQueryClient} from "@tanstack/react-query";
import {Question} from "@/models/question";
import {useRouter} from "expo-router";

export default function FeedPage() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [currentRegion, setCurrentRegion] = useState<{
    center: Coordinates;
    radius: number;
  } | null>(null);
  const router = useRouter()


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
        questionId: question.id,
        coordinates: {latitude: question.location.latitude, longitude: question.location.longitude},
        title: question.location.name ?? "Unknown",
        description: question.location.address?? "Unknown"
      })
    })
    setLocations(newLocations)
  }

  return (
      <SafeAreaView edges={["left", "right", "bottom"]}>
        <ScrollView margin={0}>
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
            <FeedMap
                locations={locations}
                onRegionChange={handleRegionChange}
                onMarkerPress={handleMarkerPress}
                showRadiusCircle={true}
                disableAutoFetch={false}
                height={300}
            />
          </YStack>

          {/* Questions Feed */}
          <QuestionsFeed
              region={currentRegion}
              onQuestionsChange={handleQuestionsUpdate}
          />
        </ScrollView>

      </SafeAreaView>
  );
}
