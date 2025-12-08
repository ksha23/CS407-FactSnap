import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Platform, Alert, Keyboard } from "react-native";
import MapView, {
    Marker,
    Region,
    PROVIDER_GOOGLE,
    MapPressEvent,
} from "react-native-maps";
import { View, Text, Button, Input, YStack, XStack, Spinner } from "tamagui";

import {
    getCurrentLocation,
    type Coordinates
} from "@/services/location-service";

import { usePlaceAutocomplete } from "@/hooks/use-place-autocomplete";
import { useReverseGeocodeName } from "@/hooks/use-reverse-geocode-name";
import { Location } from "@/models/location";

// 1. Constant Default
const DEFAULT_COORDS: Coordinates = {
    latitude: 43.0731, // Madison, WI
    longitude: -89.4012,
};

export interface LocationSelection {
    coords: Coordinates;
    address: string;
    label: string;
}

interface LocationPickerProps {
    onChange?: (sel: LocationSelection) => void;
    initialLocation?: Location;
    height?: number;
}

export default function LocationPicker({
    onChange,
    initialLocation,
    height = 400,
}: LocationPickerProps) {
    // Helper to safely extract coordinates from Location or use Default
    const getStartCoords = (): Coordinates => {
        if (initialLocation) {
            return {
                latitude: initialLocation.latitude,
                longitude: initialLocation.longitude
            };
        }
        return DEFAULT_COORDS;
    };

    const startCoords = getStartCoords();

    // 2. Initialize state immediately using the helper
    const [coords, setCoords] = useState<Coordinates>(startCoords);
    
    // Construct the Region separate from Coordinates
    const [initialRegion] = useState<Region>({
        latitude: startCoords.latitude,
        longitude: startCoords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    const [address, setAddress] = useState<string>(initialLocation?.address ?? "");
    const [label, setLabel] = useState<string>(initialLocation?.name ?? "");

    const [userEditedLabel, setUserEditedLabel] = useState(false);
    const [userEditedAddress, setUserEditedAddress] = useState(false);

    const mapRef = useRef<MapView>(null);
    const selectionIdRef = useRef(0);
    const isMountedRef = useRef(true);
    const fetchedLocationRef = useRef<Coordinates | null>(null);

    const [latInput, setLatInput] = useState<string>(startCoords.latitude.toFixed(6));
    const [lngInput, setLngInput] = useState<string>(startCoords.longitude.toFixed(6));

    const {
        query,
        setQuery,
        suggestions,
        loading: suggestionsLoading,
        resolveSuggestion,
        resolveFreeText,
        clearSuggestions,
    } = usePlaceAutocomplete();

    const { getBestAddressFor } = useReverseGeocodeName();
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [isFetchingCurrentLocation, setIsFetchingCurrentLocation] = useState(false);
    const [isInitializing, setIsInitializing] = useState(!initialLocation);

    const emitChange = (
        nextCoords: Coordinates,
        nextAddress: string,
        nextLabel: string,
    ) => {
        if (!onChange) return;
        onChange({
            coords: nextCoords,
            address: nextAddress,
            label: nextLabel,
        });
    };

    const startNewSelection = async ({
        nextCoords,
        seedLabel,
        seedAddress,
        source,
        animate = true,
    }: {
        nextCoords: Coordinates;
        seedLabel?: string;
        seedAddress?: string;
        source: "places" | "map" | "manual" | "current";
        animate?: boolean;
    }) => {
        const newId = selectionIdRef.current + 1;
        selectionIdRef.current = newId;
        
        setCoords(nextCoords);

        const formattedCoords = `(${nextCoords.latitude.toFixed(5)}, ${nextCoords.longitude.toFixed(5)})`;
        const trimmedSeedLabel = seedLabel?.trim() ?? "";
        const trimmedSeedAddress = seedAddress?.trim() ?? "";

        const defaultLabel = trimmedSeedLabel || trimmedSeedAddress || formattedCoords;
        const defaultAddress = trimmedSeedAddress || trimmedSeedLabel || formattedCoords;

        if (isMountedRef.current) {
            setLabel(defaultLabel);
            setAddress(defaultAddress);
            setUserEditedLabel(false);
            setUserEditedAddress(false);
            setIsEditingDetails(false);

            setLatInput(nextCoords.latitude.toFixed(6));
            setLngInput(nextCoords.longitude.toFixed(6));
        }

        if (animate && mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    latitude: nextCoords.latitude,
                    longitude: nextCoords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                },
                500,
            );
        }

        emitChange(nextCoords, defaultAddress, defaultLabel);

        try {
            if (seedAddress && seedLabel) return;

            const betterAddr = await getBestAddressFor(nextCoords);
            
            if (selectionIdRef.current !== newId) return;
            if (!isMountedRef.current) return;

            const candidateAddress = (betterAddr ?? "").trim();
            const resolvedAddress = !userEditedAddress
                ? candidateAddress || defaultAddress
                : defaultAddress;
            const resolvedLabel = !userEditedLabel
                ? trimmedSeedLabel || candidateAddress || defaultLabel
                : defaultLabel;

            if (!userEditedAddress) setAddress(resolvedAddress);
            if (!userEditedLabel) setLabel(resolvedLabel);
            
            emitChange(nextCoords, resolvedAddress, resolvedLabel);
        } catch (error) {
            console.warn("[LocationPicker] reverse geocode failed:", error);
        }
    };

    // 3. Smart Initialization Waterfall
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            // Case A: Initial Location provided via props
            if (initialLocation) {
                await startNewSelection({
                    // FIX: access lat/long directly, not via .coordinates
                    nextCoords: {
                        latitude: initialLocation.latitude,
                        longitude: initialLocation.longitude
                    },
                    seedAddress: initialLocation.address,
                    seedLabel: initialLocation.name,
                    source: "manual",
                    animate: false,
                });
                return;
            }

            // Case B: No initial location.
            
            // Try GPS Location (Slow)
            try {
                const currentLoc = await getCurrentLocation();
                if (currentLoc && !cancelled) {
                    console.log("Refining with fresh GPS");
                    fetchedLocationRef.current = currentLoc.coordinates;
                    await startNewSelection({
                        nextCoords: currentLoc.coordinates,
                        source: "current",
                    });
                } else if (!cancelled) {
                     // Ensure text fields are populated for default location if everything failed
                     // But we don't want to "set" the location if we failed?
                     // User said "default location should be shown but not actually used to fetch questions or set the location"
                     // So we might just stop initializing and let the user manually pick.
                     console.log("Could not get fresh location.");
                }
            } catch (error) {
                console.error("Failed to get fresh location", error);
            } finally {
                if (!cancelled) setIsInitializing(false);
            }
        };

        void init();

        return () => {
            cancelled = true;
            isMountedRef.current = false;
        };
    }, []);
    
    const handleMapPress = (event: MapPressEvent) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        startNewSelection({
            nextCoords: { latitude, longitude },
            source: "map",
        });
    };

    const handleSearchSubmit = async () => {
        const trimmed = query.trim();
        if (!trimmed) {
            Alert.alert("Enter a place", "Type a location to search for first.");
            return;
        }

        try {
            const result = await resolveFreeText(trimmed);
            if (!result) {
                Alert.alert("Location not found", "No match found.");
                return;
            }
            await startNewSelection({
                nextCoords: result.coordinates,
                seedLabel: result.label,
                seedAddress: result.address,
                source: "places",
            });
            setQuery(result.label);
            clearSuggestions();
        } catch (error) {
            console.error("Search failed:", error);
            Alert.alert("Search failed", "Error searching for place.");
        }
    };

    const handlePickSuggestion = async (place_id: string, description: string) => {
        try {
            const result = await resolveSuggestion(place_id, description);
            if (!result) {
                Alert.alert("Place unavailable", "Could not fetch details.");
                return;
            }
            await startNewSelection({
                nextCoords: result.coordinates,
                seedLabel: result.label,
                seedAddress: result.address,
                source: "places",
            });
            setQuery("");
            clearSuggestions();
            Keyboard.dismiss();
        } catch (error) {
            console.error("Suggestion failed:", error);
            Alert.alert("Error", "Could not load suggestion.");
        }
    };

    const handleLatLngGo = () => {
        const lat = parseFloat(latInput);
        const lng = parseFloat(lngInput);
        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert("Invalid coordinates", "Please enter valid numbers.");
            return;
        }
        startNewSelection({
            nextCoords: { latitude: lat, longitude: lng },
            source: "manual",
        });
    };

    const handleUseCurrent = async () => {
        if (fetchedLocationRef.current) {
            await startNewSelection({
                nextCoords: fetchedLocationRef.current,
                source: "map",
            });
            return;
        }

        setIsFetchingCurrentLocation(true);
        try {
            const currentLoc = await getCurrentLocation();
            if (!currentLoc) {
                Alert.alert("Location unavailable", "Could not determine location.");
                return;
            }
            fetchedLocationRef.current = currentLoc.coordinates;
            await startNewSelection({
                nextCoords: currentLoc.coordinates,
                source: "map",
            });
        } catch (error) {
            console.error("Failed to load current location:", error);
        } finally {
            setIsFetchingCurrentLocation(false);
        }
    };

    const handleLabelChange = (txt: string) => {
        setLabel(txt);
        setUserEditedLabel(true);
        if (coords) emitChange(coords, address, txt);
    };

    const handleAddressChange = (txt: string) => {
        setAddress(txt);
        setUserEditedAddress(true);
        if (coords) emitChange(coords, txt, label);
    };

    return (
        <YStack gap="$3" position="relative">
                <Input
                    flex={1}
                    placeholder="Search for a place..."
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearchSubmit}
                    size="$4"
                    py="$2"
                />

            {suggestionsLoading && <Spinner size="small" />}
            {suggestions.length > 0 && (
                <YStack
                    // backgroundColor="$background"
                    // borderRadius="$3"
                    // padding="$2"
                    maxHeight={200}
                    // borderWidth={1}
                    borderColor="$gray5"
                >
                    {suggestions.map((s) => (
                        <Button
                            key={s.place_id}
                            onPress={() => handlePickSuggestion(s.place_id, s.description)}
                            size="$3"
                            theme="gray"
                            justifyContent="flex-start"
                            marginBottom="$1"
                        >
                            {s.description}
                        </Button>
                    ))}
                </YStack>
            )}

            <XStack gap="$2">
                <Input
                    flex={1}
                    placeholder="Latitude"
                    value={latInput}
                    onChangeText={setLatInput}
                    keyboardType="numeric"
                    size="$3"
                    py = "$2"
                />
                <Input
                    flex={1}
                    placeholder="Longitude"
                    value={lngInput}
                    onChangeText={setLngInput}
                    keyboardType="numeric"
                    size="$3"
                    py = "$2"
                />
                <Button size="$3" onPress={handleLatLngGo}>
                    Go
                </Button>
            </XStack>

            <Button size="$3" onPress={handleUseCurrent} theme="blue">
                Use Current Location
            </Button>

            <View height={height} borderRadius="$4" overflow="hidden" position="relative">
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={
                        Platform.OS === "android" || Platform.OS === "ios"
                            ? PROVIDER_GOOGLE
                            : undefined
                    }
                    initialRegion={initialRegion}
                    onPress={handleMapPress}
                    showsUserLocation={!isInitializing}
                    showsMyLocationButton={false}
                >
                    <Marker
                        coordinate={coords}
                        title={label || "Selected Location"}
                        description={address}
                    />
                </MapView>
                
                {isInitializing && (
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

            {!isEditingDetails ? (
                <YStack
                    padding="$3"
                    backgroundColor="$background"
                    borderRadius="$4"
                    gap="$2"
                    borderWidth={1}
                    borderColor="$gray5"
                >
                    <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize="$4" fontWeight="bold">Selected Location</Text>
                        <Button size="$2" theme="gray" onPress={() => setIsEditingDetails(true)}>
                            Edit ✎
                        </Button>
                    </XStack>

                    <Text fontSize="$3" color="$gray10">Name:</Text>
                    <Text fontSize="$3" fontWeight="600" color="$color">
                        {label?.trim() ? label : "Unnamed location"}
                    </Text>

                    {address?.trim() ? (
                        <>
                            <Text fontSize="$3" color="$gray10" marginTop="$2">Address:</Text>
                            <Text fontSize="$3" color="$color" fontWeight="600">{address}</Text>
                        </>
                    ) : null}

                    <XStack gap="$2" flexWrap="wrap" marginTop="$2">
                        <Text color="$gray11" fontSize="$2">
                            Lat: <Text color="$color" fontWeight="600">{coords.latitude.toFixed(6)}</Text>
                        </Text>
                        <Text color="$gray11" fontSize="$2">
                            Lng: <Text color="$color" fontWeight="600">{coords.longitude.toFixed(6)}</Text>
                        </Text>
                    </XStack>
                </YStack>
            ) : (
                <YStack
                    padding="$3"
                    backgroundColor="$background"
                    borderRadius="$4"
                    gap="$3"
                    borderWidth={1}
                    borderColor="$gray5"
                >
                    <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize="$4" fontWeight="bold">Edit Location Details</Text>
                        <Button size="$2" theme="blue" onPress={() => setIsEditingDetails(false)}>
                            Done
                        </Button>
                    </XStack>

                    <YStack gap="$1">
                        <Text fontSize="$3" color="$gray10">Name</Text>
                        <Input
                            value={label}
                            onChangeText={handleLabelChange}
                            placeholder="Location name..."
                            size="$3"
                            paddingVertical={8}
                        />
                    </YStack>

                    <YStack gap="$1">
                        <Text fontSize="$3" color="$gray10">Address</Text>
                        <Input
                            value={address}
                            onChangeText={handleAddressChange}
                            placeholder="Address..."
                            size="$3"
                            paddingVertical={8}
                        />
                    </YStack>

                    <XStack gap="$2" flexWrap="wrap">
                        <Text color="$gray11" fontSize="$2">
                            Lat:{" "}
                            <Text color="$color" fontWeight="600">
                                {coords.latitude.toFixed(6)}
                            </Text>
                        </Text>
                        <Text color="$gray11" fontSize="$2">
                            Lng:{" "}
                            <Text color="$color" fontWeight="600">
                                {coords.longitude.toFixed(6)}
                            </Text>
                        </Text>
                    </XStack>
                </YStack>
            )}

            {isFetchingCurrentLocation && (
                <View
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    backgroundColor="rgba(0,0,0,0.5)"
                    zIndex={1000}
                    justifyContent="center"
                    alignItems="center"
                    borderRadius="$3"
                >
                    <Spinner size="large" color="white" />
                </View>
            )}
        </YStack>
    );
}

const styles = StyleSheet.create({
    map: { width: "100%", height: "100%" },
});
