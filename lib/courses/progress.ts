import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbCourse } from "./types";

// Direct port of frontend/lib/courses/progress.ts — same RLS-scoped reads/
// writes (auth.uid() = user_id keeps a learner scoped to their own rows).

export type LessonProgressStatus = "in_progress" | "completed";

export interface DbCourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  lastAccessedAt: string;
  completedAt: string | null;
}

export interface DbLessonProgress {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  status: LessonProgressStatus;
  completedAt: string | null;
  lastViewedAt: string;
}

export interface DbLessonNote {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  body: string;
  updatedAt: string;
}

export interface CourseProgressSummary {
  courseId: string;
  enrolled: boolean;
  enrolledAt: string | null;
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
  completedLessonIds: string[];
  nextLessonId: string | null;
  firstLessonId: string | null;
}

interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  last_accessed_at: string;
  completed_at: string | null;
}

interface LessonProgressRow {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  status: string;
  completed_at: string | null;
  last_viewed_at: string;
}

interface LessonNoteRow {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  body: string;
  updated_at: string;
}

function mapEnrollment(row: EnrollmentRow): DbCourseEnrollment {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    enrolledAt: row.enrolled_at,
    lastAccessedAt: row.last_accessed_at,
    completedAt: row.completed_at,
  };
}

function mapLessonProgress(row: LessonProgressRow): DbLessonProgress {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    status: row.status as LessonProgressStatus,
    completedAt: row.completed_at,
    lastViewedAt: row.last_viewed_at,
  };
}

function mapLessonNote(row: LessonNoteRow): DbLessonNote {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    body: row.body,
    updatedAt: row.updated_at,
  };
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

export async function getEnrollment(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<DbCourseEnrollment | null> {
  const { data, error } = await supabase
    .from("course_enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapEnrollment(data as EnrollmentRow) : null;
}

/** Idempotent — enrolling twice simply returns the existing row. */
export async function enrollInCourse(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<DbCourseEnrollment> {
  const existing = await getEnrollment(supabase, userId, courseId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("course_enrollments")
    .upsert(
      { user_id: userId, course_id: courseId, last_accessed_at: new Date().toISOString() },
      { onConflict: "user_id,course_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return mapEnrollment(data as EnrollmentRow);
}

export async function touchEnrollment(supabase: SupabaseClient, userId: string, courseId: string): Promise<void> {
  const { error } = await supabase
    .from("course_enrollments")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (error) throw error;
}

export async function listUserEnrollments(supabase: SupabaseClient, userId: string): Promise<DbCourseEnrollment[]> {
  const { data, error } = await supabase
    .from("course_enrollments")
    .select("*")
    .eq("user_id", userId)
    .order("last_accessed_at", { ascending: false });

  if (error) throw error;
  return (data as EnrollmentRow[] | null)?.map(mapEnrollment) ?? [];
}

// ─── Lesson progress ─────────────────────────────────────────────────────────

export async function listLessonProgressForCourse(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<DbLessonProgress[]> {
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (error) throw error;
  return (data as LessonProgressRow[] | null)?.map(mapLessonProgress) ?? [];
}

export async function listLessonProgressForCourses(
  supabase: SupabaseClient,
  userId: string,
  courseIds: string[],
): Promise<DbLessonProgress[]> {
  if (courseIds.length === 0) return [];

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .in("course_id", courseIds);

  if (error) throw error;
  return (data as LessonProgressRow[] | null)?.map(mapLessonProgress) ?? [];
}

export async function upsertLessonProgress(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  lessonId: string,
  status: LessonProgressStatus,
): Promise<DbLessonProgress> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        status,
        completed_at: status === "completed" ? now : null,
        last_viewed_at: now,
      },
      { onConflict: "user_id,lesson_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return mapLessonProgress(data as LessonProgressRow);
}

export function buildCourseProgressSummary(
  course: DbCourse,
  enrollment: DbCourseEnrollment | null,
  progressRows: DbLessonProgress[],
): CourseProgressSummary {
  const orderedLessonIds = [...course.modules]
    .sort((a, b) => a.position - b.position)
    .flatMap((module) =>
      [...module.lessons].sort((a, b) => a.position - b.position).map((lesson) => lesson.id),
    );

  const completedSet = new Set(
    progressRows.filter((row) => row.status === "completed").map((row) => row.lessonId),
  );
  const completedLessonIds = orderedLessonIds.filter((id) => completedSet.has(id));
  const nextLessonId = orderedLessonIds.find((id) => !completedSet.has(id)) ?? null;
  const totalLessons = orderedLessonIds.length;
  const completedLessons = completedLessonIds.length;

  return {
    courseId: course.id,
    enrolled: enrollment !== null,
    enrolledAt: enrollment?.enrolledAt ?? null,
    totalLessons,
    completedLessons,
    percentComplete: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
    completedLessonIds,
    nextLessonId,
    firstLessonId: orderedLessonIds[0] ?? null,
  };
}

// ─── Lesson notes ────────────────────────────────────────────────────────────

export async function getLessonNote(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
): Promise<DbLessonNote | null> {
  const { data, error } = await supabase
    .from("lesson_notes")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapLessonNote(data as LessonNoteRow) : null;
}

export async function upsertLessonNote(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  lessonId: string,
  body: string,
): Promise<DbLessonNote> {
  const { data, error } = await supabase
    .from("lesson_notes")
    .upsert(
      { user_id: userId, course_id: courseId, lesson_id: lessonId, body },
      { onConflict: "user_id,lesson_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return mapLessonNote(data as LessonNoteRow);
}

export async function deleteLessonNote(supabase: SupabaseClient, userId: string, lessonId: string): Promise<void> {
  const { error } = await supabase
    .from("lesson_notes")
    .delete()
    .eq("user_id", userId)
    .eq("lesson_id", lessonId);

  if (error) throw error;
}
