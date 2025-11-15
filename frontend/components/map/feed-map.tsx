import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Alert, StyleSheet, Platform } from "react-native";
import MapView, {
  Marker,
  Region,
  PROVIDER_GOOGLE,
  Circle,
} from "react-native-maps";
import { View, Text, Button, Input, YStack, XStack, Spinner } from "tamagui";
import {
  Coordinates,
  getCurrentLocation,
  forwardGeocode,
} from "@/services/location-service";

// Debounce delay in milliseconds (wait 1 second after user stops moving map)
const REGION_CHANGE_DEBOUNCE_MS = 1000;
const INITIAL_RADIUS_MILES = 10;

export interface MapLocation {
  id: string;
  questionId: string;
  coordinates: Coordinates;
  title: string;
  description?: string;
  // Add any other properties from your API response
}

interface FeedMapProps {
  /**
   * Callback to fetch locations based on center and radius
   * Should make API call to backend with these params
   */
  onRegionChange: (center: Coordinates, radiusMiles: number) => void;

  /**
   * Array of locations to display on the map
   */
  locations: MapLocation[];

  /**
   * Callback when a marker is pressed
   */
  onMarkerPress?: (location: MapLocation) => void;

  /**
   * Height of the map component
   */
  height?: number;

  /**
   * Show radius circle on map
   */
  showRadiusCircle?: boolean;

  /**
   * Disable automatic API calls on region change
   * Useful when backend is not available
   */
  disableAutoFetch?: boolean;
  /**
   * Optional key to force remounting of the underlying MapView when the
   * set of markers changes. Pass a stable join of question IDs from the
   * parent to force an immediate map update when items change.
   */
  mapKey?: string;
}

/**
 * FeedMap Component
 * Displays a map with multiple location markers
 * Updates via API calls based on visible region
 * Defaults to current location but adjustable via search
 */
export default function FeedMap({
  onRegionChange,
  locations,
  onMarkerPress,
  height = 500,
  showRadiusCircle = true,
  disableAutoFetch = false,
  mapKey,
}: FeedMapProps) {
  // Unique key for the current marker set; forcing the fragment below to remount
  // when the ID set changes ensures MapView drops any cached marker children without
  // needing to remount the entire map.
  const markerSetKey = useMemo(() => {
    const ids = locations.map((loc) => loc.questionId).sort();
    return ids.join(",");
  }, [locations]);

  // debug: log when locations prop changes
  useEffect(() => {
    try {
      // console.debug("FeedMap: received locations prop", locations.length, "ids:", locations.map(l => l.questionId).join(","));
    } catch (e) {
      // ignore
    }
  }, [locations]);
  const [region, setRegion] = useState<Region | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [radiusMiles, setRadiusMiles] = useState<number>(INITIAL_RADIUS_MILES);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initializeMap = useCallback(async () => {
    setIsLoading(true);

    const currentLocation = await getCurrentLocation();
    const coords: Coordinates = currentLocation?.coordinates || {
      latitude: 43.0731, // Default to Madison, WI
      longitude: -89.4012,
    };

    const initialRegion: Region = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    setRegion(initialRegion);
    setIsLoading(false);
    console.debug("FeedMap: initializeMap calling onRegionChange", coords, INITIAL_RADIUS_MILES);
    onRegionChange(coords, INITIAL_RADIUS_MILES);
  }, [onRegionChange]);

  // Initialize with current location
  useEffect(() => {
    void initializeMap();

    // Cleanup debounce timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [initializeMap]);

  // Handle region change (when user pans or zooms) with debouncing
  const handleRegionChangeComplete = useCallback(
    (newRegion: Region) => {
      setRegion(newRegion);

      // Calculate approximate radius in miles from latitudeDelta
      // This is a rough approximation: 1 degree ≈ 69 miles
      const calculatedRadius = (newRegion.latitudeDelta * 69) / 2;
      const radius = Math.min(Math.max(calculatedRadius, 0.1), 50); // Clamp between 0.1-50 miles

      setRadiusMiles(radius);

      // Skip API calls if disabled
      if (disableAutoFetch) {
        return;
      }

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer - only call API after user stops moving map for 1 second
      debounceTimerRef.current = setTimeout(() => {
        const center: Coordinates = {
          latitude: newRegion.latitude,
          longitude: newRegion.longitude,
        };

        console.debug("FeedMap: debounced onRegionChange", center, radius);
        onRegionChange(center, radius);
      }, REGION_CHANGE_DEBOUNCE_MS);
    },
    [disableAutoFetch, onRegionChange]
  );

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Enter a location", "Type something to search for first.");
      return;
    }

    try {
      setIsSearching(true);
      const coords = await forwardGeocode(searchQuery.trim());
      if (!coords) {
        Alert.alert(
          "Location not found",
          "We couldn't find that place. Try a different search term."
        );
        return;
      }

      mapRef.current?.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    } catch (error) {
      console.error("Search failed:", error);
      Alert.alert(
        "Search failed",
        "We ran into an issue searching for that place. Please try again."
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Reset to current location
  const handleResetToCurrentLocation = async () => {
    try {
      const currentLocation = await getCurrentLocation();
      if (!currentLocation) {
        Alert.alert(
          "Location unavailable",
          "We could not determine your current location."
        );
        return;
      }

      mapRef.current?.animateToRegion({
        latitude: currentLocation.coordinates.latitude,
        longitude: currentLocation.coordinates.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    } catch (error) {
      console.error("Failed to reset map to current location:", error);
      Alert.alert(
        "Location unavailable",
        "An error occurred while fetching your current location."
      );
    }
  };

  if (isLoading || !region) {
    return (
      <View
        flex={1}
        justifyContent="center"
        alignItems="center"
        height={height}
      >
        <Spinner size="large" />
        <Text marginTop="$4">Loading map...</Text>
      </View>
    );
  }

  return (
    <YStack gap="$3" flex={1}>
      {/* Search controls */}
      <XStack gap="$2" paddingHorizontal="$3">
        <Input
          flex={1}
          placeholder="Search location..."
          value={searchQuery}
          height="$5"
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        {/* <Button
          onPress={handleSearch}
          disabled={isSearching}
          theme="blue"
        >
          {isSearching ? "Searching..." : "Search"}
        </Button> */}
        <Button onPress={handleResetToCurrentLocation} theme="gray">
          📍
        </Button>
      </XStack>

      {/* Info bar
      <View paddingHorizontal="$3">
        <Text fontSize="$2" color="$gray11">
          Showing {locations.length} location(s) within ~
          {radiusMiles.toFixed(1)} miles
        </Text>
      </View> */}

      {/* Map */}
      <View flex={1} height={height} borderRadius="$4" overflow="hidden">
        <MapView
          key={mapKey}
          ref={mapRef}
          style={styles.map}
          provider={
            Platform.OS === "android" || Platform.OS === "ios"
              ? PROVIDER_GOOGLE
              : undefined
          }
          initialRegion={region}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
          moveOnMarkerPress={false}
        >
          {/* Render location markers */}
          {/* Force the marker layer to remount whenever the ID set changes to avoid stale children */}
          <React.Fragment key={markerSetKey}>
            {locations.map((location) => (
              <Marker
                key={location.questionId}
                identifier={location.questionId}
                coordinate={{ latitude: Number(location.coordinates.latitude), longitude: Number(location.coordinates.longitude) }}
                title={location.title}
                description={location.description}
                onPress={() => {
                  console.debug("FeedMap: marker pressed", location.questionId, location.id);
                  onMarkerPress?.(location);
                }}
              />
            ))}
          </React.Fragment>

          {/* Optional radius circle */}
          {showRadiusCircle && region && (
            <Circle
              center={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
              radius={radiusMiles * 1609.34} // Convert miles to meters
              strokeColor="rgba(0, 122, 255, 0.5)"
              fillColor="rgba(0, 122, 255, 0.1)"
              strokeWidth={2}
            />
          )}
        </MapView>
      </View>
    </YStack>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});
