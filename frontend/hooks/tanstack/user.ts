import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {userKeys} from "@/hooks/tanstack/query-keys";
import {getAuthUser, syncClerkUser} from "@/services/auth-service";
import {Alert} from "react-native";

// QUERIES
export function useGetAuthUser() {
    return useQuery({
        queryKey: userKeys.authUser(),
        queryFn: () => getAuthUser(),
    })
}

// MUTATIONS
export function useSyncAuthUser() {
    return useMutation({
        mutationFn: () => syncClerkUser(),
        onError: (error) => {
            console.warn("Error syncing Clerk user (can usually ignore this)", error.message)
        }
    })
}