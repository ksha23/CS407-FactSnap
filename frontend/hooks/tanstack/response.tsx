import {
    InfiniteData,
    QueryClient,
    QueryFilters,
    useInfiniteQuery, useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { produce } from "immer";
import { questionKeys, responseKeys } from "@/hooks/tanstack/query-keys";
import { createResponse, deleteResponse, getResponseById, getResponsesByQuestionId } from "@/services/response-service";
import { PAGE_SIZE } from "@/services/axios-client";
import { CreateQuestionReq, Question } from "@/models/question";
import { createQuestion } from "@/services/question-service";
import { Alert } from "react-native";
import { CreateResponseReq } from "@/models/response";

export type InfiniteResponses = {
    responseIds: string[];
    nextPageParam?: number;
}

export function resetInfiniteResponsesList(
    queryClient: QueryClient,
    queryFilter: QueryFilters,
) {
    queryClient.setQueriesData<InfiniteData<InfiniteResponses>>(
        queryFilter,
        (oldData: InfiniteData<InfiniteResponses> | undefined) => {
            if (!oldData) return undefined;

            return produce(oldData, (draft) => {
                // Reset to the first page
                draft.pages = draft.pages?.slice(0, 1) || [];
                draft.pageParams = draft.pageParams?.slice(0, 1) || [];
            });
        },
    );
}

// QUERIES

export function useGetResponsesByQuestionId(questionId: string, isEnabled: boolean = true) {
    const queryClient = useQueryClient();

    return useInfiniteQuery({
        enabled: isEnabled || !!questionId,
        queryKey: responseKeys.getResponsesByQuestionId(questionId),
        queryFn: async ({pageParam}): Promise<InfiniteResponses> => {
            const responses = await getResponsesByQuestionId(questionId, pageParam)
            responses.forEach((response) => {
                queryClient.setQueryData(responseKeys.getResponseById(response.id), response)
            })
            return {
                responseIds: responses.map((response) => response.id),
                nextPageParam: responses.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
            };
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextPageParam,
        gcTime: 1000, // remove inactive feeds from the cache after 1 sec
    })
}

export function useGetResponseById(id: string, forceFetch = false) {
    return useQuery({
        queryKey: responseKeys.getResponseById(id),
        queryFn: () => getResponseById(id),
        enabled: !!id,
        staleTime: forceFetch ? 0 : Infinity,
    })
}

// MUTATIONS

export function useCreateResponse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (req: CreateResponseReq) => createResponse(req),
        onError: (error) => {
            Alert.alert("Failed to create response. Please try again.", error.message);
        },
        onSuccess: (data, variables) => {
            // Reset responses list to first page
            // then invalidate it so that we can re-fetch to show the newly created response
            resetInfiniteResponsesList(queryClient, {queryKey: responseKeys.getResponsesByQuestionId(variables.question_id)})
            queryClient.invalidateQueries({queryKey: responseKeys.getResponsesByQuestionId(variables.question_id)})

            // Cancel any outgoing refetches so that they don't overwrite our updates
            queryClient.cancelQueries({
                queryKey: questionKeys.getQuestionById(variables.question_id),
            });

            // update the question details cache
            const prevQuestion = queryClient.getQueryData(questionKeys.getQuestionById(variables.question_id)) as Question;
            if (prevQuestion) {
                const modifiedQuestion = produce(prevQuestion, (draft: Question) => {
                    draft.responses_amount = prevQuestion.responses_amount + 1;
                })
                queryClient.setQueryData(questionKeys.getQuestionById(variables.question_id), modifiedQuestion)
            }
        },
    });
}

export function useDeleteResponse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (req: {questionId: string, responseId: string}) => deleteResponse(req.responseId),
        onError: (error) => {
            Alert.alert("Failed to delete response. Please try again.", error.message);
        },
        onSuccess: (data, variables, onMutateResult, context) => {
            // Cancel any outgoing refetches so that they don't overwrite our update
            queryClient.cancelQueries({queryKey: responseKeys.getResponseById(variables.responseId)})
            queryClient.cancelQueries({queryKey: responseKeys.getResponsesByQuestionId(variables.questionId)})
            queryClient.cancelQueries({queryKey: questionKeys.getQuestionById(variables.questionId)})

            // remove response from all response lists cache
            queryClient.setQueriesData(
                {queryKey: responseKeys.lists()},
                (oldData: InfiniteData<InfiniteResponses> | undefined) => {
                    if (!oldData) return oldData;

                    return produce(oldData, (draft) => {
                        draft.pages.forEach((page) => {
                            page.responseIds = page.responseIds.filter(responseId => responseId !== variables.responseId)
                        })
                    })
                }
            )

            // delete the cache for response details
            queryClient.setQueryData(responseKeys.getResponseById(variables.responseId), null)

            // decrement responses amount for the question detail cache
            const prevQuestion = queryClient.getQueryData(questionKeys.getQuestionById(variables.questionId)) as Question;
            if (prevQuestion) {
                const modifiedQuestion = produce(prevQuestion, (draft: Question) => {
                    draft.responses_amount = Math.max(0, prevQuestion.responses_amount - 1);
                })
                queryClient.setQueryData(questionKeys.getQuestionById(variables.questionId), modifiedQuestion)
            }
        }
    })
}