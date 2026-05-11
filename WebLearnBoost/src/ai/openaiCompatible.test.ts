import { describe, expect, it } from "vitest";
import { createDemoLearningMap, createDemoTrainingContent } from "./openaiCompatible";
import type { ExtractedPageContent } from "../shared/types";

const pageContent: ExtractedPageContent = {
  title: "RAG 入门",
  url: "https://example.com/rag",
  scope: "selection",
  text: "RAG 通过检索外部知识增强回答，并保留原文依据。",
  excerpt: "RAG 通过检索外部知识增强回答。",
  locationHints: [{ textQuote: "RAG 通过检索外部知识增强回答", index: 0 }],
  extractedAt: "2026-05-12T01:20:00.000Z"
};

describe("demo AI fallback", () => {
  it("creates a complete learning map and training package", () => {
    const map = createDemoLearningMap(pageContent);
    const training = createDemoTrainingContent(pageContent, map);

    expect(map.overview).toContain("RAG 入门");
    expect(map.structure.length).toBeGreaterThan(0);
    expect(training.learningMap).toEqual(map);
    expect(training.summary.length).toBeGreaterThan(0);
    expect(training.quiz[0].correctOptionId).toBe("A");
    expect(training.sourceQuotes.length).toBeGreaterThan(0);
  });
});
