import { Role } from "@/models/role";

export type User = {
    id: string;
    username: string;
    avatar_url?: string;
    about_me?: string;
    display_name?: string;
    role: Role;
    created_at: string;
    expo_push_token?: string;
    last_known_location?: {
        latitude: number;
        longitude: number;
    };
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
    expo_push_token?: string;
    last_known_location?: {
        latitude: number;
        longitude: number;
    };
};

// DTOs
export type SyncClerkUserRes = {
    auth_user: AuthUser;
};

export type GetAuthUser = {
    auth_user: AuthUser;
};

export type GetUserStatistics = {
    question_count: number;
    response_count: number;
};

// UpdateUserProfileParams is used when editing the user's profile.
type UpdateUserProfileParams struct {
    DisplayName string
}