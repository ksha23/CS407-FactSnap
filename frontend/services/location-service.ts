// Provides location services: permissions, current location, geocoding, place autocomplete/details

import * as Location from "expo-location";
import { Alert, AppState } from "react-native";
import Constants from "expo-constants";

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface LocationResult {
    coordinates: Coordinates;
    address?: string;
    timestamp: number;
}

export interface PlaceDetails {
    coordinates: Coordinates;
    name?: string; // "McDonald's"
    formattedAddress?: string; // "1102 Regent St, Madison, WI 53715, USA"
}

function resolvePlacesApiKey(): string | null {
    const manifestExtra = (Constants.manifest as any)?.extra ?? {};
    const expoConfigExtra = (Constants.expoConfig as any)?.extra ?? {};

    return (
        process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ??
        manifestExtra?.["EXPO_PUBLIC_GOOGLE_PLACES_API_KEY"] ??
        expoConfigExtra?.["EXPO_PUBLIC_GOOGLE_PLACES_API_KEY"] ??
        null
    );
}

function redactKey(key: string): string {
    if (!key) return "<redacted>";
    if (key.length <= 8) {
        return `${key.slice(0, 2)}***`;
    }
    return `${key.slice(0, 4)}***${key.slice(-3)}`;
}

function redactUrl(url: string, key: string): string {
    return key ? url.replace(key, redactKey(key)) : url;
}

/**
 * Request location permissions from the user
 * @returns true if permissions granted, false otherwise
 */
export async function requestLocationPermissions(): Promise<boolean> {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
            Alert.alert(
                "Permission Required",
                "Location permission is required to use this feature. Please enable it in your device settings.",
                [{ text: "OK" }],
            );
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error requesting location permissions:", error);
        return false;
    }
}

/**
 * Request background location permissions (for notifications)
 * @returns true if permissions granted, false otherwise
 */
export async function requestBackgroundLocationPermissions(): Promise<boolean> {
    try {
        // First request foreground permissions
        const foregroundPermission = await requestLocationPermissions();
        if (!foregroundPermission) return false;

        // Then request background permissions
        const { status } = await Location.requestBackgroundPermissionsAsync();

        if (status !== "granted") {
            Alert.alert(
                "Background Permission Required",
                "Background location permission is required to receive location-based notifications.",
                [{ text: "OK" }],
            );
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error requesting background location permissions:", error);
        return false;
    }
}

/**
 * Get the current device location
 * @returns LocationResult with coordinates and timestamp
 */
export async function getCurrentLocation(): Promise<LocationResult | null> {
    try {
        const hasPermission = await requestLocationPermissions();
        if (!hasPermission) return null;

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        return {
            coordinates: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            },
            timestamp: location.timestamp,
        };
    } catch (error) {
        if (AppState.currentState === 'active') {
            console.error("Error getting current location:", error);
            Alert.alert("Error", "Unable to get current location. Please try again.");
        }
        return null;
    }
}

export async function getLastKnownLocation() {
    try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return null;

        // This is much faster than getCurrentPositionAsync
        // It returns the last cached location from the OS
        const location = await Location.getLastKnownPositionAsync({});
        
        if (!location) return null;

        return {
            coordinates: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            }
        };
    } catch (error) {
        console.warn("Error getting last known location:", error);
        return null;
    }
}

/**
 * Reverse geocode coordinates to get address
 * @param coordinates - Latitude and longitude
 * @returns Formatted address string
 */
export async function reverseGeocode(coordinates: Coordinates): Promise<string | null> {
    try {
        const [result] = await Location.reverseGeocodeAsync({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
        });

        if (result) {
            const parts = [
                result.name,
                result.street,
                result.city,
                result.region,
                result.postalCode,
                result.country,
            ].filter(Boolean);

            return parts.join(", ");
        }

        return null;
    } catch (error) {
        console.error("Error reverse geocoding:", error);
        return null;
    }
}

/**
 * Forward geocode address to get coordinates
 * @param address - Address string to search
 * @returns Coordinates if found
 */
export async function forwardGeocode(address: string): Promise<Coordinates | null> {
    try {
        const results = await Location.geocodeAsync(address);

        if (results && results.length > 0) {
            return {
                latitude: results[0].latitude,
                longitude: results[0].longitude,
            };
        }

        return null;
    } catch (error) {
        console.error("Error forward geocoding:", error);
        return null;
    }
}

/**
 * Fetch place autocomplete suggestions using Google Places API.
 * Requires EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to be set in environment.
 */
export async function fetchPlaceAutocomplete(
    input: string,
): Promise<Array<{ place_id: string; description: string }>> {
    try {
        const apiKey = resolvePlacesApiKey();

        if (!apiKey) {
            console.warn(
                "Google Places API key not found. Set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in env or expo.extra in app.json to enable autocomplete.",
            );
            return [];
        }

        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            input,
        )}&key=${apiKey}`;
        console.debug("[Places] Autocomplete request URL:", redactUrl(url, apiKey));
        const res = await fetch(url);
        if (!res.ok) {
            console.warn("[Places] Autocomplete HTTP error:", res.status, res.statusText);
            return [];
        }
        const json = await res.json();
        console.debug(
            "[Places] Autocomplete response status:",
            json.status,
            "error_message:",
            json.error_message,
        );
        if (json.status !== "OK") {
            // If zero results, return empty list; otherwise log for debugging
            if (json.status !== "ZERO_RESULTS") {
                console.warn(
                    "[Places] Autocomplete returned non-OK status",
                    json.status,
                    json.error_message || "",
                );
            }
            return [];
        }
        const preds = (json.predictions || []).map((p: any) => ({
            place_id: p.place_id,
            description: p.description,
        }));
        for (const p of preds) {
            console.debug("[Places] Autocomplete prediction:", p.description);
        }
        return preds;
    } catch (error) {
        console.error("Error fetching place autocomplete:", error);
        return [];
    }
}

/**
 * Get place details (coordinates + address) from a Google Place ID.
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
        const apiKey = resolvePlacesApiKey();

        if (!apiKey) {
            console.warn(
                "Google Places API key not found. Set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in env or expo.extra in app.json to enable place details.",
            );
            return null;
        }

        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
            placeId,
        )}&key=${apiKey}`;

        console.debug("[Places] Details request URL:", redactUrl(url, apiKey));

        const res = await fetch(url);
        if (!res.ok) {
            console.warn("[Places] Details HTTP error:", res.status, res.statusText);
            return null;
        }
        const json = await res.json();

        console.debug(
            "[Places] Details response status:",
            json.status,
            "error_message:",
            json.error_message,
        );

        if (json.status !== "OK" || !json.result) {
            return null;
        }

        const result = json.result;

        const lat = result.geometry?.location?.lat;
        const lng = result.geometry?.location?.lng;

        if (typeof lat !== "number" || typeof lng !== "number") {
            return null;
        }

        return {
            coordinates: {
                latitude: lat,
                longitude: lng,
            },
            name: result.name, // "McDonald's"
            formattedAddress: result.formatted_address, // "1102 Regent St..."
        };
    } catch (error) {
        console.error("Error fetching place details:", error);
        return null;
    }
}

/**
 * Calculate distance between two coordinates in miles
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in miles
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coord1.latitude)) *
            Math.cos(toRad(coord2.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Check if coordinates are within a radius of a center point
 * @param center - Center coordinates
 * @param point - Point to check
 * @param radiusMiles - Radius in miles
 * @returns true if point is within radius
 */
export function isWithinRadius(
    center: Coordinates,
    point: Coordinates,
    radiusMiles: number,
): boolean {
    const distance = calculateDistance(center, point);
    return distance <= radiusMiles;
}
