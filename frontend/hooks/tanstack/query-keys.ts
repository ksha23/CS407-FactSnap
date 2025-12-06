import { PageFilterType } from "@/services/axios-client";

export const userKeys = {
    all: ["users"] as const,

    authUser: () => [...userKeys.all, "auth"] as const,
    statistics: () => [...userKeys.all, "statistics"] as const,
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
};
