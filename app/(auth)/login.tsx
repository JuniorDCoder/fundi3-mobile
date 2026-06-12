import { useState } from "react";
import { Link, useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LogoFullLight } from "../../components/brand/Logo";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { TextField } from "../../components/ui/TextField";
import { brand, fonts } from "../../lib/theme/brand";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";

export default function LoginScreen() {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("toast.loginFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LogoFullLight height={36} />

        <View style={styles.headlineBlock}>
          <Text style={styles.headline}>{t("auth.login.title")}</Text>
          <Text style={styles.subhead}>{t("auth.login.subtitle")}</Text>
        </View>

        <GlassCard style={styles.card}>
          <TextField
            label={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextField
            label={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            placeholder={t("auth.passwordPlaceholder")}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label={submitting ? t("auth.signingIn") : t("auth.login.cta")}
            onPress={handleSubmit}
            loading={submitting}
            disabled={!email || !password}
          />
        </GlassCard>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{t("auth.noAccount")} </Text>
          <Link href="/(auth)/signup" style={styles.footerLink}>
            {t("auth.signupLink")}
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: brand.dark.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 32,
  },
  headlineBlock: { gap: 8 },
  headline: {
    fontFamily: fonts.headingSemibold,
    fontSize: 28,
    color: brand.white,
  },
  subhead: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: brand.dark.muted,
  },
  card: { gap: 16 },
  error: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: brand.amber[400],
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: brand.dark.muted,
  },
  footerLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.green[400],
  },
});
