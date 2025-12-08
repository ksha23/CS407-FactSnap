import { useRef, useState } from "react";
import {
    Image,
    ScrollView,
    View,
    NativeScrollEvent,
    NativeSyntheticEvent,
    TouchableOpacity,
    LayoutChangeEvent,
} from "react-native";
import { XStack } from "tamagui";
import { ChevronLeft, ChevronRight } from "@tamagui/lucide-icons";

type Props = {
    imageUrls: string[];
    height?: number;
    borderRadius?: number;
};

export function ImageCarousel({
                                  imageUrls,
                                  height = 260,
                                  borderRadius = 12,
                              }: Props) {
    const scrollRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [pageWidth, setPageWidth] = useState(0);

    if (!imageUrls?.length) return null;

    function onLayout(e: LayoutChangeEvent) {
        const w = e.nativeEvent.layout.width;
        if (w !== pageWidth) {
            setPageWidth(w);
            // realign to current index when width changes
            requestAnimationFrame(() => {
                scrollRef.current?.scrollTo({ x: currentIndex * w, animated: false });
            });
        }
    }

    function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
        const { contentOffset, layoutMeasurement } = e.nativeEvent;
        const width = layoutMeasurement.width || pageWidth;
        if (!width) return;
        const index = Math.round(contentOffset.x / width);
        setCurrentIndex(index);
    }

    function goTo(index: number) {
        if (!scrollRef.current || !pageWidth) return;
        const clamped = Math.max(0, Math.min(imageUrls.length - 1, index));
        scrollRef.current.scrollTo({ x: clamped * pageWidth, animated: true });
    }

    function goNext() {
        goTo(currentIndex + 1);
    }

    function goPrev() {
        goTo(currentIndex - 1);
    }

    const ARROW_SIZE = 24;

    return (
        <View onLayout={onLayout} style={{ position: "relative" }}>
            {/* Don't render until we know width */}
            {pageWidth > 0 && (
                <>
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleMomentumEnd}
                        scrollEventThrottle={16}
                    >
                        {imageUrls.map((url, idx) => (
                            <View
                                key={`${url}-${idx}`}
                                style={{
                                    width: pageWidth,
                                    height,
                                    borderRadius,
                                    overflow: "hidden",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    // backgroundColor: "black",
                                }}
                            >
                                <Image
                                    source={{ uri: url }}
                                    style={{
                                        width: pageWidth,
                                        height,
                                    }}
                                    resizeMode="contain"
                                />
                            </View>
                        ))}
                    </ScrollView>

                    {/* Left Arrow */}
                    {imageUrls.length > 1 && currentIndex > 0 && (
                        <TouchableOpacity
                            onPress={goPrev}
                            style={{
                                position: "absolute",
                                left: 8,
                                top: height / 2 - ARROW_SIZE / 2,
                                padding: 8,
                                backgroundColor: "rgba(0,0,0,0.4)",
                                borderRadius: 999,
                            }}
                        >
                            <ChevronLeft color="white" size={ARROW_SIZE} />
                        </TouchableOpacity>
                    )}

                    {/* Right Arrow */}
                    {imageUrls.length > 1 && currentIndex < imageUrls.length - 1 && (
                        <TouchableOpacity
                            onPress={goNext}
                            style={{
                                position: "absolute",
                                right: 8,
                                top: height / 2 - ARROW_SIZE / 2,
                                padding: 8,
                                backgroundColor: "rgba(0,0,0,0.4)",
                                borderRadius: 999,
                            }}
                        >
                            <ChevronRight color="white" size={ARROW_SIZE} />
                        </TouchableOpacity>
                    )}
                </>
            )}

            {/* Dots */}
            {imageUrls.length > 1 && (
                <XStack justifyContent="center" marginTop={8} gap={6}>
                    {imageUrls.map((_, i) => (
                        <View
                            key={i}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: i === currentIndex ? "white" : "#888",
                            }}
                        />
                    ))}
                </XStack>
            )}
        </View>
    );
}
