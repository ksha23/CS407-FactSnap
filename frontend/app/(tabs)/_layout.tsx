import { Redirect, Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Spinner, Text as TText, useTheme, View, YStack } from "tamagui";
import { useAuth } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useClerkSyncUser } from "@/hooks/clerk-auth";
import AppHeader from "@/components/headers/app-header";

export default function TabsLayout() {
    const { isSignedIn, isLoaded } = useAuth();
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    useClerkSyncUser();

    if (!isLoaded) {
        return (
            <View style={{ flex: 1 }}>
                <YStack
                    rowGap={10}
                    flex={1}
                    justifyContent={"center"}
                    alignItems={"center"}
                >
                    <Spinner size={"large"} />
                    <TText>Loading...</TText>
                </YStack>
            </View>
        );
    }

    if (!isSignedIn) {
        return <Redirect href={"/(auth)/sign-in"} />;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: true,

                header: (props) => <AppHeader {...props} />,

                tabBarActiveTintColor: theme.colorFocus.val,
                tabBarStyle: {
                    height: 50 + insets.bottom,
                    backgroundColor: theme.color1.val, // match Tamagui bg
                    borderTopColor: theme.borderColor?.val,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Feed",
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="ask"
                options={{
                    title: "Ask",
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="plus-circle" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="user" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
