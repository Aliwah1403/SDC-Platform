import { Stack } from "expo-router";
import { useSavedFacilitiesQuery } from "@/hooks/queries/useSavedFacilitiesQuery";

export default function CareLayout() {
  useSavedFacilitiesQuery(); // pre-fetch so all care screens have it on mount
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="medications" />
      <Stack.Screen name="appointments" />
      <Stack.Screen name="emergency" />
      <Stack.Screen name="care-team" />
      <Stack.Screen name="crisis-plan" />
      <Stack.Screen name="facilities" />
    </Stack>
  );
}
