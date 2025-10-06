import '../tamagui-web.css'

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { SplashScreen, Stack } from 'expo-router'
import {PortalProvider, TamaguiProvider, YStack} from 'tamagui'
import { useColorScheme } from 'react-native'
import {ClerkProvider, useAuth} from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'


import { tamaguiConfig } from '@/tamagui.config'
import {useEffect} from "react";
import {useFonts} from "expo-font";
import {setBackgroundColorAsync} from "expo-system-ui";
import {Toast, ToastProvider, ToastViewport, useToastState} from "@tamagui/toast";
import {useSafeAreaInsets} from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const CurrentToast = () => {
    const currentToast = useToastState()

    if (!currentToast || currentToast.isHandledNatively) return null

    return (
        <Toast
            key={currentToast.id}
            animation="200ms"
            duration={currentToast.duration}
            enterStyle={{ opacity: 0, transform: [{ translateY: 100 }] }}
            exitStyle={{ opacity: 0, transform: [{ translateY: 100 }] }}
            transform={[{ translateY: 0 }]}
            opacity={1}
            scale={1}
            viewportName={currentToast.viewportName}
        >
            <YStack>
                <Toast.Title>{currentToast.title}</Toast.Title>
                {!!currentToast.message && (
                    <Toast.Description>
                        {currentToast.message}
                    </Toast.Description>
                )}
            </YStack>
        </Toast>
    )
}

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
                <ToastProvider>
                    <ThemeProvider value={getTheme()}>
                        <ClerkProvider tokenCache={tokenCache}>
                            {isFontsLoaded ? (
                                <Stack screenOptions={{headerShown: false}}>
                                    <Stack.Screen name="(auth)" />
                                    <Stack.Screen name="(tabs)"/>
                                </Stack>
                            ) : null}
                        </ClerkProvider>
                    </ThemeProvider>
                    <CurrentToast/>
                    <ToastViewport
                        flexDirection={"column"}
                        top={insets.top}
                        left={insets.left}
                        right={insets.right}
                    />
                </ToastProvider>
            </PortalProvider>
        </TamaguiProvider>
    )
}