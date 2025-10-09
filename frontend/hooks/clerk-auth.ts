import {useEffect, useState} from "react";
import {getClerkInstance, isClerkAPIResponseError, useAuth, useSSO} from "@clerk/clerk-expo";
import {Provider} from "@/models/provider";
import {OAuthStrategy} from "@clerk/types";
import {Alert, Platform} from "react-native";
import {coolDownAsync, warmUpAsync} from "expo-web-browser";
import {makeRedirectUri} from "expo-auth-session";
import {useRouter} from "expo-router";
import {useSyncAuthUser} from "@/hooks/tanstack/user";


export function useClerkOAuth() {
    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    useEffect(() => {
        if (Platform.OS !== 'android') return
        void warmUpAsync()
        return () => {
            // Cleanup: closes browser when component unmounts
            void coolDownAsync()
        }
    }, [])

    const [isLoading, setIsLoading] = useState(false);
    const {startSSOFlow} = useSSO()
    const router = useRouter()

    async function handleOAuth(provider: Provider, clerkStrategy: OAuthStrategy) {
        setIsLoading(true)
        try {
            const { createdSessionId, setActive} = await startSSOFlow({
                strategy: clerkStrategy,
                // For web, defaults to current path
                // For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
                // For more info, see https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
                redirectUrl: makeRedirectUri(),
            })

            // if sign in was successful, set the active session
            if (createdSessionId && setActive) {
                await setActive({
                    session: createdSessionId,
                })
            }
        } catch (err) {
            if (isClerkAPIResponseError(err)) {
                Alert.alert("Error", err.message)
            } else {
                Alert.alert("Error", JSON.stringify(err, null, 2))
            }
        } finally {
            setIsLoading(false)
        }
    }

    return {isLoading, handleOAuth}
}

export function useClerkSyncUser() {
    const { isSignedIn } = useAuth();
    const mutation = useSyncAuthUser()

    useEffect(() => {
        // if the user is signed in, and hasn't synced yet, then sync the user
        if (isSignedIn && !mutation.data) {
            mutation.mutate()
        }
    }, [isSignedIn]);
}