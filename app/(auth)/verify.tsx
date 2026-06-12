import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { LogoFullLight } from "../../components/brand/Logo";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { TextField } from "../../components/ui/TextField";
import { brand, fonts } from "../../lib/theme/brand";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";

export default function VerifyScreen() {
  const { t } = useLanguage();
  const { verifyOtp, resendVerification } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? "";

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleVerify = async () => {
    setError(null);
    setResendMessage(null);
    setVerifying(true);
    try {
      await verifyOtp(email, code.trim());
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.verify.invalidCode"));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendMessage(null);
    setResending(true);
    try {
      await resendVerification(email);
      setResendMessage(t("toast.codeResentDesc"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("toast.resendFailed"));
    } finally {
      setResending(false);
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
          <Text style={styles.headline}>{t("auth.verify.title")}</Text>
          <Text style={styles.subhead}>
            {t("auth.verify.sent")} {email}
          </Text>
          <Text style={styles.subhead}>{t("auth.verify.instructions")}</Text>
        </View>

        <GlassCard style={styles.card}>
          <TextField
            label={t("auth.verify.codeLabel")}
            value={code}
            onChangeText={setCode}
            placeholder={t("auth.verify.codePlaceholder")}
            keyboardType="number-pad"
            maxLength={8}
            style={styles.codeInput}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {resendMessage ? <Text style={styles.success}>{resendMessage}</Text> : null}

          <Button
            label={verifying ? t("auth.verify.verifying") : t("auth.verify.submit")}
            onPress={handleVerify}
            loading={verifying}
            disabled={code.trim().length < 6}
          />
          <Button
            label={t("auth.verify.resend")}
            variant="ghost"
            onPress={handleResend}
            loading={resending}
          />
        </GlassCard>
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
  codeInput: {
    fontFamily: fonts.mono,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: "center",
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: brand.amber[400],
  },
  success: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: brand.green[400],
  },
});
