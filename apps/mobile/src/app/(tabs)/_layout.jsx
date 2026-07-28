import { NativeTabs } from "expo-router/unstable-native-tabs";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

export default function TabLayout() {
  const theme = useTheme();
  return (
    <NativeTabs
      backgroundColor={theme.tabBarBackground}
      tintColor={theme.tabActiveText}
      iconColor={{ default: theme.tabInactiveText, selected: theme.tabActiveText }}
      labelStyle={{
        default: { fontFamily: fonts.semibold, fontSize: 10, color: theme.tabInactiveText },
        selected: { fontFamily: fonts.semibold, fontSize: 10, color: theme.tabActiveText },
      }}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="track">
        <NativeTabs.Trigger.Icon sf="chart.line.uptrend.xyaxis" md="trending_up" />
        <NativeTabs.Trigger.Label>Track</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {/* Learn tab hidden — direction TBD */}
      <NativeTabs.Trigger name="learn" hidden />
      <NativeTabs.Trigger name="care">
        <NativeTabs.Trigger.Icon sf={{ default: "cross.case", selected: "cross.case.fill" }} md="medical_services" />
        <NativeTabs.Trigger.Label>Care</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="community">
        <NativeTabs.Trigger.Icon sf={{ default: "person.2", selected: "person.2.fill" }} md="group" />
        <NativeTabs.Trigger.Label>Community</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
