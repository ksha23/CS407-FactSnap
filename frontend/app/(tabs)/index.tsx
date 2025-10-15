import {SafeAreaView} from "react-native-safe-area-context";
import {Text, TextArea, View} from "tamagui";
import {useIsFocused} from "@react-navigation/native";
import {useClerkSyncUser} from "@/hooks/clerk-auth";

export default function FeedPage() {
    return (
        <View>
            <Text>Feed Page</Text>
        </View>
    )
}