export type InputScope = "page" | "selection";

export type ViewName = "entry" | "map" | "training" | "history" | "settings";

export type ModelProvider = "openai-compatible" | "anthropic-compatible";

export type AsyncStatus =
  | "idle"
  | "extracting"
  | "generating-map"
  | "awaiting-training"
  | "generating-training"
  | "training"
  | "saved"
  | "exporting"
  | "failed";

export interface AppSettings {
  provider: ModelProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  outputLanguage: string;
}

export interface SourceLocationHint {
  textQuote: string;
  selector?: string;
  heading?: string;
  index?: number;
}

export interface ExtractedPageContent {
  title: string;
  url: string;
  scope: InputScope;
  text: string;
  byline?: string;
  excerpt?: string;
  locationHints: SourceLocationHint[];
  extractedAt: string;
}

export interface LearningMap {
  overview: string;
  structure: Array<{ title: string; description: string }>;
  concepts: string[];
  conceptRelations: string[];
  readingOrder: string[];
  pitfalls: string[];
  prerequisites: string[];
}

export interface SummaryItem {
  text: string;
  sourceQuote?: string;
  locationHint?: SourceLocationHint;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  sourceQuote?: string;
  locationHint?: SourceLocationHint;
}

export interface LearningPackage {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  inputScope: InputScope;
  sourceText: string;
  learningMap: LearningMap;
  summary: SummaryItem[];
  quiz: QuizQuestion[];
  answers: Record<string, string>;
  sourceQuotes: string[];
  locationHints: SourceLocationHint[];
  exportStatus: "idle" | "exporting" | "exported" | "failed";
}

export interface HistoryGroup {
  url: string;
  title: string;
  latestCreatedAt: string;
  versions: LearningPackage[];
}

export interface UserFacingError {
  title: string;
  message: string;
  recoveryAction?: string;
}

export type RuntimeRequest =
  | { type: "GET_ACTIVE_TAB_CONTENT"; scope: InputScope }
  | { type: "LOCATE_SOURCE_QUOTE"; quote: string };

export type RuntimeResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: UserFacingError };
