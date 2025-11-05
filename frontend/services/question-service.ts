import {CreateQuestionReq, CreateQuestionRes, GetQuestionByIdRes} from "@/models/question";
import {apiClient} from "@/services/axios-client";


// QUERIES
export async function getQuestionById(questionId: string) {
    (await apiClient.get<GetQuestionByIdRes>(`/questions/${questionId}`)).data.question
}

// MUTATIONS
export async function createQuestion(req: CreateQuestionReq) {
    return (await apiClient.post<CreateQuestionRes>(`/questions`, req)).data.question
}