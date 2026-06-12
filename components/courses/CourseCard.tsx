import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BookOpen } from "lucide-react-native";
import { GlassCard } from "../ui/GlassCard";
import { brand, fonts } from "../../lib/theme/brand";
import { levelBadgeKey, localizedLessonCount, type LocalizedCourse } from "../../lib/courses/types";
import { useLanguage } from "../../hooks/useLanguage";

interface CourseCardProps {
  course: LocalizedCourse;
  onPress: () => void;
  isEnrolled?: boolean;
}

function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "amber" }) {
  return (
    <View style={[styles.badge, tone === "amber" && styles.badgeAmber]}>
      <Text style={[styles.badgeText, tone === "amber" && styles.badgeTextAmber]}>{label}</Text>
    </View>
  );
}

export function CourseCard({ course, onPress, isEnrolled = false }: CourseCardProps) {
  const { t } = useLanguage();
  const lessonCount = localizedLessonCount(course);

  const ctaLabel = isEnrolled
    ? t("dashboard.continueLearning")
    : course.isFree
      ? t("courses.startFree")
      : t("courses.viewCourse");

  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.card}>
        <LinearGradient
          colors={[course.gradientFrom, course.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <BookOpen color={brand.white} size={28} />
        </LinearGradient>

        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {course.description}
        </Text>

        <View style={styles.badgeRow}>
          <Badge label={t(levelBadgeKey(course.level))} />
          <Badge label={t("courses.badge.bilingual")} />
          {course.isFree ? <Badge label={t("courses.badge.free")} /> : null}
          {course.isAfrican ? <Badge label={t("courses.badge.african")} tone="amber" /> : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("courses.lessons", { count: String(lessonCount) })}</Text>
          <Text style={styles.cta}>{ctaLabel} →</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 0,
    overflow: "hidden",
  },
  banner: {
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.headingSemibold,
    fontSize: 18,
    color: brand.white,
    paddingHorizontal: 16,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: brand.dark.muted,
    paddingHorizontal: 16,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
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
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    marginTop: 4,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: brand.dark.muted,
  },
  cta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.green[400],
  },
});
