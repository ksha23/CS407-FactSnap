import {useLocalSearchParams, useNavigation} from "expo-router";
import {Text} from "tamagui";

export default function EditQuestionPage() {
    // TODO: finish impl
    const { id } = useLocalSearchParams();

    return (
        <Text>Editing question ${id}</Text>
    )
}