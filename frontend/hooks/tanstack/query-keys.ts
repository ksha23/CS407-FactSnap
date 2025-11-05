export const userKeys = {
    all: ["users"] as const,

    authUser: () => [...userKeys.all, "auth"] as const,
}

export const questionKeys = {
    all: ["questions"] as const,

    // detail
    details: () => [...questionKeys.all, "detail"] as const,
    getQuestionById: (id: string) => [...questionKeys.details(), id] as const,
}