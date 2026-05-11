import { ChevronLeft, ChevronRight, Download, ExternalLink, PlayCircle } from "lucide-react";
import { useState } from "react";
import type { LearningMap, LearningPackage } from "../../shared/types";

interface TrainingViewProps {
  isBusy: boolean;
  learningMap: LearningMap | null;
  learningPackage: LearningPackage | null;
  onExportMarkdown: () => void;
  onLocateSourceQuote?: (quote: string) => void;
  onStartTraining: () => void;
}

export function TrainingView({
  isBusy,
  learningMap,
  learningPackage,
  onExportMarkdown,
  onLocateSourceQuote,
  onStartTraining
}: TrainingViewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const questions = learningPackage?.quiz ?? [];
  const currentQuestionIndex = Math.min(questionIndex, Math.max(questions.length - 1, 0));
  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

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
            <span>{answeredCount(answers, questions)} 已答</span>
          </div>
          <h2>{currentQuestion.question}</h2>
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = selectedAnswer && option.id === currentQuestion.correctOptionId;
            return (
              <button
                className={`option ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""}`}
                key={option.id}
                type="button"
                onClick={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: option.id }))}
              >
                {option.text}
              </button>
            );
          })}
          {selectedAnswer && (
            <div className="answer-panel">
              <strong>{selectedAnswer === currentQuestion.correctOptionId ? "回答正确" : "再看一次原文依据"}</strong>
              <p>{currentQuestion.explanation}</p>
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
