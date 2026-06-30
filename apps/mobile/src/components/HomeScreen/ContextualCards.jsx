import { View } from "react-native";
import { AppointmentSection } from "./AppointmentSection";
import { ContextualCardsSkeleton } from "./ContextualCardsSkeleton";

export function ContextualCards({ appointments = [], isLoading = false }) {
  if (isLoading) return <ContextualCardsSkeleton />;

  if (appointments.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 16, gap: 16 }}>
      <AppointmentSection appointments={appointments} />
    </View>
  );
}
