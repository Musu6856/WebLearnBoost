import type { ReactNode } from "react";

interface StatusPanelProps {
  actionLabel?: string;
  icon: ReactNode;
  message: string;
  onAction?: () => void;
  title: string;
  tone: "danger" | "info" | "loading";
}

export function StatusPanel({ actionLabel, icon, message, onAction, title, tone }: StatusPanelProps) {
  return (
    <section className={`status-panel ${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <div className="status-icon">{icon}</div>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
        {actionLabel && onAction && (
          <button className="link-button" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </section>
  );
}
