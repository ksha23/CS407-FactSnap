import { PageFilterType } from "@/services/axios-client";

export const userKeys = {
    all: ["users"] as const,

    authUser: () => [...userKeys.all, "auth"] as const,
};

export const questionKeys = {
    all: ["questions"] as const,

    // list
    lists: () => [...questionKeys.all, "list"] as const,
    getQuestionsFeed: (
        lat: number,
        lon: number,
        radiusMiles: number,
        pageFilter: PageFilterType,
        pageFilterValue: string,
    ) =>
        [
            ...questionKeys.lists(),
            { lat, lon, radiusMiles, pageFilter, pageFilterValue },
        ] as const,

    // detail
    details: () => [...questionKeys.all, "detail"] as const,
    getQuestionById: (id: string) => [...questionKeys.details(), id] as const,

    // summary
    summaryByQuestionId: (id: string) => [...questionKeys.getQuestionById(id), "summary"]
};

export const responseKeys = {
    all: ["responses"] as const,

    // list
    lists: () => [...responseKeys.all, "list"] as const,
    getResponsesByQuestionId: (questionId: string) => [...responseKeys.lists(), 'question', { questionId }] as const,

    // detail
    details: () => [...responseKeys.all, "detail"] as const,
    responseByQuestionId: (questionId: string) => [...responseKeys.details(), questionId] as const,
    getResponseById: (responseId: string, questionId: string) => [...responseKeys.responseByQuestionId(questionId), responseId] as const,
}