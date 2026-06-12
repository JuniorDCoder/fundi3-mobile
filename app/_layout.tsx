import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
} from "@expo-google-fonts/space-grotesk";
import { useFonts as useInter, Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import { useFonts as useJetBrainsMono, JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import { Toaster } from "sonner-native";
import { brand } from "../lib/theme/brand";

export default function RootLayout() {
  const [spaceGroteskLoaded] = useSpaceGrotesk({ SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium });
  const [jetBrainsMonoLoaded] = useJetBrainsMono({ JetBrainsMono_400Regular });

  const fontsLoaded = spaceGroteskLoaded && interLoaded && jetBrainsMonoLoaded;

  useEffect(() => {
    // Fonts load fast on-device; a brief unstyled flash before they're ready
    // is acceptable here rather than pulling in expo-splash-screen.
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: brand.dark.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: brand.dark.bg },
          }}
        />
        <Toaster theme="dark" richColors />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
