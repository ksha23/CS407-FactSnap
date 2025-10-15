import '../tamagui-web.css'

import { DarkTheme, DefaultTheme, ThemeProvider, useIsFocused } from '@react-navigation/native'
import { SplashScreen, Stack } from 'expo-router'
import {PortalProvider, TamaguiProvider} from 'tamagui'
import { useColorScheme } from 'react-native'
import {ClerkProvider} from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { tamaguiConfig } from '@/tamagui.config'
import {useEffect} from "react";
import {useFonts} from "expo-font";
import {setBackgroundColorAsync} from "expo-system-ui";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {isAxiosError} from "axios";


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme()
    const insets = useSafeAreaInsets()

    // set background color of root layout to prevent screen flashes
    setBackgroundColorAsync(colorScheme === "dark" ?
        tamaguiConfig.themes.dark_gray_surface1.background.val
        : tamaguiConfig.themes.light_gray.background.val);

    function getTheme() {
        const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme
        return {
            ...base,
            colors: {
                ...base.colors,
                background: colorScheme === 'dark' ?
                    tamaguiConfig.themes.dark_gray_surface1.background.val :
                    tamaguiConfig.themes.light_gray.background.val,
            }
        }
    }

    const [isFontsLoaded] = useFonts({
        Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
        InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
    })

    useEffect(() => {
        // once font is loaded, remove the splash screen
        if (isFontsLoaded) {
            setTimeout(() => {
                SplashScreen.hideAsync()
            })
        }
    }, [isFontsLoaded]);

    return (
        <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme === "dark" ? "dark_blue" : "light_blue"}>
            <PortalProvider shouldAddRootHost={true}>
                <ThemeProvider value={getTheme()}>
                    <ClerkProvider tokenCache={tokenCache}>
                        <QueryClientProvider client={queryClient}>
                            {isFontsLoaded ? (
                                <Stack screenOptions={{headerShown: false}}>
                                    <Stack.Screen name="(auth)" />
                                    <Stack.Screen name="(tabs)"/>
                                </Stack>
                            ) : null}
                        </QueryClientProvider>
                    </ClerkProvider>
                </ThemeProvider>
            </PortalProvider>
        </TamaguiProvider>
    )
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                // don't retry if we get 401 (unauthenticated) or 404 status code
                if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 404)) {
                    return false;
                }
                // retry on error only two times after initial API call
                return failureCount < 2;
            },
        }
    }
})