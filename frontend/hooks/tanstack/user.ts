import {useMutation, useQuery} from "@tanstack/react-query";
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
            Alert.alert("Error syncing Clerk user", error.message)
        }
    })
}