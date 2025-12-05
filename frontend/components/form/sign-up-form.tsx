import { useRouter } from "expo-router";
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
import { useEffect, useState } from "react";
import { isClerkAPIResponseError, useSignUp } from "@clerk/clerk-expo";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignUpFormSchema } from "@/validation/validation";
import EmailVerificationDialog from "@/components/dialog/email-verification-dialog";

export default function SignUpForm() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [pendingVerification, setPendingVerification] = useState(false);

    useEffect(() => {
        if (isLoaded) {
            setIsLoading(false);
        }
    }, [isLoaded]);

    const {
        control,
        handleSubmit: submit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
        resolver: zodResolver(SignUpFormSchema),
    });

    async function handleSubmit(values: {
        email: string;
        password: string;
        confirmPassword: string;
    }) {
        if (!isLoaded) return;
        setIsLoading(true);

        // Start sign-up process using email and password provided
        try {
            await signUp.create({
                emailAddress: values.email,
                password: values.password,
            });

            // Send user an email with verification code
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

            // Set 'pendingVerification' to true to display second form
            // and capture OTP code
            setPendingVerification(true);
        } catch (err) {
            // See https://clerk.com/docs/guides/development/custom-flows/error-handling
            // for more info on error handling
            if (isClerkAPIResponseError(err)) {
                Alert.alert("Error", err.message);
            } else {
                Alert.alert("Error", JSON.stringify(err, null, 2));
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleVerification(code: string) {
        if (!isLoaded) return;
        setPendingVerification(false);
        setIsLoading(true);

        try {
            // Use the code the user provided to attempt verification
            const signUpAttempt = await signUp.attemptEmailAddressVerification({
                code: code,
            });

            // If verification was completed, set the session to active
            // and redirect the user
            if (signUpAttempt.status === "complete") {
                await setActive({
                    session: signUpAttempt.createdSessionId,
                });
            } else {
                // If the status is not complete, check why. User may need to
                // complete further steps.
                Alert.alert("Error", JSON.stringify(signUpAttempt, null, 2));
            }
        } catch (err) {
            // See https://clerk.com/docs/guides/development/custom-flows/error-handling
            // for more info on error handling
            if (isClerkAPIResponseError(err)) {
                Alert.alert("Error", err.message);
            } else {
                Alert.alert("Error", JSON.stringify(err, null, 2));
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView behavior={"padding"} style={{ flex: 1 }}>
            <View padding={20} flex={1} justifyContent={"center"}>
                <H1 alignSelf={"center"} paddingBottom={30}>
                    FactSnap
                </H1>
                <EmailVerificationDialog
                    isOpen={pendingVerification}
                    onClose={() => setPendingVerification(false)}
                    onSubmit={handleVerification}
                />
                <Card bordered>
                    <Card.Header>
                        <H3 alignSelf={"center"} paddingBottom={20}>
                            Sign up for an account
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

                        {/* Confirm Password Input*/}
                        <YStack rowGap={0}>
                            <Label>Confirm Password</Label>
                            <Controller
                                name={"confirmPassword"}
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder={"Confirm password"}
                                        secureTextEntry
                                        textContentType={"password"}
                                        disabled={isLoading}
                                        ref={field.ref}
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                            {errors.confirmPassword && (
                                <Text color={"red"}>
                                    {errors.confirmPassword.message}
                                </Text>
                            )}
                        </YStack>

                        {isLoading ? (
                            <Button disabled={true} opacity={0.7}>
                                <Spinner size="large" />
                            </Button>
                        ) : (
                            <Button onPress={submit(handleSubmit)}>
                                <Paragraph>Sign up</Paragraph>
                            </Button>
                        )}

                        <Paragraph alignSelf={"center"}>
                            Have an account?{" "}
                            <SizableText
                                onPress={() => {
                                    if (isLoading) return;
                                    router.push("/(auth)/sign-in");
                                }}
                                cursor="pointer"
                                textDecorationLine={"underline"}
                            >
                                Sign in
                            </SizableText>
                        </Paragraph>
                    </YStack>
                </Card>
            </View>
        </KeyboardAvoidingView>
    );
}
