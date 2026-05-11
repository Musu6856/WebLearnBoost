import { BookOpen, FileClock, Trash2 } from "lucide-react";
import type { LearningPackage } from "../../shared/types";

interface HistoryViewProps {
  history: LearningPackage[];
  onDeleteItem: (learningPackage: LearningPackage) => void;
  onOpenItem: (learningPackage: LearningPackage) => void;
}

export function HistoryView({ history, onDeleteItem, onOpenItem }: HistoryViewProps) {
  if (history.length === 0) {
    return (
      <section className="stack">
        <article className="card empty-state">
          <FileClock size={30} />
          <h1>还没有学习历史</h1>
          <p>生成训练内容后，会在本地保存学习包版本，便于继续复习和导出。</p>
        </article>
      </section>
    );
  }

  const groups = groupByUrl(history);

  return (
    <section className="stack">
      <div className="section-heading">
        <span>本地历史</span>
        <strong>{groups.length} 个网页 / {history.length} 个版本</strong>
      </div>
      {groups.map((group) => (
        <article className="card history-group" key={group.url}>
          <header>
            <div>
              <strong>{group.title}</strong>
              <span>{group.url}</span>
            </div>
            <small>{group.versions.length} 个版本</small>
          </header>
          <div className="history-version-list">
            {group.versions.map((item, index) => (
              <div className="history-version" key={item.id}>
                <div>
                  <strong>{index === 0 ? "最新版本" : `版本 ${group.versions.length - index}`}</strong>
                  <span>{formatDate(item.createdAt)} · {item.inputScope === "page" ? "整页" : "选中段落"}</span>
                </div>
                <div className="history-actions">
                  <button type="button" onClick={() => onOpenItem(item)} aria-label={`打开 ${item.title}`}>
                    <BookOpen size={15} />打开
                  </button>
                  <button className="danger-button" type="button" onClick={() => onDeleteItem(item)} aria-label={`删除 ${item.title}`}>
                    <Trash2 size={15} />删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function groupByUrl(history: LearningPackage[]) {
  const map = new Map<string, LearningPackage[]>();
  for (const item of history) {
    const versions = map.get(item.url) ?? [];
    versions.push(item);
    map.set(item.url, versions);
  }

  return [...map.entries()]
    .map(([url, versions]) => {
      const sorted = [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return {
        url,
        title: sorted[0]?.title ?? url,
        latestCreatedAt: sorted[0]?.createdAt ?? "",
        versions: sorted
      };
    })
    .sort((a, b) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
