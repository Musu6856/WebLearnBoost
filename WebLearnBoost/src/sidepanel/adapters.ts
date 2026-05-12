import {
  generateLearningMap as generateAiLearningMap,
  generateTrainingContent
} from "../ai";
import { downloadLearningPackageMarkdown } from "../export";
import {
  deleteLearningPackageVersion,
  getSettings,
  listLearningPackages,
  saveLearningPackage,
  saveSettings as persistSettings
} from "../storage";
import type {
  AppSettings,
  ExtractedPageContent,
  InputScope,
  LearningMap,
  LearningPackage,
  RuntimeRequest,
  RuntimeResponse,
  UserFacingError
} from "../shared/types";
import { isSamePageUrl } from "./pageContext";

const extensionUnavailableError: UserFacingError = {
  title: "扩展运行环境不可用",
  message: "当前页面没有检测到 Chrome 扩展 API。",
  recoveryAction: "请在 Chrome / Edge 扩展侧边栏中打开 WebLearnBoost。"
};

const pageConnectionError: UserFacingError = {
  title: "页面连接失败",
  message: "无法连接到当前网页的内容脚本，可能是浏览器内部页、扩展商店页，或页面尚未刷新。",
  recoveryAction: "请刷新普通网页后重试；如果仍失败，请选中正文段落后再试。"
};

const emptyPageResponseError: UserFacingError = {
  title: "页面没有返回内容",
  message: "当前网页没有返回可用于学习包生成的正文。",
  recoveryAction: "请选中正文段落后重试。"
};

export async function loadInitialSettings(): Promise<AppSettings> {
  if (!hasChromeStorage()) {
    return {
      provider: "openai-compatible",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-4o-mini",
      outputLanguage: "中文"
    };
  }

  return getSettings();
}

export async function loadHistory(): Promise<LearningPackage[]> {
  if (!hasChromeStorage()) return [];
  return listLearningPackages();
}

export async function getActivePageInfo(): Promise<{ title: string; url: string } | null> {
  if (!hasChromeTabs()) return null;

  try {
    const tab = await getActiveTab();
    if (!tab?.url) return null;

    return {
      title: tab.title?.trim() || tab.url,
      url: tab.url
    };
  } catch {
    return null;
  }
}

export async function saveSettings(settings: AppSettings): Promise<RuntimeResponse<AppSettings>> {
  if (!hasChromeStorage()) return { ok: false, error: extensionUnavailableError };

  try {
    const saved = await persistSettings(settings);
    return { ok: true, data: saved };
  } catch (error) {
    return {
      ok: false,
      error: {
        title: "设置保存失败",
        message: error instanceof Error ? error.message : "无法写入浏览器本地存储。",
        recoveryAction: "请稍后重试。"
      }
    };
  }
}

export async function extractActiveContent(scope: InputScope): Promise<RuntimeResponse<ExtractedPageContent>> {
  if (!hasChromeTabs()) return { ok: false, error: extensionUnavailableError };

  const tab = await getActiveTab();
  if (!tab?.id) {
    return {
      ok: false,
      error: {
        title: "没有找到当前标签页",
        message: "WebLearnBoost 需要读取当前活动标签页的正文内容。",
        recoveryAction: "请切回要学习的网页后重试。"
      }
    };
  }

  const request: RuntimeRequest = { type: "GET_ACTIVE_TAB_CONTENT", scope };
  return sendTabMessage<ExtractedPageContent>(tab, request);
}

export async function generateLearningMap(
  content: ExtractedPageContent,
  settings: AppSettings
): Promise<RuntimeResponse<LearningMap>> {
  return generateAiLearningMap(settings, content);
}

export async function buildTrainingPackage(
  content: ExtractedPageContent,
  learningMap: LearningMap,
  settings: AppSettings
): Promise<RuntimeResponse<LearningPackage>> {
  return generateTrainingContent(settings, content, learningMap);
}

export async function savePackage(learningPackage: LearningPackage): Promise<RuntimeResponse<LearningPackage>> {
  if (!hasChromeStorage()) return { ok: false, error: extensionUnavailableError };

  try {
    const saved = await saveLearningPackage(learningPackage);
    return { ok: true, data: saved };
  } catch (error) {
    return {
      ok: false,
      error: {
        title: "历史保存失败",
        message: error instanceof Error ? error.message : "无法保存学习包到本地历史。",
        recoveryAction: "可以先导出 Markdown，再重试保存。"
      }
    };
  }
}

export async function deletePackageVersion(packageId: string): Promise<RuntimeResponse<string>> {
  if (!hasChromeStorage()) return { ok: false, error: extensionUnavailableError };

  try {
    const deleted = await deleteLearningPackageVersion(packageId);
    if (!deleted) {
      return {
        ok: false,
        error: {
          title: "没有找到历史版本",
          message: "该学习包版本可能已经被删除。",
          recoveryAction: "刷新历史列表"
        }
      };
    }

    return { ok: true, data: packageId };
  } catch (error) {
    return {
      ok: false,
      error: {
        title: "删除历史失败",
        message: error instanceof Error ? error.message : "无法删除这个学习包版本。",
        recoveryAction: "请稍后重试。"
      }
    };
  }
}

export async function exportMarkdown(learningPackage: LearningPackage): Promise<RuntimeResponse<LearningPackage>> {
  try {
    downloadLearningPackageMarkdown(learningPackage);
    return {
      ok: true,
      data: { ...learningPackage, exportStatus: "exported" }
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        title: "Markdown 导出失败",
        message: error instanceof Error ? error.message : "浏览器未能创建下载文件。",
        recoveryAction: "请检查浏览器下载权限后重试。"
      }
    };
  }
}

export async function locateSourceQuote(quote: string, pageUrl?: string): Promise<RuntimeResponse<true>> {
  if (!hasChromeTabs()) return { ok: false, error: extensionUnavailableError };

  const tab = pageUrl ? await getTabForPageUrl(pageUrl) : await getActiveTab();
  if (!tab?.id) {
    return {
      ok: false,
      error: {
        title: "没有找到当前标签页",
        message: "无法把原文依据定位回页面。",
        recoveryAction: "请切回来源网页后重试。"
      }
    };
  }

  return sendTabMessage<true>(tab, { type: "LOCATE_SOURCE_QUOTE", quote });
}

function hasChromeStorage() {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
}

function hasChromeTabs() {
  return typeof chrome !== "undefined" && Boolean(chrome.tabs);
}

function hasChromeScripting() {
  return typeof chrome !== "undefined" && Boolean(chrome.scripting?.executeScript);
}

function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const error = chrome.runtime.lastError?.message;
      if (error) {
        reject(new Error(error));
        return;
      }

      resolve(tabs[0]);
    });
  });
}

async function getTabForPageUrl(pageUrl: string): Promise<chrome.tabs.Tab | undefined> {
  if (!isInjectableTabUrl(pageUrl)) return undefined;

  const activeTab = await getActiveTab();
  if (activeTab?.id && isSamePageUrl(activeTab.url, pageUrl)) {
    return activeTab;
  }

  const currentWindowTabs = await getCurrentWindowTabs();
  const matchingTab = currentWindowTabs.find((tab) => typeof tab.id === "number" && isSamePageUrl(tab.url, pageUrl));
  if (typeof matchingTab?.id === "number") {
    return activateTab(matchingTab.id);
  }

  const createdTab = await createTab(pageUrl);
  if (typeof createdTab?.id === "number") {
    await waitForTabComplete(createdTab.id);
  }

  return createdTab;
}

function getCurrentWindowTabs(): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const error = chrome.runtime.lastError?.message;
      if (error) {
        reject(new Error(error));
        return;
      }

      resolve(tabs);
    });
  });
}

function activateTab(tabId: number): Promise<chrome.tabs.Tab | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.update(tabId, { active: true }, (tab) => {
      const error = chrome.runtime.lastError?.message;
      if (error) {
        reject(new Error(error));
        return;
      }

      resolve(tab);
    });
  });
}

function createTab(url: string): Promise<chrome.tabs.Tab | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url, active: true }, (tab) => {
      const error = chrome.runtime.lastError?.message;
      if (error) {
        reject(new Error(error));
        return;
      }

      resolve(tab);
    });
  });
}

function waitForTabComplete(tabId: number, timeoutMs = 10000): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    let timeoutId: number | undefined;
    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        finish();
      }
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };

    chrome.tabs.onUpdated.addListener(listener);
    timeoutId = window.setTimeout(finish, timeoutMs);

    chrome.tabs.get(tabId, (tab) => {
      if (!chrome.runtime.lastError?.message && tab?.status === "complete") {
        finish();
      }
    });
  });
}

type TabMessageAttempt<T> =
  | { status: "success"; response: RuntimeResponse<T> }
  | { status: "empty" }
  | { status: "send-error"; message: string };

type MessageTargetTab = Pick<chrome.tabs.Tab, "id" | "url">;

async function sendTabMessage<T>(tab: MessageTargetTab, request: RuntimeRequest): Promise<RuntimeResponse<T>> {
  if (typeof tab.id !== "number") {
    return { ok: false, error: pageConnectionError };
  }

  const firstAttempt = await sendTabMessageOnce<T>(tab.id, request);
  if (firstAttempt.status !== "send-error" || !isMissingContentScriptError(firstAttempt.message)) {
    return toRuntimeResponse(firstAttempt);
  }

  if (!isInjectableTabUrl(tab.url) || !(await injectContentScript(tab.id))) {
    return { ok: false, error: pageConnectionError };
  }

  return toRuntimeResponse(await sendTabMessageOnce<T>(tab.id, request));
}

function sendTabMessageOnce<T>(tabId: number, request: RuntimeRequest): Promise<TabMessageAttempt<T>> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, request, (response: RuntimeResponse<T> | undefined) => {
      const error = chrome.runtime.lastError?.message;
      if (error) {
        resolve({ status: "send-error", message: error });
        return;
      }

      if (!response) {
        resolve({ status: "empty" });
        return;
      }

      resolve({ status: "success", response });
    });
  });
}

function injectContentScript(tabId: number): Promise<boolean> {
  if (!hasChromeScripting()) return Promise.resolve(false);

  return new Promise((resolve) => {
    chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] }, () => {
      resolve(!chrome.runtime.lastError?.message);
    });
  });
}

function toRuntimeResponse<T>(attempt: TabMessageAttempt<T>): RuntimeResponse<T> {
  if (attempt.status === "success") return attempt.response;
  if (attempt.status === "empty") return { ok: false, error: emptyPageResponseError };
  return { ok: false, error: pageConnectionError };
}

function isMissingContentScriptError(message: string) {
  return message.includes("Could not establish connection") || message.includes("Receiving end does not exist");
}

function isInjectableTabUrl(url: string | undefined) {
  if (!url) return false;

  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
