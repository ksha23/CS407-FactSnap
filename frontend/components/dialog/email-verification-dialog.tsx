import { Button, Dialog, Input, Paragraph, YStack } from "tamagui";
import { useState } from "react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (code: string) => void;
};

export default function EmailVerificationDialog(props: Props) {
    const [code, setCode] = useState("");
    return (
        <Dialog modal open={props.isOpen}>
            <Dialog.Portal>
                <Dialog.Overlay
                    key="overlay"
                    animation="quick"
                    opacity={0.5}
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                    onPress={props.onClose}
                />

                <Dialog.FocusScope focusOnIdle={true}>
                    <Dialog.Content
                        bordered
                        paddingVertical="$4"
                        paddingHorizontal="$6"
                        elevate
                        borderRadius="$6"
                        key="content"
                        animateOnly={["transform", "opacity"]}
                        animation={[
                            "quicker",
                            {
                                opacity: {
                                    overshootClamping: true,
                                },
                            },
                        ]}
                        enterStyle={{ x: 0, y: 20, opacity: 0 }}
                        exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
                        gap="$4"
                    >
                        <Dialog.Title>Verify your email</Dialog.Title>
                        <Dialog.Description>
                            Enter the verification code we sent to your inbox
                        </Dialog.Description>
                        <Input
                            placeholder={"Code"}
                            textContentType={"oneTimeCode"}
                            keyboardType={"number-pad"}
                            value={code}
                            onChangeText={setCode}
                        />
                        <Dialog.Close displayWhenAdapted asChild>
                            <Button onPress={() => props.onSubmit(code)}>
                                <Paragraph>Submit</Paragraph>
                            </Button>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.FocusScope>
            </Dialog.Portal>
        </Dialog>
    );
}
