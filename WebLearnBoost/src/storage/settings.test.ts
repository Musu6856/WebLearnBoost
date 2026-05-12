import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSettings, saveSettings, updateSettings } from "./settings";
import type { AppSettings } from "../shared/types";

let storageData: Record<string, unknown>;

function installChromeStorageMock() {
  vi.stubGlobal("chrome", {
    runtime: {},
    storage: {
      local: {
        get: vi.fn((key: string, callback: (items: Record<string, unknown>) => void) => {
          callback({ [key]: storageData[key] });
        }),
        set: vi.fn((items: Record<string, unknown>, callback: () => void) => {
          storageData = { ...storageData, ...items };
          callback();
        }),
        remove: vi.fn((key: string, callback: () => void) => {
          delete storageData[key];
          callback();
        })
      }
    }
  });
}

beforeEach(() => {
  storageData = {};
  installChromeStorageMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("settings storage", () => {
  it("migrates the old anthropic provider value", async () => {
    storageData["weblearnboost:settings"] = {
      provider: "anthropic",
      baseUrl: "https://models.example.test",
      apiKey: "key",
      model: "model",
      outputLanguage: "中文"
    };

    await expect(getSettings()).resolves.toMatchObject({
      provider: "anthropic-compatible"
    });
  });

  it("falls back to OpenAI-compatible for unsupported provider values", async () => {
    storageData["weblearnboost:settings"] = {
      provider: "ollama",
      baseUrl: "http://localhost:11434",
      apiKey: "key",
      model: "model",
      outputLanguage: "中文"
    };

    await expect(getSettings()).resolves.toMatchObject({
      provider: "openai-compatible"
    });
  });

  it("normalizes settings before saving or patching", async () => {
    const saved = await saveSettings({
      provider: "anthropic-compatible",
      baseUrl: "https://models.example.test",
      apiKey: "key",
      model: "model",
      outputLanguage: "中文"
    });
    expect(saved.provider).toBe("anthropic-compatible");

    const updated = await updateSettings({ provider: "openai-compatible" } satisfies Partial<AppSettings>);
    expect(updated.provider).toBe("openai-compatible");
  });
});
