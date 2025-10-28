import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createQuestion,
  fetchQuestionsInRadius,
  getQuestion,
} from "@/services/location-api-service";
import type {
  CreateQuestionParams,
  Question,
} from "@/models/question";
import type { Coordinates } from "@/services/location-service";

const QUESTIONS_QUERY_KEY = "questions";
const QUESTION_QUERY_KEY = "question";

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

/**
 * Fetch a single question by identifier.
 */
export function useQuestion(questionId: string | null, enabled = true) {
  return useQuery<Question | null>({
    queryKey: [QUESTION_QUERY_KEY, questionId],
    queryFn: async () => {
      if (!questionId) {
        return null;
      }
      return await getQuestion(questionId);
    },
    enabled: enabled && Boolean(questionId),
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

/**
 * Create a question and invalidate cached question lists on success.
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation<Question, Error, CreateQuestionParams>({
    mutationFn: async (variables) => {
      return await createQuestion(variables);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_QUERY_KEY] });
    },
  });
}

export const questionQueryKeys = {
  root: QUESTIONS_QUERY_KEY,
  detail: QUESTION_QUERY_KEY,
};
