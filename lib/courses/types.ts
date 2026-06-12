import type { Lang } from "../i18n";

// Mirrors frontend/lib/courses/types.ts (learner-facing subset only — no
// admin write payloads, since the mobile app is read/enroll/learn only).

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseLanguageMode = "en" | "fr" | "both";
export type CourseStatus = "draft" | "published" | "archived";
export type LessonType = "video" | "text" | "code" | "quiz";

export interface DbCourseLesson {
  id: string;
  moduleId: string;
  titleEn: string;
  titleFr: string;
  durationLabel: string;
  lessonType: LessonType;
  contentEn: string;
  contentFr: string;
  videoUrl: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbCourseModule {
  id: string;
  courseId: string;
  titleEn: string;
  titleFr: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  lessons: DbCourseLesson[];
}

export interface DbCourse {
  id: string;
  slug: string;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  longDescriptionEn: string;
  longDescriptionFr: string;
  level: CourseLevel;
  language: CourseLanguageMode;
  status: CourseStatus;
  isFree: boolean;
  priceUsd: number | null;
  isAfrican: boolean;
  durationLabel: string;
  gradientFrom: string;
  gradientTo: string;
  thumbnailUrl: string | null;
  tags: string[];
  outcomesEn: string[];
  outcomesFr: string[];
  position: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  modules: DbCourseModule[];
}

// ─── Localized view models — what the UI actually renders ────────────────────

export interface LocalizedLesson {
  id: string;
  title: string;
  duration: string;
  lessonType: LessonType;
  content: string;
  videoUrl: string | null;
}

export interface LocalizedModule {
  id: string;
  title: string;
  lessons: LocalizedLesson[];
}

export interface LocalizedCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  level: CourseLevel;
  isFree: boolean;
  priceUsd: number | null;
  isAfrican: boolean;
  duration: string;
  gradientFrom: string;
  gradientTo: string;
  thumbnailUrl: string | null;
  tags: string[];
  outcomes: string[];
  modules: LocalizedModule[];
}

function pickText(lang: Lang, en: string, fr: string): string {
  if (lang === "fr") return fr || en;
  return en || fr;
}

function pickList(lang: Lang, en: string[], fr: string[]): string[] {
  if (lang === "fr") return fr.length ? fr : en;
  return en.length ? en : fr;
}

export function localizeCourse(course: DbCourse, lang: Lang): LocalizedCourse {
  return {
    id: course.id,
    slug: course.slug,
    title: pickText(lang, course.titleEn, course.titleFr),
    description: pickText(lang, course.descriptionEn, course.descriptionFr),
    longDescription: pickText(lang, course.longDescriptionEn, course.longDescriptionFr),
    level: course.level,
    isFree: course.isFree,
    priceUsd: course.priceUsd,
    isAfrican: course.isAfrican,
    duration: course.durationLabel,
    gradientFrom: course.gradientFrom,
    gradientTo: course.gradientTo,
    thumbnailUrl: course.thumbnailUrl,
    tags: course.tags,
    outcomes: pickList(lang, course.outcomesEn, course.outcomesFr),
    modules: [...course.modules]
      .sort((a, b) => a.position - b.position)
      .map((module) => ({
        id: module.id,
        title: pickText(lang, module.titleEn, module.titleFr),
        lessons: [...module.lessons]
          .sort((a, b) => a.position - b.position)
          .map((lesson) => ({
            id: lesson.id,
            title: pickText(lang, lesson.titleEn, lesson.titleFr),
            duration: lesson.durationLabel,
            lessonType: lesson.lessonType,
            content: pickText(lang, lesson.contentEn, lesson.contentFr),
            videoUrl: lesson.videoUrl,
          })),
      })),
  };
}

export function localizedLessonCount(course: LocalizedCourse): number {
  return course.modules.reduce((total, module) => total + module.lessons.length, 0);
}

export function localizedModuleCount(course: LocalizedCourse): number {
  return course.modules.length;
}

export function levelBadgeKey(level: CourseLevel): string {
  return `courses.badge.${level}`;
}
