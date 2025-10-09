import {Avatar, Button, Text, useTheme, View} from "tamagui";
import {useClerk} from "@clerk/clerk-expo";
import {useGetAuthUser} from "@/hooks/tanstack/user";

export default function ProfilePage() {
    const authUserData = useGetAuthUser()
    const {signOut} = useClerk()

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
        </View>
    )
}