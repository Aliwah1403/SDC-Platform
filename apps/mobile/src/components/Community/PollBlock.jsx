import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

export function PollBlock({ poll, votedOptionId, onVote }) {
  const t = useTheme();
  const hasVoted = votedOptionId != null;
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}>
      {poll.options.map((option) => {
        const isSelected = votedOptionId === option.id;
        const percentage =
          hasVoted && totalVotes > 0
            ? Math.round((option.votes / totalVotes) * 100)
            : 0;

        if (hasVoted) {
          return (
            <View
              key={option.id}
              style={{
                borderRadius: 10,

                backgroundColor: isSelected ? (t.isDark ? t.surfaceElevated : "#FDF0F2") : (t.isDark ? t.surfaceElevated : "#F8F4F0"),
                overflow: "hidden",
              }}
            >
              {/* Proportional fill bar behind the text */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${percentage}%`,
                  backgroundColor: isSelected
                    ? "rgba(169,51,77,0.18)"
                    : t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 15,
                  paddingHorizontal: 14,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontFamily: isSelected ? fonts.semibold : fonts.regular,
                    fontSize: 14,
                    color: isSelected ? "#A9334D" : t.text,
                  }}
                >
                  {option.text}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 13,
                    color: isSelected ? "#A9334D" : t.textSecondary,
                    minWidth: 38,
                    textAlign: "right",
                  }}
                >
                  {percentage}%
                </Text>
              </View>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => onVote(option.id)}
            activeOpacity={0.7}
            style={{
              borderRadius: 10,
              backgroundColor: t.isDark ? t.surfaceElevated : "#FAFAFA",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 15,
                paddingHorizontal: 14,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontFamily: fonts.regular,
                  fontSize: 14,
                  color: t.text,
                }}
              >
                {option.text}
              </Text>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 1.5,
                  borderColor: t.border,
                }}
              />
            </View>
          </TouchableOpacity>
        );
      })}

      {hasVoted && (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 12,
            color: t.textSecondary,
            marginTop: 2,
          }}
        >
          {totalVotes.toLocaleString()} {totalVotes === 1 ? "vote" : "votes"}
        </Text>
      )}
    </View>
  );
}
