import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    ContentType,
    CreatePollReq,
    CreateQuestionReq,
    Poll,
    PollOption,
    Question,
    VotePollReq
} from "@/models/question";
import {createPoll, createQuestion, getQuestionById, votePoll} from "@/services/question-service";
import {Alert} from "react-native";
import {questionKeys} from "@/hooks/tanstack/query-keys";
import {produce} from "immer";

// QUERIES

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
                    }

                    // select new option
                    const newSelected = poll.options.find((o) => o.id === req.option_id)
                    if (newSelected) {
                        newSelected.is_selected = true
                        newSelected.num_votes += 1
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