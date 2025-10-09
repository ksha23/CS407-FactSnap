import {SafeAreaView} from "react-native-safe-area-context";
import {Paragraph} from "tamagui";
import SignUpForm from "@/components/form/sign-up-form";

export default function SignUpPage() {
    return (
        <SafeAreaView style={{flex:1}}>
           <SignUpForm />
        </SafeAreaView>
    )
}