import {Redirect, Stack} from "expo-router";
import {useAuth} from "@clerk/clerk-expo";
import {Spinner, Text, View, YStack} from "tamagui";

export default function AuthLayout() {
    const {isSignedIn, isLoaded} = useAuth()

    if (!isLoaded) {
        return (
            <View style={{flex:1}}>
                <YStack rowGap={10} flex={1} justifyContent={"center"} alignItems={"center"}>
                    <Spinner size={"large"}/>
                    <Text>Loading...</Text>
                </YStack>
            </View>
        )
    }

    if (isSignedIn) {
        return <Redirect href={"/(tabs)"} />
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}