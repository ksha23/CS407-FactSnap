import { useEffect, useMemo, useState } from "react";
import { Slider, Text, YStack } from "tamagui";

type Props = {
    duration: string;
    onChange: (newDuration: string) => void;
    onBlur: () => void;
};

export default function DurationInput(props: Props) {
    const MIN_DURATION = 15;
    const MAX_DURATION = 60;
    const STEP = 5;

    const minutes = useMemo(() => {
        const match = props.duration.match(/^(\d+(?:\.\d+)?)([a-zµ]+)?$/);
        if (!match) {
            return MAX_DURATION;
        }
        const value = parseFloat(match[1]);
        const unit = match[2] ?? "m";
        let mins: number;
        switch (unit) {
            case "h":
                mins = value * 60;
                break;
            case "m":
                mins = value;
                break;
            case "s":
                mins = value / 60;
                break;
            default:
                mins = MAX_DURATION;
        }
        return Math.max(MIN_DURATION, Math.min(MAX_DURATION, Math.round(mins)));
    }, [props.duration]);

    const [currentValue, setCurrentValue] = useState(minutes);

    useEffect(() => {
        setCurrentValue(minutes);
    }, [minutes]);

    return (
        <YStack gap="$2" alignItems="center">
            <Slider
                size="$10"
                width="90%"
                min={MIN_DURATION}
                max={MAX_DURATION}
                step={STEP}
                value={[currentValue]}
                onValueChange={(value) => {
                    const selected = value[0];
                    const clamped = Math.max(
                        MIN_DURATION,
                        Math.min(MAX_DURATION, selected),
                    );
                    setCurrentValue(selected);
                    props.onChange(`${clamped}m`);
                    props.onBlur();
                }}
                aria-label="Question duration in minutes"
                marginTop={2}
                marginBottom={10}
            >
                <Slider.Track flex={1} backgroundColor="$color7">
                    <Slider.TrackActive backgroundColor="$color10" />
                </Slider.Track>
                <Slider.Thumb
                    index={0}
                    circular
                    size="$1"
                    borderWidth={2}
                    borderColor="$color12"
                    backgroundColor="$color9"
                    pressStyle={{ scale: 1.05 }}
                />
            </Slider>
            <Text fontWeight="400">{currentValue} minutes</Text>
        </YStack>
    );
}
