import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  clamp,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { ChevronLeft, Clock, AlertCircle } from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { getEducationArticle, getRelatedArticles } from "@/utils/educationContent";
import { TOPIC_IMAGES } from "@/utils/educationTopicImages";
import { EducationCardBackground } from "@/components/EducationCardBackground";
import { ScrollProgressPill } from "@/components/ScrollProgressPill";
import { PressableScale } from "@/components/PressableScale";

const CARD_WIDTH = 220;
const CARD_HEIGHT = 170;

function RelatedCard({ item, t, onPress }) {
  const { imageUrl, fallbackColor } = TOPIC_IMAGES[item.topic] ?? {};

  return (
    <PressableScale
      onPress={onPress}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 16, overflow: "hidden" }}
    >
      <EducationCardBackground
        imageUrl={imageUrl}
        fallbackColor={fallbackColor}
        style={{ flex: 1, padding: 16, justifyContent: "flex-end" }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        />
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 11,
            letterSpacing: 1,
            color: "#F8E9E7",
            marginBottom: 8,
          }}
        >
          {item.kicker}
        </Text>
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 16,
            color: "#FFFFFF",
            lineHeight: 21,
            marginBottom: 10,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Clock size={12} color="rgba(255,255,255,0.8)" />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 12,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {item.readTime} min read
          </Text>
        </View>
      </EducationCardBackground>
    </PressableScale>
  );
}

function Header({ t, router, insets }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: insets.top + 10,
        paddingBottom: 12,
      }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.6}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: t.surfaceElevated,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChevronLeft size={22} color={t.text} />
      </TouchableOpacity>
      <View style={{ width: 38 }} />
    </View>
  );
}

export default function EducationArticleScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const posthog = usePostHog();
  const { topic, from } = useLocalSearchParams();
  const article = getEducationArticle(topic);
  const relatedArticles = getRelatedArticles(topic);

  useEffect(() => {
    posthog?.capture("education_article_viewed", {
      topic,
      from: from ?? "unknown",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll-progress tracking for the floating pill — kept above the
  // early-return so hook order stays stable whether or not the article
  // exists (the pill itself is only rendered in the found-article branch).
  const scrollRef = useRef(null);
  const viewportHeight = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const progress = useSharedValue(0);
  const isResetting = useSharedValue(false);
  const currentScroll = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    const y = event.contentOffset.y;
    currentScroll.set(y);
    if (isResetting.get()) return;
    const scrollableHeight = contentHeight.get() - viewportHeight.get();
    progress.set(scrollableHeight > 0 ? clamp(y / scrollableHeight, 0, 1) : 0);
  });

  // Reset guard: onReset flips isResetting so the handler above ignores the
  // scroll-to-top's intermediate offsets, then this reaction clears the flag
  // (and snaps progress back to 0, so the pill returns to the reading-time
  // state instead of staying stuck on the up-arrow) once the scroll actually
  // lands at y === 0.
  useAnimatedReaction(
    () => isResetting.get() && currentScroll.get() === 0,
    (shouldClear) => {
      if (shouldClear) {
        isResetting.set(false);
        progress.set(0);
      }
    },
  );

  const onReset = () => {
    isResetting.set(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  if (!article) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <StatusBar style={t.isDark ? "light" : "dark"} />
        <Header t={t} router={router} insets={insets} />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 16,
              color: t.textSecondary,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            This article isn't ready yet — check back soon.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar style={t.isDark ? "light" : "dark"} />
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onLayout={(e) => viewportHeight.set(e.nativeEvent.layout.height)}
        onContentSizeChange={(w, h) => contentHeight.set(h)}
        contentContainerStyle={{
          paddingHorizontal: 20,
          // Clears the floating progress pill (bottom + 16 offset, 52 tall)
          // so it never sits on the carousel at full scroll.
          paddingBottom: insets.bottom + 88,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Header t={t} router={router} insets={insets} />

        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 12,
            letterSpacing: 1.2,
            color: "#A9334D",
            marginBottom: 8,
          }}
        >
          {article.kicker}
        </Text>

        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 28,
            lineHeight: 34,
            color: t.text,
            marginBottom: 10,
          }}
        >
          {article.title}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 20,
          }}
        >
          <Clock size={13} color={t.textSecondary} />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: t.textSecondary,
            }}
          >
            {article.readTime} min read
          </Text>
        </View>

        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 16,
            lineHeight: 26,
            color: t.textSecondary,
          }}
        >
          {article.intro}
        </Text>

        {article.sections.map((section, i) => (
          <View key={i}>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 18,
                color: t.text,
                marginTop: 28,
                marginBottom: 8,
              }}
            >
              {section.heading}
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 16,
                lineHeight: 26,
                color: t.textSecondary,
              }}
            >
              {section.body}
            </Text>
            {section.bullets?.length > 0 && (
              <View style={{ marginTop: 10, gap: 10 }}>
                {section.bullets.map((bullet, j) => (
                  <View
                    key={j}
                    style={{ flexDirection: "row", gap: 10 }}
                  >
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 2.5,
                        backgroundColor: "#A9334D",
                        marginTop: 9,
                      }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: fonts.regular,
                        fontSize: 16,
                        lineHeight: 26,
                        color: t.textSecondary,
                      }}
                    >
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {article.callout && (
          <View
            style={{
              marginTop: 32,
              borderRadius: 16,
              backgroundColor: "#A9334D0D",
              borderWidth: 1,
              borderColor: "#A9334D22",
              padding: 18,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <AlertCircle size={16} color="#A9334D" />
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 15,
                  color: t.text,
                }}
              >
                {article.callout.title}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 14,
                lineHeight: 21,
                color: t.textSecondary,
              }}
            >
              {article.callout.body}
            </Text>
          </View>
        )}

        <Text
          style={{
            marginTop: 28,
            fontFamily: fonts.regular,
            fontSize: 12,
            color: t.textSecondary,
            opacity: 0.8,
          }}
        >
          This is general education, not medical advice. Always follow the
          plan you've agreed with your care team.
        </Text>

        {relatedArticles.length > 0 && (
          <View>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 19,
                color: t.text,
                marginTop: 36,
                marginBottom: 12,
              }}
            >
              Others you might like
            </Text>
            <View style={{ marginHorizontal: -20 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + 12}
                snapToAlignment="start"
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
                {relatedArticles.map((item) => (
                  <RelatedCard
                    key={item.topic}
                    item={item}
                    t={t}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      posthog?.capture("education_related_tapped", {
                        from_topic: topic,
                        to_topic: item.topic,
                      });
                      router.push(
                        `/education-article?topic=${item.topic}&from=related`,
                      );
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </Animated.ScrollView>

      <ScrollProgressPill
        progress={progress}
        readingTime={article.readTime}
        onReset={onReset}
        bottomOffset={insets.bottom + 16}
      />
    </View>
  );
}
