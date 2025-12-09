import { apiClient } from "@/services/axios-client";
import { GetAuthUser, GetUserStatistics, SyncClerkUserRes, AuthUser } from "@/models/user";

export async function syncClerkUser() {
    return (await apiClient.post<SyncClerkUserRes>("/auth/sync-clerk")).data.auth_user;
}

export async function getAuthUser() {
    return (await apiClient.get<GetAuthUser>("/auth/me")).data.auth_user;
}

export async function getUserStatistics() {
    return (await apiClient.get<GetUserStatistics>("/users/stats")).data;
}

export type EditUserReq = {
    display_name: string;

};

type UpdateProfileRes = {
  user: AuthUser;
};

export async function editUser(req: EditUserReq): Promise<AuthUser> {
    const res = await apiClient.put<{ auth_user: AuthUser }>("/users/me", req);
    return res.data.auth_user;
}






