import {useMutation, useQueryClient} from "@tanstack/react-query";
import {CreateQuestionReq} from "@/models/question";
import {createQuestion} from "@/services/question-service";
import {Alert} from "react-native";
import {questionKeys} from "@/hooks/tanstack/query-keys";

export function useCreateQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (req: CreateQuestionReq) => createQuestion(req),
        onError: (error) => {
            Alert.alert("Failed to create post. Please try again.", error.message)
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({queryKey: questionKeys.all})
        }
    })
}