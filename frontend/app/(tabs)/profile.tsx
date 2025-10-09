import {Avatar, Button, Text, useTheme, View} from "tamagui";
import {useClerk} from "@clerk/clerk-expo";
import {useGetAuthUser} from "@/hooks/tanstack/user";
import {useFocusEffect} from "expo-router";
import {useCallback, useEffect} from "react";
import {Alert} from "react-native";

export default function ProfilePage() {
    const authUserQuery = useGetAuthUser()
    const authUser = authUserQuery.data
    const {signOut} = useClerk()

    useEffect(() => {
        if (authUserQuery.error) {
            Alert.alert("Error loading profile", authUserQuery.error.message)
        }
    }, [authUserQuery.error]);

    return (
        <View>
            <Text>Profile Page</Text>
            {authUserQuery.isFetching || authUserQuery.isPending ? (
                <Text>Loading</Text>
            ) : (authUserQuery.error || !authUser) ? (
                <Text color={"red"}>{authUserQuery.isError ? authUserQuery.error.message : "Could not load profile"}</Text>
            ) : (
                <View>
                    <Avatar circular size={100}>
                        <Avatar.Image
                            srcSet={authUser.avatar_url}
                        />
                        <Avatar.Fallback backgroundColor={"$blue8"} />
                    </Avatar>
                    <Text>Email: {authUser.email}</Text>
                    <Text>Username: {authUser.username}</Text>
                    <Text>Display Name: {authUser.display_name}</Text>
                </View>
            )}
            <Button onPress={() => signOut()}>Sign Out</Button>
            <Button onPress={() => authUserQuery.refetch()}>Refresh</Button>
        </View>
    )
}