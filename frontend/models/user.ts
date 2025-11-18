import { Role } from "@/models/role";

export type User = {
    id: string;
    username: string;
    avatar_url?: string;
    about_me?: string;
    display_name?: string;
    role: Role;
    created_at: string;
};

export type AuthUser = {
    id: string;
    email: string;
    username: string;
    avatar_url?: string;
    about_me?: string;
    display_name?: string;
    role: Role;
    created_at: string;
};

// DTOs
export type SyncClerkUserRes = {
    auth_user: AuthUser;
};

export type GetAuthUser = {
    auth_user: AuthUser;
};
