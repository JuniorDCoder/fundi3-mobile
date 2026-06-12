import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Award, BookOpen, ChevronRight, ExternalLink, GraduationCap, Sparkles } from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { SkeletonStatCard, SkeletonCourseProgressCard } from "../../components/ui/Skeleton";
import { brand, fonts } from "../../lib/theme/brand";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardProgress, type DashboardEntry } from "../../hooks/useDashboard";
import { useLanguage } from "../../hooks/useLanguage";
import type { CertificateListItem } from "../../lib/certificates/api";

export default function DashboardScreen() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { entries, stats, recentCerts, loading, refresh } = useDashboardProgress();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const displayName = user?.email?.split("@")[0] ?? "";

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.green[400]} />
      }
    >
      <View>
        <Text style={styles.welcome}>{t("dashboard.welcome")}</Text>
        <Text style={styles.name}>{displayName}</Text>
      </View>

      <View style={styles.statsRow}>
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard icon={BookOpen} value={String(stats.coursesEnrolled)} label={t("dashboard.coursesEnrolled")} />
            <StatCard icon={Award} value={String(stats.certificatesEarned)} label={t("dashboard.certificatesEarned")} />
            <StatCard icon={GraduationCap} value={String(stats.lessonsCompleted)} label={t("dashboard.lessonsCompleted")} />
          </>
        )}
      </View>

      {loading ? (
        <View style={{ gap: 14 }}>
          <SkeletonCourseProgressCard />
          <SkeletonCourseProgressCard />
        </View>
      ) : entries && entries.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("dashboard.myCourses")}</Text>
          <View style={{ gap: 14 }}>
            {entries.map((entry) => (
              <EnrolledCourseCard
                key={entry.course.id}
                entry={entry}
                onPress={() => router.push(`/courses/${entry.course.slug}`)}
              />
            ))}
          </View>
          <Button
            label={t("dashboard.viewAllCourses")}
            variant="ghost"
            onPress={() => router.push("/(tabs)/courses")}
          />
        </View>
      ) : (
        <GlassCard style={styles.emptyCard}>
          <Sparkles color={brand.amber[400]} size={28} />
          <Text style={styles.emptyTitle}>{t("dashboard.noCoursesTitle")}</Text>
          <Text style={styles.emptyBody}>{t("dashboard.noCoursesBody")}</Text>
          <Button label={t("dashboard.browseCourses")} onPress={() => router.push("/(tabs)/courses")} />
        </GlassCard>
      )}

      {!loading && recentCerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("dashboard.certificates")}</Text>
            <Pressable onPress={() => router.push("/certificates")} style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>{t("dashboard.viewAllCerts")}</Text>
              <ChevronRight size={14} color={brand.green[400]} />
            </Pressable>
          </View>
          <View style={{ gap: 10 }}>
            {recentCerts.map((cert) => (
              <CertMiniCard key={cert.id} cert={cert} lang={lang} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BookOpen;
  value: string;
  label: string;
}) {
  return (
    <GlassCard style={styles.statCard}>
      <Icon color={brand.green[400]} size={20} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function CertMiniCard({ cert, lang }: { cert: CertificateListItem; lang: string }) {
  const appUrl = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const name = lang === "fr" ? cert.courseNameFr || cert.courseNameEn : cert.courseNameEn;
  const issued = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(cert.issuedAt),
  );
  return (
    <GlassCard style={styles.certMiniCard}>
      <View style={styles.certMiniInner}>
        <View style={styles.certMiniIcon}>
          <Award size={16} color={brand.amber[400]} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.certMiniName} numberOfLines={1}>{name}</Text>
          <Text style={styles.certMiniDate}>{issued}</Text>
        </View>
        <Pressable
          onPress={() => Linking.openURL(`${appUrl}/certificate/${cert.id}`)}
          style={styles.certMiniViewBtn}
        >
          <ExternalLink size={13} color={brand.green[400]} />
        </Pressable>
      </View>
    </GlassCard>
  );
}

function EnrolledCourseCard({ entry, onPress }: { entry: DashboardEntry; onPress: () => void }) {
  const { t } = useLanguage();
  const { course, progress } = entry;

  return (
    <Pressable onPress={onPress}>
      <GlassCard style={{ gap: 10 }}>
        <Text style={styles.courseTitle} numberOfLines={1}>
          {course.title}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress.percentComplete}%` }]} />
        </View>
        <View style={styles.courseMetaRow}>
          <Text style={styles.courseMeta}>
            {t("dashboard.courseCardLessons", {
              completed: String(progress.completedLessons),
              total: String(progress.totalLessons),
            })}
          </Text>
          <Text style={styles.coursePercent}>
            {t("dashboard.progressLabel", { percent: String(progress.percentComplete) })}
          </Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.dark.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 24,
  },
  welcome: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: brand.dark.muted,
  },
  name: {
    fontFamily: fonts.headingSemibold,
    fontSize: 26,
    color: brand.white,
    textTransform: "capitalize",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "flex-start",
    gap: 6,
    padding: 14,
  },
  statValue: {
    fontFamily: fonts.headingSemibold,
    fontSize: 20,
    color: brand.white,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: brand.dark.muted,
  },
  section: { gap: 14 },
  sectionTitle: {
    fontFamily: fonts.headingSemibold,
    fontSize: 18,
    color: brand.white,
  },
  courseTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: brand.white,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: brand.green[400],
  },
  courseMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  courseMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: brand.dark.muted,
  },
  coursePercent: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: brand.green[400],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: brand.green[400],
  },
  certMiniCard: {
    padding: 12,
    borderColor: "rgba(239,159,39,0.18)",
    borderWidth: 1,
    backgroundColor: "rgba(239,159,39,0.04)",
  },
  certMiniInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  certMiniIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(239,159,39,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  certMiniName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.white,
  },
  certMiniDate: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: brand.dark.muted,
    marginTop: 2,
  },
  certMiniViewBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(15,110,86,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    alignItems: "flex-start",
    gap: 10,
  },
  emptyTitle: {
    fontFamily: fonts.headingSemibold,
    fontSize: 17,
    color: brand.white,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: brand.dark.muted,
  },
});
