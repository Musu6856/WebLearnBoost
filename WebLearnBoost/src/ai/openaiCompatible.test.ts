import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAnthropicCompatibleEndpoint,
  buildOpenAICompatibleEndpoint,
  createDemoLearningMap,
  createDemoTrainingContent,
  extractAnthropicTextContent,
  generateLearningMap,
  generateTrainingContent
} from "./openaiCompatible";
import type { AppSettings, ExtractedPageContent, LearningMap } from "../shared/types";

const pageContent: ExtractedPageContent = {
  title: "RAG 入门",
  url: "https://example.com/rag",
  scope: "selection",
  text: "RAG 通过检索外部知识增强回答，并保留原文依据。",
  excerpt: "RAG 通过检索外部知识增强回答。",
  locationHints: [{ textQuote: "RAG 通过检索外部知识增强回答", index: 0 }],
  extractedAt: "2026-05-12T01:20:00.000Z"
};

const learningMapResponse: LearningMap = {
  overview: "RAG 用检索到的外部知识增强回答。",
  structure: [{ title: "检索", description: "先找到相关资料。" }],
  concepts: ["RAG", "检索"],
  conceptRelations: ["检索结果支撑生成质量"],
  readingOrder: ["先理解检索", "再理解生成"],
  pitfalls: ["不要忽略原文依据"],
  prerequisites: ["LLM 基础"]
};

const trainingResponse = {
  summary: [{ text: "RAG 会把外部知识放进上下文。", sourceQuote: "检索外部知识增强回答" }],
  quiz: [
    {
      id: "q1",
      question: "RAG 的关键价值是什么？",
      options: [
        { id: "A", text: "增强回答依据" },
        { id: "B", text: "替代网页阅读" },
        { id: "C", text: "只生成标题" }
      ],
      correctOptionId: "A",
      explanation: "RAG 通过检索资料给回答提供依据。",
      difficulty: "medium",
      sourceQuote: "检索外部知识增强回答"
    }
  ],
  sourceQuotes: ["检索外部知识增强回答"]
};

const openAISettings: AppSettings = {
  provider: "openai-compatible",
  baseUrl: "https://models.example.test/v1",
  apiKey: "test-key",
  model: "model-a",
  outputLanguage: "中文"
};

const anthropicSettings: AppSettings = {
  provider: "anthropic-compatible",
  baseUrl: "https://anthropic-compatible.example.test/custom",
  apiKey: "anthropic-key",
  model: "model-b",
  outputLanguage: "中文"
};

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    status: init?.status ?? 200,
    headers: { "content-type": "application/json" }
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

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

describe("provider endpoint builders", () => {
  it("builds OpenAI-compatible chat completions endpoints", () => {
    expect(buildOpenAICompatibleEndpoint("https://models.example.test/v1/")).toBe(
      "https://models.example.test/v1/chat/completions"
    );
  });

  it("builds Anthropic-compatible messages endpoints", () => {
    expect(buildAnthropicCompatibleEndpoint("https://models.example.test")).toBe("https://models.example.test/v1/messages");
    expect(buildAnthropicCompatibleEndpoint("https://models.example.test/custom")).toBe(
      "https://models.example.test/custom/v1/messages"
    );
    expect(buildAnthropicCompatibleEndpoint("https://models.example.test/v1")).toBe("https://models.example.test/v1/messages");
    expect(buildAnthropicCompatibleEndpoint("https://models.example.test/v1/messages")).toBe(
      "https://models.example.test/v1/messages"
    );
  });
});

describe("provider requests", () => {
  it("keeps OpenAI-compatible request URL, headers, and body", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({
        choices: [{ message: { content: JSON.stringify(learningMapResponse) } }]
      })
    );

    const result = await generateLearningMap(openAISettings, pageContent);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://models.example.test/v1/chat/completions");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer test-key"
    });
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: "model-a",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
  });

  it("asks for plausible quiz distractors and difficulty labels", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({
        choices: [{ message: { content: JSON.stringify(trainingResponse) } }]
      })
    );

    const result = await generateTrainingContent(openAISettings, pageContent, learningMapResponse);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.messages[0].content).toContain("3-option multiple-choice questions");
    expect(body.messages[0].content).toContain("difficulty");
    expect(body.messages[0].content).toContain("Avoid making the correct answer always appear in the same option position");
  });

  it("sends Anthropic-compatible headers and messages body", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({
        content: [{ type: "text", text: JSON.stringify(learningMapResponse) }]
      })
    );

    const result = await generateLearningMap(anthropicSettings, pageContent);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(url).toBe("https://anthropic-compatible.example.test/custom/v1/messages");
    expect(init.headers).toMatchObject({
      "content-type": "application/json",
      "x-api-key": "anthropic-key",
      "anthropic-version": "2023-06-01"
    });
    expect(body).toMatchObject({
      model: "model-b",
      max_tokens: 3000,
      temperature: 0.2
    });
    expect(body.system).toContain("Return only valid JSON");
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe("user");
  });

  it("parses Anthropic-compatible learning map and training JSON from content text", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          content: [{ type: "text", text: JSON.stringify(learningMapResponse) }]
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          content: [{ type: "text", text: JSON.stringify(trainingResponse) }]
        })
      );

    const mapResult = await generateLearningMap(anthropicSettings, pageContent);
    expect(mapResult.ok).toBe(true);
    if (!mapResult.ok) return;
    expect(mapResult.data.overview).toContain("RAG");

    const trainingResult = await generateTrainingContent(anthropicSettings, pageContent, mapResult.data);
    expect(trainingResult.ok).toBe(true);
    if (!trainingResult.ok) return;
    expect(trainingResult.data.summary[0].text).toContain("外部知识");
    expect(trainingResult.data.quiz[0].correctOptionId).toBe("A");
    expect(trainingResult.data.quiz[0].difficulty).toBe("medium");
  });

  it("extracts only text blocks from Anthropic-compatible responses", () => {
    expect(
      extractAnthropicTextContent({
        content: [
          { type: "text", text: " first " },
          { type: "image", text: "ignored" },
          { type: "text", text: "second" }
        ]
      })
    ).toBe("first\nsecond");
  });
});
