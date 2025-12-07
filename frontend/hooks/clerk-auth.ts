import { useEffect, useState } from "react";
import {
    getClerkInstance,
    isClerkAPIResponseError,
    useAuth,
    useSignIn,
    useSSO,
} from "@clerk/clerk-expo";
import { Provider } from "@/models/provider";
import { OAuthStrategy } from "@clerk/types";
import { Alert, Platform } from "react-native";
import { coolDownAsync, warmUpAsync } from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { useRouter } from "expo-router";
import { useSyncAuthUser } from "@/hooks/tanstack/user";

export function useClerkAuth() {
    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    useEffect(() => {
        if (Platform.OS !== "android") return;
        void warmUpAsync();
        return () => {
            // Cleanup: closes browser when component unmounts
            void coolDownAsync();
        };
    }, []);

    const [isLoading, setIsLoading] = useState(false);
    const { signIn, setActive, isLoaded } = useSignIn();
    const { startSSOFlow } = useSSO();

    async function handleOAuth(provider: Provider, clerkStrategy: OAuthStrategy) {
        setIsLoading(true);

        try {
            const { createdSessionId, setActive } = await startSSOFlow({
                strategy: clerkStrategy,
                // For web, defaults to current path
                // For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
                // For more info, see https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
                redirectUrl: makeRedirectUri({
                    scheme: "factsnap",
                    path: "(auth)"
                }),
            });

            // if sign in was successful, set the active session
            if (createdSessionId && setActive) {
                await setActive({
                    session: createdSessionId,
                });
            }
        } catch (err) {
            if (isClerkAPIResponseError(err)) {
                Alert.alert("Error", err.message);
            } else {
                Alert.alert("Error", JSON.stringify(err, null, 2));
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCredentials(email: string, password: string) {
        if (!isLoaded) {
            Alert.alert("Error", "Something went wrong. Please try again.");
            return;
        }
        setIsLoading(true);

        // Start the sign-in process using the email and password provided
        try {
            const signInAttempt = await signIn.create({
                identifier: email,
                password: password,
            });

            // If sign-in process is complete, set the created session as active
            // and redirect the user
            if (signInAttempt.status === "complete") {
                await setActive({
                    session: signInAttempt.createdSessionId,
                });
            } else {
                // If the status is not complete, check why. User may need to
                // complete further steps.
                Alert.alert("Error", JSON.stringify(signInAttempt, null, 2));
            }
        } catch (err) {
            // See https://clerk.com/docs/guides/development/custom-flows/error-handling
            // for more info on error handling
            if (isClerkAPIResponseError(err)) {
                Alert.alert("Error", err.message);
            } else {
                Alert.alert("Error", JSON.stringify(err, null, 2));
            }
        } finally {
            setIsLoading(false);
        }
    }

    return { isLoading, handleOAuth, handleCredentials };
}

export function useClerkSyncUser() {
    const { isSignedIn } = useAuth();
    const mutation = useSyncAuthUser();

    useEffect(() => {
        // if the user is signed in, and hasn't synced yet, then sync the user
        if (isSignedIn && !mutation.data) {
            mutation.mutate();
        }
    }, [isSignedIn]);
}
