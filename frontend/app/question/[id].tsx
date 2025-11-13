import {useLocalSearchParams, useNavigation} from "expo-router";
import {ScrollView, Spinner, Text, View, XStack, YStack} from "tamagui";
import {useEffect} from "react";
import {useGetQuestionById} from "@/hooks/tanstack/question";
import {Alert, RefreshControl} from "react-native";
import {isAxiosError} from "axios";
import QuestionCard from "@/components/card/question-card";

export default function QuestionDetailsPage() {
    const { id } = useLocalSearchParams();
    const navigation = useNavigation();

    // always fetch the question
    const questionQuery = useGetQuestionById(id as string, true)

    useEffect(() => {
        if (questionQuery.error) {
            Alert.alert("Error loading question", questionQuery.error.message)
        }
    }, [questionQuery.error]);

    //  dynamically override the title of the current stack screen to the question title
    useEffect(() => {
        if (questionQuery.data) {
            navigation.setOptions({
                title: `${questionQuery.data.title}`,
            });
        }
    }, [questionQuery.data, navigation]);


    if (questionQuery.isError) {
        if (isAxiosError(questionQuery.error) && questionQuery.error.status !== 404) {
            return <Text color={"red"}>Could not load question {id}</Text>
        } else {
            return <Text color={"red"}>Question not found. It may have been removed or doesn't exist</Text>
        }
    }

    if (questionQuery.isPending || questionQuery.isFetching) {
        return (
            <View style={{flex: 1}}>
                <YStack
                    rowGap={10}
                    flex={1}
                    justifyContent={"center"}
                    alignItems={"center"}
                >
                    <Spinner size={"large"}/>
                    <Text>Loading...</Text>
                </YStack>
            </View>
        )
    }

    const question = questionQuery.data

    return (
        <ScrollView
            refreshControl={
                <RefreshControl
                    refreshing={questionQuery.isRefetching}
                    enabled={true}
                    onRefresh={questionQuery.refetch}
                />
            }
        >
            <YStack>
                <QuestionCard questionId={question.id} showDetails={true}/>
            </YStack>
        </ScrollView>
    )
}