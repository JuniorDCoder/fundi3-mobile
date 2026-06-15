import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Code2,
  Compass,
  FileText,
  HelpCircle,
  PlayCircle,
} from "lucide-react-native";
import { toast } from "sonner-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "../../../components/ui/Button";
import { GlassCard } from "../../../components/ui/GlassCard";
import { LessonMarkdown } from "../../../components/ui/LessonMarkdown";
import { SkeletonLesson } from "../../../components/ui/Skeleton";
import { CodePlayground } from "../../../components/learn/CodePlayground";
import { QuizBlock } from "../../../components/learn/QuizBlock";
import { VideoEmbed } from "../../../components/learn/VideoEmbed";
import { CertClaimBanner } from "../../../components/certificates/CertClaimBanner";
import { brand, fonts } from "../../../lib/theme/brand";
import { useAuth } from "../../../hooks/useAuth";
import { useCourseById } from "../../../hooks/useCourses";
import { useLanguage } from "../../../hooks/useLanguage";
import { supabase } from "../../../lib/supabase/client";
import {
  enrollInCourse,
  getLessonNote,
  touchEnrollment,
  upsertLessonNote,
  upsertLessonProgress,
  type LessonProgressStatus,
} from "../../../lib/courses/progress";
import type { LessonType, LocalizedLesson } from "../../../lib/courses/types";

const LESSON_TYPE_ICONS: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  text: FileText,
  code: Code2,
  quiz: HelpCircle,
};

function progressCacheKey(userId: string, courseId: string): string {
  return `fundi3:courseProgress:${userId}:${courseId}`;
}

export default function LessonPlayerScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const { course, dbCourse, loading } = useCourseById(courseId);
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [noteStatus, setNoteStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [busy, setBusy] = useState(false);
  const [showCertBanner, setShowCertBanner] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  // Guards against rapid double-taps (or quiz + button) firing setProgress("completed")
  // twice for the same lesson before `busy`/`completedIds` update — without this,
  // multiple "Lesson completed" toasts can stack.
  const completingRef = useRef<Set<string>>(new Set());

  const ordered = useMemo(() => {
    if (!course) return [] as LocalizedLesson[];
    return course.modules.flatMap((module) => module.lessons);
  }, [course]);

  const lessonIndex = ordered.findIndex((l) => l.id === lessonId);
  const lesson = lessonIndex >= 0 ? ordered[lessonIndex] : null;
  const prevLesson = lessonIndex > 0 ? ordered[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < ordered.length - 1 ? ordered[lessonIndex + 1] : null;

  const refreshProgress = useCallback(async () => {
    if (!user || !dbCourse) return;
    const { data } = await supabase
      .from("lesson_progress")
      .select("lesson_id, status")
      .eq("user_id", user.id)
      .eq("course_id", dbCourse.id)
      .eq("status", "completed");
    const ids = (data ?? []).map((row: { lesson_id: string }) => row.lesson_id);
    setCompletedIds(new Set(ids));
    AsyncStorage.setItem(progressCacheKey(user.id, dbCourse.id), JSON.stringify(ids)).catch(() => {});
  }, [user, dbCourse]);

  // Hydrate from the local cache instantly — avoids the "Mark complete" button and
  // curriculum checkmarks flashing the wrong state while Supabase responds.
  useEffect(() => {
    if (!user || !dbCourse) return;
    let cancelled = false;
    AsyncStorage.getItem(progressCacheKey(user.id, dbCourse.id))
      .then((raw) => {
        if (cancelled || !raw) return;
        setCompletedIds(new Set(JSON.parse(raw) as string[]));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, dbCourse]);

  useEffect(() => {
    if (!user || !dbCourse) return;
    enrollInCourse(supabase, user.id, dbCourse.id)
      .then(() => touchEnrollment(supabase, user.id, dbCourse.id))
      .then(refreshProgress);
  }, [user, dbCourse, refreshProgress]);

  useEffect(() => {
    if (!user || !lesson) return;
    setNote("");
    setNoteStatus("idle");
    getLessonNote(supabase, user.id, lesson.id).then((existing) => {
      if (existing) setNote(existing.body);
    });
  }, [user, lesson?.id]);

  useEffect(() => {
    if (!lesson) return;
    setQuizPassed(completedIds.has(lesson.id));
  }, [lesson?.id, completedIds]);

  const isCompleted = lesson ? completedIds.has(lesson.id) : false;
  const hasVideo = lesson?.lessonType === "video" && !!lesson.videoUrl;
  const hasCode = lesson?.lessonType === "code" && !!lesson.codeLanguage;
  const hasQuiz = lesson?.lessonType === "quiz" && (lesson?.quiz.length ?? 0) > 0;
  const canProceed = !(hasQuiz && !quizPassed);

  const setProgress = async (status: LessonProgressStatus) => {
    if (!user || !dbCourse || !lesson) return;
    if (status === "completed") {
      if (isCompleted || completingRef.current.has(lesson.id)) return;
      completingRef.current.add(lesson.id);
    } else {
      completingRef.current.delete(lesson.id);
    }
    setBusy(true);
    try {
      await upsertLessonProgress(supabase, user.id, dbCourse.id, lesson.id, status);
      await refreshProgress();
      if (status === "completed") {
        toast.success(t("toast.lessonCompleted"), {
          id: `lesson-completed-${lesson.id}`,
          description: t("toast.lessonCompletedDesc"),
        });
        // Check if this was the last lesson
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("lesson_id, status")
          .eq("user_id", user.id)
          .eq("course_id", dbCourse.id)
          .eq("status", "completed");
        const completedCount = progressData?.length ?? 0;
        if (completedCount === ordered.length) {
          setShowCertBanner(true);
        }
      }
    } finally {
      completingRef.current.delete(lesson.id);
      setBusy(false);
    }
  };

  const handleSaveNote = async (body: string) => {
    if (!user || !dbCourse || !lesson) return;
    setNoteStatus("saving");
    try {
      await upsertLessonNote(supabase, user.id, dbCourse.id, lesson.id, body);
      setNoteStatus("saved");
    } catch {
      setNoteStatus("idle");
    }
  };

  const goToLesson = (target: LocalizedLesson | null) => {
    if (!target || !dbCourse) return;
    router.replace(`/learn/${dbCourse.id}/${target.id}`);
  };

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <SkeletonLesson />
      </View>
    );
  }

  if (!course || !dbCourse || !lesson) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <ArrowLeft color={brand.white} size={20} />
        </Pressable>
        <Compass color={brand.dark.muted} size={32} />
        <Text style={styles.notFoundTitle}>{t("learn.notFound")}</Text>
        <Text style={styles.notFoundBody}>{t("learn.notFoundBody")}</Text>
      </View>
    );
  }

  const TypeIcon = LESSON_TYPE_ICONS[lesson.lessonType];
  const showComingSoon =
    (lesson.lessonType === "video" && !hasVideo) ||
    (lesson.lessonType === "quiz" && !hasQuiz) ||
    (lesson.lessonType === "code" && !hasCode);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={() => router.push(`/courses/${course.slug}`)} style={styles.backRow}>
        <ArrowLeft color={brand.white} size={18} />
        <Text style={styles.backText}>{t("learn.back")}</Text>
      </Pressable>

      <View style={styles.headerBlock}>
        <Text style={styles.lessonOf}>
          {t("learn.lessonOf", { current: String(lessonIndex + 1), total: String(ordered.length) })}
        </Text>
        <View style={styles.titleRow}>
          <TypeIcon color={brand.green[400]} size={22} />
          <Text style={styles.title}>{lesson.title}</Text>
        </View>
        <Text style={styles.duration}>{lesson.duration}</Text>
      </View>

      <GlassCard style={{ gap: 12 }}>
        {showComingSoon && (
          <Text style={styles.comingSoon}>
            {t("learn.lessonTypeComingSoon", { type: t(`learn.lessonType${capitalize(lesson.lessonType)}`) })}
          </Text>
        )}
        <LessonMarkdown content={lesson.content} />
        {hasVideo && <VideoEmbed url={lesson.videoUrl!} />}
        {hasCode && (
          <CodePlayground
            codeLanguage={lesson.codeLanguage!}
            codeStarter={lesson.codeStarter}
            title={lesson.title}
          />
        )}
        {hasQuiz && (
          <QuizBlock
            questions={lesson.quiz}
            onPassed={() => {
              setQuizPassed(true);
              setProgress("completed");
            }}
          />
        )}
      </GlassCard>

      <Button
        label={isCompleted ? t("learn.markIncomplete") : t("learn.markComplete")}
        variant={isCompleted ? "ghost" : "primary"}
        onPress={() => setProgress(isCompleted ? "in_progress" : "completed")}
        loading={busy}
        disabled={hasQuiz && !quizPassed}
      />

      <View style={styles.navRow}>
        <Pressable
          style={[styles.navButton, !prevLesson && styles.navButtonDisabled]}
          disabled={!prevLesson}
          onPress={() => goToLesson(prevLesson)}
        >
          <ChevronLeft color={prevLesson ? brand.white : brand.dark.muted} size={18} />
          <Text style={[styles.navButtonText, !prevLesson && styles.navButtonTextDisabled]}>
            {t("learn.prevLesson")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.navButton, (!nextLesson || !canProceed) && styles.navButtonDisabled]}
          disabled={!nextLesson || !canProceed}
          onPress={() => goToLesson(nextLesson)}
        >
          <Text style={[styles.navButtonText, (!nextLesson || !canProceed) && styles.navButtonTextDisabled]}>
            {!canProceed
              ? t("learn.quizLockedShort")
              : nextLesson
                ? t("learn.nextLesson")
                : t("learn.finishCourse")}
          </Text>
          <ChevronRight color={nextLesson && canProceed ? brand.white : brand.dark.muted} size={18} />
        </Pressable>
      </View>

      {showCertBanner && dbCourse && course && (
        <CertClaimBanner
          courseId={dbCourse.id}
          courseName={course.title}
          onClaimed={() => {}}
        />
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("learn.notes")}</Text>
        <TextInput
          value={note}
          onChangeText={(value) => {
            setNote(value);
            setNoteStatus("idle");
          }}
          onBlur={() => handleSaveNote(note)}
          placeholder={t("learn.notesPlaceholder")}
          placeholderTextColor={brand.dark.muted}
          style={styles.notesInput}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.notesStatus}>
          {noteStatus === "saving" ? t("learn.notesSaving") : noteStatus === "saved" ? t("learn.notesSaved") : ""}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("learn.curriculum")}</Text>
        <View style={{ gap: 6 }}>
          {ordered.map((item, idx) => {
            const done = completedIds.has(item.id);
            const active = item.id === lesson.id;
            return (
              <Pressable
                key={item.id}
                style={[styles.curriculumRow, active && styles.curriculumRowActive]}
                onPress={() => goToLesson(item)}
              >
                {done ? (
                  <CheckCircle2 color={brand.green[400]} size={16} />
                ) : (
                  <Circle color={brand.dark.muted} size={16} />
                )}
                <Text style={[styles.curriculumText, active && styles.curriculumTextActive]} numberOfLines={1}>
                  {idx + 1}. {item.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 20,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.white,
  },
  headerBlock: { gap: 6 },
  lessonOf: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: brand.amber[400],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    flex: 1,
    fontFamily: fonts.headingSemibold,
    fontSize: 22,
    color: brand.white,
  },
  duration: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: brand.dark.muted,
  },
  comingSoon: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontStyle: "italic",
    color: brand.amber[400],
  },
  lessonContent: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: brand.white,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.white,
  },
  navButtonTextDisabled: {
    color: brand.dark.muted,
  },
  section: { gap: 10 },
  sectionTitle: {
    fontFamily: fonts.headingSemibold,
    fontSize: 17,
    color: brand.white,
  },
  notesInput: {
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    color: brand.white,
    fontFamily: fonts.body,
    fontSize: 14,
    padding: 14,
  },
  notesStatus: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: brand.dark.muted,
    minHeight: 16,
  },
  curriculumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  curriculumRowActive: {
    backgroundColor: "rgba(15,110,86,0.18)",
  },
  curriculumText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: brand.dark.muted,
  },
  curriculumTextActive: {
    color: brand.white,
    fontFamily: fonts.bodyMedium,
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
