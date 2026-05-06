import { ScrollView, TouchableOpacity, Text } from "react-native";
import {
  LayoutGrid,
  Trophy,
  Lightbulb,
  HelpCircle,
  HeartPulse,
  BookOpen,
  FlaskConical,
} from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

export const COMMUNITY_CATEGORIES = [
  { id: "all", label: "All", Icon: LayoutGrid },
  { id: "wins", label: "Wins", Icon: Trophy },
  { id: "tips", label: "Tips", Icon: Lightbulb },
  { id: "questions", label: "Questions", Icon: HelpCircle },
  { id: "pain", label: "Pain & Treatment", Icon: HeartPulse },
  { id: "new", label: "New to SCD", Icon: BookOpen },
  { id: "research", label: "Research", Icon: FlaskConical },
];

export function CategoryFilter({ active, onSelect }) {
  const t = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        alignItems: "center",
      }}
      style={{ backgroundColor: t.background, flexGrow: 0 }}
    >
      {COMMUNITY_CATEGORIES.map((cat) => {
        const isActive = active === cat.id;
        const { Icon } = cat;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            activeOpacity={0.75}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: isActive ? "#A9334D" : t.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isActive ? "#A9334D" : t.border,
              paddingHorizontal: 13,
              height: 34,
            }}
          >
            <Icon
              size={13}
              color={isActive ? "#F8E9E7" : t.text}
              strokeWidth={2}
            />
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.semibold,
                fontSize: 13,
                lineHeight: 17,
                includeFontPadding: false,
                color: isActive ? "#F8E9E7" : t.text,
              }}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
