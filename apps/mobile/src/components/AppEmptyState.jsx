import { View, Text } from "react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

export default function AppEmptyState({
  Icon,
  title,
  subtitle,
  children,
  style,
}) {
  const t = useTheme();

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
          paddingVertical: 60,
        },
        style,
      ]}
    >
      {Icon ? (
        <View style={{ marginBottom: 20 }}>
          <Icon size={56} color={t.textSecondary} strokeWidth={1.5} />
        </View>
      ) : null}
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: 18,
          color: t.text,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 14,
            color: t.textSecondary,
            textAlign: "center",
            lineHeight: 21,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
