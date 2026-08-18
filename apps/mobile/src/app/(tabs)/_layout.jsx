import { Tabs } from "expo-router";
import {
  Home,
  TrendingUp,
  Users,
  HeartHandshake,
  BookOpen,
} from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { ObserveInteractive } from "@/components/ObserveInteractive";

export default function TabLayout() {
  const theme = useTheme();
  return (
    <>
    <ObserveInteractive />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopWidth: 1,
          borderColor: theme.border,
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: theme.tabActiveText,
        tabBarInactiveTintColor: theme.tabInactiveText,
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: "Track",
          tabBarIcon: ({ color }) => <TrendingUp color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) => <BookOpen color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: "Care",
          tabBarIcon: ({ color }) => <HeartHandshake color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color }) => <Users color={color} size={20} />,
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="rewards" options={{ href: null }} />
    </Tabs>
    </>
  );
}
