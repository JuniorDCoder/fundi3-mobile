import { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AlertTriangle, Check, ExternalLink, Send as SendIcon, X } from "lucide-react-native";
import { Button } from "../ui/Button";
import { brand, fonts } from "../../lib/theme/brand";
import { sendTransfer, type SendResult } from "../../lib/wallet/api";
import { useLanguage } from "../../hooks/useLanguage";

interface Props {
  visible: boolean;
  onClose: () => void;
  availableSol: number | null;
  onSuccess: () => void;
}

// Reserve a little extra above the requested amount to cover the network fee.
const FEE_BUFFER_SOL = 0.00001;

const ERROR_KEYS: Record<string, string> = {
  invalid_recipient: "wallet.sendErrorInvalidRecipient",
  invalid_amount: "wallet.sendErrorInvalidAmount",
  insufficient_balance: "wallet.sendErrorInsufficientBalance",
  self_transfer: "wallet.sendErrorSelfTransfer",
  invalid_password: "wallet.sendErrorInvalidPassword",
};

export function SendModal({ visible, onClose, availableSol, onSuccess }: Props) {
  const { t } = useLanguage();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SendResult | null>(null);

  const handleClose = () => {
    setRecipient("");
    setAmount("");
    setPassword("");
    setError("");
    setLoading(false);
    setResult(null);
    onClose();
  };

  const handleSendAnother = () => {
    setRecipient("");
    setAmount("");
    setPassword("");
    setError("");
    setResult(null);
  };

  const handleMax = () => {
    if (availableSol === null) return;
    const max = Math.max(availableSol - FEE_BUFFER_SOL, 0);
    setAmount(max.toString());
  };

  const handleSubmit = async () => {
    setError("");

    const amountSol = parseFloat(amount);
    if (!recipient.trim()) {
      setError(t("wallet.sendErrorInvalidRecipient"));
      return;
    }
    if (!Number.isFinite(amountSol) || amountSol <= 0) {
      setError(t("wallet.sendErrorInvalidAmount"));
      return;
    }

    setLoading(true);
    try {
      const res = await sendTransfer(recipient.trim(), amountSol, password);
      setResult(res);
      onSuccess();
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setError(t(ERROR_KEYS[code] ?? "wallet.sendErrorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBubble}>
                <SendIcon color={brand.green[400]} size={18} />
              </View>
              <Text style={styles.title}>
                {result ? t("wallet.sendSuccessTitle") : t("wallet.sendTitle")}
              </Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12}>
              <X color={brand.dark.muted} size={20} />
            </Pressable>
          </View>

          {!result ? (
            <>
              <Text style={styles.subtitle}>{t("wallet.sendDesc")}</Text>

              <Text style={styles.label}>{t("wallet.recipientLabel")}</Text>
              <TextInput
                value={recipient}
                onChangeText={(v) => {
                  setRecipient(v);
                  setError("");
                }}
                placeholder={t("wallet.recipientPlaceholder")}
                placeholderTextColor={brand.dark.muted}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.inputMono}
              />

              <View style={styles.amountRow}>
                <Text style={styles.label}>{t("wallet.amountLabel")}</Text>
                {availableSol !== null && (
                  <Text style={styles.availableText}>
                    {t("wallet.amountAvailable", {
                      amount: availableSol.toLocaleString(undefined, { maximumFractionDigits: 4 }),
                    })}
                  </Text>
                )}
              </View>
              <View style={styles.amountInputRow}>
                <View style={styles.amountInputWrap}>
                  <TextInput
                    value={amount}
                    onChangeText={(v) => {
                      setAmount(v);
                      setError("");
                    }}
                    placeholder="0.00"
                    placeholderTextColor={brand.dark.muted}
                    keyboardType="decimal-pad"
                    style={styles.amountInput}
                  />
                  <Text style={styles.amountUnit}>SOL</Text>
                </View>
                <Pressable onPress={handleMax} disabled={availableSol === null} style={styles.maxBtn}>
                  <Text style={styles.maxBtnText}>{t("wallet.sendMax")}</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>{t("wallet.sendPasswordLabel")}</Text>
              <TextInput
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError("");
                }}
                placeholder={t("wallet.exportPasswordPlaceholder")}
                placeholderTextColor={brand.dark.muted}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                style={styles.input}
              />

              <View style={styles.warningBox}>
                <AlertTriangle color={brand.amber[400]} size={14} />
                <Text style={styles.warningText}>{t("wallet.sendWarning")}</Text>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.buttonRow}>
                <Button label={t("wallet.sendCancel")} variant="ghost" onPress={handleClose} style={{ flex: 1 }} />
                <Button
                  label={loading ? t("wallet.sendConfirming") : t("wallet.sendConfirm")}
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={!recipient.trim() || !amount || !password}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.successBox}>
                <View style={styles.successIconBubble}>
                  <Check color={brand.green[100]} size={16} />
                </View>
                <Text style={styles.successText}>{t("wallet.sendSuccess")}</Text>
              </View>

              <Pressable onPress={() => Linking.openURL(result.explorerUrl)} style={styles.secondaryBtn}>
                <ExternalLink size={14} color={brand.white} />
                <Text style={styles.secondaryBtnText}>{t("wallet.sendViewTx")}</Text>
              </Pressable>

              <View style={styles.buttonRow}>
                <Button label={t("wallet.sendAnother")} variant="ghost" onPress={handleSendAnother} style={{ flex: 1 }} />
                <Button label={t("wallet.done")} onPress={handleClose} style={{ flex: 1 }} />
              </View>
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
    gap: 12,
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
    backgroundColor: "rgba(15,110,86,0.18)",
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
  inputMono: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 14,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: brand.white,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  availableText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: brand.dark.muted,
  },
  amountInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  amountInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 14,
  },
  amountInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: brand.white,
    height: "100%",
  },
  amountUnit: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: brand.dark.muted,
  },
  maxBtn: {
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
    alignItems: "center",
    justifyContent: "center",
  },
  maxBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: brand.green[400],
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,159,39,0.2)",
    backgroundColor: "rgba(239,159,39,0.06)",
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: brand.amber[100],
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
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.25)",
    backgroundColor: "rgba(15,110,86,0.08)",
    padding: 14,
  },
  successIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,110,86,0.2)",
  },
  successText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: brand.green[100],
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
  },
  secondaryBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.white,
  },
});
