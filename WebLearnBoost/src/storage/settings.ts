import type { AppSettings } from "../shared/types";

const SETTINGS_KEY = "weblearnboost:settings";

export const defaultSettings: AppSettings = {
  provider: "openai-compatible",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  outputLanguage: "中文",
};

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
  return { ...defaultSettings, ...saved };
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  await storageSet(SETTINGS_KEY, settings);
  return settings;
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const next = { ...(await getSettings()), ...patch };
  await storageSet(SETTINGS_KEY, next);
  return next;
}

export async function resetSettings(): Promise<AppSettings> {
  await storageRemove(SETTINGS_KEY);
  return defaultSettings;
}
