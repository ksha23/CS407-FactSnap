import { Stack } from "expo-router";

export default function QuestionLayout() {
    return (
        <Stack screenOptions={{ headerShown: true, headerBackVisible: true }}>
            <Stack.Screen
                name="[id]"
                options={{
                    title: "Question Details",
                }}
            />
            <Stack.Screen
                name="[id]/edit"
                options={{
                    title: "Edit Question",
                }}
            />
        </Stack>
    );
}
