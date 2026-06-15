import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, X } from "lucide-react-native";
import { CourseCard } from "../../../components/courses/CourseCard";
import { Button } from "../../../components/ui/Button";
import { SkeletonCourseList } from "../../../components/ui/Skeleton";
import { brand, fonts, glass } from "../../../lib/theme/brand";
import { useCourses } from "../../../hooks/useCourses";
import { useLanguage } from "../../../hooks/useLanguage";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase/client";
import { listUserEnrollments } from "../../../lib/courses/progress";
import type { CourseLevel, LocalizedCourse } from "../../../lib/courses/types";

type LevelFilter = CourseLevel | "all";

/** Matches a course against a free-text search query (every word must appear somewhere in the course's text). */
function matchesSearch(course: LocalizedCourse, query: string): boolean {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = [course.title, course.description, course.longDescription, ...course.tags]
    .join(" ")
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function CoursesScreen() {
  const { t } = useLanguage();
  const { courses, loading, error, refetch } = useCourses();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [africanOnly, setAfricanOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const loadEnrollments = useCallback(() => {
    if (!user) {
      setEnrolledIds(new Set());
      return Promise.resolve();
    }
    return listUserEnrollments(supabase, user.id)
      .then((rows) => setEnrolledIds(new Set(rows.map((r) => r.courseId))))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), loadEnrollments()]);
    setRefreshing(false);
  }, [refetch, loadEnrollments]);

  const filtered = useMemo<LocalizedCourse[]>(() => {
    if (!courses) return [];
    return courses.filter((c) => {
      if (levelFilter !== "all" && c.level !== levelFilter) return false;
      if (freeOnly && !c.isFree) return false;
      if (africanOnly && !c.isAfrican) return false;
      if (!matchesSearch(c, query)) return false;
      return true;
    });
  }, [courses, levelFilter, freeOnly, africanOnly, query]);

  const hasActiveFilters = levelFilter !== "all" || freeOnly || africanOnly;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.label}>{t("courses.catalog.label")}</Text>
        <Text style={styles.headline}>{t("courses.catalog.headline")}</Text>
        <Text style={styles.subtext}>{t("courses.catalog.subtext")}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Search color={brand.dark.muted} size={16} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("courses.search.placeholder")}
          placeholderTextColor={brand.dark.muted}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} accessibilityLabel={t("courses.search.clear")}>
            <X color={brand.dark.muted} size={16} />
          </Pressable>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {/* Level filters */}
        <FilterChip
          label={t("courses.filter.all")}
          active={levelFilter === "all"}
          onPress={() => setLevelFilter("all")}
        />
        <FilterChip
          label={t("courses.badge.beginner")}
          active={levelFilter === "beginner"}
          onPress={() => setLevelFilter(levelFilter === "beginner" ? "all" : "beginner")}
        />
        <FilterChip
          label={t("courses.badge.intermediate")}
          active={levelFilter === "intermediate"}
          onPress={() => setLevelFilter(levelFilter === "intermediate" ? "all" : "intermediate")}
        />
        <FilterChip
          label={t("courses.badge.advanced")}
          active={levelFilter === "advanced"}
          onPress={() => setLevelFilter(levelFilter === "advanced" ? "all" : "advanced")}
        />

        <View style={styles.chipDivider} />

        {/* Attribute filters */}
        <FilterChip
          label={t("courses.filter.free")}
          active={freeOnly}
          onPress={() => setFreeOnly((v) => !v)}
        />
        <FilterChip
          label={t("courses.badge.african")}
          active={africanOnly}
          onPress={() => setAfricanOnly((v) => !v)}
        />
      </ScrollView>

      {/* Results count + clear */}
      {!loading && courses && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {filtered.length === 1
              ? t("courses.results.one", { count: "1" })
              : t("courses.results", { count: String(filtered.length) })}
          </Text>
          {hasActiveFilters && (
            <Pressable
              onPress={() => { setLevelFilter("all"); setFreeOnly(false); setAfricanOnly(false); }}
            >
              <Text style={styles.clearText}>{t("courses.filter.clear")}</Text>
            </Pressable>
          )}
        </View>
      )}

      {loading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <SkeletonCourseList count={4} />
        </ScrollView>
      ) : error ? (
        <View style={styles.centerBlock}>
          <Text style={styles.errorText}>{t("common.error")}</Text>
          <Button label={t("common.retry")} variant="ghost" onPress={() => router.replace("/(tabs)/courses")} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <CourseCard
              course={item}
              onPress={() => router.push(`/courses/${item.slug}`)}
              isEnrolled={enrolledIds.has(item.id)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {query.trim() ? t("courses.search.empty", { query: query.trim() }) : t("courses.empty")}
            </Text>
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.green[400]} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.dark.bg,
    paddingHorizontal: 20,
  },
  header: {
    gap: 6,
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: brand.amber[400],
  },
  headline: {
    fontFamily: fonts.headingSemibold,
    fontSize: 24,
    color: brand.white,
  },
  subtext: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: brand.dark.muted,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 999,
    backgroundColor: glass.surface,
    borderWidth: 1,
    borderColor: glass.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: brand.white,
    padding: 0,
  },
  filterScroll: {
    marginHorizontal: -20,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  chipActive: {
    backgroundColor: "rgba(15,110,86,0.25)",
    borderColor: brand.green[400],
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.dark.muted,
  },
  chipTextActive: {
    color: brand.green[400],
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: brand.dark.border,
    marginHorizontal: 4,
  },
  resultsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  resultsText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: brand.dark.muted,
  },
  clearText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.amber[400],
  },
  listContent: {
    gap: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  centerBlock: {
    alignItems: "center",
    gap: 16,
    marginTop: 48,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: brand.dark.muted,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: brand.dark.muted,
    textAlign: "center",
    marginTop: 48,
  },
});
