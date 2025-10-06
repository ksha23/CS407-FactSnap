import {useEffect, useState} from "react";
import {useSSO} from "@clerk/clerk-expo";
import {Provider} from "@/models/provider";
import {OAuthStrategy} from "@clerk/types";
import {Alert, Platform} from "react-native";
import {coolDownAsync, warmUpAsync} from "expo-web-browser";
import {makeRedirectUri} from "expo-auth-session";
import {useRouter} from "expo-router";


export default function useClerkOAuth() {
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
                    navigate: async ({session}) => {
                        router.push("/")
                    }
                })
            }
        } catch (err) {
            Alert.alert("Error", `Failed to sign in with ${provider}. Please try again.`)
        } finally {
            setIsLoading(false)
        }
    }

    return {isLoading, handleOAuth}
}