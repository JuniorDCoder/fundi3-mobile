/**
 * Shown inside the lesson player when a user has completed 100% of a course.
 * Handles the name-collection + claim flow inline.
 */
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, Linking } from "react-native";
import { Award, ExternalLink, CheckCircle2, Download } from "lucide-react-native";
import { toast } from "sonner-native";
import { GlassCard } from "../ui/GlassCard";
import { NameModal } from "./NameModal";
import { brand, fonts } from "../../lib/theme/brand";
import { claimCertificate, getUserProfile } from "../../lib/certificates/api";
import { useLanguage } from "../../hooks/useLanguage";

interface Props {
  courseId: string;
  courseName: string;
  onClaimed?: (certId: string) => void;
}

type State = "auto_claiming" | "needs_name" | "claiming" | "done" | "error";

export function CertClaimBanner({ courseId, courseName, onClaimed }: Props) {
  const { t, lang } = useLanguage();
  const [state, setState] = useState<State>("auto_claiming");
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [certId, setCertId] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  const handleClaim = async (displayName?: string) => {
    setState("claiming");
    try {
      const result = await claimCertificate(courseId, displayName);
      setCertId(result.certId);
      setExplorerUrl(result.solanaExplorerUrl);
      setState("done");
      if (!result.alreadyClaimed) {
        toast.success(t("cert.claimSuccess"), { description: t("cert.claimSuccessDesc") });
      }
      onClaimed?.(result.certId);
    } catch (err) {
      setState("error");
      toast.error(t("cert.claimError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  // Auto-trigger on mount — no button needed
  useEffect(() => {
    const run = async () => {
      try {
        const profile = await getUserProfile();
        if (profile?.displayName) {
          await handleClaim(profile.displayName);
        } else {
          setState("needs_name");
          setNameModalVisible(true);
        }
      } catch {
        setState("needs_name");
        setNameModalVisible(true);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleNameSaved = async (displayName: string) => {
    setNameModalVisible(false);
    await handleClaim(displayName);
  };

  const appUrl = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const isBusy = state === "auto_claiming" || state === "claiming";

  return (
    <>
      <GlassCard style={styles.card}>
        <View style={styles.iconRow}>
          <View style={styles.iconCircle}>
            <Award color={brand.amber[400]} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headline}>{t("cert.courseCompleteHeadline")}</Text>
            <Text style={styles.subtext}>{t("cert.courseCompleteSubtext")}</Text>
          </View>
        </View>

        {isBusy && (
          <ActivityIndicator color={brand.amber[400]} />
        )}

        {state === "done" && certId && (
          <View style={styles.doneBlock}>
            <View style={styles.doneRow}>
              <CheckCircle2 color={brand.green[400]} size={16} />
              <Text style={styles.doneText}>{t("cert.claimed")}</Text>
            </View>
            {explorerUrl && (
              <Pressable onPress={() => Linking.openURL(explorerUrl)} style={styles.explorerLink}>
                <ExternalLink size={12} color={brand.green[400]} />
                <Text style={styles.explorerText}>{t("cert.viewOnSolana")}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => Linking.openURL(`${appUrl}/certificate/${certId}`)}
              style={styles.certLink}
            >
              <Text style={styles.certLinkText}>{t("cert.viewCertificate")} →</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Linking.openURL(
                  `${appUrl}/api/certificates/${certId}/pdf${lang === "fr" ? "?lang=fr" : ""}`,
                )
              }
              style={styles.downloadLink}
            >
              <Download size={12} color={brand.amber[400]} />
              <Text style={styles.downloadLinkText}>{t("cert.downloadPdf")}</Text>
            </Pressable>
          </View>
        )}
      </GlassCard>

      <NameModal
        visible={nameModalVisible}
        onSaved={handleNameSaved}
        onDismiss={() => { setNameModalVisible(false); setState("needs_name"); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
    borderColor: "rgba(239,159,39,0.2)",
    borderWidth: 1,
    backgroundColor: "rgba(239,159,39,0.06)",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239,159,39,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    fontFamily: fonts.headingSemibold,
    fontSize: 16,
    color: brand.white,
    marginBottom: 4,
  },
  subtext: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: brand.dark.muted,
  },
  doneBlock: { gap: 10 },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  doneText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.green[400],
  },
  explorerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  explorerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: brand.green[400],
    textDecorationLine: "underline",
  },
  certLink: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(15,110,86,0.15)",
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.3)",
  },
  certLinkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.green[400],
  },
  downloadLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(239,159,39,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,159,39,0.25)",
  },
  downloadLinkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.amber[400],
  },
});
