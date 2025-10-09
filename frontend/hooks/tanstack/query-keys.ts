export const userKeys = {
    all: ["users"] as const,

    authUser: () => [...userKeys.all, "auth"] as const,
}