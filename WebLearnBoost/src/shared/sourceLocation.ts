import type { SourceLocationHint } from "./types";

const LOCATION_TEXT_PATTERN = /[\s\u00a0]+/g;
const LOCATION_PUNCTUATION_PATTERN = /[\u201c\u201d"'‘’`.,，。！？!?；;：:、·…—\-_/\\()\[\]{}【】<>《》]/g;

export function normalizeSourceLocationText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(LOCATION_TEXT_PATTERN, "")
    .replace(LOCATION_PUNCTUATION_PATTERN, "")
    .trim();
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
      score = 2;
    } else if (normalizedQuote.includes(normalizedHint)) {
      score = 1;
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
