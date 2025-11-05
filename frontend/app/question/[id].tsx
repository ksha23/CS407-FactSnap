import {useLocalSearchParams, useNavigation} from "expo-router";
import {Text} from "tamagui";
import {useEffect} from "react";

export default function QuestionDetailsPage() {
    const { id } = useLocalSearchParams();
    const navigation = useNavigation();


    // TODO: dynamically override the title of the current stack screen to the question title
    // Do this once you get tanstack query working for get question by id
    useEffect(() => {
        navigation.setOptions({
            title: `${id}`,
        });
    }, [id, navigation]);

    return (
        <Text>Question ID {id}</Text>
    )
}