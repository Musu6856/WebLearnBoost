import { ArrowRight, FileText, KeyRound, MousePointer2, Sparkles } from "lucide-react";
import type { AsyncStatus, ExtractedPageContent, InputScope } from "../../shared/types";

interface EntryViewProps {
  content: ExtractedPageContent | null;
  hasApiKey: boolean;
  hasLearningMap: boolean;
  hasTraining: boolean;
  isBusy: boolean;
  onContinue: () => void;
  onGenerateMap: () => void;
  onOpenSettings: () => void;
  onScopeChange: (scope: InputScope) => void;
  scope: InputScope;
  status: AsyncStatus;
}

export function EntryView({
  content,
  hasApiKey,
  hasLearningMap,
  hasTraining,
  isBusy,
  onContinue,
  onGenerateMap,
  onOpenSettings,
  onScopeChange,
  scope,
  status
}: EntryViewProps) {
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
        <h1>{content?.title ?? "等待读取当前标签页"}</h1>
        <p>{content?.excerpt ?? "支持整页分析，也可以只基于选中段落生成学习地图、训练题和原文依据。"}</p>
        {content && (
          <div className="page-meta">
            <span>{content.url}</span>
            <span>{content.scope === "page" ? "整页提取" : "选区提取"}</span>
          </div>
        )}
      </article>

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

      <button
        className="primary"
        type="button"
        onClick={hasLearningMap ? onContinue : onGenerateMap}
        disabled={isBusy}
      >
        {hasLearningMap ? <ArrowRight size={18} /> : <Sparkles size={18} />}
        {getActionLabel(status, hasLearningMap, hasTraining)}
      </button>
    </section>
  );
}

function getActionLabel(status: AsyncStatus, hasLearningMap: boolean, hasTraining: boolean) {
  if (status === "extracting" || status === "generating-map") return "正在生成";
  if (hasTraining) return "继续训练";
  if (hasLearningMap) return "查看学习地图";
  return "生成学习地图";
}
