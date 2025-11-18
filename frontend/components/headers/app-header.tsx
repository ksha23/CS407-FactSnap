import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spinner, Text as TText, useTheme, YStack } from "tamagui";

export default function AppHeader({ route, options }: any) {
    const insets = useSafeAreaInsets();
    const theme = useTheme();

    const title = options.title ?? route.name;

    return (
        <YStack
            // safe-area + a bit of extra space
            paddingTop={insets.top + 8}
            paddingBottom="$3"
            paddingHorizontal="$4"
            bg="$color1"
            borderBottomWidth={1}
            borderBottomColor={theme.borderColor?.val}
        >
            <TText fontSize="$9" fontWeight="800" color="$color12">
                {title}
            </TText>
        </YStack>
    );
}
