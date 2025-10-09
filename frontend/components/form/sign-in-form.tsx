import {Button, Card, H1, H3, Input, Label, Paragraph, Separator, SizableText, Spinner, View, YStack} from "tamagui";
import {useRouter} from "expo-router";
import {useClerkOAuth} from "@/hooks/clerk-auth";
import {Provider} from "@/models/provider";
import {maybeCompleteAuthSession} from 'expo-web-browser'
import GoogleIcon from "@/components/icon/google-icon";
import {KeyboardAvoidingView} from "react-native";

// Handle any pending authentication sessions
maybeCompleteAuthSession()


export default function SignInForm() {
    const router = useRouter();
    const {isLoading, handleOAuth} = useClerkOAuth()

    return (
        <KeyboardAvoidingView  behavior={"padding"} style={{ flex: 1 }}>
            <View padding={20} flex={1} justifyContent={"center"}>
                <H1 alignSelf={"center"} paddingBottom={30}>FactSnap</H1>
                <Card bordered>
                    <Card.Header>
                        <H3 alignSelf={"center"} paddingBottom={20}>Sign in to your account</H3>
                        <Separator/>
                    </Card.Header>
                    <YStack
                        padding={20}
                        paddingTop={0}
                        rowGap={10}
                    >
                        {/* Email Input*/}
                        <YStack>
                            <Label>
                                Email
                            </Label>
                            <Input placeholder={"email@example.com"} disabled={isLoading}/>
                        </YStack>

                        {/* Password Input*/}
                        <YStack>
                            <Label>
                                Password
                            </Label>
                            <Input
                                placeholder={"Enter password"}
                                secureTextEntry textContentType={"password"}
                                disabled={isLoading}
                            />
                        </YStack>

                        {isLoading ? (
                            <Button disabled={true} opacity={0.7}>
                                <Spinner size="large"/>
                            </Button>
                        ) : (
                            <Button onPress={() => {
                                // TODO: credentials
                            }}>
                                <Paragraph>Sign In</Paragraph>
                            </Button>
                        )}

                        <View flexDirection={"row"} width={"100%"} alignItems={"center"} gap={15}>
                            <Separator/>
                            <Paragraph>Or</Paragraph>
                            <Separator/>
                        </View>

                        {/* Google */}
                        {isLoading ? (
                            <Button disabled={true} opacity={0.7}>
                                <Spinner size="large"/>
                            </Button>
                        ) : (
                            <Button
                                onPress={async () => {
                                    await handleOAuth(Provider.Google, "oauth_google")
                                }}
                            >
                                <Button.Icon>
                                    <GoogleIcon style={{width: 20, height: 20}}/>
                                </Button.Icon>
                                <Button.Text>
                                    <Paragraph>Continue with Google</Paragraph>
                                </Button.Text>
                            </Button>
                        )}

                        <Paragraph alignSelf={"center"}>
                            Don't have an account?{" "}
                            <SizableText
                                onPress={() => {
                                    if (isLoading) return
                                    router.push("/(auth)/sign-up")
                                }}
                                cursor="pointer"
                                textDecorationLine={"underline"}
                            >
                                Sign up
                            </SizableText>
                        </Paragraph>

                    </YStack>
                </Card>
            </View>
        </KeyboardAvoidingView>
    )
}