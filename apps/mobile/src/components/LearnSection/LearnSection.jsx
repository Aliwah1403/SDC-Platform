import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Clock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { mockArticles } from "@/types";
import { fonts } from "@/utils/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 220;

const CATEGORY_LABEL = {
  treatment: "Treatment",
  nutrition: "Nutrition",
  exercise: "Exercise",
  "mental-health": "Mental Health",
  education: "Education",
};

function ArticleCard({ article, onPress }) {
  const label = CATEGORY_LABEL[article.category] ?? "Wellness";

  const content = (
    <LinearGradient
      colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.82)"]}
      locations={[0, 0.45, 1]}
      style={{
        flex: 1,
        borderRadius: 20,
        padding: 20,
        justifyContent: "flex-end",
      }}
    >
      {/* Read time */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 10,
          gap: 5,
        }}
      >
        <Clock size={12} color="rgba(255,255,255,0.75)" strokeWidth={2} />
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 12,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          {article.readTime} min read
        </Text>
      </View>

      {/* Title */}
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: 22,
          color: "#FFFFFF",
          lineHeight: 28,
          marginBottom: 8,
        }}
        numberOfLines={2}
      >
        {article.title}
      </Text>

      {/* Summary */}
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 13,
          color: "rgba(255,255,255,0.80)",
          lineHeight: 19,
        }}
        numberOfLines={2}
      >
        {article.summary}
      </Text>
    </LinearGradient>
  );

  const cardStyle = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}
    >
      {article.imageUrl ? (
        <ImageBackground
          source={{ uri: article.imageUrl }}
          style={cardStyle}
          imageStyle={{ borderRadius: 20 }}
        >
          {content}
        </ImageBackground>
      ) : (
        <View style={[cardStyle, { backgroundColor: article.fallbackColor ?? "#09332C" }]}>
          {content}
        </View>
      )}
    </TouchableOpacity>
  );
}

export function LearnSection() {
  const router = useRouter();
  const goToLearn = () => router.push("/(tabs)/learn");

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Section header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          marginBottom: 14,
        }}
      >
        <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: "#09332C" }}>
          Learn About Sickle Cell
        </Text>
        <TouchableOpacity
          onPress={goToLearn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#F0531C" }}>
            See all
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full-width paging carousel */}
      <FlatList
        data={mockArticles}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <ArticleCard article={item} onPress={goToLearn} />
        )}
        // Dot indicator spacing hint
        style={{ marginBottom: 10 }}
      />
    </View>
  );
}
