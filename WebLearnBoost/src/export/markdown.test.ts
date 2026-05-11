import { describe, expect, it } from "vitest";
import { createMarkdownFilename, learningPackageToMarkdown } from "./markdown";
import type { LearningPackage } from "../shared/types";

const learningPackage: LearningPackage = {
  id: "pkg-test",
  title: "RAG 架构: 从检索到生成?",
  url: "https://example.com/rag",
  createdAt: "2026-05-12T01:20:00.000Z",
  inputScope: "page",
  sourceText: "RAG 通过检索外部知识增强大模型回答。",
  learningMap: {
    overview: "这篇资料解释 RAG 的基本路径。",
    structure: [{ title: "检索", description: "先找到相关资料。" }],
    concepts: ["RAG", "Embedding"],
    conceptRelations: ["检索结果影响生成质量"],
    readingOrder: ["先看背景", "再看流程"],
    pitfalls: ["不要忽略原文依据"],
    prerequisites: ["LLM 基础"]
  },
  summary: [
    {
      text: "RAG 的价值是把外部资料注入上下文。",
      sourceQuote: "检索外部知识增强大模型回答"
    }
  ],
  quiz: [
    {
      id: "q1",
      question: "RAG 为什么需要原文依据？",
      options: [
        { id: "A", text: "便于核对结论" },
        { id: "B", text: "替代所有阅读" }
      ],
      correctOptionId: "A",
      explanation: "原文依据能帮助用户回看上下文。",
      sourceQuote: "检索外部知识增强大模型回答"
    }
  ],
  answers: { q1: "A" },
  sourceQuotes: ["检索外部知识增强大模型回答"],
  locationHints: [{ textQuote: "检索外部知识增强大模型回答", index: 0 }],
  exportStatus: "idle"
};

describe("learningPackageToMarkdown", () => {
  it("exports the core learning package sections", () => {
    const markdown = learningPackageToMarkdown(learningPackage);

    expect(markdown).toContain("# RAG 架构: 从检索到生成?");
    expect(markdown).toContain("## 学习地图");
    expect(markdown).toContain("## 摘要");
    expect(markdown).toContain("## 练习题");
    expect(markdown).toContain("## 原文摘录");
    expect(markdown).toContain("便于核对结论 (正确, 已选)");
  });
});

describe("createMarkdownFilename", () => {
  it("removes characters that are invalid in download filenames", () => {
    expect(createMarkdownFilename(learningPackage)).toBe("RAG 架构- 从检索到生成--2026-05-12.md");
  });
});
