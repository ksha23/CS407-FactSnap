// Hook to manage background location notifications

import { useState, useEffect, useCallback } from 'react';
import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  isBackgroundLocationTrackingActive,
  requestNotificationPermissions,
} from '@/services/notification-service';

/**
 * Hook to manage background location notifications
 */
export function useBackgroundLocationNotifications() {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Function to check current status of background location tracking
  const checkStatus = useCallback(async () => {
    try {
      const active = await isBackgroundLocationTrackingActive();
      setIsActive(active);
      return active;
    } catch (error) {
      console.error('Error checking background tracking status:', error);
      setIsActive(false);
      return false;
    }
  }, []);

  // Check if background tracking is active on mount
  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  // Function to start background location tracking
  const startTracking = async () => {
    try {
      setLoading(true);
      
      // Request notification permissions first
      const hasNotificationPermission = await requestNotificationPermissions();
      if (!hasNotificationPermission) {
        console.log('Notification permissions required');
        return false;
      }

      // Start background location tracking. We don't pass an explicit callback
      // so the background service will use the app's QueryClient and the
      // `fetchNearbyLocationsForNotifications` service via the queryClient
      // fallback, ensuring background fetches go through TanStack Query.
      const success = await startBackgroundLocationTracking();
      await checkStatus();
      return success;
    } catch (error) {
      console.error('Error starting background tracking:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const stopTracking = async () => {
    try {
      setLoading(true);
      await stopBackgroundLocationTracking();
      await checkStatus();
    } catch (error) {
      console.error('Error stopping background tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isActive,
    loading,
    startTracking,
    stopTracking,
    checkStatus,
  };
}
