import { apiClient, PAGE_SIZE } from "@/services/axios-client";
import {
    CreateResponseReq,
    CreateResponseRes,
    EditResponseReq,
    EditResponseRes, GetQuestionSummaryRes, GetResponseByIdRes,
    GetResponsesByQuestionIdRes,
} from "@/models/response";

// QUERIES

export async function getResponsesByQuestionId(questionId: string, pageParam: number) {
    return (await apiClient.get<GetResponsesByQuestionIdRes>(`/responses/questions/${questionId}?limit=${PAGE_SIZE}&offset=${pageParam}`)).data.responses
}

export async function getResponseById(responseId: string) {
    return (await apiClient.get<GetResponseByIdRes>(`/responses/${responseId}`)).data.response
}

export async function getQuestionSummary(questionId: string) {
    return (await apiClient.get<GetQuestionSummaryRes>(`/responses/questions/${questionId}/summary`)).data.summary
}

// MUTATIONS

export async function createResponse(req: CreateResponseReq) {
    return (await apiClient.post<CreateResponseRes>("/responses", req)).data.response
}

export async function updateResponse(req: EditResponseReq) {
    return (await apiClient.put<EditResponseRes>("/responses", req)).data.response
}

export async function deleteResponse(responseId: string) {
    return await apiClient.delete(`/responses/${responseId}`)
}