import React from "react";
import { View, Text } from "react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

function Divider() {
  const t = useTheme();
  return (
    <View style={{ height: 1, backgroundColor: t.divider, marginLeft: 54 }} />
  );
}

export function SectionCard({ title, children }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 24 }}>
      {title ? (
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 11,
            color: t.textSecondary,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            marginBottom: 6,
            marginLeft: 4,
          }}
        >
          {title}
        </Text>
      ) : null}
      <View
        style={{
          backgroundColor: t.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: t.border,
          overflow: "hidden",
        }}
      >
        {React.Children.map(children, (child, i) => {
          if (!child) return null;
          const isLast = i === React.Children.count(children) - 1;
          return (
            <>
              {child}
              {!isLast && <Divider />}
            </>
          );
        })}
      </View>
    </View>
  );
}
