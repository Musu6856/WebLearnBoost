import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  FileText,
  FileSymlink,
  KeyRound,
  MousePointer2,
  RefreshCw,
  Sparkles
} from "lucide-react";
import type { AsyncStatus, ExtractedPageContent, InputScope } from "../../shared/types";
import type { ActivePageInfo, PageContextSummary, PageSourceStatus } from "../pageContext";

interface EntryViewProps {
  content: ExtractedPageContent | null;
  activePageInfo?: ActivePageInfo | null;
  hasApiKey: boolean;
  hasLearningMap: boolean;
  hasTraining: boolean;
  isBusy: boolean;
  learningSource?: PageContextSummary | null;
  onContinue: () => void;
  onGenerateMap: () => void;
  onOpenSettings: () => void;
  onRestartCurrentPage?: () => void;
  onScopeChange: (scope: InputScope) => void;
  scope: InputScope;
  status: AsyncStatus;
  sourceStatus?: PageSourceStatus;
}

export function EntryView({
  content,
  activePageInfo,
  hasApiKey,
  hasLearningMap,
  hasTraining,
  isBusy,
  learningSource,
  onContinue,
  onGenerateMap,
  onOpenSettings,
  onRestartCurrentPage,
  onScopeChange,
  scope,
  status,
  sourceStatus = "unknown"
}: EntryViewProps) {
  const hasSourceMismatch = sourceStatus === "different-source";
  const sourceLabel = hasSourceMismatch ? "当前标签页与现有学习包来源不一致" : "当前标签页与学习包来源一致";
  const sourceDetail = hasSourceMismatch
    ? "如果要继续看旧学习包，可以直接进入；如果要学习当前网页，请重新开始当前网页。"
    : "当前网页和现有学习包一致，可以继续查看或训练。";
  const currentPageTitle = hasSourceMismatch ? activePageInfo?.title ?? content?.title : content?.title ?? activePageInfo?.title;
  const currentPageUrl = hasSourceMismatch ? activePageInfo?.url ?? content?.url : content?.url ?? activePageInfo?.url;
  const currentPageExcerpt = hasSourceMismatch
    ? "当前标签页已变化，现有学习包仍会保留在下方。"
    : content?.excerpt ?? "支持整页分析，也可以只基于选中段落生成学习地图、训练题和原文依据。";

  return (
    <section className="stack">
      {!hasApiKey && (
        <article className="notice action-notice">
          <KeyRound size={17} />
          <div>
            <strong>尚未配置 API Key</strong>
            <span>现在展示可点击的 MVP 流程，接入真实模型前请先保存配置。</span>
          </div>
          <button type="button" onClick={onOpenSettings}>设置</button>
        </article>
      )}

      <article className="card hero-card">
        <span className="eyebrow">当前网页</span>
        <h1>{currentPageTitle ?? "等待读取当前标签页"}</h1>
        <p>{currentPageExcerpt}</p>
        {currentPageUrl && (
          <div className="page-meta">
            <span title={currentPageUrl}>{currentPageUrl}</span>
            {!hasSourceMismatch && content && <span>{content.scope === "page" ? "整页提取" : "选区提取"}</span>}
          </div>
        )}
      </article>

      {hasSourceMismatch && learningSource && (
        <article className="notice action-notice source-notice warning">
          <AlertTriangle size={17} />
          <div>
            <strong>{sourceLabel}</strong>
            <span>{sourceDetail}</span>
          </div>
          <button type="button" onClick={onContinue}>
            <ExternalLink size={14} />
            查看现有学习包
          </button>
        </article>
      )}

      {hasLearningMap && learningSource && (
        <article className="card accent source-card">
          <div className="source-card-head">
            <div>
              <span className="eyebrow">学习包来源</span>
              <strong>{learningSource.title ?? "未命名学习包"}</strong>
            </div>
            <FileSymlink size={16} />
          </div>
          <div className="page-meta">
            <span title={learningSource.url}>{learningSource.url ?? "未记录来源网址"}</span>
            <span>{learningSource.scope === "selection" ? "选区来源" : "整页来源"}</span>
          </div>
          {learningSource.excerpt && <p>{learningSource.excerpt}</p>}
        </article>
      )}

      <div className="segmented" aria-label="提取范围">
        <button type="button" className={scope === "page" ? "active" : ""} onClick={() => onScopeChange("page")}>
          <FileText size={15} />整页
        </button>
        <button type="button" className={scope === "selection" ? "active" : ""} onClick={() => onScopeChange("selection")}>
          <MousePointer2 size={15} />选中段落
        </button>
      </div>

      <div className="flow-list" aria-label="MVP 流程">
        {["提取正文", "生成学习地图", "开始训练", "导出 Markdown"].map((step, index) => (
          <div className="flow-step" key={step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>

      <button className="primary" type="button" onClick={hasLearningMap ? onContinue : onGenerateMap} disabled={isBusy}>
        {hasLearningMap ? <ArrowRight size={18} /> : <Sparkles size={18} />}
        {getActionLabel(status, hasLearningMap, hasTraining)}
      </button>

      {hasLearningMap && onRestartCurrentPage && (
        <button className="secondary" type="button" onClick={onRestartCurrentPage} disabled={isBusy}>
          <RefreshCw size={16} />
          重新开始当前网页
        </button>
      )}
    </section>
  );
}

function getActionLabel(status: AsyncStatus, hasLearningMap: boolean, hasTraining: boolean) {
  if (status === "extracting" || status === "generating-map") return "正在生成";
  if (hasTraining) return "继续训练";
  if (hasLearningMap) return "查看学习地图";
  return "生成学习地图";
}
