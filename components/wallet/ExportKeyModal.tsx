import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { AlertTriangle, Check, Copy, Eye, EyeOff, KeyRound, X } from "lucide-react-native";
import { Button } from "../ui/Button";
import { brand, fonts } from "../../lib/theme/brand";
import { exportWalletKey } from "../../lib/wallet/api";
import { useLanguage } from "../../hooks/useLanguage";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ExportKeyModal({ visible, onClose }: Props) {
  const { t } = useLanguage();

  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setPassword("");
    setSecretKey(null);
    setShowKey(false);
    setCopied(false);
    setError("");
    setLoading(false);
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const key = await exportWalletKey(password);
      setSecretKey(key);
    } catch {
      setError(t("wallet.exportInvalidPassword"));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!secretKey) return;
    await Clipboard.setStringAsync(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBubble}>
                <KeyRound color={brand.amber[400]} size={18} />
              </View>
              <Text style={styles.title}>
                {secretKey ? t("wallet.exportRevealedTitle") : t("wallet.exportTitle")}
              </Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12}>
              <X color={brand.dark.muted} size={20} />
            </Pressable>
          </View>

          {!secretKey ? (
            <>
              <Text style={styles.subtitle}>{t("wallet.exportDesc")}</Text>

              <View style={styles.warningBox}>
                <AlertTriangle color="#fca5a5" size={14} />
                <Text style={styles.warningText}>{t("wallet.exportWarning")}</Text>
              </View>

              <Text style={styles.label}>{t("wallet.exportPasswordLabel")}</Text>
              <TextInput
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError("");
                }}
                placeholder={t("wallet.exportPasswordPlaceholder")}
                placeholderTextColor={brand.dark.muted}
                secureTextEntry
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                style={[styles.input, error ? styles.inputError : null]}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.buttonRow}>
                <Button label={t("wallet.exportCancel")} variant="ghost" onPress={handleClose} style={{ flex: 1 }} />
                <Button
                  label={loading ? t("wallet.exportConfirming") : t("wallet.exportConfirm")}
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={password.length === 0}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.warningBox}>
                <AlertTriangle color="#fca5a5" size={14} />
                <Text style={styles.warningText}>{t("wallet.exportRevealedWarning")}</Text>
              </View>

              <View style={styles.keyBox}>
                <Text style={styles.keyText} selectable={showKey}>
                  {showKey ? secretKey : "•".repeat(48)}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <Pressable onPress={() => setShowKey((v) => !v)} style={styles.secondaryBtn}>
                  {showKey ? (
                    <EyeOff size={14} color={brand.dark.muted} />
                  ) : (
                    <Eye size={14} color={brand.dark.muted} />
                  )}
                  <Text style={styles.secondaryBtnText}>{showKey ? t("wallet.hide") : t("wallet.show")}</Text>
                </Pressable>
                <Pressable onPress={handleCopy} style={styles.copyBtn}>
                  {copied ? (
                    <Check size={14} color={brand.green[100]} />
                  ) : (
                    <Copy size={14} color={brand.green[400]} />
                  )}
                  <Text style={[styles.copyBtnText, copied && styles.copyBtnTextCopied]}>
                    {copied ? t("wallet.copied") : t("wallet.copyKey")}
                  </Text>
                </Pressable>
              </View>

              <Button label={t("wallet.done")} onPress={handleClose} />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: brand.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: brand.dark.border,
    padding: 24,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,159,39,0.12)",
  },
  title: {
    fontFamily: fonts.headingSemibold,
    fontSize: 18,
    color: brand.white,
    flexShrink: 1,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: brand.dark.muted,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    backgroundColor: "rgba(239,68,68,0.06)",
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: "#fca5a5",
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.white,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: brand.white,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#ef4444",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  keyBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
    backgroundColor: brand.dark.bg,
    padding: 14,
  },
  keyText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    color: brand.green[100],
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
  },
  secondaryBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.dark.muted,
  },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(15,110,86,0.15)",
  },
  copyBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.green[400],
  },
  copyBtnTextCopied: {
    color: brand.green[100],
  },
});
