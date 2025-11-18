import {
    Button,
    Card,
    H1,
    H3,
    Input,
    Label,
    Paragraph,
    Separator,
    SizableText,
    Spinner,
    Text,
    View,
    YStack,
} from "tamagui";
import { useRouter } from "expo-router";
import { useClerkAuth } from "@/hooks/clerk-auth";
import { Provider } from "@/models/provider";
import { maybeCompleteAuthSession } from "expo-web-browser";
import GoogleIcon from "@/components/icon/google-icon";
import { KeyboardAvoidingView } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInFormSchema } from "@/validation/validation";

// Handle any pending authentication sessions
maybeCompleteAuthSession();

export default function SignInForm() {
    const router = useRouter();
    const { isLoading, handleOAuth, handleCredentials } = useClerkAuth();

    const {
        control,
        handleSubmit: submit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
        resolver: zodResolver(SignInFormSchema),
    });

    async function handleSubmit(values: { email: string; password: string }) {
        await handleCredentials(values.email, values.password);
    }

    return (
        <KeyboardAvoidingView behavior={"padding"} style={{ flex: 1 }}>
            <View padding={20} flex={1} justifyContent={"center"}>
                <H1 alignSelf={"center"} paddingBottom={30}>
                    FactSnap
                </H1>
                <Card bordered>
                    <Card.Header>
                        <H3 alignSelf={"center"} paddingBottom={20}>
                            Sign in to your account
                        </H3>
                        <Separator />
                    </Card.Header>
                    <YStack padding={20} paddingTop={0} rowGap={10}>
                        {/* Email Input*/}
                        <YStack>
                            <Label>Email</Label>
                            <Controller
                                name={"email"}
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder={"email@example.com"}
                                        disabled={isLoading}
                                        textContentType={"emailAddress"}
                                        keyboardType={"email-address"}
                                        ref={field.ref}
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                            {errors.email && (
                                <Text color={"red"}>{errors.email.message}</Text>
                            )}
                        </YStack>

                        {/* Password Input*/}
                        <YStack>
                            <Label>Password</Label>
                            <Controller
                                name={"password"}
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder={"Enter password"}
                                        secureTextEntry={true}
                                        textContentType={"password"}
                                        disabled={isLoading}
                                        ref={field.ref}
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                            {errors.password && (
                                <Text color={"red"}>{errors.password.message}</Text>
                            )}
                        </YStack>

                        {isLoading ? (
                            <Button disabled={true} opacity={0.7}>
                                <Spinner size="large" />
                            </Button>
                        ) : (
                            <Button onPress={submit(handleSubmit)}>
                                <Paragraph>Sign In</Paragraph>
                            </Button>
                        )}

                        <View
                            flexDirection={"row"}
                            width={"100%"}
                            alignItems={"center"}
                            gap={15}
                        >
                            <Separator />
                            <Paragraph>Or</Paragraph>
                            <Separator />
                        </View>

                        {/* Google */}
                        {isLoading ? (
                            <Button disabled={true} opacity={0.7}>
                                <Spinner size="large" />
                            </Button>
                        ) : (
                            <Button
                                onPress={async () => {
                                    await handleOAuth(Provider.Google, "oauth_google");
                                }}
                            >
                                <Button.Icon>
                                    <GoogleIcon style={{ width: 20, height: 20 }} />
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
                                    if (isLoading) return;
                                    router.push("/(auth)/sign-up");
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
    );
}
