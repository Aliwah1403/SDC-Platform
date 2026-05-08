import { View } from "react-native";
import { MedicationCard } from "./MedicationCard";
import { AppointmentSection } from "./AppointmentSection";
import { ContextualCardsSkeleton } from "./ContextualCardsSkeleton";

export function ContextualCards({ appointments = [], medications = [], isLoading = false }) {
  if (isLoading) return <ContextualCardsSkeleton />;

  const hasMedications = medications.length > 0;
  const hasAppointments = appointments.length > 0;

  if (!hasMedications && !hasAppointments) return null;

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 16, gap: 16 }}>
      {hasAppointments && <AppointmentSection appointments={appointments} />}
      {hasMedications && <MedicationCard medications={medications} />}
    </View>
  );
}
