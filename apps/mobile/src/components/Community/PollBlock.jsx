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

        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => onVote(option.id)}
            activeOpacity={0.7}
            style={{
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: isSelected ? "#A9334D" : "#E2D9D6",
              backgroundColor: isSelected ? "#FDF0F2" : "#FAFAFA",
              overflow: "hidden",
            }}
          >
            {/* Progress bar fill (behind content, only after voting) */}
            {hasVoted && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${percentage}%`,
                  backgroundColor: isSelected
                    ? "rgba(169,51,77,0.1)"
                    : "rgba(9,51,44,0.05)",
                }}
              />
            )}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                paddingRight: 14,
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

              {hasVoted ? (
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 13,
                    color: isSelected ? "#A9334D" : "#6B7280",
                    minWidth: 36,
                    textAlign: "right",
                  }}
                >
                  {percentage}%
                </Text>
              ) : (
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 1.5,
                    borderColor: "#D1C9C6",
                  }}
                />
              )}
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
