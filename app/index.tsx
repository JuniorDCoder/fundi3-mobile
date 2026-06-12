import { useEffect } from "react";
import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LogoFullLight } from "../components/brand/Logo";
import { Button } from "../components/ui/Button";
import { brand, fonts } from "../lib/theme/brand";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";

export default function WelcomeScreen() {
  const { isAuthenticated, loading } = useAuth();
  const { t, lang, toggleLanguage } = useLanguage();
  const router = useRouter();

  useEffect(() => {}, []);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <LogoFullLight height={32} />
        <ActivityIndicator color={brand.green[400]} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <LinearGradient
      colors={[brand.dark.bg, brand.green[900], brand.dark.bg]}
      style={styles.screen}
    >
      <Pressable onPress={toggleLanguage} style={styles.langToggle} hitSlop={12}>
        <Text style={styles.langToggleText}>{lang === "fr" ? "EN" : "FR"}</Text>
      </Pressable>

      <View style={styles.content}>
        <LogoFullLight height={40} />

        <View style={styles.headlineBlock}>
          <Text style={styles.headline}>
            {lang === "fr" ? "Web3, Enfin Clair." : "Web3, Finally Clear."}
          </Text>
          <Text style={styles.subhead}>
            {lang === "fr"
              ? "La première plateforme Web3 conçue pour l'Afrique."
              : "The first Web3 platform built for Africa."}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button label={t("auth.createFree")} onPress={() => router.push("/(auth)/signup")} />
          <Button
            label={t("auth.signIn")}
            variant="ghost"
            onPress={() => router.push("/(auth)/login")}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: brand.dark.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  screen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  langToggle: {
    alignSelf: "flex-end",
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  langToggleText: {
    fontFamily: fonts.bodyMedium,
    color: brand.white,
    fontSize: 13,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 40,
  },
  headlineBlock: {
    gap: 12,
  },
  headline: {
    fontFamily: fonts.headingSemibold,
    fontSize: 36,
    lineHeight: 42,
    color: brand.white,
  },
  subhead: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: brand.dark.muted,
  },
  actions: {
    gap: 12,
  },
});
