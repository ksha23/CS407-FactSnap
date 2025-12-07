import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/hooks/tanstack/query-keys";
import { getAuthUser, getUserStatistics, syncClerkUser } from "@/services/auth-service";
import { Alert } from "react-native";
import { editUser, EditUserReq } from "@/services/auth-service";
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


export function useEditAuthUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (req: EditUserReq) => editUser(req),
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(userKeys.authUser(), updatedUser);
        },
        onError: (err) => {
            Alert.alert("Failed to update user", err?.message ?? "Unknown error");
        },
    });
}