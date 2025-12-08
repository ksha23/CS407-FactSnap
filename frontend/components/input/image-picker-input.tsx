import * as ImagePicker from "expo-image-picker";
import { MediaTypeOptions } from "expo-image-picker";
import { Button, Image, Paragraph, XStack, YStack } from "tamagui";
import { Alert } from "react-native";
import { Camera, Image as ImageIcon } from "@tamagui/lucide-icons";

type Props = {
    value: string[];
    onChange: (urls: string[]) => void;
    disabled?: boolean;
    fileSizeLimit?: number;
};

export function ImageUploadField({ value, onChange, disabled, fileSizeLimit = 2097152 }: Props) {

    async function handlePickImage(useCamera: boolean) {
        const permissionResult = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            const source = useCamera ? "camera" : "media library";
            Alert.alert('Permission required', `Permission to access your ${source} is required.`);
            return;
        }

        const pickerOptions = {
            allowsMultipleSelection: false,
            allowsEditing: true,
            quality: 0.8,
        }

        const result = useCamera
            ? await ImagePicker.launchCameraAsync(pickerOptions)
            : await ImagePicker.launchImageLibraryAsync({
                ...pickerOptions,
                mediaTypes: MediaTypeOptions.Images
            })

        console.debug(result)

        if (result.canceled || !result.assets?.[0]) return;

        const asset = result.assets[0]
        if (asset.fileSize && asset.fileSize > fileSizeLimit) {
            Alert.alert('Image is too large', `The size ${asset.fileSize}B exceeds the limit of ${fileSizeLimit}B`);
            return;
        }

        onChange([...value, asset.uri])
    }

    function handleRemove(idx: number) {
        const next = value.filter((_, i) => i !== idx);
        onChange(next);
    }

    return (
        <YStack gap="$2">
            <XStack gap="$2" flexWrap="wrap">
                {value.map((url, idx) => (
                    <YStack key={url} width={80} gap="$1">
                        <Image
                            source={{ uri: url }}
                            width={80}
                            height={80}
                            borderRadius="$3"
                        />
                        <Button
                            size="$2"
                            onPress={() => handleRemove(idx)}
                            disabled={disabled}
                            backgroundColor="$red8"
                        >
                            <Paragraph size="$2">Remove</Paragraph>
                        </Button>
                    </YStack>
                ))}
            </XStack>

            <XStack gap="$2" flexWrap="wrap">
                <Button
                    onPress={() => handlePickImage(false)}
                    disabled={disabled}
                >
                    <Button.Icon>
                        <ImageIcon/>
                    </Button.Icon>
                    <Button.Text>
                        <Paragraph>Add Image</Paragraph>
                    </Button.Text>
                </Button>
                <Button
                    onPress={() => handlePickImage(true)}
                    disabled={disabled}
                >
                    <Button.Icon>
                        <Camera/>
                    </Button.Icon>
                    <Button.Text>
                        <Paragraph>Take Photo</Paragraph>
                    </Button.Text>
                </Button>
            </XStack>

        </YStack>
    );
}