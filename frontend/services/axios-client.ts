import {getClerkInstance} from "@clerk/clerk-expo";
import axios from "axios";
import {Alert} from "react-native";

export const PAGE_SIZE = 10;

export enum PageFilterType {
    NONE = "none",
    QUESTION_CATEGORY = "question_category"
}

export const apiClient = axios.create({
    baseURL: process.env.EXPO_PUBLIC_BACKEND_API_URL,
    timeout: 15_000, // 15 seconds
    timeoutErrorMessage: "Request timed out"
})

// Attach Clerk token to Auth header on every request
apiClient.interceptors.request.use(async (config) => {
    const token = await getClerkInstance().session?.getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    response => response,
    async (error) => {
        // sign out whenever we get 401 (unauthenticated) status code.
        // usually this means session token is no longer valid.
        if (error.response?.status === 401) {
            Alert.alert("Your session is no longer valid", "Please sign in again")
            await getClerkInstance().signOut()
        }
        return Promise.reject(error);
    }
)

