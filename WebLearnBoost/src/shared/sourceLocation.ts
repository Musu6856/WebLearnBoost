import type { SourceLocationHint } from "./types";

const LOCATION_TEXT_PATTERN = /[\s\u00a0]+/g;
const LOCATION_PUNCTUATION_PATTERN = /[\u201c\u201d"'‘’`.,，。！？!?；;：:、·…—\-_/\\()\[\]{}【】<>《》]/g;
const MIN_REVERSE_FRAGMENT_LENGTH = 18;
const MIN_REVERSE_COVERAGE = 0.65;
const CJK_PATTERN = /[\u3400-\u9fff]/g;

export function normalizeSourceLocationText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(LOCATION_TEXT_PATTERN, "")
    .replace(LOCATION_PUNCTUATION_PATTERN, "")
    .trim();
}

function isMeaningfulFragment(normalizedText: string): boolean {
  const cjkCount = normalizedText.match(CJK_PATTERN)?.length ?? 0;
  return cjkCount >= 6 || normalizedText.length >= 12;
}

export function sourceLocationTextsMatch(candidateText: string, quote: string): boolean {
  const normalizedCandidate = normalizeSourceLocationText(candidateText);
  const normalizedQuote = normalizeSourceLocationText(quote);

  if (!normalizedCandidate || !normalizedQuote) return false;
  if (normalizedCandidate === normalizedQuote) return true;

  if (normalizedCandidate.includes(normalizedQuote)) {
    return isMeaningfulFragment(normalizedQuote);
  }

  if (normalizedQuote.includes(normalizedCandidate)) {
    return (
      normalizedCandidate.length >= MIN_REVERSE_FRAGMENT_LENGTH &&
      normalizedCandidate.length / normalizedQuote.length >= MIN_REVERSE_COVERAGE
    );
  }

  return false;
}

export function findBestSourceLocationHint(
  quote: string,
  hints: SourceLocationHint[]
): SourceLocationHint | undefined {
  const normalizedQuote = normalizeSourceLocationText(quote);
  if (!normalizedQuote) return undefined;

  let bestHint: SourceLocationHint | undefined;
  let bestScore = 0;
  let bestLength = Number.POSITIVE_INFINITY;

  for (const hint of hints) {
    const normalizedHint = normalizeSourceLocationText(hint.textQuote);
    if (!normalizedHint) continue;

    let score = 0;
    if (normalizedHint === normalizedQuote) {
      score = 3;
    } else if (normalizedHint.includes(normalizedQuote)) {
      score = isMeaningfulFragment(normalizedQuote) ? 2 : 0;
    } else if (normalizedQuote.includes(normalizedHint)) {
      score =
        normalizedHint.length >= MIN_REVERSE_FRAGMENT_LENGTH &&
        normalizedHint.length / normalizedQuote.length >= MIN_REVERSE_COVERAGE
          ? 1
          : 0;
    }

    if (!score) continue;

    if (score > bestScore || (score === bestScore && normalizedHint.length < bestLength)) {
      bestHint = hint;
      bestScore = score;
      bestLength = normalizedHint.length;
    }
  }

  return bestHint;
}
