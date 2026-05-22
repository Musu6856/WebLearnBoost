import { ChevronLeft, ChevronRight, Download, ExternalLink, PlayCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LearningMap, LearningPackage } from "../../shared/types";

interface TrainingViewProps {
  isBusy: boolean;
  learningMap: LearningMap | null;
  learningPackage: LearningPackage | null;
  onExportMarkdown: () => void;
  onAnswersChange?: (answers: Record<string, string>) => void;
  onAnswersCommit?: (answers: Record<string, string>) => void;
  answersCommitDelayMs?: number;
  onLocateSourceQuote?: (quote: string) => void;
  onStartTraining: () => void;
}

export function TrainingView({
  answersCommitDelayMs = 800,
  isBusy,
  learningMap,
  learningPackage,
  onAnswersCommit,
  onAnswersChange,
  onExportMarkdown,
  onLocateSourceQuote,
  onStartTraining
}: TrainingViewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionResult, setQuestionResult] = useState<Record<string, "correct" | "incorrect">>({});
  const answersCommitTimer = useRef<number | undefined>(undefined);
  const pendingAnswersCommit = useRef<
    | {
        answers: Record<string, string>;
        onCommit: (answers: Record<string, string>) => void;
      }
    | undefined
  >(undefined);
  const autoAdvanceTimer = useRef<number | undefined>(undefined);
  const questions = learningPackage?.quiz ?? [];

  const flushAnswersCommit = () => {
    if (answersCommitTimer.current) {
      window.clearTimeout(answersCommitTimer.current);
      answersCommitTimer.current = undefined;
    }

    const pendingCommit = pendingAnswersCommit.current;
    pendingAnswersCommit.current = undefined;
    pendingCommit?.onCommit(pendingCommit.answers);
  };

  const scheduleAnswersCommit = (nextAnswers: Record<string, string>) => {
    if (!onAnswersCommit) {
      return;
    }

    if (answersCommitDelayMs <= 0) {
      pendingAnswersCommit.current = undefined;
      if (answersCommitTimer.current) {
        window.clearTimeout(answersCommitTimer.current);
        answersCommitTimer.current = undefined;
      }
      onAnswersCommit(nextAnswers);
      return;
    }

    pendingAnswersCommit.current = {
      answers: nextAnswers,
      onCommit: onAnswersCommit
    };

    if (answersCommitTimer.current) {
      window.clearTimeout(answersCommitTimer.current);
    }

    answersCommitTimer.current = window.setTimeout(() => {
      flushAnswersCommit();
    }, Math.max(0, answersCommitDelayMs));
  };

  useEffect(() => {
    setAnswers(learningPackage?.answers ?? {});
    setQuestionResult({});
    setQuestionIndex(0);
  }, [learningPackage?.id]);

  useEffect(() => {
    return () => {
      flushAnswersCommit();
    };
  }, [learningPackage?.id]);

  useEffect(() => {
    if (questions.length > 0 && questionIndex >= questions.length) {
      setQuestionIndex(0);
    }
  }, [questionIndex, questions.length]);

  useEffect(() => {
    return () => {
      flushAnswersCommit();
      if (autoAdvanceTimer.current) {
        window.clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  const currentQuestionIndex = Math.min(questionIndex, Math.max(questions.length - 1, 0));
  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentQuestionResult = currentQuestion ? questionResult[currentQuestion.id] : undefined;

  const selectAnswer = (questionId: string, optionId: string) => {
    const nextAnswers = { ...answers, [questionId]: optionId };
    const nextQuestionResult: Record<string, "correct" | "incorrect"> = {
      ...questionResult,
      [questionId]:
        learningPackage?.quiz.find((question) => question.id === questionId)?.correctOptionId === optionId ? "correct" : "incorrect"
    };
    setAnswers(nextAnswers);
    setQuestionResult(nextQuestionResult);
    onAnswersChange?.(nextAnswers);
    scheduleAnswersCommit(nextAnswers);

    if (autoAdvanceTimer.current) {
      window.clearTimeout(autoAdvanceTimer.current);
    }

    if (nextQuestionResult[questionId] === "correct" && currentQuestionIndex < questions.length - 1) {
      autoAdvanceTimer.current = window.setTimeout(() => {
        setQuestionIndex((current) => (current === currentQuestionIndex ? current + 1 : current));
        autoAdvanceTimer.current = undefined;
      }, 500);
    }
  };

  if (!learningPackage) {
    return (
      <section className="stack">
        <article className="card empty-state">
          <PlayCircle size={30} />
          <h1>训练内容还没生成</h1>
          <p>{learningMap ? "学习地图已经准备好，可以生成重点摘要、自测题和原文依据。" : "请先回到入口生成学习地图。"}</p>
        </article>
        <button className="primary" type="button" onClick={onStartTraining} disabled={!learningMap || isBusy}>
          <PlayCircle size={18} />生成训练内容
        </button>
      </section>
    );
  }

  return (
    <section className="stack">
      <article className="card">
        <span className="eyebrow">重点摘要</span>
        <div className="summary-list">
          {learningPackage.summary.map((item) => (
            <div className="summary-item" key={item.text}>
              <p>{item.text}</p>
              {item.sourceQuote && <span>依据：{item.sourceQuote}</span>}
            </div>
          ))}
        </div>
      </article>

      {currentQuestion && (
        <article className="card quiz-card">
          <div className="quiz-header">
            <span className="eyebrow">自测 {currentQuestionIndex + 1}/{questions.length}</span>
            <span className="eyebrow">{quizDifficultyLabel(currentQuestion.difficulty)}</span>
            <span>{answeredCount(answers, questions)} 已答</span>
          </div>
          <h2>{currentQuestion.question}</h2>
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = currentQuestionResult === "correct" && option.id === currentQuestion.correctOptionId;
            const isWrongSelection = currentQuestionResult === "incorrect" && isSelected;
            return (
              <button
                className={`option ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrongSelection ? "incorrect" : ""}`}
                key={option.id}
                type="button"
                onClick={() => selectAnswer(currentQuestion.id, option.id)}
              >
                {option.text}
              </button>
            );
          })}
          {selectedAnswer && (
            <div className={`answer-panel ${currentQuestionResult === "incorrect" ? "incorrect" : "correct"}`}>
              <strong>{currentQuestionResult === "incorrect" ? "回答错误" : "回答正确"}</strong>
              <p>{currentQuestion.explanation}</p>
              {currentQuestionResult === "incorrect" && <p>先看原文依据，再重新选择。</p>}
            </div>
          )}
          <div className="quiz-nav">
            <button
              className="secondary"
              type="button"
              onClick={() => setQuestionIndex((current) => Math.max(0, current - 1))}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft size={16} />上一题
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => setQuestionIndex((current) => Math.min(questions.length - 1, current + 1))}
              disabled={currentQuestionIndex >= questions.length - 1}
            >
              下一题<ChevronRight size={16} />
            </button>
          </div>
        </article>
      )}

      <article className="card">
        <span className="eyebrow">原文依据</span>
        <div className="source-list">
          {learningPackage.sourceQuotes.map((quote) => (
            <button className="source-button" type="button" key={quote} onClick={() => onLocateSourceQuote?.(quote)}>
              <span>{quote}</span>
              <ExternalLink size={14} />
            </button>
          ))}
        </div>
      </article>

      <button className="secondary" type="button" onClick={onExportMarkdown} disabled={isBusy}>
        <Download size={16} />{learningPackage.exportStatus === "exported" ? "已导出 Markdown" : "导出 Markdown"}
      </button>
    </section>
  );
}

function answeredCount(answers: Record<string, string>, questions: LearningPackage["quiz"]) {
  return questions.filter((question) => Boolean(answers[question.id])).length;
}

function quizDifficultyLabel(difficulty?: string) {
  if (difficulty === "easy") return "基础题";
  if (difficulty === "hard") return "挑战题";
  return "进阶题";
}
