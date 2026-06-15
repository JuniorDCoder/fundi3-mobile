import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { toast } from "sonner-native";
import { Award, ChevronLeft, ExternalLink, Download, X } from "lucide-react-native";
import { GlassCard } from "../../components/ui/GlassCard";
import { SkeletonCertCard } from "../../components/ui/Skeleton";
import { brand, fonts } from "../../lib/theme/brand";
import { getCertificates, type CertificateListItem } from "../../lib/certificates/api";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../hooks/useAuth";

export default function CertificatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [certs, setCerts] = useState<CertificateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewCert, setPreviewCert] = useState<CertificateListItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const appUrl = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const load = useCallback(() => {
    if (!user) return Promise.resolve();
    return getCertificates()
      .then(setCerts)
      .catch(() => setCerts([]));
  }, [user]);

  // Wait for the session to be restored before deciding there's nothing to
  // load — otherwise the empty state flashes before `user` is populated.
  useEffect(() => {
    if (authLoading) return;
    load().finally(() => setLoading(false));
  }, [authLoading, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const courseName = (cert: CertificateListItem) =>
    lang === "fr" ? cert.courseNameFr || cert.courseNameEn : cert.courseNameEn;

  const handleDownload = async (cert: CertificateListItem) => {
    setDownloadingId(cert.id);
    try {
      const url = `${appUrl}/api/certificates/${cert.id}/pdf${lang === "fr" ? "?lang=fr" : ""}`;
      const destination = new File(Paths.cache, `fundi3-certificate-${cert.id}.pdf`);
      const file = await File.downloadFileAsync(url, destination, { idempotent: true });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      } else {
        await Linking.openURL(file.uri);
      }
    } catch (err) {
      console.error("[certificates] failed to download PDF:", err);
      toast.error(t("cert.downloadError"));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={22} color={brand.dark.muted} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("dashboard.certificates")}</Text>
      </View>

      <FlatList
        data={certs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, !loading && certs.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.green[400]} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 14 }}>
              <SkeletonCertCard />
              <SkeletonCertCard />
              <SkeletonCertCard />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Award size={32} color={brand.amber[400]} />
              </View>
              <Text style={styles.emptyTitle}>No certificates yet</Text>
              <Text style={styles.emptyBody}>
                Complete all lessons in a course to earn a verified NFT certificate on Solana.
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/courses")} style={styles.browseBtn}>
                <Text style={styles.browseBtnText}>Browse Courses</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => {
            const issued = new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date(item.issuedAt));

            return (
              <GlassCard style={styles.certCard}>
                <View style={styles.certCardInner}>
                  <View style={styles.awardCircle}>
                    <Award size={20} color={brand.amber[400]} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.certCourseName} numberOfLines={1}>
                      {courseName(item)}
                    </Text>
                    <Text style={styles.certMeta}>
                      {item.displayName} · {issued}
                    </Text>
                  </View>
                </View>
                <View style={styles.certActions}>
                  <Pressable
                    onPress={() => setPreviewCert(item)}
                    style={styles.viewBtn}
                  >
                    <Text style={styles.viewBtnText}>{t("cert.viewCertificate")}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDownload(item)}
                    style={styles.downloadBtn}
                    disabled={downloadingId === item.id}
                  >
                    {downloadingId === item.id ? (
                      <ActivityIndicator size="small" color={brand.amber[400]} />
                    ) : (
                      <>
                        <Download size={11} color={brand.amber[400]} />
                        <Text style={styles.downloadBtnText}>{t("cert.downloadPdf")}</Text>
                      </>
                    )}
                  </Pressable>
                  {item.solanaExplorerUrl && (
                    <Pressable
                      onPress={() => Linking.openURL(item.solanaExplorerUrl!)}
                      style={styles.solanaBtn}
                    >
                      <ExternalLink size={11} color={brand.dark.muted} />
                      <Text style={styles.solanaBtnText}>Solana</Text>
                    </Pressable>
                  )}
                </View>
              </GlassCard>
            );
          }}
      />

      <Modal
        visible={previewCert !== null}
        animationType="slide"
        onRequestClose={() => setPreviewCert(null)}
      >
        <View style={[styles.previewScreen, { paddingTop: insets.top }]}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {previewCert ? courseName(previewCert) : ""}
            </Text>
            <Pressable onPress={() => setPreviewCert(null)} style={styles.previewCloseBtn} hitSlop={8}>
              <X size={20} color={brand.white} />
            </Pressable>
          </View>
          {previewCert && (
            <WebView
              source={{ uri: `${appUrl}/certificate/${previewCert.id}` }}
              style={styles.previewWebView}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.previewLoading}>
                  <ActivityIndicator color={brand.green[400]} />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.dark.bg,
  },
  previewScreen: {
    flex: 1,
    backgroundColor: brand.dark.bg,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: brand.dark.border,
  },
  previewTitle: {
    flex: 1,
    fontFamily: fonts.headingSemibold,
    fontSize: 16,
    color: brand.white,
  },
  previewCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  previewWebView: {
    flex: 1,
    backgroundColor: brand.dark.bg,
  },
  previewLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(239,159,39,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: fonts.headingSemibold,
    fontSize: 18,
    color: brand.white,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: brand.dark.muted,
    textAlign: "center",
  },
  browseBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: brand.green[600],
  },
  browseBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.white,
  },
  list: {
    padding: 16,
    gap: 14,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  certCard: {
    gap: 12,
    borderColor: "rgba(239,159,39,0.18)",
    borderWidth: 1,
    backgroundColor: "rgba(239,159,39,0.04)",
  },
  certCardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  awardCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(239,159,39,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  certCourseName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: brand.white,
    marginBottom: 3,
  },
  certMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: brand.dark.muted,
  },
  certActions: {
    flexDirection: "row",
    gap: 10,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(15,110,86,0.15)",
    alignItems: "center",
  },
  viewBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.green[400],
  },
  solanaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  solanaBtnText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: brand.dark.muted,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(239,159,39,0.12)",
  },
  downloadBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: brand.amber[400],
  },
});
