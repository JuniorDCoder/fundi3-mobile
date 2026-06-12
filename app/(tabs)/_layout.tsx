import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { BookOpen, Home, User } from "lucide-react-native";
import { brand, fonts } from "../../lib/theme/brand";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";

export default function TabsLayout() {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: brand.dark.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={brand.green[400]} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: brand.dark.surface,
          borderTopColor: brand.dark.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: brand.green[400],
        tabBarInactiveTintColor: brand.dark.muted,
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.dashboard"),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="courses/index"
        options={{
          title: t("nav.courses"),
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("nav.profile"),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
