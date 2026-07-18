import { View, Text, TouchableOpacity, ScrollView, ImageBackground } from "react-native";
import { Clock } from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { mockArticles } from "@/types";

// Interim home for education content while the Learn tab is hidden
// ((tabs)/_layout.jsx sets href: null). Self-contained so it can be
// relocated by moving one import if the Learn tab is later repurposed.
const CARD_WIDTH = 160;
const CARD_HEIGHT = 130;

function MiniArticleCard({ article, onPress }) {
  const content = (
    <View
      style={{
        flex: 1,
        borderRadius: 16,
        padding: 12,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.35)",
      }}
    >
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
    </View>
  );

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 16, overflow: "hidden" }}>
      {article.imageUrl ? (
        <ImageBackground source={{ uri: article.imageUrl }} style={{ flex: 1 }}>
          {content}
        </ImageBackground>
      ) : (
        <View style={{ flex: 1, backgroundColor: article.fallbackColor ?? "#781D11" }}>{content}</View>
      )}
    </TouchableOpacity>
  );
}

export function UnderstandingSCDRow({ onPress }) {
  const t = useTheme();
  const articles = mockArticles.slice(0, 4);

  return (
    <View>
      <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: t.text, marginBottom: 12 }}>
        Understanding SCD
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {articles.map((article) => (
          <MiniArticleCard key={article.id} article={article} onPress={onPress} />
        ))}
      </ScrollView>
    </View>
  );
}
