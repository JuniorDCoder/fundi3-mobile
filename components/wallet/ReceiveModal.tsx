import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { Check, Copy, QrCode as QrCodeIcon, X } from "lucide-react-native";
import { brand, fonts } from "../../lib/theme/brand";
import { useLanguage } from "../../hooks/useLanguage";

interface Props {
  visible: boolean;
  onClose: () => void;
  address: string;
}

export function ReceiveModal({ visible, onClose, address }: Props) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBubble}>
                <QrCodeIcon color={brand.green[400]} size={18} />
              </View>
              <Text style={styles.title}>{t("wallet.receiveTitle")}</Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12}>
              <X color={brand.dark.muted} size={20} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>{t("wallet.receiveDesc")}</Text>

          <View style={styles.qrWrap}>
            <View style={styles.qrBox}>
              <QRCode value={address} size={180} color={brand.dark.bg} backgroundColor={brand.white} />
            </View>
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.addressText} selectable>
              {address}
            </Text>
          </View>

          <Pressable onPress={handleCopy} style={styles.copyBtn}>
            {copied ? <Check size={14} color={brand.green[100]} /> : <Copy size={14} color={brand.green[400]} />}
            <Text style={[styles.copyBtnText, copied && styles.copyBtnTextCopied]}>
              {copied ? t("wallet.copied") : t("wallet.copy")}
            </Text>
          </Pressable>
        </View>
      </View>
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
  qrWrap: {
    alignItems: "center",
  },
  qrBox: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: brand.white,
  },
  addressBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
    backgroundColor: brand.dark.bg,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addressText: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: brand.white,
    textAlign: "center",
  },
  copyBtn: {
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
    fontSize: 14,
    color: brand.green[400],
  },
  copyBtnTextCopied: {
    color: brand.green[100],
  },
});
