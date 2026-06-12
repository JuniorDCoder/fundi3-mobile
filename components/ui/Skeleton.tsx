import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "./GlassCard";
import { glass } from "../../lib/theme/brand";

interface SkeletonProps {
  style?: ViewStyle | ViewStyle[];
}

/**
 * Base shimmer block — mirrors web/components/ui/Skeleton.tsx: a glass
 * surface with a soft light band sweeping across it on a loop. Every
 * loading state in the app should compose larger layouts out of this.
 */
export function Skeleton({ style }: SkeletonProps) {
  const [width, setWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (width === 0) return;
    translateX.setValue(-width);
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: width,
        duration: 1400,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [width, translateX]);

  return (
    <View style={[styles.base, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Animated.View style={[styles.shimmer, { width, transform: [{ translateX }] }]}>
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.08)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: glass.surface,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

/** Mirrors the dashboard's StatCard — icon chip + value + label. */
export function SkeletonStatCard() {
  return (
    <GlassCard style={composed.statCard}>
      <Skeleton style={{ width: 20, height: 20, borderRadius: 6 }} />
      <Skeleton style={{ width: 36, height: 18, borderRadius: 5, marginTop: 6 }} />
      <Skeleton style={{ width: 64, height: 10, borderRadius: 4, marginTop: 4 }} />
    </GlassCard>
  );
}

/** Mirrors EnrolledCourseCard — title, progress bar, meta row. */
export function SkeletonCourseProgressCard() {
  return (
    <GlassCard style={{ gap: 10 }}>
      <Skeleton style={{ height: 16, width: "60%", borderRadius: 5 }} />
      <Skeleton style={{ height: 6, width: "100%", borderRadius: 999 }} />
      <View style={composed.row}>
        <Skeleton style={{ height: 11, width: 90, borderRadius: 4 }} />
        <Skeleton style={{ height: 11, width: 40, borderRadius: 4 }} />
      </View>
    </GlassCard>
  );
}

// ─── Course catalog ───────────────────────────────────────────────────────────

/** Mirrors CourseCard — gradient banner, title, description, badges, footer. */
export function SkeletonCourseCard() {
  return (
    <GlassCard style={composed.courseCard}>
      <Skeleton style={{ height: 96, borderRadius: 0 }} />
      <View style={composed.courseCardBody}>
        <Skeleton style={{ height: 18, width: "70%", borderRadius: 5 }} />
        <Skeleton style={{ height: 14, width: "100%", borderRadius: 4 }} />
        <Skeleton style={{ height: 14, width: "85%", borderRadius: 4 }} />
        <View style={[composed.row, { marginTop: 4 }]}>
          <Skeleton style={{ height: 22, width: 64, borderRadius: 999 }} />
          <Skeleton style={{ height: 22, width: 56, borderRadius: 999 }} />
          <Skeleton style={{ height: 22, width: 48, borderRadius: 999 }} />
        </View>
      </View>
      <View style={composed.courseCardFooter}>
        <Skeleton style={{ height: 12, width: 70, borderRadius: 4 }} />
        <Skeleton style={{ height: 12, width: 50, borderRadius: 4 }} />
      </View>
    </GlassCard>
  );
}

/** Stack of skeleton course cards — drop-in placeholder while the catalog loads. */
export function SkeletonCourseList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCourseCard key={i} />
      ))}
    </View>
  );
}

// ─── Certificates ─────────────────────────────────────────────────────────────

/** Mirrors the certificate card — award icon, course/name/date, action row. */
export function SkeletonCertCard() {
  return (
    <GlassCard style={composed.certCard}>
      <View style={composed.row}>
        <Skeleton style={{ width: 38, height: 38, borderRadius: 12 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton style={{ height: 15, width: "70%", borderRadius: 4 }} />
          <Skeleton style={{ height: 12, width: "50%", borderRadius: 4 }} />
        </View>
      </View>
      <View style={[composed.row, { gap: 10 }]}>
        <Skeleton style={{ flex: 1, height: 32, borderRadius: 10 }} />
        <Skeleton style={{ width: 90, height: 32, borderRadius: 10 }} />
      </View>
    </GlassCard>
  );
}

// ─── Course detail ────────────────────────────────────────────────────────────

/** Mirrors the course detail hero — banner, title, description, badges, stats, CTA. */
export function SkeletonCourseDetail() {
  return (
    <View>
      <Skeleton style={{ height: 180, borderRadius: 0 }} />
      <View style={composed.detailBody}>
        <Skeleton style={{ height: 24, width: "80%", borderRadius: 6 }} />
        <Skeleton style={{ height: 14, width: "100%", borderRadius: 4 }} />
        <Skeleton style={{ height: 14, width: "90%", borderRadius: 4 }} />
        <View style={composed.row}>
          <Skeleton style={{ height: 22, width: 70, borderRadius: 999 }} />
          <Skeleton style={{ height: 22, width: 90, borderRadius: 999 }} />
          <Skeleton style={{ height: 22, width: 60, borderRadius: 999 }} />
        </View>
        <Skeleton style={{ height: 72, width: "100%", borderRadius: 16 }} />
        <Skeleton style={{ height: 48, width: "100%", borderRadius: 12, marginTop: 4 }} />
      </View>
    </View>
  );
}

// ─── Lesson player ────────────────────────────────────────────────────────────

/** Mirrors the lesson player — breadcrumb, title, body paragraphs, embed area. */
export function SkeletonLesson() {
  return (
    <View style={composed.lesson}>
      <Skeleton style={{ height: 12, width: 100, borderRadius: 4 }} />
      <Skeleton style={{ height: 26, width: "75%", borderRadius: 6 }} />
      <View style={{ gap: 10, marginTop: 4 }}>
        <Skeleton style={{ height: 14, width: "100%", borderRadius: 4 }} />
        <Skeleton style={{ height: 14, width: "100%", borderRadius: 4 }} />
        <Skeleton style={{ height: 14, width: "85%", borderRadius: 4 }} />
        <Skeleton style={{ height: 14, width: "100%", borderRadius: 4 }} />
        <Skeleton style={{ height: 14, width: "70%", borderRadius: 4 }} />
      </View>
      <Skeleton style={{ height: 160, width: "100%", borderRadius: 16, marginTop: 8 }} />
    </View>
  );
}

const composed = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: "flex-start",
    gap: 6,
    padding: 14,
  },
  courseCard: {
    gap: 12,
    padding: 0,
    overflow: "hidden",
  },
  courseCardBody: {
    paddingHorizontal: 16,
    gap: 8,
  },
  courseCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  certCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(239,159,39,0.18)",
    backgroundColor: "rgba(239,159,39,0.04)",
  },
  detailBody: {
    padding: 20,
    gap: 14,
  },
  lesson: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
});
