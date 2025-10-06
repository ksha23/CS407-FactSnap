import {SafeAreaView} from "react-native-safe-area-context";
import SignInForm from "@/components/form/sign-in-form";

export default function SignInPage() {
    return (
        <SafeAreaView style={{flex:1}}>
            <SignInForm/>
        </SafeAreaView>
    )
}