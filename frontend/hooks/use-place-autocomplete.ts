// hooks/usePlaceAutocomplete.ts
import { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchPlaceAutocomplete,
  getPlaceDetails,
  forwardGeocode,
} from "@/services/location-service";

export interface AutocompleteSuggestion {
  place_id: string; // Google Place ID
  description: string; // "McDonald's, Regent Street, Madison, WI, USA"
}

export interface PlaceDetailsResult {
  coordinates: { latitude: number; longitude: number };
  label: string;   // human-friendly POI name ("McDonald's")
  address: string; // postal-ish address ("1102 Regent St, Madison, WI 53715, USA")
}

export function usePlaceAutocomplete() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // debounce autocomplete
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        console.debug(
          "[Places] Autocomplete request URL:",
          // (you can log the actual URL inside fetchPlaceAutocomplete instead)
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            query
          )}&key=...`
        );

        const results = await fetchPlaceAutocomplete(query.trim());
        const normalized = Array.isArray(results) ? results : [];

        // results should be like:
        // [{ place_id, description }, ...]
        normalized.forEach((r: any) => {
          console.debug("[Places] Autocomplete prediction:", r.description);
        });

        setSuggestions(normalized.slice(0, 6));
      } catch (e) {
        console.error("[usePlaceAutocomplete] autocomplete error:", e);
        setSuggestions([]);
      } finally {
        setLoading(false);
        timerRef.current = null;
      }
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [query]);

  // User taps a dropdown suggestion (has place_id)
  const resolveSuggestion = useCallback(
    async (
      place_id: string,
      description: string
    ): Promise<PlaceDetailsResult | null> => {
      const details = await getPlaceDetails(place_id);
      if (!details) return null;

      // Prefer real business name for label.
      // Fall back to description.
      const label =
        (details.name && details.name.trim().length > 0
          ? details.name
          : description) || description;

      // Prefer formatted_address for address.
      // Fall back to description.
      const address =
        (details.formattedAddress &&
          details.formattedAddress.trim().length > 0
          ? details.formattedAddress
          : description) || description;

      return {
        coordinates: details.coordinates,
        label,   // "McDonald's"
        address, // "1102 Regent St, Madison, WI 53715, USA"
      };
    },
    []
  );

  // User hits Enter / taps Search without picking a suggestion
  // (forwardGeocode just turns free text into coords + maybe an address string)
  const resolveFreeText = useCallback(
    async (text: string): Promise<PlaceDetailsResult | null> => {
      if (!text.trim()) return null;
      const coords = await forwardGeocode(text.trim());
      if (!coords) return null;

      // Here we DON'T have a "business name", so we treat
      // their text as both label and address seed.
      return {
        coordinates: coords,
        label: text.trim(),
        address: text.trim(),
      };
    },
    []
  );

  const clearSuggestions = () => setSuggestions([]);

  return {
    query,
    setQuery,
    suggestions,
    loading,
    resolveSuggestion,
    resolveFreeText,
    clearSuggestions,
  };
}
