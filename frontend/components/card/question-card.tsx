import {useDeleteQuestion, useGetQuestionById} from "@/hooks/tanstack/question";
import {Avatar, Card, XStack, YStack, Text, Image, Button, H2, H3, Label, View} from "tamagui";
import {Calendar, Clock, MapPin, MessageCircle, SquarePen, Trash, ChevronLeft} from "@tamagui/lucide-icons";
import {ContentType, Question} from "@/models/question";
import {Location} from "@/models/location"
import QuestionMap from "@/components/map/question-map";
import {Badge} from "@/components/card/badge";
import {formatDisplayNumber, formatExpirationDate, multiFormatDateString} from "@/utils/formatter";
import {QuestionPollCard} from "@/components/card/question-poll";
import {useRouter} from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { Alert, ScrollView } from "react-native";

// Jerry
import ResponseCard from "@/components/card/response-card";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator } from "react-native";
import { TextInput } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { questionKeys, userKeys } from "@/hooks/tanstack/query-keys";

type Props = {
    questionId: string;
    showDetails?: boolean;
};

export default function QuestionCard(props: Props) {
    const questionQuery = useGetQuestionById(props.questionId);
    const deleteQuestionMutation = useDeleteQuestion();

    const question = questionQuery.data;
    const router = useRouter();
    const isDetails = !!props.showDetails;
    const queryClient = useQueryClient();

    // Jerry: responses & summary state + auth
    const API_BASE = process.env.EXPO_PUBLIC_BACKEND_API_URL; // Using your own base url in .env
    const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
    const [summaryText, setSummaryText] = useState<string | null>(null);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const { getToken } = useAuth(); // Clerk: getToken

    const [replyText, setReplyText] = useState("");
    const [posting, setPosting] = useState(false);
    const [responses, setResponses] = useState<any[]>([]);
    const [loadingResponses, setLoadingResponses] = useState<boolean>(false);

    // Edit & Delete
    const { user } = useUser();
    const currentUserId = user?.id ?? null;

    //helper: normalize a response from backend (maybe we need normalize in backend, then can simplify in frontend)
    function normalizeResp(raw: any) {
      // ensure consistent shape: { id, author: { id, username, display_name, avatar_url }, body, created_at, ... }
      const id = raw?.id ?? raw?.ID ?? raw?.Id ?? raw?.iD ?? null;
      const authorRaw = raw?.author ?? raw?.Author ?? {};
      const authorId = authorRaw?.id ?? authorRaw?.ID ?? authorRaw?.Id ?? null;
      const author = {
        id: authorId,
        username: authorRaw?.username ?? authorRaw?.Username ?? "",
        display_name: authorRaw?.display_name ?? authorRaw?.DisplayName ?? authorRaw?.displayName ?? "Unknown",
        avatar_url: authorRaw?.avatar_url ?? authorRaw?.AvatarURL ?? authorRaw?.avatarUrl ?? null,
      };
      const body = typeof raw?.body === "string" ? raw.body : (typeof raw?.Body === "string" ? raw.Body : String(raw?.body ?? raw?.Body ?? ""));
      const created_at = raw?.created_at ?? raw?.CreatedAt ?? raw?.createdAt ?? null;
      const image_urls = raw?.image_urls ?? raw?.imageUrls ?? raw?.ImageURLs ?? [];
      return {
        ...raw,
        id: id ? String(id) : null,
        author,
        body,
        created_at,
        image_urls,
      };
    }

    // fetchResponses
    async function fetchResponses() {
      setLoadingResponses(true);
      try {
        const HOST = process.env.EXPO_PUBLIC_BACKEND_API_URL;
        let token: string | null = null;
        try { token = await getToken(); } catch (_) { token = null; }

        const qid = props.questionId;
        const res = await fetch(`${HOST}/questions/${qid}/responses`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
        });

        const text = await res.text();
        if (!res.ok) {
          console.warn("fetchResponses failed:", res.status, text);
          setResponses([]);
          return;
        }

        let body: any = {};
        try { body = JSON.parse(text); } catch (e) { body = { responses: [] }; }

        const raw = body.responses ?? [];
        // Normalize and dedupe by id (keep order)
        const seen = new Map<string, any>();
        const normalized: any[] = [];
        for (const r of raw) {
          const n = normalizeResp(r);
          const rid = n.id ?? `__noid__${Math.random().toString(36).slice(2,8)}`; // give a fallback unique token if no id
          // if id is null we give a unique fallback to avoid duplicate keys; but real solution: backend should include id
          if (!seen.has(rid)) {
            seen.set(rid, true);
            normalized.push(n);
          } else {
            // duplicate id from backend — log it for debugging
            console.warn("[fetchResponses] duplicate response id from backend:", rid, r);
          }
        }

        console.log("[fetchResponses] normalized ids:", normalized.map((x:any)=>x.id));
        setResponses(normalized);
      } catch (err) {
        console.error("fetchResponses error:", err);
        setResponses([]);
      } finally {
        setLoadingResponses(false);
      }
    }


    // call once on mount / when questionId changes
    useEffect(() => {
      if (!props.questionId) return;
      fetchResponses();
    }, [props.questionId]);

    // Method for post new response
    async function handlePostResponse() {
      if (replyText.trim() === "") return;
      setPosting(true);
      try {
        const HOST = process.env.EXPO_PUBLIC_BACKEND_API_URL;
        const token = await getToken().catch(()=>null);
        const res = await fetch(`${HOST}/questions/${props.questionId}/responses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ body: replyText }),
        });

        const text = await res.text();
        if (!res.ok) {
          Alert.alert("Post error", `${res.status}: ${text}`);
          return;
        }

        let body: any = {};
        try { body = JSON.parse(text); } catch (e) { body = { response: null }; }
        const newResp = body.response;

        if (newResp) {
          setResponses(prev => [ newResp, ...(prev ?? []) ]);
          setReplyText("");

          queryClient.invalidateQueries({ queryKey: questionKeys.responded() });
          queryClient.invalidateQueries({ queryKey: userKeys.statistics() });

          await fetchResponses();
        } else {
          await fetchResponses();
          queryClient.invalidateQueries({ queryKey: questionKeys.responded() });
          queryClient.invalidateQueries({ queryKey: userKeys.statistics() });
        }
      } catch (err) {
        Alert.alert("Error", String(err));
      } finally {
        setPosting(false);
      }
    }

    async function handleSummaryPress() {
      try {
        setSummaryError(null);
        setSummaryText(null);
        setSummaryLoading(true);

        // optional token
        let token: string | null = null;
        try { token = await getToken(); } catch (e) { token = null; }

        const HOST = process.env.EXPO_PUBLIC_BACKEND_API_URL;
        const qid = props.questionId;

        // --- build dynamic prompt from responses ---
        // take up to 20 responses
        const items = (responses ?? []).slice(0, 20);

        // helper: safely get body text (adjust fields if your response shape differs)
        const sanitize = (s: any) => {
          if (!s && s !== 0) return "";
          if (typeof s === "object") {
            return String(s.body ?? s.BODY ?? s.Body ?? s.text ?? "");
          }
          return String(s);
        };

        const lines = items.map((r: any, idx: number) => {
          const body = sanitize(r?.body ?? r?.Body ?? r?.BODY ?? r?.text ?? r);
          const compact = body.replace(/\s+/g, " ").trim();
          return `${idx + 1}. ${compact}`;
        }).filter(l => l.length > 0);

        let responsesText = lines.join("\n");

        const MAX_CHARS = 5000;
        if (responsesText.length > MAX_CHARS) {
          responsesText = responsesText.slice(0, MAX_CHARS) + " ... (truncated)";
        }


        const prompt = `Summarize all the responses in the following using the third person and three points.

        Responses:
        ${responsesText}

        Constraints:
        - Provide exactly three concise bullet points.
        - Use third-person phrasing (e.g., "Users report..." or "Respondents mention...").
        - Each bullet point should be one short sentence (no sub-clauses).
        - Keep language neutral and factual.
        - Do not include extra commentary or prefatory text.`;

        // --- send to backend ---
        const res = await fetch(`${HOST}/questions/${qid}/summary`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ prompt }),
        });

        const text = await res.text();
        console.log("SUMMARY_RESP_RAW", res.status, text);

        if (!res.ok) {
          setSummaryError(`status ${res.status}: ${text}`);
          return;
        }

        let body: any = {};
        try { body = JSON.parse(text); } catch (e) { body = { summary_raw: text }; }
        const gotSummary = (body.summary ?? body.summary_raw ?? "").toString();

        // Set summary above all responses lists
        setSummaryText(gotSummary ?? "");
        setSummaryError(null);

      } catch (err: any) {
        console.error("handleSummaryPress error:", err);
        setSummaryError(String(err?.message ?? err));
      } finally {
        setSummaryLoading(false);
      }
    }



    const handleCardPress = () => {
      router.push({
        pathname: "/question/[id]",
        params: { id: props.questionId },
      });
    };

    // All fake responses used for tests only. If you need for tests, please set it back and set USE_FAKE_RESPONSES = true.
    /*const USE_FAKE_RESPONSES = false;
    const FAKE_RESPONSES = [
      {
        id: "r-fake-1",
        author: { id: "u_alice", username: "alice", display_name: "Alice", avatar_url: "https://i.pravatar.cc/80?u=alice" },
        body: "I was there 10 minutes ago. long queue, highly recommend.",
        created_at: "2025-11-15T13:20:00Z",
      },
      {
        id: "r-fake-2",
        author: { id: "u_bob", username: "bob", display_name: "Bob", avatar_url: "https://i.pravatar.cc/80?u=bob" },
        body: "Parking is tight on weekends — try to bike or come earlier.",
        created_at: "2025-11-15T12:05:00Z",
      },
      {
        id: "r-fake-3",
        author: { id: "u_carol", username: "carol", display_name: "Carol", avatar_url: "https://i.pravatar.cc/80?u=carol" },
        body: "They have vegetarian options inside — pretty tasty.",
        created_at: "2025-11-14T19:30:00Z",
      },
      {
        id: "r-fake-4",
        author: { id: "u_dave", username: "dave", display_name: "Dave", avatar_url: "https://i.pravatar.cc/80?u=dave" },
        body: "An event was happening — place was noisier than usual.",
        created_at: "2025-11-13T15:45:00Z",
      },
      {
        id: "r-fake-5",
        author: { id: "u_elaine", username: "elaine", display_name: "Elaine", avatar_url: "https://i.pravatar.cc/80?u=elaine" },
        body: "Staff were friendly and the wifi worked well.",
        created_at: "2025-11-12T10:12:00Z",
      }
    ]; */

    // Delete & Edit
    // method for handling Edit Response
    async function handleEditResponse(responseId: string, newBody: string) {
      if (!responseId) {
        Alert.alert("Edit error", "missing response id");
        return;
      }
      const HOST = process.env.EXPO_PUBLIC_BACKEND_API_URL;
      setLoadingResponses(true);
      try {
        const token = await getToken().catch(()=>null);
        const res = await fetch(`${HOST}/questions/${props.questionId}/responses/${responseId}`, {
          method: "PUT",// see response handler for http route information
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ body: newBody }),
        });

        const text = await res.text();
        if (!res.ok) {
          Alert.alert("Edit error", `${res.status}: ${text}`);
          await fetchResponses();
          return;
        }

        let body: any = {};
        try { body = JSON.parse(text); } catch(e){ body = { response: null }; }
        const updatedRaw = body.response ?? body;
        if (!updatedRaw) {
          console.warn("[handleEditResponse] backend returned no updated object:", body);
          await fetchResponses();
          return;
        }
        const updated = normalizeResp(updatedRaw);
        console.log("[handleEditResponse] updated:", updated);

        setResponses(prev => prev.map(r => {
          const rid = String(r.id ?? r.ID ?? "");
          const uid = String(updated.id ?? updated.ID ?? "");
          if (rid === uid) {
            return { ...r, ...updated };
          }
          return r;
        }));
      } catch (err) {
        Alert.alert("Edit error", String(err));
      } finally {
        setLoadingResponses(false);
      }
    }

    // Method for handling delete response in the lists
    async function handleDeleteResponse(responseId: string) {
      if (!responseId) {
        Alert.alert("Delete error", "missing response id");
        return;
      }
      const HOST = process.env.EXPO_PUBLIC_BACKEND_API_URL;
      Alert.alert(
        "Delete response",
        "Are you sure you want to delete this response?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setLoadingResponses(true);
              try {
                const token = await getToken().catch(()=>null);
                const res = await fetch(`${HOST}/questions/${props.questionId}/responses/${responseId}`, {
                  method: "DELETE",
                  headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                  },
                });

                if (!res.ok) {
                  const txt = await res.text();
                  Alert.alert("Delete error", `${res.status}: ${txt}`);
                  await fetchResponses();
                  return;
                }

                // remove from local list (use normalized id compare)
                setResponses(prev => prev.filter(r => String(r.id ?? r.ID ?? "") !== String(responseId)));
              } catch (err) {
                Alert.alert("Delete error", String(err));
              } finally {
                setLoadingResponses(false);
              }
            }
          }
        ]
      );
    }
    // Jerry end


    const isExpired = useMemo(() => {
        if (question) {
            const expiry = new Date(question.expired_at)
            const now = new Date()
            return now.getTime() >= expiry.getTime()
        } else {
            return false
        }
    }, [question])


    function handleDelete() {
        deleteQuestionMutation.mutate(question!!.id);
        if (isDetails) {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.navigate({ pathname: "/(tabs)" });
            }
        }
    }

    if (!question) {
        return null;
    }

    return (
        // Jerry: Modify for scorll of response-card lists
        <Card
            padding="$4"
            {...(!props.showDetails ? { onPress: handleCardPress } : {})}
        >

            {/* Owner actions */}
            {question.is_owned && (
                <XStack position="absolute" top="$3" right="$3" gap="$3">
                    <Button
                        size="$2"
                        backgroundColor="$blue4"
                        onPress={(e) => {
                            e.stopPropagation();

                            if (isExpired) {
                                Alert.alert(
                                    "You cannot edit this question",
                                    "This question has expired",
                                );
                                return;
                            }

                            router.push({
                                pathname: "/question/[id]/edit",
                                params: { id: props.questionId },
                            });
                        }}
                    >
                        <SquarePen size={20} color="$blue11" />
                    </Button>

                    <Button
                        size="$2"
                        backgroundColor="$red4"
                        onPress={(e) => {
                            e.stopPropagation();
                            Alert.alert(
                                "Confirm Action",
                                "Are you sure you want to delete this question?",
                                [
                                    {
                                        text: "Cancel",
                                        onPress: () => {},
                                        style: "cancel",
                                    },
                                    {
                                        text: "OK",
                                        onPress: handleDelete,
                                    },
                                ],
                            );
                        }}
                    >
                        <Trash size={20} color="$red11" />
                    </Button>
                </XStack>
            )}

            <YStack gap={isDetails ? "$3" : "$2"}>
                {/* Header: avatar + badges */}
                {isDetails ? (
                    <>
                        {/* Author info (detailed) */}
                        <XStack alignItems="center" gap="$3">
                            <Avatar circular>
                                <Avatar.Image srcSet={question.author.avatar_url} />
                                <Avatar.Fallback backgroundColor={"$gray5"} />
                            </Avatar>
                            <YStack>
                                <Text>{question.author.display_name}</Text>
                                <Text color="$gray10">@{question.author.username}</Text>
                            </YStack>
                        </XStack>

                        {/* Category + Expired At Badges */}
                        <XStack gap="$2">
                            <Badge label={question.category} />
                            <Badge
                                icon={<Clock size={15} color="$red9" />}
                                label={formatExpirationDate(question.expired_at)}
                            />
                        </XStack>
                    </>
                ) : (
                    // COMPACT HEADER (showDetails = false)
                    <XStack alignItems="center" gap="$2">
                        <Avatar circular size="$2">
                            <Avatar.Image srcSet={question.author.avatar_url} />
                            <Avatar.Fallback backgroundColor="$gray5" />
                        </Avatar>

                        <XStack gap="$1" flexShrink={1} flexWrap="wrap">
                            <Badge label={question.category} />
                            <Badge
                                icon={<Clock size={14} color="$red9" />}
                                label={formatExpirationDate(question.expired_at)}
                            />
                        </XStack>
                    </XStack>
                )}

                {/* Title (always shown, but clamp in compact) */}
                <YStack>
                    <H3 numberOfLines={isDetails ? undefined : 2}>{question.title}</H3>
                    {/* Description/body: ONLY in details mode */}
                    {isDetails && question.body && <Text>{question.body}</Text>}
                </YStack>

                {/* Map + Location */}
                {isDetails ? (
                    <YStack>
                        <View>
                            <QuestionMap
                                location={question.location}
                                height={undefined}
                            />
                        </View>
                        <Text color="$gray10">Location: {question.location.name}</Text>
                    </YStack>
                ) : (
                    <Text color="$gray10" numberOfLines={1}>
                        📍 {question.location.name}
                    </Text>
                )}

                {/* Content */}
                {question.content.type !== ContentType.NONE &&
                    (isDetails ? (
                        question.content.data ? (
                            question.content.type === ContentType.POLL ? (
                                <QuestionPollCard poll={question.content.data} />
                            ) : null
                        ) : (
                            <Text color={"red"}>
                                Error loading {question.content.type.toLowerCase()}
                            </Text>
                        )
                    ) : (
                        <Text fontWeight={600} fontStyle={"italic"}>This question contains a {question.content.type.toLowerCase()}</Text>
                    )
                )}
                {/* Section: Creation + Edited Date */}
                <XStack gap={"$1"}>
                    <Text color="$gray10">
                        {multiFormatDateString(question.created_at)}
                    </Text>
                    {question.edited_at && question.created_at != question.edited_at && (
                        <Text color="$gray10">
                            (edited {multiFormatDateString(question.edited_at).toLowerCase()})
                        </Text>
                        
                    )} 
                    <Text color="$gray10"> | </Text>
                    <Text color="$gray10">
                        {formatDisplayNumber(question.responses_amount)} responses
                    </Text>  
                </XStack>

                {isDetails && <YStack marginTop="$3">
                  <TextInput
                    value={replyText}
                    onChangeText={setReplyText}
                    placeholder="Write a reply..."
                    style={{ minHeight: 40, borderRadius: 8, padding: 8, backgroundColor: "#fff" }}
                  />
                  <Button onPress={handlePostResponse} disabled={posting || replyText.trim() === ""}>
                    <Text>{posting ? "Posting..." : "Reply"}</Text>
                  </Button>
                </YStack>}

                {/* Section: Responses Amount */}

                    {/* COMPACT FOOTER: posted + responses on ONE LINE*/}
                        


                {/* Responses list*/}
                {props.showDetails && (
                  <>
                    <Text fontWeight="700" marginTop="$3" marginBottom="$2">Responses</Text>
                    { summaryText !== null && (
                      <YStack
                        padding="$3"
                        borderRadius="$6"
                        marginBottom="$2"
                        backgroundColor="$blue3"
                        borderWidth={1}
                        borderColor="$blue8"
                      >
                        <XStack justifyContent="space-between" alignItems="center">
                          <Text fontWeight="700" color="$blue11">Summary</Text>
                          <Button size="$2" onPress={() => setSummaryText(null)} backgroundColor="$gray3">
                            <Text>Close</Text>
                          </Button>
                        </XStack>

                        <Text color="$blue12" marginTop="$2" numberOfLines={3}>
                          {summaryText.trim() === "" ? "No summary" : summaryText}
                        </Text>
                      </YStack>
                    )}

                    {loadingResponses ? (
                      <YStack marginTop="$2" style={{ maxHeight: 220 }}>
                        <ScrollView nestedScrollEnabled contentContainerStyle={{ paddingBottom: 8 }}>
                          <YStack paddingHorizontal="$0" gap="$2">
                            <Text color="$gray10" padding="$2">Loading responses...</Text>
                          </YStack>
                        </ScrollView>
                      </YStack>
                    ) : (
                      <YStack marginTop="$2" style={{ height: 330 }}>
                        <ScrollView
                          nestedScrollEnabled={true}
                          style={{ height: 330 }}
                          contentContainerStyle={{ paddingBottom: 12, flexGrow: 1 }}
                          showsVerticalScrollIndicator={true}
                        >
                          <YStack paddingHorizontal="$0" gap="$2">
                            {responses.length === 0 ? (
                              <Text color="$gray10" padding="$2">
                                No responses yet — be the first to answer!
                              </Text>
                            ) : (
                              responses.map((r: any, i: number) => {
                                const rid = r?.id ?? r?.ID ?? `response-${i}`;
                                return (
                                  <ResponseCard
                                    key={`${String(rid)}-${i}`}
                                    response={r}
                                    currentUserId={currentUserId}
                                    onEdit={(id: string, newBody: string) => handleEditResponse(id, newBody)}
                                    onDelete={(id: string) => handleDeleteResponse(id)}
                                  />
                                );
                              })
                            )}
                          </YStack>
                        </ScrollView>
                      </YStack>
                    )}

                    {/* Summary button (UI-only) */}
                    <XStack justifyContent="center" marginTop="$4">
                      <Button
                        size="$3"
                        width={"65%"}
                        borderRadius="$6"
                        backgroundColor="$blue8"
                        onPress={() => handleSummaryPress()}
                        alignItems="center"
                        justifyContent="center"
                        disabled={summaryLoading}
                      >
                        {summaryLoading ? (
                          <ActivityIndicator />
                        ) : (
                          <Text fontWeight="700" fontSize="$4">Summary</Text>
                        )}
                      </Button>
                    </XStack>
                  </>
                )}
            </YStack>
        </Card>
    );
}
