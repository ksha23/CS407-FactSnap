// Hook to get and manage user location by using location-service.ts

import { useCallback, useEffect, useRef, useState } from 'react';
import * as ExpoLocation from 'expo-location';
import {
  Coordinates,
  getCurrentLocation,
  requestLocationPermissions,
  requestBackgroundLocationPermissions,
} from '@/services/location-service';

/**
 * Hook to get and track current location
 */
export function useCurrentLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getCurrentLocation();
      if (!isMountedRef.current) {
        return null;
      }

      if (result) {
        setLocation(result.coordinates);
      } else {
        setError('Unable to get location');
      }

      return result?.coordinates ?? null;
    } catch (err) {
      console.error('Error fetching location:', err);
      if (isMountedRef.current) {
        setError('Error fetching location');
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchCurrentLocation();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchCurrentLocation]); // run once on mount

  return {
    location,
    loading,
    error,
    refetch: fetchCurrentLocation,
  };
}

/**
 * Hook to manage location permissions
 */
export function useLocationPermissions() {
  const [hasPermission, setHasPermission] = useState(false);
  const [hasBackgroundPermission, setHasBackgroundPermission] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPermissionStatus = async () => {
      try {
        const foreground = await ExpoLocation.getForegroundPermissionsAsync();
        if (!cancelled) {
          setHasPermission(foreground.status === ExpoLocation.PermissionStatus.GRANTED);
        }
        const background = await ExpoLocation.getBackgroundPermissionsAsync();
        if (!cancelled) {
          setHasBackgroundPermission(
            background.status === ExpoLocation.PermissionStatus.GRANTED
          );
        }
      } catch (error) {
        console.error('Error reading location permission status:', error);
      }
    };

    void loadPermissionStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const granted = await requestLocationPermissions();
      setHasPermission(granted);
      if (!granted) {
        setHasBackgroundPermission(false);
      }
      return granted;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      setHasPermission(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestBackgroundPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const granted = await requestBackgroundLocationPermissions();
      setHasBackgroundPermission(granted);
      if (granted) {
        setHasPermission(true);
      }
      return granted;
    } catch (error) {
      console.error('Error requesting background location permissions:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    hasPermission,
    hasBackgroundPermission,
    loading,
    requestPermissions,
    requestBackgroundPermissions,
  };
}
