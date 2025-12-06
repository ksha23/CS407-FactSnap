import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/hooks/tanstack/query-keys";
import { getAuthUser, getUserStatistics, syncClerkUser } from "@/services/auth-service";
import { Alert } from "react-native";

// QUERIES
export function useGetAuthUser() {
    return useQuery({
        queryKey: userKeys.authUser(),
        queryFn: () => getAuthUser(),
    });
}

export function useGetUserStatistics() {
    return useQuery({
        queryKey: userKeys.statistics(),
        queryFn: () => getUserStatistics(),
    });
}

// MUTATIONS
export function useSyncAuthUser() {
    return useMutation({
        mutationFn: () => syncClerkUser(),
        onError: (error) => {
            Alert.alert("Error syncing Clerk user", error.message);
        },
    });
}
