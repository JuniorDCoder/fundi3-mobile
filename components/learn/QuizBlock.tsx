import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react-native";
import { brand, fonts, glass } from "../../lib/theme/brand";
import { useLanguage } from "../../hooks/useLanguage";
import type { LocalizedQuizQuestion } from "../../lib/courses/types";

const INCORRECT_COLOR = "#EF4444";

interface QuestionState {
  selectedIndex: number | null;
  revealed: boolean;
}

interface Props {
  questions: LocalizedQuizQuestion[];
  onPassed: () => void;
}

export function QuizBlock({ questions, onPassed }: Props) {
  const { t } = useLanguage();
  const [state, setState] = useState<Record<string, QuestionState>>(() =>
    Object.fromEntries(
      questions.map((q) => [q.id, { selectedIndex: null, revealed: false }]),
    ),
  );
  const passedRef = useRef(false);

  const correctCount = questions.filter(
    (q) => state[q.id]?.selectedIndex === q.correctIndex,
  ).length;
  const allCorrect = questions.length > 0 && correctCount === questions.length;

  useEffect(() => {
    if (allCorrect && !passedRef.current) {
      passedRef.current = true;
      onPassed();
    }
  }, [allCorrect, onPassed]);

  function selectOption(questionId: string, index: number) {
    setState((prev) => ({
      ...prev,
      [questionId]: { selectedIndex: index, revealed: true },
    }));
  }

  function retry(questionId: string) {
    setState((prev) => ({
      ...prev,
      [questionId]: { selectedIndex: null, revealed: false },
    }));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>
        {t("learn.quizProgress", {
          correct: String(correctCount),
          total: String(questions.length),
        })}
      </Text>

      {questions.map((question, qi) => {
        const qState = state[question.id] ?? { selectedIndex: null, revealed: false };
        const isCorrect = qState.selectedIndex === question.correctIndex;

        return (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionText}>
              {qi + 1}. {question.question}
            </Text>

            <View style={{ gap: 8 }}>
              {question.options.map((option, oi) => {
                const isSelected = qState.selectedIndex === oi;
                const isCorrectOption = oi === question.correctIndex;

                let optionStyle: ViewStyle = styles.option;
                let icon = null;
                if (qState.revealed) {
                  if (isCorrectOption) {
                    optionStyle = styles.optionCorrect;
                    icon = <CheckCircle2 color={brand.green[400]} size={18} />;
                  } else if (isSelected) {
                    optionStyle = styles.optionIncorrect;
                    icon = <XCircle color={INCORRECT_COLOR} size={18} />;
                  } else {
                    optionStyle = styles.optionDimmed;
                  }
                }

                return (
                  <Pressable
                    key={oi}
                    style={[styles.option, optionStyle]}
                    onPress={() => selectOption(question.id, oi)}
                    disabled={qState.revealed}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                    {icon}
                  </Pressable>
                );
              })}
            </View>

            {qState.revealed && (
              <View style={{ gap: 8 }}>
                <Text
                  style={[
                    styles.feedback,
                    isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
                  ]}
                >
                  {isCorrect ? t("learn.quizCorrect") : t("learn.quizIncorrect")}
                </Text>
                {question.explanation ? (
                  <Text style={styles.explanation}>{question.explanation}</Text>
                ) : null}
                {!isCorrect && (
                  <Pressable style={styles.retryButton} onPress={() => retry(question.id)}>
                    <RotateCcw color={brand.white} size={14} />
                    <Text style={styles.retryText}>{t("learn.quizTryAgain")}</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        );
      })}

      <View style={[styles.banner, allCorrect ? styles.bannerSuccess : styles.bannerWarning]}>
        <Text
          style={[
            styles.bannerText,
            allCorrect ? styles.bannerTextSuccess : styles.bannerTextWarning,
          ]}
        >
          {allCorrect ? t("learn.quizPassed") : t("learn.quizMustPass")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  progress: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.amber[400],
  },
  questionCard: {
    gap: 10,
    backgroundColor: glass.surface,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: 14,
    padding: 14,
  },
  questionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: brand.white,
    lineHeight: 22,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  optionCorrect: {
    borderColor: brand.green[400],
    backgroundColor: "rgba(29,158,117,0.16)",
  },
  optionIncorrect: {
    borderColor: INCORRECT_COLOR,
    backgroundColor: "rgba(239,68,68,0.12)",
  },
  optionDimmed: {
    opacity: 0.6,
  },
  optionText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: brand.white,
  },
  feedback: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  feedbackCorrect: {
    color: brand.green[400],
  },
  feedbackIncorrect: {
    color: INCORRECT_COLOR,
  },
  explanation: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: brand.dark.muted,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  retryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.white,
  },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  bannerSuccess: {
    backgroundColor: "rgba(29,158,117,0.14)",
    borderColor: brand.green[400],
  },
  bannerWarning: {
    backgroundColor: "rgba(239,159,39,0.10)",
    borderColor: brand.amber[400],
  },
  bannerText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 20,
  },
  bannerTextSuccess: {
    color: brand.green[100],
  },
  bannerTextWarning: {
    color: brand.amber[400],
  },
});
