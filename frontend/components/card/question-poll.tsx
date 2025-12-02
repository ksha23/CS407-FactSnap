import React, { useMemo } from "react";
import { XStack, YStack, Text, Progress, RadioGroup, Button } from "tamagui";
import { Poll, PollOption, VotePollReq } from "@/models/question";
import { useVotePoll } from "@/hooks/tanstack/question";

type Props = {
    poll: Poll;
};

export function QuestionPollCard({ poll }: Props) {
    const votePollMutation = useVotePoll();

    const isExpired = useMemo(() => {
        const expiry = new Date(poll.expired_at);
        const now = new Date();
        return now.getTime() >= expiry.getTime();
    }, [poll.expired_at]);

    const selectedOptionId =
        poll.options.find((o: PollOption) => o.is_selected)?.id ?? null;

    async function onSubmit(optionId: string) {
        if (isExpired || optionId === selectedOptionId) return;

        console.log("POLL_VOTE_SUBMISSION", "option id", optionId);

        try {
            const req: VotePollReq = {
                question_id: poll.question_id,
                poll_id: poll.id,
                option_id: optionId,
            };
            await votePollMutation.mutateAsync(req);
        } catch (e) {
            // error alert is already shown
            console.error("could not vote on poll", e);
        }
    }

    async function onRemoveVote() {
        if (!selectedOptionId || isExpired) return;

        console.log("POLL_VOTE_REMOVE", "option id", selectedOptionId);

        try {
            const req: VotePollReq = {
                question_id: poll.question_id,
                poll_id: poll.id,
                option_id: undefined,
            };
            await votePollMutation.mutateAsync(req);
        } catch (e) {
            // error alert is already shown
            console.error("could not remove poll vote", e);
        }
    }

    return (
        <YStack
            gap="$3"
            padding="$3"
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$gray5"
        >
            <YStack gap="$2">
                <Text fontWeight="700">Poll</Text>
                <Text fontSize="$2" color="$gray10">
                    {poll.num_total_votes} votes
                </Text>
                {isExpired && (
                    <Text fontSize="$2" color="red">
                        Poll has expired
                    </Text>
                )}
            </YStack>

            <RadioGroup
                value={selectedOptionId ?? ""}
                onValueChange={onSubmit}
                disabled={isExpired || votePollMutation.isPending}
            >
                {poll.options.map((option: PollOption) => {
                    const percent =
                        poll.num_total_votes > 0
                            ? Math.round((option.num_votes / poll.num_total_votes) * 100)
                            : 0;

                    const isSelected = selectedOptionId === option.id;

                    return (
                        <YStack key={option.id} gap="$1">
                            <XStack
                                alignItems="center"
                                justifyContent="space-between"
                                borderRadius="$3"
                                backgroundColor={isSelected ? "$blue3" : "$gray3"}
                                paddingHorizontal="$3"
                                paddingVertical="$2"
                                onPress={() => onSubmit(option.id)}
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
                    );
                })}
            </RadioGroup>

            {selectedOptionId && !isExpired && (
                <Button
                    backgroundColor={"$red8"}
                    size="$2"
                    disabled={votePollMutation.isPending}
                    onPress={onRemoveVote}
                >
                    Remove Vote
                </Button>
            )}
        </YStack>
    );
}
