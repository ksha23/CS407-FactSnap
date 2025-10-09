import {getClerkInstance} from "@clerk/clerk-expo";
import axios, {AxiosInstance} from "axios";

export const PAGE_SIZE = 10;


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


