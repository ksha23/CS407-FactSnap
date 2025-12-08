import React, { useState, useEffect, useRef, useCallback } from "react";
import { Alert, StyleSheet, Platform } from "react-native";
import MapView, { Marker, Region, PROVIDER_GOOGLE, Circle } from "react-native-maps";
import { View, Text, Button, Input, YStack, XStack, Spinner } from "tamagui";
import {
    Coordinates,
    getCurrentLocation,
    forwardGeocode,
} from "@/services/location-service";

const REGION_CHANGE_DEBOUNCE_MS = 1000;
const INITIAL_RADIUS_MILES = 10;

// 1. Define defaults constants to use immediately
const DEFAULT_COORDS: Coordinates = {
    latitude: 43.0731, // Madison, WI
    longitude: -89.4012,
};

const DEFAULT_REGION: Region = {
    latitude: DEFAULT_COORDS.latitude,
    longitude: DEFAULT_COORDS.longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
};

export interface MapLocation {
    id: string;
    questionId: string;
    coordinates: Coordinates;
    title: string;
    description?: string;
}

interface FeedMapProps {
    onRegionChange: (center: Coordinates, radiusMiles: number) => void;
    locations: MapLocation[];
    onMarkerPress?: (location: MapLocation) => void;
    height?: number;
    showRadiusCircle?: boolean;
    disableAutoFetch?: boolean;
    mapKey: string;
    recenterToken?: number;
}

export default function FeedMap({
    onRegionChange,
    locations,
    onMarkerPress,
    height = 500,
    showRadiusCircle = false,
    disableAutoFetch = false,
    mapKey,
    recenterToken,
}: FeedMapProps) {
    // 2. Initialize with Default Region immediately (No null state)
    const [region, setRegion] = useState<Region>(DEFAULT_REGION);
    const [searchQuery, setSearchQuery] = useState<string>("");
    
    // We can remove the general loading state since we want to show the map immediately
    const [radiusMiles, setRadiusMiles] = useState<number>(INITIAL_RADIUS_MILES);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [isLocating, setIsLocating] = useState<boolean>(true);
    
    const mapRef = useRef<MapView>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ignoreInitialRegionChangeRef = useRef(false);

    // 3. New Initialization Logic
    useEffect(() => {
        const init = async () => {
            // STEP A: Fetch fresh high-accuracy location (Slower)
            try {
                const freshLocation = await getCurrentLocation();
                
                if (freshLocation && mapRef.current) {
                    console.log("Refining location with fresh GPS data...");
                    const refinedRegion = {
                        latitude: freshLocation.coordinates.latitude,
                        longitude: freshLocation.coordinates.longitude,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    };
                    
                    // Flag to ignore the region change triggered by this animation
                    ignoreInitialRegionChangeRef.current = true;
                    mapRef.current.animateToRegion(refinedRegion, 1000);
                    
                    onRegionChange(freshLocation.coordinates, INITIAL_RADIUS_MILES);
                } else {
                    // If we failed to get fresh location, we just stop locating.
                    // The map stays at default, but we don't trigger a fetch.
                    console.log("Could not get fresh location.");
                }
            } catch (error) {
                console.log("Background location fetch failed", error);
            } finally {
                setIsLocating(false);
            }
        };

        init();

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleRegionChangeComplete = useCallback(
        (newRegion: Region) => {
            // Don't trigger updates while we are still determining initial location
            if (isLocating) return;

            setRegion(newRegion);

            const calculatedRadius = (newRegion.latitudeDelta * 69) / 2;
            const radius = Math.min(Math.max(calculatedRadius, 0.1), 50);

            setRadiusMiles(radius);

            if (disableAutoFetch) return;

            // If this region change was caused by the initial location animation, ignore it
            // because we already manually triggered the fetch in init()
            if (ignoreInitialRegionChangeRef.current) {
                ignoreInitialRegionChangeRef.current = false;
                return;
            }

            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = setTimeout(() => {
                const center: Coordinates = {
                    latitude: newRegion.latitude,
                    longitude: newRegion.longitude,
                };
                onRegionChange(center, radius);
            }, REGION_CHANGE_DEBOUNCE_MS);
        },
        [disableAutoFetch, onRegionChange, isLocating],
    );

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            Alert.alert("Enter a location", "Type something to search for first.");
            return;
        }

        try {
            setIsSearching(true);
            const coords = await forwardGeocode(searchQuery.trim());
            if (!coords) {
                Alert.alert("Location not found", "Try a different search term.");
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
            Alert.alert("Search failed", "Please try again.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleResetToCurrentLocation = async () => {
        try {
            const currentLocation = await getCurrentLocation();
            if (!currentLocation) {
                Alert.alert("Location unavailable", "We could not determine your current location.");
                return;
            }

            mapRef.current?.animateToRegion({
                latitude: currentLocation.coordinates.latitude,
                longitude: currentLocation.coordinates.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            });
        } catch (error) {
            console.error("Failed to reset map:", error);
        }
    };

    useEffect(() => {
        if (!recenterToken) return;
        void handleResetToCurrentLocation();
    }, [recenterToken]);

    // 4. Removed the "if (isLoading)" block entirely so MapView renders immediately

    return (
        <YStack gap="$3" flex={1}>
            <XStack gap="$2" paddingHorizontal="$3">
                <Input
                    flex={1}
                    placeholder="Search location..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                />
                <Button onPress={handleResetToCurrentLocation} theme="gray">
                    📍
                </Button>
            </XStack>

            <View paddingHorizontal="$3">
                <Text fontSize="$2" color="$gray11">
                    Showing {locations.length} location(s) within ~
                    {radiusMiles.toFixed(1)} miles
                </Text>
            </View>

            <View flex={1} height={height} borderRadius="$4" overflow="hidden" position="relative">
                <MapView
                    key={mapKey}
                    ref={mapRef}
                    style={styles.map}
                    provider={
                        Platform.OS === "android" || Platform.OS === "ios"
                            ? PROVIDER_GOOGLE
                            : undefined
                    }
                    // Use initialRegion to set the start point, but control subsequent updates via animateToRegion
                    initialRegion={DEFAULT_REGION}
                    onRegionChangeComplete={handleRegionChangeComplete}
                    showsUserLocation={!isLocating}
                    showsMyLocationButton={false}
                    moveOnMarkerPress={false}
                >
                    {locations.map((location, i) => (
                        <Marker
                            key={location.questionId + location.id + i}
                            coordinate={location.coordinates}
                            title={location.title}
                            description={location.description}
                            onPress={() => onMarkerPress?.(location)}
                        />
                    ))}

                    {showRadiusCircle && region && (
                        <Circle
                            center={{
                                latitude: region.latitude,
                                longitude: region.longitude,
                            }}
                            radius={radiusMiles * 1609.34}
                            strokeColor="rgba(0, 122, 255, 0.5)"
                            fillColor="rgba(0, 122, 255, 0.1)"
                            strokeWidth={2}
                        />
                    )}
                </MapView>
                
                {isLocating && (
                    <View
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        backgroundColor="rgba(0,0,0,0.3)"
                        justifyContent="center"
                        alignItems="center"
                        zIndex={1000}
                    >
                        <Spinner size="large" color="white" />
                    </View>
                )}
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
