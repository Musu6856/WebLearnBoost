// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppView, defaultAdapters } from "./App";
import { StatusPanel } from "./components/StatusPanel";
import { SettingsView } from "./components/SettingsView";
import type { AppSettings, ExtractedPageContent, LearningMap, LearningPackage } from "../shared/types";

const settings: AppSettings = {
  provider: "openai-compatible",
  baseUrl: "https://api.example.com/v1",
  apiKey: "test-key",
  model: "test-model",
  outputLanguage: "中文"
};

const content: ExtractedPageContent = {
  title: "测试文章",
  url: "https://example.com/article",
  scope: "page",
  text: "这是一篇用于测试的文章内容，足够长，可以生成学习地图和自测题。",
  excerpt: "这是一篇用于测试的文章内容。",
  locationHints: [{ textQuote: "测试的文章内容", index: 0 }],
  extractedAt: "2026-05-12T00:00:00.000Z"
};

const learningMap: LearningMap = {
  overview: "测试学习地图",
  structure: [{ title: "第一部分", description: "说明核心内容。" }],
  concepts: ["概念 A"],
  conceptRelations: ["概念 A 支撑主题"],
  readingOrder: ["先读第一部分"],
  pitfalls: ["不要重复生成"],
  prerequisites: ["基础知识"]
};

const learningPackage: LearningPackage = {
  id: "pkg-1",
  title: content.title,
  url: content.url,
  createdAt: "2026-05-12T00:01:00.000Z",
  inputScope: "page",
  sourceText: content.text,
  learningMap,
  summary: [{ text: "摘要内容", sourceQuote: "测试的文章内容" }],
  quiz: [
    {
      id: "q1",
      question: "第一题？",
      options: [
        { id: "A", text: "选项 A" },
        { id: "B", text: "选项 B" }
      ],
      correctOptionId: "A",
      explanation: "第一题解析",
      sourceQuote: "测试的文章内容"
    },
    {
      id: "q2",
      question: "第二题？",
      options: [
        { id: "A", text: "第二题 A" },
        { id: "B", text: "第二题 B" }
      ],
      correctOptionId: "B",
      explanation: "第二题解析",
      sourceQuote: "测试的文章内容"
    }
  ],
  answers: {},
  sourceQuotes: ["测试的文章内容"],
  locationHints: content.locationHints,
  exportStatus: "idle"
};

function createAdapters() {
  return {
    ...defaultAdapters,
    buildTrainingPackage: vi.fn(async () => ({ ok: true as const, data: learningPackage })),
    deletePackageVersion: vi.fn(async (id: string) => ({ ok: true as const, data: id })),
    exportMarkdown: vi.fn(async (pkg: LearningPackage) => ({ ok: true as const, data: { ...pkg, exportStatus: "exported" as const } })),
    extractActiveContent: vi.fn(async () => ({ ok: true as const, data: content })),
    generateLearningMap: vi.fn(async () => ({ ok: true as const, data: learningMap })),
    getActivePageInfo: vi.fn(async () => ({ title: content.title, url: content.url })),
    loadHistory: vi.fn(async () => []),
    loadInitialSettings: vi.fn(async () => settings),
    locateSourceQuote: vi.fn(async () => ({ ok: true as const, data: true as const })),
    savePackage: vi.fn(async (pkg: LearningPackage) => ({ ok: true as const, data: pkg })),
    saveSettings: vi.fn(async (next: AppSettings) => ({ ok: true as const, data: next }))
  };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AppView learning flow", () => {
  it("does not regenerate map or training after results already exist", async () => {
    const adapters = createAdapters();
    const user = userEvent.setup();

    render(<AppView adapters={adapters} />);

    await user.click(await screen.findByRole("button", { name: /生成学习地图/ }));
    await screen.findByText("测试学习地图");
    expect(adapters.generateLearningMap).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /开始训练/ }));
    await screen.findByText("第一题？");
    expect(adapters.buildTrainingPackage).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /入口/ }));
    expect(screen.getByRole("button", { name: /继续训练/ })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /继续训练/ }));
    expect(adapters.generateLearningMap).toHaveBeenCalledTimes(1);
    expect(adapters.buildTrainingPackage).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /地图/ }));
    await user.click(screen.getByRole("button", { name: /继续训练/ }));
    expect(adapters.buildTrainingPackage).toHaveBeenCalledTimes(1);
  });

  it("can reset the current page flow without regenerating existing results", async () => {
    const adapters = createAdapters();
    const user = userEvent.setup();

    render(<AppView adapters={adapters} />);

    await user.click(await screen.findByRole("button", { name: /生成学习地图/ }));
    await user.click(await screen.findByRole("button", { name: /开始训练/ }));
    await screen.findByText("第一题？");

    await user.click(screen.getByRole("button", { name: /入口/ }));
    await user.click(screen.getByRole("button", { name: /重新开始当前网页/ }));

    expect(screen.getByRole("button", { name: /生成学习地图/ })).toBeTruthy();
    expect(adapters.generateLearningMap).toHaveBeenCalledTimes(1);
    expect(adapters.buildTrainingPackage).toHaveBeenCalledTimes(1);
  });

  it("can navigate quiz questions with previous and next buttons", async () => {
    const adapters = createAdapters();
    const user = userEvent.setup();

    render(<AppView adapters={adapters} />);

    await user.click(await screen.findByRole("button", { name: /生成学习地图/ }));
    await user.click(await screen.findByRole("button", { name: /开始训练/ }));

    await screen.findAllByText("第一题？");
    await user.click(screen.getAllByRole("button", { name: /下一题/ })[0]);
    await screen.findAllByText("第二题？");

    await user.click(screen.getByRole("button", { name: /上一题/ }));
    await waitFor(() => expect(screen.getAllByText("第一题？").length).toBeGreaterThan(0));
  });

  it("keeps the user on a wrong question and marks the error clearly", async () => {
    const adapters = createAdapters();
    const user = userEvent.setup();

    render(<AppView adapters={adapters} />);

    await user.click(await screen.findByRole("button", { name: /生成学习地图/ }));
    await user.click(await screen.findByRole("button", { name: /开始训练/ }));

    await user.click(await screen.findByRole("button", { name: "选项 B" }));
    expect(await screen.findByText("回答错误")).toBeTruthy();
    expect(screen.getByText("第一题？")).toBeTruthy();
    expect(screen.getByRole("button", { name: "下一题" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "选项 B" }).className).toContain("incorrect");
    await user.click(screen.getByRole("button", { name: "下一题" }));
    expect(screen.getByText("第二题？")).toBeTruthy();
  });

  it("automatically advances after answering a correct quiz question and preserves answers for export", async () => {
    const adapters = createAdapters();
    const user = userEvent.setup();

    render(<AppView adapters={adapters} />);

    await user.click(await screen.findByRole("button", { name: /生成学习地图/ }));
    await user.click(await screen.findByRole("button", { name: /开始训练/ }));

    await user.click(await screen.findByRole("button", { name: "选项 A" }));
    expect(await screen.findByText("回答正确")).toBeTruthy();

    await screen.findByText("第二题？");
    await waitFor(() => {
      expect(adapters.savePackage).toHaveBeenCalledWith(
        expect.objectContaining({
          answers: { q1: "A" }
        })
      );
    });

    await user.click(screen.getByRole("button", { name: /导出 Markdown/ }));
    await waitFor(() => expect(adapters.exportMarkdown).toHaveBeenCalledTimes(1));
    expect(adapters.exportMarkdown).toHaveBeenCalledWith(
      expect.objectContaining({
        answers: { q1: "A" }
      })
    );
  });

  it("locates source quotes using the learning package URL", async () => {
    const adapters = createAdapters();
    const user = userEvent.setup();

    render(<AppView adapters={adapters} />);

    await user.click(await screen.findByRole("button", { name: /生成学习地图/ }));
    await user.click(await screen.findByRole("button", { name: /开始训练/ }));
    await user.click(await screen.findByRole("button", { name: /测试的文章内容/ }));

    expect(adapters.locateSourceQuote).toHaveBeenCalledWith("测试的文章内容", "https://example.com/article");
  });

  it("keeps the generated map visible when training generation fails", async () => {
    const adapters = {
      ...createAdapters(),
      buildTrainingPackage: vi.fn(async () => ({
        ok: false as const,
        error: {
          title: "训练内容生成失败",
          message: "模型服务暂时不可用。",
          recoveryAction: "检查配置后重试"
        }
      }))
    };
    const user = userEvent.setup();

    render(<AppView adapters={adapters} />);

    await user.click(await screen.findByRole("button", { name: /生成学习地图/ }));
    await screen.findByText("测试学习地图");
    await user.click(screen.getByRole("button", { name: /开始训练/ }));

    expect(await screen.findByText("训练内容生成失败")).toBeTruthy();
    expect(screen.getByText("测试学习地图")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /地图/ }));
    expect(screen.getByText("测试学习地图")).toBeTruthy();
  });

  it("keeps the learning package visible when Markdown export fails", async () => {
    const adapters = {
      ...createAdapters(),
      exportMarkdown: vi.fn(async () => ({
        ok: false as const,
        error: {
          title: "导出失败",
          message: "浏览器下载被拦截。",
          recoveryAction: "请重试导出"
        }
      }))
    };
    const user = userEvent.setup();

    render(<AppView adapters={adapters} />);

    await user.click(await screen.findByRole("button", { name: /生成学习地图/ }));
    await user.click(await screen.findByRole("button", { name: /开始训练/ }));
    await screen.findByText("第一题？");

    await user.click(screen.getByRole("button", { name: /导出 Markdown/ }));
    expect(await screen.findByText("导出失败")).toBeTruthy();
    expect(screen.getByText("第一题？")).toBeTruthy();
    expect(screen.getByRole("button", { name: /导出 Markdown/ })).toBeTruthy();
  });

  it("deletes a single history version", async () => {
    const adapters = {
      ...createAdapters(),
      loadHistory: vi.fn(async () => [learningPackage])
    };
    const user = userEvent.setup();

    render(<AppView adapters={adapters} />);

    await user.click(await screen.findByRole("button", { name: /历史/ }));
    await screen.findByText("测试文章");
    await user.click(screen.getByRole("button", { name: /删除 测试文章/ }));

    await waitFor(() => expect(adapters.deletePackageVersion).toHaveBeenCalledWith("pkg-1"));
    expect(screen.getByText("还没有学习历史")).toBeTruthy();
  });
});

describe("StatusPanel loading state", () => {
  it("shows elapsed loading progress", async () => {
    vi.useFakeTimers();

    render(
      <StatusPanel
        tone="loading"
        icon={<span />}
        message="正在处理"
        title="处理中"
        startedAt={Date.now() - 5000}
      />
    );

    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("34");
    expect(screen.getByText(/已等待 5 秒/)).toBeTruthy();

    vi.useRealTimers();
  });
});

describe("SettingsView provider options", () => {
  it("only shows supported providers", () => {
    render(
      <SettingsView
        settings={settings}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole("option", { name: "OpenAI Compatible" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Anthropic Compatible" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Ollama" })).toBeNull();
    expect(screen.queryByRole("option", { name: "Anthropic" })).toBeNull();
  });
});
