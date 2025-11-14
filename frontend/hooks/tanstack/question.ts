import {
    InfiniteData,
    QueryClient,
    QueryFilters,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query";
import {
    ContentType,
    CreatePollReq,
    CreateQuestionReq,
    GetQuestionsInRadiusFeedReq,
    Poll,
    Question, UpdateQuestionReq,
    VotePollReq
} from "@/models/question";
import {
    createPoll,
    createQuestion,
    getQuestionById,
    getQuestionsInRadiusFeed, updateQuestion,
    votePoll
} from "@/services/question-service";
import {Alert} from "react-native";
import {questionKeys} from "@/hooks/tanstack/query-keys";
import {produce} from "immer";
import {Coordinates} from "@/services/location-service";
import {PAGE_SIZE, PageFilterType} from "@/services/axios-client";

export type InfiniteQuestions = {
    questionIds: string[],
    nextPageParam?: number,
}


/**
 * Helper function to reset infinite question list(s) to the first page (by setting the cache)
 * NOTE: it assumes the queries have been canceled prior
 * @param queryClient react query client
 * @param queryFilter the query filter to use for matching the lists
 */
export function resetInfiniteQuestionsList(queryClient: QueryClient, queryFilter: QueryFilters) {
    queryClient.setQueriesData<InfiniteData<InfiniteQuestions>>(
        queryFilter,
        (oldData: InfiniteData<InfiniteQuestions> | undefined) => {
            if (!oldData) return undefined;

            return produce(oldData, (draft) => {
                // Reset to the first page
                draft.pages = draft.pages?.slice(0, 1) || [];
                draft.pageParams = draft.pageParams?.slice(0, 1) || [];
            });
        },
    )
}

// QUERIES

export function useGetQuestionsFeed(
    coords: Coordinates | null,
    radiusMiles: number,
    filterType: PageFilterType | null,
    filter: string | null,
) {
    const queryClient = useQueryClient()

    const lat = coords?.latitude ?? 0
    const lon = coords?.longitude ?? 0
    const pageFilter = filterType ?? PageFilterType.NONE
    const pageFilterValue = filter ?? ""

    return useInfiniteQuery({
        enabled: coords != null,
        queryKey: questionKeys.getQuestionsFeed(lat, lon, radiusMiles, pageFilter, pageFilterValue),
        queryFn: async ({pageParam}): Promise<InfiniteQuestions> => {
            const req: GetQuestionsInRadiusFeedReq = {
                // @ts-ignore backend only needs lat and long
                location: {
                    latitude:  lat,
                    longitude: lon,
                },
                limit: PAGE_SIZE,
                offset: pageParam,
                radius_miles: radiusMiles,
                page_filter_type: pageFilter,
                page_filter_value: pageFilterValue,
            }
            console.debug("useGetQuestionsFeed: sending GetQuestionsInRadiusFeedReq request:", req)
            const questions = await getQuestionsInRadiusFeed(req)
            questions.forEach(question => {
                queryClient.setQueryData(questionKeys.getQuestionById(question.id), question)
            })
            return {
                questionIds: questions.map(question => question.id),
                nextPageParam: questions.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
            }
        },
        // staleTime: 0,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextPageParam,
        gcTime: 1000, // remove inactive feeds from the cache after 1 sec
    })
}

export function useGetQuestionById(id: string, forceFetch = false) {
    return useQuery({
        queryKey: questionKeys.getQuestionById(id),
        queryFn: () => getQuestionById(id),
        enabled: !!id,
        staleTime: forceFetch ? 0 : Infinity,
    })
}

// MUTATIONS

export function useCreateQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (req: CreateQuestionReq) => createQuestion(req),
        onError: (error) => {
            Alert.alert("Failed to create question. Please try again.", error.message)
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({queryKey: questionKeys.all})
        }
    })
}

export function useUpdateQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (req: UpdateQuestionReq) => updateQuestion(req),
        onError: (error) => {
            Alert.alert("Failed to edit question. Please try again.", error.message)
        },
        onSuccess: (data, variables, onMutateResult, context) => {
            // Cancel any outgoing refetches so that they don't overwrite our updates
            queryClient.cancelQueries({queryKey: questionKeys.getQuestionById(variables.question_id)})

            // update the question details cache
            const oldQuestion = queryClient.getQueryData(questionKeys.getQuestionById(variables.question_id)) as Question
            if (oldQuestion) {
                queryClient.setQueryData(questionKeys.getQuestionById(variables.question_id), data)
            }
        }
    })
}

export function useCreatePoll() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (req: CreatePollReq) => createPoll(req),
        onError: (error) => {
            Alert.alert("Failed to create a poll for this question. Please try again.", error.message)
        }
    })
}

export function useVotePoll() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (req: VotePollReq) => votePoll(req),
        onMutate: (req) => {
            // Cancel any outgoing refetches so that they don't overwrite our optimistic updates
            queryClient.cancelQueries({queryKey: questionKeys.getQuestionById(req.question_id)})

            // Snapshot the previous value for question details
            const previousQuestion = queryClient.getQueryData(questionKeys.getQuestionById(req.question_id)) as Question

            // Write new value and update the cache (if it exists in the cache)
            if (previousQuestion && previousQuestion.content.type == ContentType.POLL) {
                const newQuestion = produce(previousQuestion, (draft) => {
                    const poll = draft.content.data as Poll

                    // unselect previous option
                    const prevSelected = poll.options.find((o) => o.is_selected)
                    if (prevSelected) {
                        prevSelected.is_selected = false
                        prevSelected.num_votes = Math.max(prevSelected.num_votes - 1, 0)
                        poll.num_total_votes = Math.max(prevSelected.num_votes - 1, 0)
                    }

                    // select new option
                    if (req.option_id) {
                        const newSelected = poll.options.find((o) => o.id === req.option_id)
                        if (newSelected) {
                            newSelected.is_selected = true
                            newSelected.num_votes += 1
                            poll.num_total_votes += 1
                        }
                    }
                })

                queryClient.setQueryData(questionKeys.getQuestionById(req.question_id), newQuestion)
            }

            return {previousQuestion}
        },
        onError: (error, variables, context) => {
            // if mutation failed, then undo the optimistic updates
            if (context?.previousQuestion) {
                queryClient.setQueryData(questionKeys.getQuestionById(variables.question_id), context.previousQuestion)
            }

            Alert.alert("Error voting on poll. Please try again.", error.message)
        }
    })
}