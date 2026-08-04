import { View, Text, Dimensions } from "react-native";
import { Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { fonts } from "@/utils/fonts";
import { colors } from "@/utils/colors";
import { isNewArticle } from "@/utils/educationContent";
import { TOPIC_IMAGES } from "@/utils/educationTopicImages";
import { EducationCardBackground } from "@/components/EducationCardBackground";
import { PressableScale } from "@/components/PressableScale";

export const LIBRARY_CARD_HEIGHT = 190;

// Shared 2-up sizing for the Learn tab and category "See All" grid — kept
// here so both screens size cards identically.
const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const LIBRARY_H_PADDING = 20;
export const LIBRARY_CARD_GAP = 12;
export const LIBRARY_CARD_WIDTH = (SCREEN_WIDTH - LIBRARY_H_PADDING * 2 - LIBRARY_CARD_GAP) / 2;

// 2-up illustrated card for the education library (Learn tab + category "See
// All" screen) — same photo-background grammar as the article screen's
// RelatedCard and the Insights UnderstandingSCDRow, sized for a 2-column
// grid instead of a 220-wide horizontal carousel.
export function LibraryCard({ article, width, onPress }) {
  const { imageUrl, fallbackColor } = TOPIC_IMAGES[article.topic] ?? {};
  const isNew = isNewArticle(article);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <PressableScale
      onPress={handlePress}
      style={{ width, height: LIBRARY_CARD_HEIGHT, borderRadius: 16, overflow: "hidden" }}
    >
      <EducationCardBackground
        imageUrl={imageUrl}
        fallbackColor={fallbackColor}
        style={{ flex: 1, padding: 14, justifyContent: "flex-end" }}
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
        {isNew && (
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: colors.orange,
              borderRadius: 8,
              paddingHorizontal: 7,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 9,
                letterSpacing: 0.6,
                color: "#FFFFFF",
              }}
            >
              NEW
            </Text>
          </View>
        )}
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 10,
            letterSpacing: 0.8,
            color: "rgba(255,255,255,0.8)",
            marginBottom: 6,
          }}
          numberOfLines={1}
        >
          {article.kicker}
        </Text>
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 15,
            color: "#FFFFFF",
            lineHeight: 19,
            marginBottom: 8,
          }}
          numberOfLines={2}
        >
          {article.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Clock size={11} color="rgba(255,255,255,0.8)" />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 11,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {article.readTime} min read
          </Text>
        </View>
      </EducationCardBackground>
    </PressableScale>
  );
}
