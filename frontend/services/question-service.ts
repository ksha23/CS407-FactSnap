import {
    CreatePollReq,
    CreatePollRes,
    CreateQuestionReq,
    CreateQuestionRes,
    GetQuestionByIdRes,
    GetQuestionsInRadiusFeedReq,
    GetQuestionsInRadiusFeedRes,
    UpdateQuestionReq,
    UpdateQuestionRes,
    VotePollReq
} from "@/models/question";
import {apiClient} from "@/services/axios-client";
import {Coordinates} from "@/services/location-service";


// QUERIES

export async function getQuestionById(questionId: string) {
    return (await apiClient.get<GetQuestionByIdRes>(`/questions/${questionId}`)).data.question
}

export async function getQuestionsInRadiusFeed(req: GetQuestionsInRadiusFeedReq) {
    return (await apiClient.post<GetQuestionsInRadiusFeedRes>(`/questions/feed`, req)).data.questions
}

// MUTATIONS

export async function createQuestion(req: CreateQuestionReq) {
    return (await apiClient.post<CreateQuestionRes>(`/questions`, req)).data.question_id
}

export async function updateQuestion(req: UpdateQuestionReq) {
    return (await apiClient.put<UpdateQuestionRes>('/questions', req)).data.question
}

export async function createPoll(req: CreatePollReq) {
    return (await apiClient.post<CreatePollRes>(`/questions/poll`, req)).data.poll_id
}

export async function votePoll(req: VotePollReq) {
    return await apiClient.post(`/questions/poll/vote`, req)
}