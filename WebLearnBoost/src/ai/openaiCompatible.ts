import type {
  AppSettings,
  ExtractedPageContent,
  LearningMap,
  LearningPackage,
  QuizQuestion,
  RuntimeResponse,
  SummaryItem,
  UserFacingError
} from "../shared/types";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

type AnthropicMessagesResponse = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  error?: {
    message?: string;
  };
};

type TrainingContent = {
  summary: SummaryItem[];
  quiz: QuizQuestion[];
  sourceQuotes?: string[];
};

const JSON_INSTRUCTIONS =
  "Return only valid JSON. Do not include markdown, comments, or explanatory prose.";

const ANTHROPIC_VERSION = "2023-06-01";
const ANTHROPIC_MAX_TOKENS = 3000;

export async function generateLearningMap(
  settings: AppSettings,
  pageContent: ExtractedPageContent
): Promise<RuntimeResponse<LearningMap>> {
  const settingsError = validateModelSettings(settings);
  if (settingsError) return { ok: false, error: settingsError };

  try {
    const content = await requestStructuredJson(settings, [
      {
        role: "system",
        content: [
          "You generate learning maps from web page content.",
          "Use the user's requested output language.",
          JSON_INSTRUCTIONS,
          "The JSON shape must be:",
          JSON.stringify({
            overview: "string",
            structure: [{ title: "string", description: "string" }],
            concepts: ["string"],
            conceptRelations: ["string"],
            readingOrder: ["string"],
            pitfalls: ["string"],
            prerequisites: ["string"]
          })
        ].join("\n")
      },
      {
        role: "user",
        content: JSON.stringify({
          outputLanguage: settings.outputLanguage,
          source: compactPageContent(pageContent)
        })
      }
    ]);

    const parsed = parseJsonObject(content);
    const map = validateLearningMap(parsed);
    return { ok: true, data: map };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error, "学习地图生成失败") };
  }
}

export async function generateTrainingContent(
  settings: AppSettings,
  pageContent: ExtractedPageContent,
  learningMap: LearningMap
): Promise<RuntimeResponse<LearningPackage>> {
  const settingsError = validateModelSettings(settings);
  if (settingsError) return { ok: false, error: settingsError };

  try {
    const content = await requestStructuredJson(settings, [
      {
        role: "system",
        content: [
          "You generate study summaries and quiz questions from a page and a learning map.",
          "Use concise wording and preserve sourceQuote values when the page contains direct support.",
          "Use the user's requested output language.",
          JSON_INSTRUCTIONS,
          "The JSON shape must be:",
          JSON.stringify({
            summary: [{ text: "string", sourceQuote: "optional string" }],
            quiz: [
              {
                id: "q1",
                question: "string",
                options: [
                  { id: "A", text: "string" },
                  { id: "B", text: "string" },
                  { id: "C", text: "string" }
                ],
                correctOptionId: "A",
                explanation: "string",
                sourceQuote: "optional string"
              }
            ],
            sourceQuotes: ["string"]
          })
        ].join("\n")
      },
      {
        role: "user",
        content: JSON.stringify({
          outputLanguage: settings.outputLanguage,
          learningMap,
          source: compactPageContent(pageContent)
        })
      }
    ]);

    const parsed = parseJsonObject(content);
    const training = validateTrainingContent(parsed);
    return {
      ok: true,
      data: buildLearningPackage(pageContent, learningMap, training)
    };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error, "训练内容生成失败") };
  }
}

export function createDemoLearningMap(pageContent: ExtractedPageContent): LearningMap {
  const title = pageContent.title || "当前页面";
  return {
    overview: `这份学习地图围绕「${title}」梳理核心内容，帮助你先建立整体框架，再进入细节练习。`,
    structure: [
      { title: "主题背景", description: "先确认页面讨论的问题、适用场景和目标读者。" },
      { title: "关键概念", description: "提取反复出现且影响理解的术语、机制和判断标准。" },
      { title: "应用与风险", description: "把概念连接到实际用法，并标出容易误解的地方。" }
    ],
    concepts: ["核心主题", "关键术语", "因果关系", "实践方法"],
    conceptRelations: ["关键术语共同支撑核心主题", "实践方法需要结合页面中的限制条件理解"],
    readingOrder: ["先读标题和摘要", "再读结构化段落", "最后回看证据和示例"],
    pitfalls: ["不要只记结论而忽略适用条件", "不要把页面示例泛化成所有场景"],
    prerequisites: ["基础阅读理解", "主题相关背景知识"]
  };
}

export function createDemoTrainingContent(
  pageContent: ExtractedPageContent,
  learningMap: LearningMap
): LearningPackage {
  return buildLearningPackage(pageContent, learningMap, {
    summary: [
      {
        text: learningMap.overview,
        sourceQuote: pageContent.excerpt || firstSourceQuote(pageContent.text)
      }
    ],
    quiz: [
      {
        id: "q1",
        question: "学习这篇内容时，最合适的第一步是什么？",
        options: [
          { id: "A", text: "先建立整体结构，再进入细节" },
          { id: "B", text: "直接背诵所有句子" },
          { id: "C", text: "只阅读最后一段" }
        ],
        correctOptionId: "A",
        explanation: "学习地图的作用是先帮助你建立结构化理解，再补充证据和练习。",
        sourceQuote: pageContent.excerpt || firstSourceQuote(pageContent.text)
      }
    ],
    sourceQuotes: [pageContent.excerpt || firstSourceQuote(pageContent.text)].filter(Boolean)
  });
}

function validateModelSettings(settings: AppSettings): UserFacingError | null {
  if (!settings.apiKey.trim()) {
    return {
      title: "缺少 API Key",
      message: "生成学习内容需要先配置 API Key。",
      recoveryAction: "请打开设置，填写当前模型服务的 API Key 后重试。"
    };
  }

  if (!settings.baseUrl.trim()) {
    return {
      title: "缺少 Base URL",
      message: "需要配置模型兼容服务的 Base URL。",
      recoveryAction: "请填写你要使用的 OpenAI Compatible 或 Anthropic Compatible 服务地址。"
    };
  }

  if (!settings.model.trim()) {
    return {
      title: "缺少模型名称",
      message: "需要指定用于生成内容的模型。",
      recoveryAction: "请在设置中填写模型名称后重试。"
    };
  }

  return null;
}

async function requestStructuredJson(settings: AppSettings, messages: ChatMessage[]): Promise<string> {
  if (settings.provider === "anthropic-compatible") {
    return requestAnthropicCompatibleJson(settings, messages);
  }

  return requestOpenAICompatibleJson(settings, messages);
}

async function requestOpenAICompatibleJson(settings: AppSettings, messages: ChatMessage[]): Promise<string> {
  const endpoint = buildOpenAICompatibleEndpoint(settings.baseUrl);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  const payload = (await readJsonResponse(response)) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || `模型服务返回 HTTP ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("模型没有返回可解析的内容。");
  }

  return content;
}

async function requestAnthropicCompatibleJson(settings: AppSettings, messages: ChatMessage[]): Promise<string> {
  const endpoint = buildAnthropicCompatibleEndpoint(settings.baseUrl);
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const chatMessages = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role,
      content: message.content
    }));

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": settings.apiKey,
      "anthropic-version": ANTHROPIC_VERSION
    },
    body: JSON.stringify({
      model: settings.model,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      temperature: 0.2,
      system,
      messages: chatMessages
    })
  });

  const payload = (await readJsonResponse(response)) as AnthropicMessagesResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || `模型服务返回 HTTP ${response.status}`);
  }

  const content = extractAnthropicTextContent(payload);
  if (!content) {
    throw new Error("模型没有返回可解析的文本内容。");
  }

  return content;
}

export function buildOpenAICompatibleEndpoint(baseUrl: string): string {
  return `${baseUrl.trim().replace(/\/+$/, "")}/chat/completions`;
}

export function buildAnthropicCompatibleEndpoint(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, "");

  if (normalized.endsWith("/v1/messages")) {
    return normalized;
  }

  if (normalized.endsWith("/v1")) {
    return `${normalized}/messages`;
  }

  return `${normalized}/v1/messages`;
}

export function extractAnthropicTextContent(payload: AnthropicMessagesResponse): string {
  return (payload.content ?? [])
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text?.trim())
    .filter((text): text is string => Boolean(text))
    .join("\n");
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    if (!response.ok) {
      throw new Error(`模型服务返回了非 JSON 响应：${text.slice(0, 160)}`);
    }
    throw new Error("模型服务响应不是有效 JSON。");
  }
}

function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fencedMatch?.[1]?.trim() || trimmed;

  try {
    return JSON.parse(jsonText);
  } catch {
    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(jsonText.slice(start, end + 1));
    }
    throw new Error("模型返回内容不是有效 JSON。");
  }
}

function validateLearningMap(value: unknown): LearningMap {
  const object = assertRecord(value, "学习地图");
  const map: LearningMap = {
    overview: requireString(object, "overview"),
    structure: requireArray(object, "structure").map((item, index) => {
      const structureItem = assertRecord(item, `structure[${index}]`);
      return {
        title: requireString(structureItem, "title"),
        description: requireString(structureItem, "description")
      };
    }),
    concepts: requireStringArray(object, "concepts"),
    conceptRelations: requireStringArray(object, "conceptRelations"),
    readingOrder: requireStringArray(object, "readingOrder"),
    pitfalls: requireStringArray(object, "pitfalls"),
    prerequisites: requireStringArray(object, "prerequisites")
  };

  if (map.structure.length === 0 || map.concepts.length === 0) {
    throw new Error("模型返回的学习地图缺少必要条目。");
  }

  return map;
}

function validateTrainingContent(value: unknown): TrainingContent {
  const object = assertRecord(value, "训练内容");
  const summary = requireArray(object, "summary").map((item, index) => {
    const summaryItem = assertRecord(item, `summary[${index}]`);
    return {
      text: requireString(summaryItem, "text"),
      sourceQuote: optionalString(summaryItem, "sourceQuote")
    };
  });
  const quiz = requireArray(object, "quiz").map(validateQuizQuestion);
  const sourceQuotes = optionalStringArray(object, "sourceQuotes");

  if (summary.length === 0 || quiz.length === 0) {
    throw new Error("模型返回的训练内容缺少摘要或测验。");
  }

  return { summary, quiz, sourceQuotes };
}

function validateQuizQuestion(item: unknown, index: number): QuizQuestion {
  const question = assertRecord(item, `quiz[${index}]`);
  const options = requireArray(question, "options").map((option, optionIndex) => {
    const optionObject = assertRecord(option, `quiz[${index}].options[${optionIndex}]`);
    return {
      id: requireString(optionObject, "id"),
      text: requireString(optionObject, "text")
    };
  });
  const correctOptionId = requireString(question, "correctOptionId");

  if (options.length < 2 || !options.some((option) => option.id === correctOptionId)) {
    throw new Error(`模型返回的第 ${index + 1} 道题选项不完整。`);
  }

  return {
    id: optionalString(question, "id") || `q${index + 1}`,
    question: requireString(question, "question"),
    options,
    correctOptionId,
    explanation: requireString(question, "explanation"),
    sourceQuote: optionalString(question, "sourceQuote")
  };
}

function buildLearningPackage(
  pageContent: ExtractedPageContent,
  learningMap: LearningMap,
  training: TrainingContent
): LearningPackage {
  const sourceQuotes = [
    ...(training.sourceQuotes || []),
    ...training.summary.map((item) => item.sourceQuote),
    ...training.quiz.map((item) => item.sourceQuote)
  ].filter((quote): quote is string => Boolean(quote?.trim()));

  return {
    id: createPackageId(),
    title: pageContent.title,
    url: pageContent.url,
    createdAt: new Date().toISOString(),
    inputScope: pageContent.scope,
    sourceText: pageContent.text,
    learningMap,
    summary: training.summary,
    quiz: training.quiz,
    answers: {},
    sourceQuotes: Array.from(new Set(sourceQuotes)),
    locationHints: pageContent.locationHints,
    exportStatus: "idle"
  };
}

function compactPageContent(pageContent: ExtractedPageContent) {
  return {
    title: pageContent.title,
    url: pageContent.url,
    scope: pageContent.scope,
    byline: pageContent.byline,
    excerpt: pageContent.excerpt,
    locationHints: pageContent.locationHints.slice(0, 12),
    text: pageContent.text.slice(0, 24000)
  };
}

function toUserFacingError(error: unknown, fallbackTitle: string): UserFacingError {
  const message = error instanceof Error ? error.message : "发生未知错误。";
  return {
    title: fallbackTitle,
    message,
    recoveryAction: "请检查模型配置、网络连接和页面内容后重试。"
  };
}

function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`模型返回的 ${label} 不是对象。`);
  }

  return value as Record<string, unknown>;
}

function requireString(object: Record<string, unknown>, key: string): string {
  const value = object[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`模型返回缺少 ${key} 字段。`);
  }

  return value.trim();
}

function optionalString(object: Record<string, unknown>, key: string): string | undefined {
  const value = object[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requireArray(object: Record<string, unknown>, key: string): unknown[] {
  const value = object[key];
  if (!Array.isArray(value)) {
    throw new Error(`模型返回缺少 ${key} 数组。`);
  }

  return value;
}

function requireStringArray(object: Record<string, unknown>, key: string): string[] {
  const values = requireArray(object, key).filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
  if (values.length === 0) {
    throw new Error(`模型返回的 ${key} 数组为空。`);
  }

  return values.map((item) => item.trim());
}

function optionalStringArray(object: Record<string, unknown>, key: string): string[] | undefined {
  const value = object[key];
  if (!Array.isArray(value)) return undefined;

  return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim());
}

function firstSourceQuote(text: string): string {
  return text.trim().slice(0, 160);
}

function createPackageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `pkg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
