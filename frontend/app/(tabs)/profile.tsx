import {Avatar, Button, Text, useTheme, View} from "tamagui";
import {useClerk} from "@clerk/clerk-expo";
import {useGetAuthUser} from "@/hooks/tanstack/user";
import {useFocusEffect} from "expo-router";
import {useCallback, useEffect} from "react";
import {Alert} from "react-native";

export default function ProfilePage() {
    const authUserData = useGetAuthUser()
    const {signOut} = useClerk()

    useEffect(() => {
        if (authUserData.error) {
            Alert.alert("Error getting profile", authUserData.error.message)
        }
    }, [authUserData.error]);

    return (
        <View>
            <Text>Profile Page</Text>
            {authUserData.isFetching ? (
                <Text>Loading</Text>
            ) : (authUserData.error) ? (
                <Text color={"red"}>{authUserData.error.message}</Text>
            ) : (
                <View>
                    <Avatar circular size={100}>
                        <Avatar.Image
                            srcSet={authUserData.data!.avatar_url}
                        />
                        <Avatar.Fallback backgroundColor={"$blue8"} />
                    </Avatar>
                    <Text>Email: {authUserData.data!.email}</Text>
                    <Text>Username: {authUserData.data!.username}</Text>
                    <Text>Display Name: {authUserData.data!.display_name}</Text>
                </View>
            )}
            <Button onPress={() => signOut()}>Sign Out</Button>
            <Button onPress={() => authUserData.refetch()}>Refresh</Button>
        </View>
    )
}