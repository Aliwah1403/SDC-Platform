import { useRef, useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

const WEEKS_BACK = 12;
const WEEKS_FORWARD = 1;

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  // Shift to Monday (0=Sun → go back 6, 1=Mon → stay, etc.)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function generateWeeks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonday = getWeekStart(today);
  const weeks = [];

  for (let i = -WEEKS_BACK; i <= WEEKS_FORWARD; i++) {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(currentMonday.getDate() + i * 7);
    const week = [];
    for (let j = 0; j < 7; j++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + j);
      week.push(day);
    }
    weeks.push(week);
  }

  return weeks;
}

function DayItem({ date, selectedDate, setSelectedDate, isToday, isFuture, isSelected, dayIndex }) {
  const future = isFuture(date);
  const selected = isSelected(date, selectedDate);
  const todayDate = isToday(date);

  return (
    <TouchableOpacity
      onPress={() => !future && setSelectedDate(date)}
      disabled={future}
      style={{
        width: SCREEN_WIDTH / 7,
        alignItems: "center",
        paddingVertical: 8,
        opacity: future ? 0.35 : 1,
      }}
    >
      {/* Day label: TODAY or single letter */}
      <Text
        style={{
          fontSize: todayDate ? 9 : 11,
          fontWeight: "700",
          color: "rgba(255, 255, 255, 0.72)",
          marginBottom: 6,
          letterSpacing: todayDate ? 0.8 : 0,
        }}
      >
        {todayDate ? "TODAY" : DAY_LETTERS[dayIndex]}
      </Text>

      {/* Date number: white filled circle when selected */}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: selected ? "#F0531C" : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: "#FFFFFF",
          }}
        >
          {date.getDate()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function DatePicker({ selectedDate, setSelectedDate, isToday, isFuture, isSelected }) {
  const flatListRef = useRef(null);
  const weeks = useMemo(() => generateWeeks(), []);

  const renderWeek = ({ item: week }) => (
    <View style={{ width: SCREEN_WIDTH, flexDirection: "row" }}>
      {week.map((date, dayIndex) => (
        <DayItem
          key={date.toISOString()}
          date={date}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isToday={isToday}
          isFuture={isFuture}
          isSelected={isSelected}
          dayIndex={dayIndex}
        />
      ))}
    </View>
  );

  return (
    <FlatList
      ref={flatListRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      data={weeks}
      renderItem={renderWeek}
      keyExtractor={(_, index) => String(index)}
      initialScrollIndex={WEEKS_BACK}
      getItemLayout={(_, index) => ({
        length: SCREEN_WIDTH,
        offset: SCREEN_WIDTH * index,
        index,
      })}
      style={{ flexGrow: 0 }}
    />
  );
}
