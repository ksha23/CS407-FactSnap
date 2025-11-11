import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchQuestionsInRadius,
  getQuestion,
} from "@/services/location-api-service";
import type {
  Question,
} from "@/models/question";
import type { Coordinates } from "@/services/location-service";

const QUESTIONS_QUERY_KEY = "questions";

/**
 * Fetch questions within a radius of a coordinate. Falls back to an empty array
 * if the center is not yet determined so downstream code can rely on array semantics.
 */
export function useQuestionsInRadius(
  center: Coordinates | null,
  radiusMiles: number,
  enabled = true,
) {
  const roundedRadius = Number.isFinite(radiusMiles)
    ? Number(radiusMiles.toFixed(2))
    : 0;

  return useQuery<Question[]>({
    queryKey: [
      QUESTIONS_QUERY_KEY,
      center?.latitude ?? null,
      center?.longitude ?? null,
      roundedRadius,
    ],
    queryFn: async () => {
      if (!center) {
        return [];
      }
      return await fetchQuestionsInRadius(center, radiusMiles);
    },
    enabled: enabled && center !== null,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}