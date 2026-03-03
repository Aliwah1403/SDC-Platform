import { Stack } from "expo-router";

export default function CareLayout() {
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
