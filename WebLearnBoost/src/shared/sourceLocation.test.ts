import { describe, expect, it } from "vitest";
import { findBestSourceLocationHint, normalizeSourceLocationText } from "./sourceLocation";

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
});
