import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Platform, Alert } from "react-native";
import MapView, {
  Marker,
  Region,
  PROVIDER_GOOGLE,
  MapPressEvent,
} from "react-native-maps";
import { View, Text, Button, Input, YStack, XStack, Spinner } from "tamagui";

import { getCurrentLocation } from "@/services/location-service";
import type { Coordinates } from "@/services/location-service";

import { usePlaceAutocomplete } from "@/hooks/use-place-autocomplete";
import { useReverseGeocodeName } from "@/hooks/use-reverse-geocode-name";

export interface LocationSelection {
  coords: Coordinates;
  address: string;
  label: string;
}

interface LocationPickerProps {
  onChange?: (sel: LocationSelection) => void;
  initialLocation?: Coordinates;
  height?: number;
}

export default function LocationPicker({
  onChange,
  initialLocation,
  height = 400,
}: LocationPickerProps) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string>("");
  const [label, setLabel] = useState<string>("");

  const [userEditedLabel, setUserEditedLabel] = useState(false);
  const [userEditedAddress, setUserEditedAddress] = useState(false);

  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<MapView>(null);
  const selectionIdRef = useRef(0);
  const isMountedRef = useRef(true);

  const [latInput, setLatInput] = useState<string>("");
  const [lngInput, setLngInput] = useState<string>("");

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

  const emitChange = (
    nextCoords: Coordinates,
    nextAddress: string,
    nextLabel: string
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
  }: {
    nextCoords: Coordinates;
    seedLabel?: string;
    seedAddress?: string;
    source: "places" | "map" | "manual" | "current";
  }) => {
    const newId = selectionIdRef.current + 1;
    selectionIdRef.current = newId;
    setCoords(nextCoords);

    const formattedCoords = `(${nextCoords.latitude.toFixed(5)}, ${nextCoords.longitude.toFixed(5)})`;
    const trimmedSeedLabel = seedLabel?.trim() ?? "";
    const trimmedSeedAddress = seedAddress?.trim() ?? "";

    const defaultLabel =
      trimmedSeedLabel || trimmedSeedAddress || formattedCoords;
    const defaultAddress =
      trimmedSeedAddress || trimmedSeedLabel || formattedCoords;

    setLabel(defaultLabel);
    setAddress(defaultAddress);
    setUserEditedLabel(false);
    setUserEditedAddress(false);
    setIsEditingDetails(false);

    setLatInput(nextCoords.latitude.toFixed(6));
    setLngInput(nextCoords.longitude.toFixed(6));

    mapRef.current?.animateToRegion(
      {
        latitude: nextCoords.latitude,
        longitude: nextCoords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      250
    );

    emitChange(nextCoords, defaultAddress, defaultLabel);

    try {
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

      if (!userEditedAddress && isMountedRef.current) {
        setAddress(resolvedAddress);
      }
      if (!userEditedLabel && isMountedRef.current) {
        setLabel(resolvedLabel);
      }
      emitChange(nextCoords, resolvedAddress, resolvedLabel);
    } catch (error) {
      console.warn("[LocationPicker] reverse geocode failed:", error);
      if (selectionIdRef.current !== newId) return;
      if (!isMountedRef.current) return;

      // keep default fallback that was already emitted
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setIsLoading(true);
      try {
        let startCoords: Coordinates | null = null;

        if (initialLocation) {
          startCoords = initialLocation;
        } else {
          const currentLoc = await getCurrentLocation();
          if (currentLoc) startCoords = currentLoc.coordinates;
        }

        if (!startCoords) {
          startCoords = { latitude: 43.0731, longitude: -89.4012 };
        }

        if (!cancelled) {
          setInitialRegion({
            latitude: startCoords.latitude,
            longitude: startCoords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }

        await startNewSelection({
          nextCoords: startCoords,
          source: "current",
        });
      } catch (error) {
        console.error("Failed to initialise location picker:", error);
        if (!cancelled) {
          Alert.alert(
            "Map unavailable",
            "We could not initialise the map. Try again in a moment."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        Alert.alert(
          "Location not found",
          "We could not find a match for that search."
        );
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
      console.error("Free text search failed:", error);
      Alert.alert(
        "Search failed",
        "We ran into an issue searching for that place."
      );
    }
  };

  const handlePickSuggestion = async (
    place_id: string,
    description: string
  ) => {
    try {
      const result = await resolveSuggestion(place_id, description);
      if (!result) {
        Alert.alert(
          "Place unavailable",
          "We could not fetch details for that suggestion."
        );
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
      console.error("Autocomplete suggestion failed:", error);
      Alert.alert(
        "Place lookup failed",
        "We could not load that suggestion. Please try another."
      );
    }
  };

  const handleLatLngGo = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert("Invalid coordinates", "Please enter valid numbers.");
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert(
        "Out of range",
        "Latitude must be [-90,90], longitude [-180,180]."
      );
      return;
    }
    startNewSelection({
      nextCoords: { latitude: lat, longitude: lng },
      source: "manual",
    });
  };

  const handleUseCurrent = async () => {
    try {
      const currentLoc = await getCurrentLocation();
      if (!currentLoc) {
        Alert.alert(
          "Location unavailable",
          "We could not determine your current location."
        );
        return;
      }
      await startNewSelection({
        nextCoords: currentLoc.coordinates,
        seedLabel: "Current Location",
        source: "current",
      });
    } catch (error) {
      console.error("Failed to load current location:", error);
      Alert.alert(
        "Location unavailable",
        "An error occurred while fetching your current location."
      );
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

  // ---------------- render ----------------
  if (isLoading || !initialRegion || !coords) {
    return (
      <View flex={1} justifyContent="center" alignItems="center" height={height}>
        <Spinner size="large" />
        <Text marginTop="$4">Loading map...</Text>
      </View>
    );
  }

  return (
    <YStack gap="$3">
      <XStack gap="$2">
        <Input
          flex={1}
          placeholder="Search for a place..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearchSubmit}
          size="$3"
        />
        <Button size="$3" onPress={handleSearchSubmit}>
          Search
        </Button>
      </XStack>

      {suggestionsLoading && <Spinner size="small" />}
      {suggestions.length > 0 && (
        <YStack
          backgroundColor="$background"
          borderRadius="$3"
          padding="$2"
          maxHeight={200}
          borderWidth={1}
          borderColor="$gray5"
        >
          {suggestions.map((s) => (
            <Button
              key={s.place_id}
              onPress={() => handlePickSuggestion(s.place_id, s.description)}
              size="$3"
              theme="gray"
              justifyContent="flex-start"
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
        />
        <Input
          flex={1}
          placeholder="Longitude"
          value={lngInput}
          onChangeText={setLngInput}
          keyboardType="numeric"
          size="$3"
        />
        <Button size="$3" onPress={handleLatLngGo}>
          Go
        </Button>
      </XStack>

      <Button size="$3" onPress={handleUseCurrent} theme="blue">
        Use Current Location
      </Button>

      <View height={height} borderRadius="$4" overflow="hidden">
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
          showsUserLocation
          showsMyLocationButton={false}
        >
          <Marker
            coordinate={coords}
            title={label || "Selected Location"}
            description={address}
          />
        </MapView>
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
            <Text fontSize="$4" fontWeight="bold">
              Selected Location
            </Text>
            <Button
              size="$2"
              theme="gray"
              onPress={() => setIsEditingDetails(true)}
            >
              Edit ✎
            </Button>
          </XStack>

          <Text fontSize="$3" color="$gray10">
            Name:
          </Text>
          <Text fontSize="$3" fontWeight="600" color="$color">
            {label?.trim() ? label : "Unnamed location"}
          </Text>

          {address?.trim() ? (
            <>
              <Text fontSize="$3" color="$gray10" marginTop="$2">
                Address:
              </Text>
              <Text fontSize="$3" color="$color" fontWeight="600">
                {address}
              </Text>
            </>
          ) : null}

          <XStack gap="$2" flexWrap="wrap" marginTop="$2">
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
            <Text fontSize="$4" fontWeight="bold">
              Edit Location Details
            </Text>
            <Button
              size="$2"
              theme="blue"
              onPress={() => setIsEditingDetails(false)}
            >
              Done
            </Button>
          </XStack>

          <YStack gap="$1">
            <Text fontSize="$3" color="$gray10">
              Name
            </Text>
            <Input
              value={label}
              onChangeText={handleLabelChange}
              placeholder="Location name (e.g. Home, Lot 32...)"
              size="$3"
              paddingVertical={8}
            />
          </YStack>

          <YStack gap="$1">
            <Text fontSize="$3" color="$gray10">
              Address
            </Text>
            <Input
              value={address}
              onChangeText={handleAddressChange}
              placeholder="Street / nearest address"
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
    </YStack>
  );
}

const styles = StyleSheet.create({
  map: { width: "100%", height: "100%" },
});
