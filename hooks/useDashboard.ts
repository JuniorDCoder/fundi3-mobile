import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";
import { getPublishedCoursesByIds } from "../lib/courses/queries";
import { localizeCourse, type LocalizedCourse } from "../lib/courses/types";
import {
  buildCourseProgressSummary,
  listLessonProgressForCourses,
  listUserEnrollments,
  type CourseProgressSummary,
} from "../lib/courses/progress";
import { getCertificates, type CertificateListItem } from "../lib/certificates/api";
import { useAuth } from "./useAuth";
import { useLanguage } from "./useLanguage";

export interface DashboardEntry {
  course: LocalizedCourse;
  progress: CourseProgressSummary;
}

export interface DashboardStats {
  coursesEnrolled: number;
  certificatesEarned: number;
  lessonsCompleted: number;
}

export function useDashboardProgress() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [entries, setEntries] = useState<DashboardEntry[] | null>(null);
  const [recentCerts, setRecentCerts] = useState<CertificateListItem[]>([]);
  const [certCount, setCertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setEntries(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const enrollments = await listUserEnrollments(supabase, user.id);

      const courseIds = enrollments.map((e) => e.courseId);
      const [courses, progressRows] = await Promise.all([
        getPublishedCoursesByIds(supabase, courseIds),
        listLessonProgressForCourses(supabase, user.id, courseIds),
      ]);

      const next: DashboardEntry[] = enrollments
        .map((enrollment) => {
          const course = courses.find((c) => c.id === enrollment.courseId);
          if (!course) return null;
          const courseProgressRows = progressRows.filter((p) => p.courseId === course.id);
          const summary = buildCourseProgressSummary(course, enrollment, courseProgressRows);
          return { course: localizeCourse(course, lang), progress: summary };
        })
        .filter((entry): entry is DashboardEntry => entry !== null);

      setEntries(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setLoading(false);
    }

    // Certificates come from the web API over HTTP — keep this isolated so a
    // network failure reaching it doesn't blank out the Supabase-backed stats above.
    try {
      const certsData = await getCertificates();
      setRecentCerts(certsData.slice(0, 3));
      setCertCount(certsData.length);
    } catch (err) {
      console.error("[dashboard] failed to load certificates:", err);
    }
  }, [user, lang]);

  useEffect(() => {
    load();
  }, [load]);

  const stats: DashboardStats = {
    coursesEnrolled: entries?.length ?? 0,
    certificatesEarned: certCount,
    lessonsCompleted: entries?.reduce((total, e) => total + e.progress.completedLessons, 0) ?? 0,
  };

  return { entries, stats, recentCerts, loading, error, refresh: load };
}
