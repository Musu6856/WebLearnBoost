import type { ExtractedPageContent, InputScope, LearningPackage } from "../shared/types";

export interface ActivePageInfo {
  title: string;
  url: string;
}

export interface PageContextSummary {
  title: string;
  url: string;
  scope: InputScope;
  excerpt?: string;
  capturedAt: string;
}

export type PageSourceStatus = "unknown" | "same-source" | "different-source";

export function createActivePageInfoFromContent(content: ExtractedPageContent | null): ActivePageInfo | null {
  if (!content) return null;
  return { title: content.title, url: content.url };
}

export function summarizeLearningSource(
  learningPackage: LearningPackage | null,
  content: ExtractedPageContent | null
): PageContextSummary | null {
  if (learningPackage) {
    return {
      title: learningPackage.title,
      url: learningPackage.url,
      scope: learningPackage.inputScope,
      excerpt: learningPackage.summary[0]?.sourceQuote ?? learningPackage.summary[0]?.text ?? learningPackage.sourceText.slice(0, 280),
      capturedAt: learningPackage.createdAt
    };
  }

  if (content) {
    return {
      title: content.title,
      url: content.url,
      scope: content.scope,
      excerpt: content.excerpt,
      capturedAt: content.extractedAt
    };
  }

  return null;
}

export function isSamePageUrl(left?: string, right?: string) {
  if (!left || !right) return false;

  try {
    const leftUrl = new URL(left);
    const rightUrl = new URL(right);
    leftUrl.hash = "";
    rightUrl.hash = "";
    return leftUrl.toString() === rightUrl.toString();
  } catch {
    return left === right;
  }
}

export function getPageSourceStatus(
  activePageInfo: ActivePageInfo | null,
  source: PageContextSummary | null
): PageSourceStatus {
  if (!activePageInfo || !source) return "unknown";
  return isSamePageUrl(activePageInfo.url, source.url) ? "same-source" : "different-source";
}
