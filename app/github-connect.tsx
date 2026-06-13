import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { X } from "lucide-react-native";
import { brand, fonts } from "../lib/theme/brand";
import { useLanguage } from "../hooks/useLanguage";
import { supabase } from "../lib/supabase/client";

const appUrl = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function GithubConnectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) {
        router.back();
        return;
      }
      const params = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      setUri(`${appUrl}/connect/github?${params.toString()}`);
    });
  }, [router]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("settings.githubTitle")}</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={8}>
          <X size={20} color={brand.white} />
        </Pressable>
      </View>
      {uri ? (
        <WebView
          source={{ uri }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={brand.green[400]} />
            </View>
          )}
          onNavigationStateChange={(navState) => {
            if (navState.url.includes("/dashboard/settings") && navState.url.includes("github=connected")) {
              router.back();
            }
          }}
        />
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator color={brand.green[400]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.dark.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: brand.dark.border,
  },
  title: {
    flex: 1,
    fontFamily: fonts.headingSemibold,
    fontSize: 16,
    color: brand.white,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  webview: {
    flex: 1,
    backgroundColor: brand.dark.bg,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
