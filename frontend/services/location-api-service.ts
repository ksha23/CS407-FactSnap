// Provides API service for location-based question endpoints

import { apiClient } from './axios-client';
import { Coordinates } from './location-service';
import { NearbyLocation } from './notification-service';
import type { Question } from '@/models/question';

/**
 * Fetch questions/locations within a radius of a center point
 * This should be connected to your backend API
 * 
 * @param center - Center coordinates
 * @param radiusMiles - Radius in miles
 * @returns Array of questions with locations
 */
export async function fetchQuestionsInRadius(
  center: Coordinates,
  radiusMiles: number
): Promise<Question[]> {
  try {
    // TODO: Replace with your actual API endpoint when backend is running
    // Example: GET /api/questions?lat={center.latitude}&lng={center.longitude}&radius={radiusMiles}
    console.log('Fetching questions in region from API:', center, radiusMiles);

    // const params: GetQuestionsParams = {
    //   latitude: String(center.latitude),
    //   longitude: String(center.longitude),
    //   radius: Math.max(0, Math.round(radiusMiles)),
    // }

    const response = await apiClient.get('/questions', {
      timeout: 5000, // Shorter timeout for location queries (5 seconds)
    });

    return response.data;
  } catch (error: any) {
    // Silently fail when backend is not available
    // This prevents console spam during development
    if (error?.code !== 'ECONNABORTED' && error?.response?.status !== 404) {
      console.log('Backend not available - questions endpoint not implemented yet');
    }
    // Return empty array as fallback
    return [];
  }
}

/**
 * Fetch nearby locations for notifications
 * Converts Question data to NearbyLocation format
 * 
 * @param currentLocation - Current user location
 * @param radiusMiles - Radius in miles
 * @returns Array of nearby locations
 */
export async function fetchNearbyLocationsForNotifications(
  currentLocation: Coordinates,
  radiusMiles: number
): Promise<NearbyLocation[]> {
  try {
    const questions = await fetchQuestionsInRadius(currentLocation, radiusMiles);
    
    // Convert to NearbyLocation format
    return questions.map((question) => ({
      id: question.id,
      coordinates: question.location,
      title: question.title,
      description: question.body ?? undefined,
      radiusMiles: 10, // You can customize this per question
    }));
  } catch (error) {
    console.error('Error fetching nearby locations for notifications:', error);
    return [];
  }
}

/**
 * Get question details by ID
 * 
 * @param questionId - Question ID
 * @returns Question details
 */
export async function getQuestion(questionId: string): Promise<Question> {
  try {
    // TODO: Replace with your actual API endpoint
    // Example: GET /api/questions/{questionId}
    
    const response = await apiClient.get(`/questions/${questionId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting question:', error);
    throw error;
  }
}
