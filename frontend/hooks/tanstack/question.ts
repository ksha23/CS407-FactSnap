import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {CreatePollReq, CreateQuestionReq} from "@/models/question";
import {createPoll, createQuestion, getQuestionById} from "@/services/question-service";
import {Alert} from "react-native";
import {questionKeys} from "@/hooks/tanstack/query-keys";

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