import type { ExtractedPageContent, InputScope, RuntimeRequest, RuntimeResponse, SourceLocationHint } from "../shared/types";
import { normalizeSourceLocationText, sourceLocationTextsMatch } from "../shared/sourceLocation";

type TextBlock = {
  element: Element;
  text: string;
  selector?: string;
  heading?: string;
  index: number;
};

const MIN_PAGE_TEXT_LENGTH = 120;
const MIN_SELECTION_TEXT_LENGTH = 40;
const MAX_TEXT_LENGTH = 50000;
const NOISE_SELECTOR = [
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "canvas",
  "iframe",
  "nav",
  "header",
  "footer",
  "aside",
  "form",
  "button",
  "input",
  "select",
  "textarea",
  "[hidden]",
  "[aria-hidden='true']",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  "[role='complementary']",
  ".ad",
  ".ads",
  ".advertisement",
  ".banner",
  ".cookie",
  ".cookies",
  ".comment",
  ".comments",
  ".footer",
  ".header",
  ".menu",
  ".modal",
  ".nav",
  ".newsletter",
  ".popup",
  ".promo",
  ".related",
  ".share",
  ".sidebar",
  ".social",
  "[class*='advert']",
  "[class*='cookie']",
  "[class*='newsletter']",
  "[class*='paywall']",
  "[class*='related']",
  "[class*='share']",
  "[id*='advert']",
  "[id*='cookie']",
  "[id*='newsletter']",
  "[id*='paywall']",
  "[id*='related']",
  "[id*='share']"
].join(",");

const BLOCK_SELECTOR = "p, li, blockquote, pre, h1, h2, h3, h4";
const ROOT_CANDIDATE_SELECTOR = "article, main, [role='main'], .article, .post, .entry-content, .post-content, .content, #content";

const normalizeText = (text: string) =>
  text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const normalizeInlineText = (text: string) => normalizeText(text).replace(/\s+/g, " ").trim();

const isVisibleElement = (element: Element) => {
  const htmlElement = element as HTMLElement;
  const style = window.getComputedStyle(htmlElement);
  const rect = htmlElement.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && rect.width > 0 && rect.height > 0;
};

const cloneReadableRoot = (root: Element) => {
  const clone = root.cloneNode(true) as Element;
  clone.querySelectorAll(NOISE_SELECTOR).forEach((node) => node.remove());
  return clone;
};

const getMetaContent = (...selectors: string[]) => {
  for (const selector of selectors) {
    const value = document.querySelector<HTMLMetaElement>(selector)?.content;
    if (value && normalizeInlineText(value)) return normalizeInlineText(value);
  }
  return undefined;
};

const getTitle = () => {
  const heading = document.querySelector("article h1, main h1, [role='main'] h1, h1");
  const title =
    getMetaContent("meta[property='og:title']", "meta[name='twitter:title']") ||
    normalizeInlineText(heading?.textContent ?? "") ||
    normalizeInlineText(document.title);
  return title || window.location.hostname;
};

const getByline = () => {
  const metaByline = getMetaContent(
    "meta[name='author']",
    "meta[property='article:author']",
    "meta[name='byl']",
    "meta[name='parsely-author']"
  );
  if (metaByline) return metaByline;

  const bylineElement = document.querySelector(
    "[rel='author'], .byline, .author, .article-author, .post-author, [class*='byline'], [class*='author']"
  );
  const byline = normalizeInlineText(bylineElement?.textContent ?? "");
  return byline && byline.length <= 160 ? byline : undefined;
};

const getExcerpt = (text: string) => {
  const metaExcerpt = getMetaContent(
    "meta[name='description']",
    "meta[property='og:description']",
    "meta[name='twitter:description']"
  );
  const excerpt = metaExcerpt ?? text;
  return normalizeInlineText(excerpt).slice(0, 280);
};

const getCssSelector = (element: Element) => {
  if (element.id) return `#${CSS.escape(element.id)}`;

  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current !== document.body && parts.length < 4) {
    const tagName = current.tagName.toLowerCase();
    const parent: Element | null = current.parentElement;
    if (!parent) break;
    const currentTagName = current.tagName;
    const siblings = Array.from(parent.children).filter((child: Element) => child.tagName === currentTagName);
    const index = siblings.indexOf(current) + 1;
    parts.unshift(siblings.length > 1 ? `${tagName}:nth-of-type(${index})` : tagName);
    current = parent;
  }

  return parts.length > 0 ? parts.join(" > ") : undefined;
};

const getNearestHeading = (element: Element) => {
  const sectionHeading = element.closest("section, article")?.querySelector("h1,h2,h3,h4");
  const previousHeadings = Array.from(document.querySelectorAll("h1,h2,h3,h4")).filter((heading) => {
    return heading.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING;
  });
  const heading = sectionHeading ?? previousHeadings.at(-1);
  const text = normalizeInlineText(heading?.textContent ?? "");
  return text ? text.slice(0, 160) : undefined;
};

const getBlockText = (element: Element) => normalizeInlineText(element.textContent ?? "");

const getTextBlocks = (root: Element) => {
  const blocks = Array.from(root.querySelectorAll(BLOCK_SELECTOR))
    .filter((element) => !element.closest(NOISE_SELECTOR) && isVisibleElement(element))
    .map((element, index): TextBlock => {
      return {
        element,
        text: getBlockText(element),
        selector: getCssSelector(element),
        heading: getNearestHeading(element),
        index
      };
    })
    .filter((block) => block.text.length >= 25 && !/^(share|subscribe|advertisement|related|read more)$/i.test(block.text));

  if (blocks.length > 0) return blocks;

  const sourceRoot = cloneReadableRoot(root);
  const fallbackText = normalizeInlineText(sourceRoot.textContent ?? "");
  return fallbackText ? [{ element: root, text: fallbackText, selector: getCssSelector(root), index: 0 }] : [];
};

const scoreRoot = (root: Element) => {
  const clone = cloneReadableRoot(root);
  const text = normalizeInlineText(clone.textContent ?? "");
  const paragraphCount = clone.querySelectorAll("p, li, blockquote").length;
  const linkTextLength = Array.from(clone.querySelectorAll("a")).reduce((sum, link) => sum + normalizeInlineText(link.textContent ?? "").length, 0);
  const linkDensity = text.length > 0 ? linkTextLength / text.length : 1;
  const rootBonus = root.matches("article, main, [role='main']") ? 500 : 0;
  return text.length + paragraphCount * 120 + rootBonus - linkDensity * 800;
};

const getReadableRoot = () => {
  const roots = Array.from(document.querySelectorAll(ROOT_CANDIDATE_SELECTOR)).filter(isVisibleElement);
  if (document.body) roots.push(document.body);

  return roots
    .map((root) => ({ root, score: scoreRoot(root) }))
    .sort((a, b) => b.score - a.score)[0]?.root ?? document.body;
};

const getReadablePageText = () => {
  const root = getReadableRoot();
  const blocks = getTextBlocks(root);
  const text = normalizeText(blocks.map((block) => block.text).join("\n\n"));
  return {
    root,
    blocks,
    text: text.slice(0, MAX_TEXT_LENGTH)
  };
};

const getSelectionBlockText = () => {
  const selection = window.getSelection();
  const selectedText = normalizeInlineText(selection?.toString() ?? "");
  if (!selection || selection.rangeCount === 0 || !selectedText) return { text: "", blocks: [] as TextBlock[] };

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? (range.commonAncestorContainer as Element)
    : range.commonAncestorContainer.parentElement;
  const blockRoot = container?.closest("p, li, blockquote, pre, article, main, [role='main']") ?? container;
  const paragraphText = blockRoot ? getBlockText(blockRoot) : "";
  const text = paragraphText && paragraphText.length <= Math.max(selectedText.length * 4, 1200) ? paragraphText : selectedText;

  return {
    text: normalizeInlineText(text).slice(0, MAX_TEXT_LENGTH),
    blocks: blockRoot
      ? [{
          element: blockRoot,
          text: normalizeInlineText(text),
          selector: getCssSelector(blockRoot),
          heading: getNearestHeading(blockRoot),
          index: 0
        }]
      : []
  };
};

const createLocationHints = (blocks: TextBlock[], fallbackText: string): SourceLocationHint[] => {
  const hints = blocks
    .filter((block) => block.text.length >= 35)
    .slice(0, 14)
    .map((block) => ({
      textQuote: block.text.slice(0, 220),
      selector: block.selector,
      heading: block.heading,
      index: block.index
    }));

  if (hints.length > 0) return hints;
  return fallbackText ? [{ textQuote: fallbackText.slice(0, 220), index: 0 }] : [];
};

const createExtractionError = (scope: InputScope): RuntimeResponse<ExtractedPageContent> => ({
  ok: false,
  error: {
    title: "页面内容提取失败",
    message: scope === "selection" ? "选中的内容太短，无法生成学习包。" : "没有识别到足够的正文内容。",
    recoveryAction: scope === "selection" ? "请选中一段更完整的正文后重试。" : "请打开包含正文的页面，或改为选中页面中的正文段落。"
  }
});

const extractPageContent = (scope: InputScope): RuntimeResponse<ExtractedPageContent> => {
  const extraction = scope === "selection" ? getSelectionBlockText() : getReadablePageText();
  const minLength = scope === "selection" ? MIN_SELECTION_TEXT_LENGTH : MIN_PAGE_TEXT_LENGTH;

  if (!extraction.text || extraction.text.length < minLength) {
    return createExtractionError(scope);
  }

  return {
    ok: true,
    data: {
      title: getTitle(),
      url: window.location.href,
      scope,
      text: extraction.text,
      byline: getByline(),
      excerpt: getExcerpt(extraction.text),
      locationHints: createLocationHints(extraction.blocks, extraction.text),
      extractedAt: new Date().toISOString()
    }
  };
};

const getLocateNeedle = (quote: string) => normalizeSourceLocationText(quote).slice(0, 160);

const matchesLocateNeedle = (candidateText: string, quote: string) => sourceLocationTextsMatch(candidateText, quote);

const scrollElementIntoView = (element: Element | null | undefined) => {
  if (!element) return false;
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  return true;
};

const locateBySelector = (quote: string) => {
  const readable = getReadablePageText();
  const hint = createLocationHints(readable.blocks, readable.text).find((candidate) => {
    return Boolean(candidate.selector && matchesLocateNeedle(candidate.textQuote, quote));
  });
  if (!hint?.selector) return false;

  return scrollElementIntoView(document.querySelector(hint.selector));
};

const locateSourceQuote = (quote: string, locationHint?: SourceLocationHint): RuntimeResponse<boolean> => {
  const primaryQuote = quote.trim();
  const hintQuote = locationHint?.textQuote?.trim() ?? "";
  const needle = getLocateNeedle(primaryQuote || hintQuote);
  if (!needle) {
    return {
      ok: false,
      error: {
        title: "无法定位原文",
        message: "没有收到可定位的原文片段。"
      }
    };
  }

  if (locationHint?.selector) {
    const hintedElement = document.querySelector(locationHint.selector);
    const hintedText = hintedElement?.textContent ?? "";
    if (
      hintedElement &&
      (matchesLocateNeedle(hintedText, primaryQuote) || (hintQuote && matchesLocateNeedle(hintedText, hintQuote)))
    ) {
      scrollElementIntoView(hintedElement);
      return { ok: true, data: true };
    }
  }

  if (primaryQuote && locateBySelector(primaryQuote)) return { ok: true, data: true };

  if (hintQuote && locateBySelector(hintQuote)) {
    return { ok: true, data: true };
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || parent.closest(NOISE_SELECTOR)) return NodeFilter.FILTER_REJECT;
      return normalizeSourceLocationText(node.textContent ?? "").length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });

  let node = walker.nextNode();
  while (node) {
    const text = node.textContent ?? "";
    if (matchesLocateNeedle(text, primaryQuote) || (hintQuote && matchesLocateNeedle(text, hintQuote))) {
      scrollElementIntoView(node.parentElement);
      return { ok: true, data: true };
    }
    node = walker.nextNode();
  }

  const blocks = getTextBlocks(getReadableRoot());
  const matchingBlock = blocks.find((block) => matchesLocateNeedle(block.text, primaryQuote) || (hintQuote && matchesLocateNeedle(block.text, hintQuote)));
  if (matchingBlock) {
    scrollElementIntoView(matchingBlock.element);
    return { ok: true, data: true };
  }

  return {
    ok: false,
    error: {
      title: "无法定位原文",
      message: "没有在当前页面找到对应片段，但学习包中仍保留了原文摘录。",
      recoveryAction: "请确认页面没有刷新到不同文章，或手动在页面中搜索该片段。"
    }
  };
};

chrome.runtime.onMessage.addListener((request: RuntimeRequest, _sender, sendResponse) => {
  if (request.type === "GET_ACTIVE_TAB_CONTENT") {
    sendResponse(extractPageContent(request.scope));
    return true;
  }

  if (request.type === "LOCATE_SOURCE_QUOTE") {
    sendResponse(locateSourceQuote(request.quote, request.locationHint));
    return true;
  }

  return false;
});
