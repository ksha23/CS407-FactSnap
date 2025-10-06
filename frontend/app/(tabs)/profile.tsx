import {Button, Text, View, XStack, YStack} from "tamagui";
import {SafeAreaView} from "react-native-safe-area-context";
import {useClerk, useUser} from "@clerk/clerk-expo";
import {Alert} from "react-native";
import {Toast, useToastController, useToastState} from "@tamagui/toast";

export default function ProfilePage() {
    const { user } = useUser()
    const {signOut} = useClerk()
    return (
        <View>
            <Text>Profile Page</Text>
            <Text>Signed in as {user!.emailAddresses[0].emailAddress}</Text>
            <Button
                onPress={() => signOut()}
            >
                Sign Out
            </Button>
        </View>
    )
}