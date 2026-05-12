import type { AppSettings, ModelProvider } from "../shared/types";

const SETTINGS_KEY = "weblearnboost:settings";

export const defaultSettings: AppSettings = {
  provider: "openai-compatible",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  outputLanguage: "中文",
};

const supportedProviders = new Set<ModelProvider>(["openai-compatible", "anthropic-compatible"]);

function normalizeProvider(provider: unknown): ModelProvider {
  if (provider === "anthropic") {
    return "anthropic-compatible";
  }

  if (typeof provider === "string" && supportedProviders.has(provider as ModelProvider)) {
    return provider as ModelProvider;
  }

  return defaultSettings.provider;
}

function normalizeSettings(saved?: Partial<AppSettings>): AppSettings {
  return {
    ...defaultSettings,
    ...saved,
    provider: normalizeProvider(saved?.provider)
  };
}

function rejectLastError(): Error | undefined {
  const message = chrome.runtime.lastError?.message;
  return message ? new Error(message) : undefined;
}

function storageGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (items) => {
      const error = rejectLastError();
      if (error) {
        reject(error);
        return;
      }

      resolve(items[key] as T | undefined);
    });
  });
}

function storageSet<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      const error = rejectLastError();
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function storageRemove(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(key, () => {
      const error = rejectLastError();
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export async function getSettings(): Promise<AppSettings> {
  const saved = await storageGet<Partial<AppSettings>>(SETTINGS_KEY);
  return normalizeSettings(saved);
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const normalized = normalizeSettings(settings);
  await storageSet(SETTINGS_KEY, normalized);
  return normalized;
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const next = normalizeSettings({ ...(await getSettings()), ...patch });
  await storageSet(SETTINGS_KEY, next);
  return next;
}

export async function resetSettings(): Promise<AppSettings> {
  await storageRemove(SETTINGS_KEY);
  return defaultSettings;
}
