import React, {useMemo, useState} from "react"
import { XStack, YStack, Text, Progress, RadioGroup, Button } from "tamagui"
import { Poll, PollOption } from "@/models/question"

type Props = {
    poll: Poll
}

export function QuestionPollCard({ poll }: Props) {
    const [selected, setSelected] = useState<string | null>(
        poll.options.find((o: PollOption) => o.is_selected)?.id ?? null
    )

    const isExpired = useMemo(() => {
        const expiry = new Date(poll.expired_at)
        const now = new Date()
        return now.getTime() >= expiry.getTime()
    }, [poll.expired_at])

    async function onSubmit(optionId: string) {

    }

    const [isVoting, setIsVoting] = useState(false)

    const handleVote = async (optionId: string) => {
        if (isExpired || isVoting) return
        setSelected(optionId)
        setIsVoting(true)
        try {
            await onSubmit(optionId)
        } finally {
            setIsVoting(false)
        }
    }

    return (
        <YStack gap="$3" padding="$3" backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$gray5">
            <YStack gap="$2">
                <Text fontWeight="700">Poll</Text>
                <Text fontSize="$2" color="$gray10">
                    {poll.num_total_votes} votes
                </Text>
            </YStack>

            <RadioGroup
                value={selected ?? ""}
                onValueChange={handleVote}
                disabled={isExpired || isVoting}
            >
                {poll.options.map((option: PollOption) => {
                    const percent =
                        poll.num_total_votes > 0
                            ? Math.round((option.num_votes / poll.num_total_votes) * 100)
                            : 0

                    const isSelected = selected === option.id

                    return (
                        <YStack key={option.id} gap="$1">
                            <XStack
                                alignItems="center"
                                justifyContent="space-between"
                                borderRadius="$3"
                                backgroundColor={isSelected ? "$blue3" : "$gray3"}
                                paddingHorizontal="$3"
                                paddingVertical="$2"
                                onPress={() => handleVote(option.id)}
                            >
                                <XStack alignItems="center" gap="$2">
                                    <RadioGroup.Item value={option.id}>
                                        <RadioGroup.Indicator />
                                    </RadioGroup.Item>
                                    <Text fontWeight={isSelected ? "700" : "400"}>
                                        {option.label}
                                    </Text>
                                </XStack>
                                <Text fontSize="$2" color="$gray11">
                                    {percent}%
                                </Text>
                            </XStack>
                            <Progress value={percent} size="$1" backgroundColor="$gray4">
                                <Progress.Indicator backgroundColor="$blue8" />
                            </Progress>
                        </YStack>
                    )
                })}
            </RadioGroup>
        </YStack>
    )
}
