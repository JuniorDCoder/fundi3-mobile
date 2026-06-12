import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";
import { getPublishedCourseBySlug, getPublishedCoursesByIds, listPublishedCourses } from "../lib/courses/queries";
import { localizeCourse, type DbCourse, type LocalizedCourse } from "../lib/courses/types";
import { useLanguage } from "./useLanguage";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useCourses() {
  const { lang } = useLanguage();
  const [state, setState] = useState<AsyncState<DbCourse[]>>({ data: null, loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const courses = await listPublishedCourses(supabase);
      setState({ data: courses, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : "error" });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const localized: LocalizedCourse[] | null = state.data?.map((course) => localizeCourse(course, lang)) ?? null;

  return { courses: localized, loading: state.loading, error: state.error, refetch: load };
}

export function useCourse(slug: string | undefined) {
  const { lang } = useLanguage();
  const [state, setState] = useState<AsyncState<DbCourse>>({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    getPublishedCourseBySlug(supabase, slug)
      .then((course) => {
        if (!cancelled) setState({ data: course, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err instanceof Error ? err.message : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const localized = state.data ? localizeCourse(state.data, lang) : null;

  return { course: localized, dbCourse: state.data, loading: state.loading, error: state.error };
}

export function useCourseById(courseId: string | undefined) {
  const { lang } = useLanguage();
  const [state, setState] = useState<AsyncState<DbCourse>>({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    getPublishedCoursesByIds(supabase, [courseId])
      .then((courses) => {
        if (!cancelled) setState({ data: courses[0] ?? null, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err instanceof Error ? err.message : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const localized = state.data ? localizeCourse(state.data, lang) : null;

  return { course: localized, dbCourse: state.data, loading: state.loading, error: state.error };
}
