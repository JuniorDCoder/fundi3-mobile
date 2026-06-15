import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { toast } from "sonner-native";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Award,
  Check,
  ChevronLeft,
  Coins,
  Copy,
  ExternalLink,
  History,
  KeyRound,
  Loader2,
  QrCode,
  RefreshCw,
  Send as SendIcon,
  Wallet as WalletIcon,
} from "lucide-react-native";
import { GlassCard } from "../../components/ui/GlassCard";
import { SkeletonTxList, SkeletonWallet } from "../../components/ui/Skeleton";
import { ExportKeyModal } from "../../components/wallet/ExportKeyModal";
import { SendModal } from "../../components/wallet/SendModal";
import { ReceiveModal } from "../../components/wallet/ReceiveModal";
import { brand, fonts } from "../../lib/theme/brand";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { useMinimumLoading } from "../../hooks/useMinimumLoading";
import {
  getTransactions,
  getWallet,
  requestAirdrop,
  type WalletInfo,
  type WalletTransaction,
} from "../../lib/wallet/api";

const NETWORK_LABEL_KEY: Record<WalletInfo["network"], string> = {
  devnet: "wallet.networkDevnet",
  testnet: "wallet.networkTestnet",
  "mainnet-beta": "wallet.networkMainnet",
};

function truncateAddress(address: string) {
  if (address.length <= 16) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

function formatDate(blockTime: number | null, lang: "en" | "fr") {
  if (!blockTime) return "";
  return new Date(blockTime * 1000).toLocaleString(
    lang === "fr" ? "fr-FR" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [airdropping, setAirdropping] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const [transactions, setTransactions] = useState<WalletTransaction[] | null>(
    null,
  );
  const [txLoading, setTxLoading] = useState(true);

  // Enforce a minimum skeleton display so warm/cached loads don't flash past.
  const showSkeleton = useMinimumLoading(loading);
  const showTxSkeleton = useMinimumLoading(txLoading);

  const load = useCallback(async () => {
    try {
      const data = await getWallet();
      setWallet(data);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch {
      setTransactions([]);
    }
  }, []);

  useEffect(() => {
    // Wait for the session to be restored before deciding there's nothing to
    // load — otherwise the empty/error state flashes before `user` is populated.
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setTxLoading(false);
      return;
    }
    load().finally(() => setLoading(false));
    loadTransactions().finally(() => setTxLoading(false));
  }, [authLoading, user, load, loadTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), loadTransactions()]);
    setRefreshing(false);
  }, [load, loadTransactions]);

  const handleCopy = async () => {
    if (!wallet) return;
    await Clipboard.setStringAsync(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleAirdrop = async () => {
    setAirdropping(true);
    try {
      await requestAirdrop();
      toast.success(t("wallet.airdropSuccess"));
      setTimeout(() => onRefresh(), 1500);
    } catch {
      toast.error(t("wallet.airdropError"));
    } finally {
      setAirdropping(false);
    }
  };

  const handleSendSuccess = () => {
    setTimeout(() => onRefresh(), 1500);
  };

  const networkColor =
    wallet?.network === "devnet" ? brand.amber[400] : brand.green[400];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <ChevronLeft size={22} color={brand.dark.muted} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("wallet.title")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={brand.green[400]}
          />
        }
      >
        {showSkeleton ? (
          <SkeletonWallet />
        ) : error || !wallet ? (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>{t("wallet.error")}</Text>
          </GlassCard>
        ) : (
          <>
            <Text style={styles.subtitle}>{t("wallet.subtitle")}</Text>

            {/* Address + QR card */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconBubbleGreen}>
                    <WalletIcon color={brand.green[400]} size={16} />
                  </View>
                  <Text style={styles.cardTitle}>
                    {t("wallet.addressLabel")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.networkBadge,
                    { backgroundColor: `${networkColor}1F` },
                  ]}
                >
                  <View
                    style={[
                      styles.networkDot,
                      { backgroundColor: networkColor },
                    ]}
                  />
                  <Text style={[styles.networkText, { color: networkColor }]}>
                    {t(NETWORK_LABEL_KEY[wallet.network])}
                  </Text>
                </View>
              </View>

              <View style={styles.qrWrap}>
                <View style={styles.qrBox}>
                  <QRCode
                    value={wallet.address}
                    size={160}
                    color={brand.dark.bg}
                    backgroundColor={brand.white}
                  />
                </View>
              </View>
              <Text style={styles.qrLabel}>{t("wallet.qrLabel")}</Text>

              <View style={styles.addressBox}>
                <Text style={styles.addressText}>
                  {truncateAddress(wallet.address)}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <Pressable onPress={handleCopy} style={styles.copyBtn}>
                  {copied ? (
                    <Check size={14} color={brand.green[100]} />
                  ) : (
                    <Copy size={14} color={brand.green[400]} />
                  )}
                  <Text
                    style={[
                      styles.copyBtnText,
                      copied && styles.copyBtnTextCopied,
                    ]}
                  >
                    {copied ? t("wallet.copied") : t("wallet.copy")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => Linking.openURL(wallet.explorerUrl)}
                  style={styles.explorerBtn}
                >
                  <ExternalLink size={14} color={brand.dark.muted} />
                  <Text style={styles.explorerBtnText}>
                    {t("wallet.viewExplorer")}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.hintText}>{t("wallet.addressHint")}</Text>
            </GlassCard>

            {/* Balance card */}
            <GlassCard style={styles.card}>
              <View style={styles.balanceHeader}>
                <Text style={styles.cardLabel}>{t("wallet.balanceLabel")}</Text>
                <Pressable
                  onPress={onRefresh}
                  disabled={refreshing}
                  hitSlop={8}
                >
                  <RefreshCw size={14} color={brand.dark.muted} />
                </Pressable>
              </View>
              {wallet.balanceSol !== null ? (
                <Text style={styles.balanceValue}>
                  {wallet.balanceSol.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}
                  <Text style={styles.balanceUnit}> SOL</Text>
                </Text>
              ) : (
                <Text style={styles.balanceUnavailable}>
                  {t("wallet.balanceUnavailable")}
                </Text>
              )}

              <View style={styles.sendReceiveRow}>
                <Pressable
                  onPress={() => setSendOpen(true)}
                  style={styles.sendBtn}
                >
                  <SendIcon size={15} color={brand.white} />
                  <Text style={styles.sendBtnText}>{t("wallet.send")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setReceiveOpen(true)}
                  style={styles.receiveBtn}
                >
                  <QrCode size={15} color={brand.white} />
                  <Text style={styles.receiveBtnText}>
                    {t("wallet.receive")}
                  </Text>
                </Pressable>
              </View>

              {wallet.network === "devnet" && (
                <Pressable
                  onPress={handleAirdrop}
                  disabled={airdropping}
                  style={styles.airdropBtn}
                >
                  {airdropping ? (
                    <Loader2 size={15} color={brand.amber[400]} />
                  ) : (
                    <Coins size={15} color={brand.amber[400]} />
                  )}
                  <Text style={styles.airdropBtnText}>
                    {airdropping
                      ? t("wallet.airdropLoading")
                      : t("wallet.airdropButton")}
                  </Text>
                </Pressable>
              )}
            </GlassCard>

            {/* Transaction history */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconBubbleGreen}>
                  <History color={brand.green[400]} size={16} />
                </View>
                <Text style={styles.cardTitle}>
                  {t("wallet.txHistoryTitle")}
                </Text>
              </View>

              {showTxSkeleton ? (
                <SkeletonTxList />
              ) : !transactions || transactions.length === 0 ? (
                <Text style={styles.hintText}>{t("wallet.txEmpty")}</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {transactions.map((txItem) => {
                    const isCertificate = txItem.kind === "certificate";
                    const isIn = txItem.direction === "in";
                    const isOut = txItem.direction === "out";
                    const iconColor = isCertificate
                      ? brand.amber[400]
                      : isIn
                        ? brand.green[400]
                        : isOut
                          ? brand.amber[400]
                          : brand.dark.muted;
                    const iconBg = isCertificate
                      ? "rgba(239,159,39,0.12)"
                      : isIn
                        ? "rgba(15,110,86,0.15)"
                        : isOut
                          ? "rgba(239,159,39,0.12)"
                          : "rgba(255,255,255,0.05)";
                    const Icon = isCertificate
                      ? Award
                      : isIn
                        ? ArrowDownLeft
                        : isOut
                          ? ArrowUpRight
                          : ArrowLeftRight;
                    const label = isCertificate
                      ? t("wallet.txCertificate")
                      : isIn
                        ? t("wallet.txReceived")
                        : isOut
                          ? t("wallet.txSent")
                          : t("wallet.txOther");
                    const counterpartyLabel = txItem.counterparty
                      ? isIn
                        ? t("wallet.txFrom", {
                            address: truncateAddress(txItem.counterparty),
                          })
                        : t("wallet.txTo", {
                            address: truncateAddress(txItem.counterparty),
                          })
                      : null;

                    return (
                      <Pressable
                        key={txItem.signature}
                        onPress={() => Linking.openURL(txItem.explorerUrl)}
                        style={styles.txRow}
                      >
                        <View
                          style={[
                            styles.txIconBubble,
                            { backgroundColor: iconBg },
                          ]}
                        >
                          <Icon size={16} color={iconColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.txLabelRow}>
                            <Text style={styles.txLabel}>{label}</Text>
                            {txItem.status === "failed" && (
                              <View style={styles.txFailedBadge}>
                                <Text style={styles.txFailedText}>
                                  {t("wallet.txFailed")}
                                </Text>
                              </View>
                            )}
                          </View>
                          {counterpartyLabel && (
                            <Text
                              style={styles.txCounterparty}
                              numberOfLines={1}
                            >
                              {counterpartyLabel}
                            </Text>
                          )}
                        </View>
                        <View style={styles.txRight}>
                          {txItem.changeSol !== null && (
                            <Text
                              style={[
                                styles.txAmount,
                                {
                                  color: isIn ? brand.green[400] : brand.white,
                                },
                              ]}
                            >
                              {txItem.changeSol > 0 ? "+" : ""}
                              {txItem.changeSol.toLocaleString(undefined, {
                                maximumFractionDigits: 6,
                              })}{" "}
                              SOL
                            </Text>
                          )}
                          <Text style={styles.txDate}>
                            {formatDate(txItem.blockTime, lang)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </GlassCard>

            {/* Export key card */}
            <GlassCard style={styles.card}>
              <View style={styles.exportRow}>
                <View style={styles.iconBubbleAmber}>
                  <KeyRound color={brand.amber[400]} size={16} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {t("wallet.exportTitle")}
                  </Text>
                  <Text style={styles.hintText}>{t("wallet.exportDesc")}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setExportOpen(true)}
                style={styles.exportBtn}
              >
                <KeyRound size={14} color={brand.white} />
                <Text style={styles.exportBtnText}>
                  {t("wallet.exportButton")}
                </Text>
              </Pressable>
            </GlassCard>
          </>
        )}
      </ScrollView>

      <ExportKeyModal
        visible={exportOpen}
        onClose={() => setExportOpen(false)}
      />
      <SendModal
        visible={sendOpen}
        onClose={() => setSendOpen(false)}
        availableSol={wallet?.balanceSol ?? null}
        onSuccess={handleSendSuccess}
      />
      {wallet && (
        <ReceiveModal
          visible={receiveOpen}
          onClose={() => setReceiveOpen(false)}
          address={wallet.address}
        />
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: brand.dark.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  headerTitle: {
    fontFamily: fonts.headingSemibold,
    fontSize: 18,
    color: brand.white,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
  errorCard: {
    alignItems: "center",
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "#fca5a5",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: brand.dark.muted,
  },
  card: {
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBubbleGreen: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,110,86,0.15)",
  },
  iconBubbleAmber: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,159,39,0.12)",
  },
  cardTitle: {
    fontFamily: fonts.headingSemibold,
    fontSize: 15,
    color: brand.white,
  },
  cardLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: brand.dark.muted,
  },
  networkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  networkText: {
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  qrWrap: {
    alignItems: "center",
  },
  qrBox: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: brand.white,
  },
  qrLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: brand.dark.muted,
    textAlign: "center",
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
    fontSize: 14,
    color: brand.white,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
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
  explorerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
  },
  explorerBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.dark.muted,
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: brand.dark.muted,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceValue: {
    fontFamily: fonts.headingSemibold,
    fontSize: 30,
    color: brand.white,
  },
  balanceUnit: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: brand.dark.muted,
  },
  balanceUnavailable: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: brand.dark.muted,
  },
  sendReceiveRow: {
    flexDirection: "row",
    gap: 10,
  },
  sendBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: brand.green[600],
  },
  sendBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.white,
  },
  receiveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
  },
  receiveBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.white,
  },
  airdropBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,159,39,0.3)",
  },
  airdropBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.amber[400],
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  txIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  txLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  txLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.white,
  },
  txFailedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(239,68,68,0.12)",
  },
  txFailedText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: "#fca5a5",
  },
  txCounterparty: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: brand.dark.muted,
    marginTop: 2,
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: "500",
  },
  txDate: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: brand.dark.muted,
    marginTop: 2,
  },
  exportRow: {
    flexDirection: "row",
    gap: 12,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
  },
  exportBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.white,
  },
});
