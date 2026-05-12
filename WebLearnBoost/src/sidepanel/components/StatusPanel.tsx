import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface StatusPanelProps {
  actionLabel?: string;
  icon: ReactNode;
  message: string;
  onAction?: () => void;
  startedAt?: number | null;
  title: string;
  tone: "danger" | "info" | "loading";
}

export function StatusPanel({ actionLabel, icon, message, onAction, startedAt, title, tone }: StatusPanelProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (tone !== "loading" || startedAt == null) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt, tone]);

  const elapsedMs = tone === "loading" && startedAt != null ? Math.max(0, now - startedAt) : 0;
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const progress = tone === "loading" ? Math.min(94, 14 + elapsedSeconds * 4) : 0;
  const loadingLabel = tone === "loading" ? formatElapsed(elapsedSeconds) : "";

  return (
    <section className={`status-panel ${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <div className="status-icon">{icon}</div>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
        {tone === "loading" && startedAt != null && (
          <div
            className="loading-meter"
            aria-label="生成进度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-valuetext={`已等待 ${loadingLabel}`}
            role="progressbar"
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        )}
        {tone === "loading" && startedAt != null && <small className="loading-caption">已等待 {loadingLabel}</small>}
        {actionLabel && onAction && (
          <button className="link-button" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </section>
  );
}

function formatElapsed(totalSeconds: number) {
  if (totalSeconds < 60) {
    return `${totalSeconds} 秒`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} 分 ${seconds} 秒`;
}
