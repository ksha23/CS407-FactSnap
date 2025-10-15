import {apiClient} from "@/services/axios-client";
import {GetAuthUser, SyncClerkUserRes} from "@/models/user";

export async function syncClerkUser() {
    return (await apiClient.post<SyncClerkUserRes>("/auth/sync-clerk")).data.auth_user
}

export async function getAuthUser() {
    return (await apiClient.get<GetAuthUser>("/auth/me")).data.auth_user
}