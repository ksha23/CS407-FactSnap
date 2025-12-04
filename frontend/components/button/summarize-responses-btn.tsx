import { Button, Paragraph } from "tamagui";
import { Sparkles } from "@tamagui/lucide-icons";

export default function SummarizeResponsesButton() {
    return (
        <Button>
            <Button.Icon>
                <Sparkles size={20} />
            </Button.Icon>
            <Button.Text>
                <Paragraph>Summarize Responses</Paragraph>
            </Button.Text>
        </Button>
    )
}