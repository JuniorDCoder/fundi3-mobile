import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, BookOpen, CheckCircle2, Circle } from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { SkeletonCourseDetail } from "../../components/ui/Skeleton";
import { brand, fonts } from "../../lib/theme/brand";
import { useCourse } from "../../hooks/useCourses";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase/client";
import {
  buildCourseProgressSummary,
  enrollInCourse,
  getEnrollment,
  listLessonProgressForCourse,
  type CourseProgressSummary,
} from "../../lib/courses/progress";
import { levelBadgeKey, localizedLessonCount, localizedModuleCount } from "../../lib/courses/types";

export default function CourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { course, dbCourse, loading } = useCourse(slug);
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [progress, setProgress] = useState<CourseProgressSummary | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const refreshProgress = useCallback(async () => {
    if (!user || !dbCourse) return;
    const [enrollment, progressRows] = await Promise.all([
      getEnrollment(supabase, user.id, dbCourse.id),
      listLessonProgressForCourse(supabase, user.id, dbCourse.id),
    ]);
    setProgress(buildCourseProgressSummary(dbCourse, enrollment, progressRows));
  }, [user, dbCourse]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  const handleStart = async () => {
    if (!user || !dbCourse || !course) return;
    setEnrolling(true);
    try {
      await enrollInCourse(supabase, user.id, dbCourse.id);
      await refreshProgress();
      const firstLessonId = course.modules[0]?.lessons[0]?.id;
      if (firstLessonId) {
        router.push(`/learn/${dbCourse.id}/${firstLessonId}`);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleContinue = () => {
    if (!dbCourse || !progress) return;
    const lessonId = progress.nextLessonId ?? progress.firstLessonId;
    if (lessonId) router.push(`/learn/${dbCourse.id}/${lessonId}`);
  };

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <SkeletonCourseDetail />
      </View>
    );
  }

  if (!course || !dbCourse) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={brand.white} size={20} />
        </Pressable>
        <BookOpen color={brand.dark.muted} size={32} />
        <Text style={styles.notFoundTitle}>{t("courses.detail.notFound")}</Text>
        <Text style={styles.notFoundBody}>{t("courses.detail.notFoundBody")}</Text>
      </View>
    );
  }

  const lessonCount = localizedLessonCount(course);
  const moduleCount = localizedModuleCount(course);
  const ctaLabel = progress?.enrolled ? t("courses.detail.continue") : t("courses.detail.start");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 48 }}>
      <LinearGradient
        colors={[course.gradientFrom, course.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, { paddingTop: insets.top + 12 }]}
      >
        <Pressable onPress={() => router.push("/(tabs)/courses")} style={styles.backButton}>
          <ArrowLeft color={brand.white} size={20} />
          <Text style={styles.backText}>{t("courses.detail.back")}</Text>
        </Pressable>
        <BookOpen color={brand.white} size={36} />
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.description}>{course.description}</Text>

        <View style={styles.badgeRow}>
          <Badge label={t(levelBadgeKey(course.level))} />
          <Badge label={t("courses.badge.bilingual")} />
          {course.isFree ? <Badge label={t("courses.badge.free")} /> : null}
          {course.isAfrican ? <Badge label={t("courses.badge.african")} tone="amber" /> : null}
        </View>

        <GlassCard style={styles.statsCard}>
          <Stat label={t("courses.detail.statLessons")} value={String(lessonCount)} />
          <Stat label={t("courses.detail.statDuration")} value={course.duration} />
          <Stat label={t("courses.detail.statCertificate")} value={t("courses.detail.certificateValue")} />
        </GlassCard>

        {progress?.enrolled ? (
          <GlassCard style={styles.progressCard}>
            <Text style={styles.progressLabel}>
              {t("dashboard.progressLabel", { percent: String(progress.percentComplete) })}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress.percentComplete}%` }]} />
            </View>
            <Text style={styles.progressMeta}>
              {t("learn.progressLabel", {
                completed: String(progress.completedLessons),
                total: String(progress.totalLessons),
              })}
            </Text>
          </GlassCard>
        ) : null}

        <Button
          label={ctaLabel}
          onPress={progress?.enrolled ? handleContinue : handleStart}
          loading={enrolling}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("courses.detail.outcomesHeadline")}</Text>
          <View style={{ gap: 10 }}>
            {course.outcomes.map((outcome, idx) => (
              <View key={idx} style={styles.outcomeRow}>
                <CheckCircle2 color={brand.green[400]} size={18} />
                <Text style={styles.outcomeText}>{outcome}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("courses.detail.curriculumHeadline")}</Text>
          <Text style={styles.sectionMeta}>
            {t("courses.detail.modulesSummary", { modules: String(moduleCount), lessons: String(lessonCount) })}
          </Text>

          <View style={{ gap: 16, marginTop: 8 }}>
            {course.modules.map((module, moduleIdx) => (
              <View key={module.id} style={styles.moduleBlock}>
                <Text style={styles.moduleTitle}>
                  {moduleIdx + 1}. {module.title}
                </Text>
                <View style={{ gap: 8 }}>
                  {module.lessons.map((lesson) => {
                    const completed = progress?.completedLessonIds.includes(lesson.id);
                    return (
                      <Pressable
                        key={lesson.id}
                        style={styles.lessonRow}
                        onPress={() => {
                          if (progress?.enrolled) {
                            router.push(`/learn/${dbCourse.id}/${lesson.id}`);
                          }
                        }}
                      >
                        {completed ? (
                          <CheckCircle2 color={brand.green[400]} size={16} />
                        ) : (
                          <Circle color={brand.dark.muted} size={16} />
                        )}
                        <Text style={styles.lessonTitle} numberOfLines={1}>
                          {lesson.title}
                        </Text>
                        <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "amber" }) {
  return (
    <View style={[styles.badge, tone === "amber" && styles.badgeAmber]}>
      <Text style={[styles.badgeText, tone === "amber" && styles.badgeTextAmber]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.dark.bg,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  banner: {
    height: 180,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  backText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.white,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  title: {
    fontFamily: fonts.headingSemibold,
    fontSize: 26,
    color: brand.white,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: brand.dark.muted,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  badgeAmber: {
    backgroundColor: "rgba(239,159,39,0.12)",
    borderColor: "rgba(239,159,39,0.3)",
  },
  badgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: brand.white,
  },
  badgeTextAmber: {
    color: brand.amber[400],
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontFamily: fonts.headingSemibold,
    fontSize: 16,
    color: brand.white,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: brand.dark.muted,
  },
  progressCard: {
    gap: 8,
  },
  progressLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.white,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: brand.green[400],
  },
  progressMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: brand.dark.muted,
  },
  section: {
    gap: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: fonts.headingSemibold,
    fontSize: 18,
    color: brand.white,
  },
  sectionMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: brand.dark.muted,
  },
  outcomeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  outcomeText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: brand.white,
  },
  moduleBlock: {
    gap: 8,
  },
  moduleTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: brand.white,
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  lessonTitle: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: brand.white,
  },
  lessonDuration: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: brand.dark.muted,
  },
  notFoundTitle: {
    fontFamily: fonts.headingSemibold,
    fontSize: 18,
    color: brand.white,
  },
  notFoundBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: brand.dark.muted,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
