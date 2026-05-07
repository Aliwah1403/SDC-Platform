import { View, Text, TouchableOpacity } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Check, Pill } from "lucide-react-native";
import { useRouter } from "expo-router";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

function RingProgress({ taken, total }) {
  const t = useTheme();
  const SIZE = 76;
  const SW = 6;
  const r = (SIZE - SW) / 2;
  const circ = 2 * Math.PI * r;
  const offset = total > 0 ? circ * (1 - taken / total) : circ;

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
      <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={r} stroke={t.border} strokeWidth={SW} fill="none" />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          stroke="#A9334D"
          strokeWidth={SW}
          fill="none"
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: t.text, lineHeight: 26 }}>
          {taken}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: t.textSecondary }}>
          of {total}
        </Text>
      </View>
    </View>
  );
}

function StatusPill({ label, color, bg }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color }}>{label}</Text>
    </View>
  );
}

function MedRow({ med, isLast }) {
  const t = useTheme();
  const taken = med.taken;
  const timeStr = med.time ?? med.nextDose ?? null;
  const detail = [timeStr, med.dosage, med.type].filter(Boolean).join(" · ");

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: taken ? "#A9334D" : "#F8E9E7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {taken ? (
            <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
          ) : (
            <Pill size={18} color="#A9334D" strokeWidth={2} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 14,
              color: t.text,
              marginBottom: 2,
            }}
          >
            {med.name}
          </Text>
          {detail.length > 0 && (
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textSecondary }}>
              {detail}
            </Text>
          )}
        </View>

        {taken ? (
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#A9334D" }}>Done</Text>
        ) : timeStr ? (
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#781D11" }}>Due →</Text>
        ) : (
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#D1D5DB" }}>—</Text>
        )}
      </View>
      {!isLast && <View style={{ height: 1, backgroundColor: t.border, marginLeft: 54 }} />}
    </View>
  );
}

export function MedicationCard({ medications }) {
  const router = useRouter();
  const t = useTheme();

  if (!medications || medications.length === 0) return null;

  const active = medications.filter((m) => m.isActive !== false);
  if (active.length === 0) return null;

  const takenCount = active.filter((m) => m.taken).length;
  const remaining = active.length - takenCount;

  const dueWithTime = active.filter((m) => !m.taken && (m.time || m.nextDose));
  const anytimeMeds = active.filter((m) => !m.taken && !m.time && !m.nextDose);
  const nextDueTime = dueWithTime[0]?.time ?? dueWithTime[0]?.nextDose ?? null;

  const displayed = active.slice(0, 3);
  const extraCount = active.length - displayed.length;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => router.push("/care/medications")}
      style={{
        backgroundColor: t.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: t.border,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          padding: 16,
          paddingBottom: 12,
        }}
      >
        <RingProgress taken={takenCount} total={active.length} />

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 17,
              color: t.text,
              marginBottom: 3,
            }}
          >
            Medications Today
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: t.textSecondary,
              marginBottom: 10,
            }}
          >
            {takenCount} taken · {remaining} remaining
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {takenCount > 0 && (
              <StatusPill label="Done" color="#A9334D" bg="#F8E9E7" />
            )}
            {nextDueTime && (
              <StatusPill label={`Due ${nextDueTime}`} color="#781D11" bg="#FFF0ED" />
            )}
            {anytimeMeds.length > 0 && (
              <StatusPill label="Anytime" color="#9CA3AF" bg="#F5F5F5" />
            )}
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: t.border, marginHorizontal: 16 }} />

      {/* Medication list */}
      <View style={{ paddingHorizontal: 16 }}>
        {displayed.map((med, i) => (
          <MedRow
            key={med.id}
            med={med}
            isLast={i === displayed.length - 1 && extraCount === 0}
          />
        ))}
        {extraCount > 0 && (
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: "#A9334D" }}>
              +{extraCount} more →
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
