import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, Clock, Home, Map, Settings, Sparkles } from "lucide-react";
import {
  buildTrainingPackage,
  deletePackageVersion,
  exportMarkdown,
  extractActiveContent,
  generateLearningMap,
  getActivePageInfo,
  loadHistory,
  loadInitialSettings,
  locateSourceQuote,
  savePackage,
  saveSettings
} from "./adapters";
import { EntryView } from "./components/EntryView";
import { HistoryView } from "./components/HistoryView";
import { LearningMapView } from "./components/LearningMapView";
import { SettingsView } from "./components/SettingsView";
import { StatusPanel } from "./components/StatusPanel";
import { TrainingView } from "./components/TrainingView";
import { createActivePageInfoFromContent, getPageSourceStatus, summarizeLearningSource, type ActivePageInfo } from "./pageContext";
import type {
  AppSettings,
  AsyncStatus,
  ExtractedPageContent,
  InputScope,
  LearningMap,
  LearningPackage,
  UserFacingError,
  ViewName
} from "../shared/types";

interface SidepanelState {
  scope: InputScope;
  status: AsyncStatus;
  busyStartedAt: number | null;
  view: ViewName;
  settings: AppSettings;
  extractedContent: ExtractedPageContent | null;
  learningMap: LearningMap | null;
  activePackage: LearningPackage | null;
  history: LearningPackage[];
  activePageInfo: ActivePageInfo | null;
  error: UserFacingError | null;
}

const fallbackSettings: AppSettings = {
  provider: "openai-compatible",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  outputLanguage: "中文"
};

const initialState: SidepanelState = {
  scope: "page",
  status: "idle",
  busyStartedAt: null,
  view: "entry",
  settings: fallbackSettings,
  extractedContent: null,
  learningMap: null,
  activePackage: null,
  history: [],
  activePageInfo: null,
  error: null
};

const statusLabels: Record<AsyncStatus, string> = {
  idle: "准备就绪",
  extracting: "正在提取页面",
  "generating-map": "正在生成学习地图",
  "awaiting-training": "等待开始训练",
  "generating-training": "正在生成训练内容",
  training: "训练中",
  saved: "已保存",
  exporting: "正在导出",
  failed: "需要处理"
};

export function App() {
  return <AppView adapters={defaultAdapters} />;
}

export const defaultAdapters = {
  buildTrainingPackage,
  deletePackageVersion,
  exportMarkdown,
  extractActiveContent,
  generateLearningMap,
  getActivePageInfo,
  loadHistory,
  loadInitialSettings,
  locateSourceQuote,
  savePackage,
  saveSettings
};

type AppAdapters = typeof defaultAdapters;

export function AppView({ adapters }: { adapters: AppAdapters }) {
  const [state, setState] = useState<SidepanelState>(initialState);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const [settings, history, activePageInfo] = await Promise.all([
          adapters.loadInitialSettings(),
          adapters.loadHistory(),
          adapters.getActivePageInfo()
        ]);
        if (!mounted) return;
        setState((current) => ({ ...current, settings, history, activePageInfo }));
      } catch (error) {
        if (!mounted) return;
        setState((current) => ({
          ...current,
          status: "failed",
          error: {
            title: "初始化失败",
            message: error instanceof Error ? error.message : "无法读取本地设置或历史。",
            recoveryAction: "重新打开侧边栏"
          }
        }));
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, [adapters]);

  useEffect(() => {
    if (!hasChromeTabsEvent()) return;

    const refreshActivePageInfo = async () => {
      const activePageInfo = await adapters.getActivePageInfo();
      setState((current) => {
        if (current.activePageInfo?.url === activePageInfo?.url) return current;

        return {
          ...current,
          activePageInfo
        };
      });
    };

    const handleActivated = () => {
      void refreshActivePageInfo();
    };
    const handleUpdated = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (changeInfo.url || changeInfo.status === "complete") {
        void refreshActivePageInfo();
      }
    };

    chrome.tabs.onActivated.addListener(handleActivated);
    chrome.tabs.onUpdated.addListener(handleUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(handleActivated);
      chrome.tabs.onUpdated.removeListener(handleUpdated);
    };
  }, [adapters]);

  const hasApiKey = state.settings.apiKey.trim().length > 0;
  const hasMap = Boolean(state.learningMap);
  const hasTraining = Boolean(state.activePackage);
  const learningSource = summarizeLearningSource(state.activePackage, state.extractedContent);
  const sourceStatus = getPageSourceStatus(state.activePageInfo, learningSource);
  const isBusy =
    state.status === "extracting" ||
    state.status === "generating-map" ||
    state.status === "generating-training" ||
    state.status === "exporting";

  const statusLabel = useMemo(() => statusLabels[state.status], [state.status]);

  const switchView = (view: ViewName) => {
    setState((current) => ({ ...current, view }));
  };

  const updateScope = (scope: InputScope) => {
    setState((current) => ({ ...current, scope, error: null }));
  };

  const handleGenerateMap = async () => {
    if (state.activePackage) {
      setState((current) => ({ ...current, status: "training", busyStartedAt: null, view: "training", error: null }));
      return;
    }

    if (state.learningMap) {
      setState((current) => ({ ...current, status: "awaiting-training", busyStartedAt: null, view: "map", error: null }));
      return;
    }

    setState((current) => ({ ...current, status: "extracting", busyStartedAt: Date.now(), error: null }));

    const extractResult = await adapters.extractActiveContent(state.scope);
    if (!extractResult.ok) {
      setState((current) => ({ ...current, status: "failed", busyStartedAt: null, error: extractResult.error }));
      return;
    }

    setState((current) => ({
      ...current,
      extractedContent: extractResult.data,
      activePageInfo: createActivePageInfoFromContent(extractResult.data),
      status: "generating-map",
      busyStartedAt: Date.now()
    }));

    const mapResult = await adapters.generateLearningMap(extractResult.data, state.settings);
    if (!mapResult.ok) {
      setState((current) => ({ ...current, status: "failed", busyStartedAt: null, error: mapResult.error }));
      return;
    }

    setState((current) => ({
      ...current,
      learningMap: mapResult.data,
      activePackage: null,
      status: "awaiting-training",
      busyStartedAt: null,
      view: "map"
    }));
  };

  const handleStartTraining = async () => {
    if (state.activePackage) {
      setState((current) => ({ ...current, status: "training", busyStartedAt: null, view: "training", error: null }));
      return;
    }

    if (!state.extractedContent || !state.learningMap) {
      setState((current) => ({
        ...current,
        status: "failed",
        error: {
          title: "还没有学习地图",
          message: "请先从当前网页生成学习地图，再开始训练。",
          recoveryAction: "返回入口重新生成"
        }
      }));
      return;
    }

    setState((current) => ({ ...current, status: "generating-training", busyStartedAt: Date.now(), error: null }));
    const trainingResult = await adapters.buildTrainingPackage(state.extractedContent, state.learningMap, state.settings);

    if (!trainingResult.ok) {
      setState((current) => ({ ...current, status: "failed", busyStartedAt: null, error: trainingResult.error }));
      return;
    }

    const saveResult = await adapters.savePackage(trainingResult.data);
    if (!saveResult.ok) {
      setState((current) => ({
        ...current,
        activePackage: trainingResult.data,
        history: upsertHistory(current.history, trainingResult.data),
        status: "training",
        busyStartedAt: null,
        view: "training",
        error: saveResult.error
      }));
      return;
    }

    setState((current) => ({
      ...current,
      activePackage: saveResult.data,
      history: upsertHistory(current.history, saveResult.data),
      status: "training",
      busyStartedAt: null,
      view: "training",
      error: null
    }));
  };

  const handleSaveSettings = async (settings: AppSettings) => {
    setState((current) => ({ ...current, settings, status: "saved", busyStartedAt: null, error: null }));
    const result = await adapters.saveSettings(settings);
    if (!result.ok) {
      setState((current) => ({ ...current, status: "failed", busyStartedAt: null, error: result.error }));
      return;
    }

    setState((current) => ({ ...current, settings: result.data, status: "saved", view: "entry" }));
  };

  const handleExportMarkdown = async () => {
    if (!state.activePackage) return;

    setState((current) => ({ ...current, status: "exporting", busyStartedAt: Date.now(), error: null }));
    const exportResult = await adapters.exportMarkdown(state.activePackage);
    if (!exportResult.ok) {
      setState((current) => ({ ...current, status: "failed", busyStartedAt: null, error: exportResult.error }));
      return;
    }

    const saveResult = await adapters.savePackage(exportResult.data);
    setState((current) => ({
      ...current,
      activePackage: exportResult.data,
      history: upsertHistory(current.history, exportResult.data),
      status: "saved",
      busyStartedAt: null,
      error: saveResult.ok ? null : saveResult.error
    }));
  };

  const handleLocateSourceQuote = async (quote: string) => {
    const result = await adapters.locateSourceQuote(quote, state.activePackage?.url);
    if (!result.ok) {
      setState((current) => ({ ...current, status: "failed", busyStartedAt: null, error: result.error }));
    }
  };

  const handleAnswersChange = (answers: Record<string, string>) => {
    setState((current) => {
      if (!current.activePackage) return current;

      const activePackage = { ...current.activePackage, answers };
      return {
        ...current,
        activePackage,
        history: upsertHistory(current.history, activePackage)
      };
    });
  };

  const handleAnswersCommit = async (answers: Record<string, string>) => {
    if (!state.activePackage) return;

    const learningPackage = { ...state.activePackage, answers };
    const result = await adapters.savePackage(learningPackage);
    if (!result.ok) {
      setState((current) => ({ ...current, status: "failed", busyStartedAt: null, error: result.error }));
      return;
    }

    setState((current) => ({
      ...current,
      activePackage: current.activePackage?.id === result.data.id ? result.data : current.activePackage,
      history: upsertHistory(current.history, result.data)
    }));
  };

  const handleRestartCurrentPage = () => {
    setState((current) => ({
      ...current,
      extractedContent: null,
      learningMap: null,
      activePackage: null,
      status: "idle",
      view: "entry",
      error: null
    }));
  };

  const openHistoryItem = (learningPackage: LearningPackage) => {
    setState((current) => ({
      ...current,
      activePackage: learningPackage,
      learningMap: learningPackage.learningMap,
      extractedContent: {
        title: learningPackage.title,
        url: learningPackage.url,
        scope: learningPackage.inputScope,
        text: learningPackage.sourceText,
        locationHints: learningPackage.locationHints,
        extractedAt: learningPackage.createdAt
      },
      scope: learningPackage.inputScope,
      status: "training",
      view: "training",
      error: null
    }));
  };

  const handleDeleteHistoryItem = async (learningPackage: LearningPackage) => {
    const result = await adapters.deletePackageVersion(learningPackage.id);
    if (!result.ok) {
      setState((current) => ({ ...current, status: "failed", busyStartedAt: null, error: result.error }));
      return;
    }

    setState((current) => ({
      ...current,
      history: current.history.filter((item) => item.id !== learningPackage.id),
      activePackage: current.activePackage?.id === learningPackage.id ? null : current.activePackage,
      status: "saved",
      busyStartedAt: null,
      error: null
    }));
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <div className="brand"><span>W</span> WebLearnBoost</div>
          <p>把当前网页变成学习地图、自测题和可回溯笔记。</p>
        </div>
        <button className="icon-button" type="button" onClick={() => switchView("settings")} aria-label="打开设置">
          <Settings size={18} />
        </button>
      </header>

      <nav className="tabs" aria-label="学习流程">
        <button type="button" className={state.view === "entry" ? "active" : ""} onClick={() => switchView("entry")}>
          <Home size={15} />入口
        </button>
        <button type="button" className={state.view === "map" ? "active" : ""} disabled={!hasMap} onClick={() => switchView("map")}>
          <Map size={15} />地图
        </button>
        <button type="button" className={state.view === "training" ? "active" : ""} disabled={!hasTraining && !hasMap} onClick={() => switchView("training")}>
          <BookOpen size={15} />训练
        </button>
        <button type="button" className={state.view === "history" ? "active" : ""} onClick={() => switchView("history")}>
          <Clock size={15} />历史
        </button>
      </nav>

      <main className="panel-body">
        {state.error && (
          <StatusPanel
            tone="danger"
            icon={<AlertCircle size={18} />}
            title={state.error.title}
            message={state.error.message}
            actionLabel={state.error.recoveryAction}
            onAction={() => switchView("entry")}
          />
        )}

        {isBusy && (
          <StatusPanel
            tone="loading"
            icon={<Sparkles size={18} />}
            title={statusLabel}
            message="正在整理网页内容和学习结构，请稍等。"
            startedAt={state.busyStartedAt}
          />
        )}

        {state.view === "entry" && (
          <EntryView
            activePageInfo={state.activePageInfo}
            content={state.extractedContent}
            hasApiKey={hasApiKey}
            hasLearningMap={hasMap}
            hasTraining={hasTraining}
            isBusy={isBusy}
            learningSource={learningSource}
            scope={state.scope}
            status={state.status}
            onContinue={() => switchView(hasTraining ? "training" : "map")}
            onGenerateMap={handleGenerateMap}
            onOpenSettings={() => switchView("settings")}
            onRestartCurrentPage={handleRestartCurrentPage}
            onScopeChange={updateScope}
            sourceStatus={sourceStatus}
          />
        )}

        {state.view === "map" && state.learningMap && (
          <LearningMapView
            canStartTraining={!isBusy}
            hasTraining={hasTraining}
            learningMap={state.learningMap}
            sourceTitle={state.extractedContent?.title ?? state.activePackage?.title}
            onStartTraining={handleStartTraining}
          />
        )}

        {state.view === "training" && (
          <TrainingView
            isBusy={isBusy}
            learningPackage={state.activePackage}
            learningMap={state.learningMap}
            answersCommitDelayMs={0}
            onStartTraining={handleStartTraining}
            onAnswersCommit={handleAnswersCommit}
            onAnswersChange={handleAnswersChange}
            onExportMarkdown={handleExportMarkdown}
            onLocateSourceQuote={handleLocateSourceQuote}
          />
        )}

        {state.view === "history" && (
          <HistoryView history={state.history} onDeleteItem={handleDeleteHistoryItem} onOpenItem={openHistoryItem} />
        )}

        {state.view === "settings" && (
          <SettingsView settings={state.settings} onSave={handleSaveSettings} />
        )}
      </main>

      <footer className="status-bar">
        <span><i className={state.status === "failed" ? "danger" : ""} />状态：{statusLabel}</span>
        <span>{state.scope === "page" ? "整页" : "选中段落"}</span>
      </footer>
    </div>
  );
}

function upsertHistory(history: LearningPackage[], learningPackage: LearningPackage) {
  return [learningPackage, ...history.filter((item) => item.id !== learningPackage.id)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function hasChromeTabsEvent() {
  return typeof chrome !== "undefined" && Boolean(chrome.tabs?.onActivated && chrome.tabs?.onUpdated);
}
