import { BookOpen, GitBranch, ListChecks, Route, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { LearningMap } from "../../shared/types";

interface LearningMapViewProps {
  canStartTraining: boolean;
  hasTraining: boolean;
  learningMap: LearningMap;
  onStartTraining: () => void;
  sourceTitle?: string;
}

export function LearningMapView({ canStartTraining, hasTraining, learningMap, onStartTraining, sourceTitle }: LearningMapViewProps) {
  return (
    <section className="stack">
      <article className="card accent">
        <span className="eyebrow">这篇资料在讲什么</span>
        <h1>{sourceTitle ?? "学习地图"}</h1>
        <p>{learningMap.overview}</p>
      </article>

      <article className="card">
        <span className="eyebrow">文章结构</span>
        <div className="timeline">
          {learningMap.structure.map((item, index) => (
            <div className="timeline-item" key={item.title}>
              <span>{index + 1}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="card">
        <span className="eyebrow">核心概念</span>
        <div className="chips">{learningMap.concepts.map((concept) => <span key={concept}>{concept}</span>)}</div>
      </article>

      <article className="card compact-grid">
        <MapBlock icon={<GitBranch size={16} />} title="概念关系" items={learningMap.conceptRelations} />
        <MapBlock icon={<Route size={16} />} title="阅读顺序" items={learningMap.readingOrder} />
        <MapBlock icon={<TriangleAlert size={16} />} title="易错点" items={learningMap.pitfalls} />
        <MapBlock icon={<ListChecks size={16} />} title="前置知识" items={learningMap.prerequisites} />
      </article>

      <button className="primary" type="button" onClick={onStartTraining} disabled={!canStartTraining}>
        <BookOpen size={18} />{hasTraining ? "继续训练" : "开始训练"}
      </button>
    </section>
  );
}

interface MapBlockProps {
  icon: ReactNode;
  items: string[];
  title: string;
}

function MapBlock({ icon, items, title }: MapBlockProps) {
  return (
    <div className="map-block">
      <h2>{icon}{title}</h2>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
