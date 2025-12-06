// app/_layout.tsx
import "../tamagui-web.css";

import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { SplashScreen, Stack } from "expo-router";
import { PortalProvider, TamaguiProvider } from "tamagui";
import { useColorScheme } from "react-native";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { tamaguiConfig } from "@/tamagui.config";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { setBackgroundColorAsync } from "expo-system-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const insets = useSafeAreaInsets();

    setBackgroundColorAsync(
        colorScheme === "dark"
            ? tamaguiConfig.themes.dark_gray_surface1.background.val
            : tamaguiConfig.themes.light_gray.background.val,
    );

    function getTheme() {
        const base = colorScheme === "dark" ? DarkTheme : DefaultTheme;
        return {
            ...base,
            colors: {
                ...base.colors,
                background:
                    colorScheme === "dark"
                        ? tamaguiConfig.themes.dark_gray_surface1.background.val
                        : tamaguiConfig.themes.light_gray.background.val,
            },
        };
    }

    const [isFontsLoaded] = useFonts({
        Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
        InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
    });

    useEffect(() => {
        if (isFontsLoaded) {
            setTimeout(() => {
                SplashScreen.hideAsync();
            });
        }
    }, [isFontsLoaded]);

    return (
        <TamaguiProvider
            config={tamaguiConfig}
            defaultTheme={colorScheme === "dark" ? "dark_blue" : "light_blue"}
        >
            <PortalProvider shouldAddRootHost>
                <ThemeProvider value={getTheme()}>
                    <ClerkProvider tokenCache={tokenCache}>
                        <QueryClientProvider client={queryClient}>
                            {isFontsLoaded ? (
                                <Stack
                                    screenOptions={{
                                        headerBackButtonDisplayMode: "minimal", // only back arrow, no text
                                    }}
                                >
                                    {/* Auth flow – no header */}
                                    <Stack.Screen
                                        name="(auth)"
                                        options={{ headerShown: false }}
                                    />

                                    {/* Tabs – they have their own AppHeader in (tabs)/_layout */}
                                    <Stack.Screen
                                        name="(tabs)"
                                        options={{ headerShown: false }}
                                    />

                                    {/* Question detail – native header + default back button */}
                                    <Stack.Screen
                                        name="question/[id]"
                                        options={{
                                            title: "Question Details",
                                        }}
                                    />

                                    {/* Edit question – same */}
                                    <Stack.Screen
                                        name="question/[id]/edit"
                                        options={{
                                            title: "Edit Question",
                                        }}
                                    />

                                    {/* Statistics stack (contains /statistics/my-questions and /statistics/my-responses) */}
                                    <Stack.Screen
                                      name="statistics"
                                      options={{ headerShown: false }}
                                    />
                                </Stack>
                            ) : null}
                        </QueryClientProvider>
                    </ClerkProvider>
                </ThemeProvider>
            </PortalProvider>
        </TamaguiProvider>
    );
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                if (
                    isAxiosError(error) &&
                    (error.response?.status === 401 || error.response?.status === 404)
                ) {
                    return false;
                }
                return failureCount < 2;
            },
        },
    },
});
