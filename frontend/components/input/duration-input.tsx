import {useMemo, useState} from "react"
import {YStack, XStack, Input, Select, Label, Adapt, Sheet} from "tamagui"
import {Category} from "@/models/question";
import {Check, ChevronDown} from "@tamagui/lucide-icons";

type Props = {
    duration: string
    onChange: (newDuration: string) => void
    onBlur: () => void
}

export default function DurationInput(props: Props) {
    // Split duration into numeric + unit parts
    const { amount, unit } = useMemo(() => {
        const match = props.duration.match(/^(\d+(?:\.\d+)?)([a-zµ]+)?$/)
        return {
            amount: match?.[1] ?? "",
            unit: match?.[2] ?? "",
        }
    }, [props.duration])

    const handleAmountChange = (newAmount: string) => {
        if (newAmount === "") props.onChange("")
        else props.onChange(`${newAmount}${unit}`)
    }

    const handleUnitChange = (newUnit: string) => {
        if (amount === "") props.onChange("")
        else props.onChange(`${amount}${newUnit}`)
    }


    return (
        <XStack
            alignItems="center" gap="$2"
        >
            <Input
                keyboardType="numeric"
                placeholder="Enter number"
                value={amount}
                onChangeText={handleAmountChange}
            />
            <Select
                value={unit}
                onValueChange={handleUnitChange}
                onOpenChange={(open) => !open}
                disablePreventBodyScroll
            >
                <Select.Trigger flex={1} iconAfter={ChevronDown}>
                    <Select.Value placeholder="Select unit" />
                </Select.Trigger>

                <Adapt platform="touch">
                    <Sheet native modal dismissOnSnapToBottom animation="medium">
                        <Sheet.Frame>
                            <Sheet.ScrollView>
                                <Adapt.Contents />
                            </Sheet.ScrollView>
                        </Sheet.Frame>
                        <Sheet.Overlay
                            backgroundColor="$shadowColor"
                            animation="lazy"
                            enterStyle={{ opacity: 0 }}
                            exitStyle={{ opacity: 0 }}
                        />
                    </Sheet>
                </Adapt>

                <Select.Content zIndex={200000}>
                    <Select.ScrollUpButton/>
                    <Select.Viewport minWidth={200}>
                        <Select.Group>
                            {["m", "h"].map((u, idx) => (
                                <Select.Item index={idx} key={u} value={u}>
                                    <Select.ItemText>{u === "m" ? "minute" : "hour"}</Select.ItemText>
                                </Select.Item>
                            ))}
                        </Select.Group>
                    </Select.Viewport>
                    <Select.ScrollDownButton/>
                </Select.Content>
            </Select>
        </XStack>
    )
}
