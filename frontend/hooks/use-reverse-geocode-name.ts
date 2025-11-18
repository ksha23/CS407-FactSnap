// hooks/useReverseGeocodeName.ts
import { useRef, useCallback } from "react";
import { reverseGeocode } from "@/services/location-service";

export interface Coords {
    latitude: number;
    longitude: number;
}

/**
 * Returns a stable async function you can call whenever coords change.
 * It will:
 *  - reverse geocode
 *  - only apply result if it's still the latest coords we asked about
 */
export function useReverseGeocodeName() {
    const lastCoordsKeyRef = useRef<string>("");

    const getBestAddressFor = useCallback(
        async (coords: Coords): Promise<string | null> => {
            const key = `${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`;
            lastCoordsKeyRef.current = key;

            try {
                const addr = await reverseGeocode(coords);
                // stale? discard
                if (lastCoordsKeyRef.current !== key) return null;
                if (!addr || addr.trim() === "") return null;
                return addr;
            } catch (err) {
                console.warn("[useReverseGeocodeName] reverseGeocode failed:", err);
                return null;
            }
        },
        [],
    );

    return { getBestAddressFor };
}
