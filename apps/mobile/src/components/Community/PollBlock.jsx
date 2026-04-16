import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { fonts } from "@/utils/fonts";

export function PollBlock({ poll, votedOptionId, onVote }) {
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

                backgroundColor: isSelected ? "#FDF0F2" : "#F8F4F0",
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
                    : "rgba(9,51,44,0.07)",
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
                    color: isSelected ? "#A9334D" : "#09332C",
                  }}
                >
                  {option.text}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 13,
                    color: isSelected ? "#A9334D" : "#6B7280",
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
              backgroundColor: "#FAFAFA",
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
                  color: "#09332C",
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
                  borderColor: "#C4BAB7",
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
            color: "#9C8D8A",
            marginTop: 2,
          }}
        >
          {totalVotes.toLocaleString()} {totalVotes === 1 ? "vote" : "votes"}
        </Text>
      )}
    </View>
  );
}
