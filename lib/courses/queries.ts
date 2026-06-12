import type { SupabaseClient } from "@supabase/supabase-js";
import type { CourseLevel, CourseLanguageMode, CourseStatus, DbCourse, DbCourseLesson, DbCourseModule, LessonType } from "./types";

// Mirrors frontend/lib/courses/queries.ts (public reads only — admin
// writes live in the web app). Mobile reads straight from Supabase; RLS
// restricts these to status='published', same as the web's anon client.

interface CourseRow {
  id: string;
  slug: string;
  title_en: string;
  title_fr: string;
  description_en: string;
  description_fr: string;
  long_description_en: string;
  long_description_fr: string;
  level: string;
  language: string;
  status: string;
  is_free: boolean;
  price_usd: number | string | null;
  is_african: boolean;
  duration_label: string;
  gradient_from: string;
  gradient_to: string;
  thumbnail_url: string | null;
  tags: string[] | null;
  outcomes_en: string[] | null;
  outcomes_fr: string[] | null;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  course_modules?: ModuleRow[] | null;
}

interface ModuleRow {
  id: string;
  course_id: string;
  title_en: string;
  title_fr: string;
  position: number;
  created_at: string;
  updated_at: string;
  course_lessons?: LessonRow[] | null;
}

interface LessonRow {
  id: string;
  module_id: string;
  title_en: string;
  title_fr: string;
  duration_label: string;
  lesson_type: string;
  content_en: string;
  content_fr: string;
  video_url: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

const COURSE_TREE_SELECT = "*, course_modules(*, course_lessons(*))";

function mapLesson(row: LessonRow): DbCourseLesson {
  return {
    id: row.id,
    moduleId: row.module_id,
    titleEn: row.title_en,
    titleFr: row.title_fr,
    durationLabel: row.duration_label,
    lessonType: row.lesson_type as LessonType,
    contentEn: row.content_en,
    contentFr: row.content_fr,
    videoUrl: row.video_url,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapModule(row: ModuleRow): DbCourseModule {
  return {
    id: row.id,
    courseId: row.course_id,
    titleEn: row.title_en,
    titleFr: row.title_fr,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lessons: (row.course_lessons ?? []).map(mapLesson),
  };
}

function mapCourse(row: CourseRow): DbCourse {
  return {
    id: row.id,
    slug: row.slug,
    titleEn: row.title_en,
    titleFr: row.title_fr,
    descriptionEn: row.description_en,
    descriptionFr: row.description_fr,
    longDescriptionEn: row.long_description_en,
    longDescriptionFr: row.long_description_fr,
    level: row.level as CourseLevel,
    language: row.language as CourseLanguageMode,
    status: row.status as CourseStatus,
    isFree: row.is_free,
    priceUsd: row.price_usd === null ? null : Number(row.price_usd),
    isAfrican: row.is_african,
    durationLabel: row.duration_label,
    gradientFrom: row.gradient_from,
    gradientTo: row.gradient_to,
    thumbnailUrl: row.thumbnail_url,
    tags: row.tags ?? [],
    outcomesEn: row.outcomes_en ?? [],
    outcomesFr: row.outcomes_fr ?? [],
    position: row.position,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    modules: (row.course_modules ?? []).map(mapModule),
  };
}

export async function listPublishedCourses(supabase: SupabaseClient): Promise<DbCourse[]> {
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_TREE_SELECT)
    .eq("status", "published")
    .order("position", { ascending: true });

  if (error) throw error;
  return (data as CourseRow[] | null)?.map(mapCourse) ?? [];
}

export async function getPublishedCourseBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<DbCourse | null> {
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_TREE_SELECT)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapCourse(data as CourseRow) : null;
}

export async function getPublishedCoursesByIds(supabase: SupabaseClient, ids: string[]): Promise<DbCourse[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_TREE_SELECT)
    .eq("status", "published")
    .in("id", ids);

  if (error) throw error;
  return (data as CourseRow[] | null)?.map(mapCourse) ?? [];
}
