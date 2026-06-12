import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from "react-native";
import { X } from "lucide-react-native";
import { Button } from "../ui/Button";
import { brand, fonts } from "../../lib/theme/brand";
import { saveUserProfile } from "../../lib/certificates/api";
import { useLanguage } from "../../hooks/useLanguage";

interface Props {
  visible: boolean;
  onSaved: (displayName: string) => void;
  onDismiss: () => void;
}

export function NameModal({ visible, onSaved, onDismiss }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError(t("cert.nameError"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const profile = await saveUserProfile(trimmed);
      onSaved(profile.displayName);
    } catch {
      setError(t("cert.nameErrorSave"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("cert.nameTitle")}</Text>
            <Pressable onPress={onDismiss} hitSlop={12}>
              <X color={brand.dark.muted} size={20} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>{t("cert.nameSubtitle")}</Text>

          <TextInput
            value={name}
            onChangeText={(v) => { setName(v); setError(""); }}
            placeholder={t("cert.namePlaceholder")}
            placeholderTextColor={brand.dark.muted}
            style={[styles.input, error ? styles.inputError : null]}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button label={t("cert.nameSave")} onPress={handleSave} loading={saving} />
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
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: fonts.headingSemibold,
    fontSize: 18,
    color: brand.white,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: brand.dark.muted,
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
});
