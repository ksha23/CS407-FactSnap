import { Text, XStack } from "tamagui"
import {ReactNode} from "react";

type Props = {
    label: string
    color?: string
    icon?: ReactNode
    backgroundColor?: string
    size?: "sm" | "md" | "lg"
}

export function Badge({icon, label, color = "$color",
                          backgroundColor = "$color4",
                          size = "md",
                      }: Props) {
    const horizontalPad = size === "sm" ? "$2" : size === "lg" ? "$3" : "$2.5"
    const verticalPad = size === "sm" ? 2 : size === "lg" ? 5 : 4
    const fontSize = size === "sm" ? "$2" : size === "lg" ? "$4" : "$3"

    return (
        <XStack
            alignItems="center"
            justifyContent="center"
            alignSelf="flex-start"
            backgroundColor={backgroundColor}
            borderRadius="$20"
            paddingHorizontal={horizontalPad}
            paddingVertical={verticalPad}
            gap={5}
        >
            {icon}
            <Text color={color} fontSize={fontSize} fontWeight="600">
                {label}
            </Text>
        </XStack>
    )
}
