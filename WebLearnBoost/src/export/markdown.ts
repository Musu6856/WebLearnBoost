import type { LearningPackage, QuizQuestion, SummaryItem } from "../shared/types";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function escapeHeading(text: string): string {
  return text.replace(/#/g, "\\#").trim();
}

function listItems(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- 无";
}

function summaryItems(items: SummaryItem[]): string {
  if (items.length === 0) {
    return "- 无";
  }

  return items
    .map((item) => {
      const lines = [`- ${item.text}`];
      if (item.sourceQuote) {
        lines.push(`  > ${item.sourceQuote}`);
      }
      return lines.join("\n");
    })
    .join("\n");
}

function quizItems(items: QuizQuestion[], answers: Record<string, string>): string {
  if (items.length === 0) {
    return "- 无";
  }

  return items
    .map((item, index) => {
      const selectedAnswer = answers[item.id];
      const options = item.options
        .map((option) => {
          const markers = [
            option.id === item.correctOptionId ? "正确" : "",
            option.id === selectedAnswer ? "已选" : "",
          ].filter(Boolean);
          const suffix = markers.length > 0 ? ` (${markers.join(", ")})` : "";
          return `   - ${option.id}. ${option.text}${suffix}`;
        })
        .join("\n");

      return [
        `${index + 1}. ${difficultyTag(item.difficulty)}${item.question}`,
        options,
        `   - 解析：${item.explanation}`,
        item.sourceQuote ? `   > ${item.sourceQuote}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function numberedStructure(items: LearningPackage["learningMap"]["structure"]): string {
  if (items.length === 0) {
    return "- 无";
  }

  return items
    .map((item, index) => `${index + 1}. **${item.title}**：${item.description}`)
    .join("\n");
}

function difficultyTag(difficulty?: string): string {
  if (difficulty === "easy") return "【基础】";
  if (difficulty === "hard") return "【挑战】";
  return "【进阶】";
}

export function learningPackageToMarkdown(learningPackage: LearningPackage): string {
  const { learningMap } = learningPackage;

  return [
    `# ${escapeHeading(learningPackage.title)}`,
    "",
    `- 来源：${learningPackage.url}`,
    `- 创建时间：${formatDate(learningPackage.createdAt)}`,
    `- 输入范围：${learningPackage.inputScope === "selection" ? "选中文本" : "整页"}`,
    "",
    "## 学习地图",
    "",
    "### 概览",
    "",
    learningMap.overview || "无",
    "",
    "### 结构",
    "",
    numberedStructure(learningMap.structure),
    "",
    "### 核心概念",
    "",
    listItems(learningMap.concepts),
    "",
    "### 概念关系",
    "",
    listItems(learningMap.conceptRelations),
    "",
    "### 阅读顺序",
    "",
    listItems(learningMap.readingOrder),
    "",
    "### 易错点",
    "",
    listItems(learningMap.pitfalls),
    "",
    "### 前置知识",
    "",
    listItems(learningMap.prerequisites),
    "",
    "## 摘要",
    "",
    summaryItems(learningPackage.summary),
    "",
    "## 练习题",
    "",
    quizItems(learningPackage.quiz, learningPackage.answers),
    "",
    "## 原文摘录",
    "",
    listItems(learningPackage.sourceQuotes),
    "",
  ].join("\n");
}

export function createMarkdownFilename(learningPackage: LearningPackage): string {
  const title = learningPackage.title.trim() || "learning-package";
  const date = learningPackage.createdAt.slice(0, 10) || "export";
  const safeTitle = title
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 80)
    .trim();

  return `${safeTitle || "learning-package"}-${date}.md`;
}

export function downloadMarkdown(markdown: string, filename: string): void {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadLearningPackageMarkdown(learningPackage: LearningPackage): void {
  downloadMarkdown(
    learningPackageToMarkdown(learningPackage),
    createMarkdownFilename(learningPackage),
  );
}
