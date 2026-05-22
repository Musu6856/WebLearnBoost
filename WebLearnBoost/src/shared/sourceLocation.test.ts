import { describe, expect, it } from "vitest";
import { findBestSourceLocationHint, normalizeSourceLocationText, sourceLocationTextsMatch } from "./sourceLocation";

describe("sourceLocation", () => {
  it("normalizes whitespace and punctuation", () => {
    expect(normalizeSourceLocationText("source snippet, with more context")).toBe("sourcesnippetwithmorecontext");
  });

  it("matches a shorter quote against a longer hint", () => {
    const hint = {
      textQuote: "source snippet with more context",
      selector: "#article p:nth-of-type(1)",
      index: 0
    };

    expect(findBestSourceLocationHint("source snippet", [hint])).toEqual(hint);
  });

  it("rejects weak partial hints that only share a short phrase", () => {
    const hint = {
      textQuote: "embedding模型",
      selector: "#article p:nth-of-type(1)",
      index: 0
    };

    expect(findBestSourceLocationHint("embedding模型的Tokens限制情况以及语义完整性影响", [hint])).toBeUndefined();
  });

  it("requires enough quote text before matching an element", () => {
    expect(sourceLocationTextsMatch("embedding模型可用于语义检索，但这段不是具体依据。", "embedding模型")).toBe(false);
    expect(sourceLocationTextsMatch("RAG通过检索外部知识增强回答，并保留原文依据。", "检索外部知识增强回答")).toBe(true);
  });
});
