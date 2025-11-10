import {
    CreatePollReq,
    CreatePollRes,
    CreateQuestionReq,
    CreateQuestionRes,
    GetQuestionByIdRes
} from "@/models/question";
import {apiClient} from "@/services/axios-client";


// QUERIES
export async function getQuestionById(questionId: string) {
    return (await apiClient.get<GetQuestionByIdRes>(`/questions/${questionId}`)).data.question
}

// MUTATIONS

export async function createQuestion(req: CreateQuestionReq) {
    return (await apiClient.post<CreateQuestionRes>(`/questions`, req)).data.question_id
}

export async function createPoll(req: CreatePollReq) {
    return (await apiClient.post<CreatePollRes>(`/questions/poll`, req)).data.poll_id
}