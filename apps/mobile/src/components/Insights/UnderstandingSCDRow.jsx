import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Clock } from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { useEducationContentQuery } from "@/hooks/queries/useEducationContentQuery";
import { TOPIC_IMAGES } from "@/utils/educationTopicImages";
import { EducationCardBackground } from "@/components/EducationCardBackground";

// Surfaces the real education library (educationContent.js / Supabase) —
// cards route straight to their article via /education-article?topic=, same
// as the pattern-row education links.
const CARD_WIDTH = 160;
const CARD_HEIGHT = 130;

function MiniArticleCard({ article, onPress }) {
  const { fallbackColor } = TOPIC_IMAGES[article.topic] ?? {};
  const imageUrl = article.photoUrl ?? TOPIC_IMAGES[article.topic]?.imageUrl;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 16, overflow: "hidden" }}
    >
      <EducationCardBackground
        imageUrl={imageUrl}
        fallbackColor={fallbackColor}
        style={{ flex: 1, padding: 12, justifyContent: "flex-end" }}
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
          <Clock size={10} color="rgba(255,255,255,0.8)" strokeWidth={2} />
          <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
            {article.readTime} min
          </Text>
        </View>
        <Text
          style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#FFFFFF", lineHeight: 17 }}
          numberOfLines={2}
        >
          {article.title}
        </Text>
      </EducationCardBackground>
    </TouchableOpacity>
  );
}

export function UnderstandingSCDRow({ onPress }) {
  const t = useTheme();
  const router = useRouter();
  const { articles: articlesByTopic } = useEducationContentQuery();
  const articles = Object.values(articlesByTopic);

  return (
    <View>
      <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: t.text, marginBottom: 12 }}>
        Understanding SCD
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {articles.map((article) => (
          <MiniArticleCard
            key={article.topic}
            article={article}
            onPress={() => {
              onPress?.(article.topic);
              router.push(`/education-article?topic=${article.topic}&from=insights`);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}
