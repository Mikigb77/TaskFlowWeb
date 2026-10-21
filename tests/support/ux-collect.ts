// Measurements taken inside the page for the UX web audit (tests/ux-renders.spec.ts).
//
// Every exported function runs in the browser through page.evaluate, so each one is
// self-contained: no imports, and no helpers from outside its own body. installHelpers()
// puts the shared helpers on window.__ux; call it first on every page you measure.
//
// Elements inside [data-ux-ignore] (the fold line, the Cloudflare stand-in) are skipped.

export type Rgba = [number, number, number, number];

export type UxHelpers = {
  selectorOf(element: Element): string;
  textOf(element: Element, max?: number): string;
  shown(element: Element): boolean;
  ignored(element: Element): boolean;
  color(value: string | null | undefined): Rgba | null;
  over(top: Rgba, bottom: Rgba): Rgba;
  ratio(a: Rgba, b: Rgba): number;
  hex(value: Rgba | null): string | null;
  backdrop(element: Element | null): { color: Rgba; note: string };
  opacity(element: Element): number;
  sticky(element: Element | null): Element | null;
};

export type ContrastHint = {
  selector: string;
  status: "pass" | "fail" | "incomplete";
  fg: string | null;
  bg: string | null;
  ratio: number | null;
  expected: number | null;
  messageKey: string | null;
};

export type Contrast = {
  ratio: number | null;
  fg: string | null;
  bg: string | null;
  required: number;
  // axe: axe-core's color-contrast check measured it (stacking-aware).
  // axe-incomplete: axe couldn't decide (messageKey in note); ratio is the ancestors estimate.
  // ancestors: axe didn't check it; the background comes from the element's ancestors only.
  source: "axe" | "axe-incomplete" | "ancestors" | "unknown";
  note: string;
};

export type TextRow = {
  selector: string;
  text: string;
  chars: number;
  size: number;
  weight: number;
  role: "heading" | "control" | "body" | "other";
  frame: "header" | "footer" | null;
  decorative: boolean;
  large: boolean;
  exempt: string | null;
  contrast: Contrast;
};

export type TargetRow = {
  i: number;
  selector: string;
  kind: string;
  text: string;
  // The visible label: the text for links and buttons, the <label> for fields.
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lines: number;
  inline: boolean;
  underline: boolean | null;
  vsText: number | null;
  disabled: boolean;
  offscreen: boolean;
  uaControl: boolean;
  spacingOk: boolean | null;
  gap: number | null;
};

export type ControlRow = {
  selector: string;
  kind: string;
  text: string;
  state: string;
  // For toggle buttons (aria-pressed): their parent, to compare pressed with not pressed.
  group: string | null;
  disabled: boolean;
  outer: string | null;
  fill: string | null;
  border: string | null;
  icon: string | null;
  fillRatio: number | null;
  borderRatio: number | null;
  iconRatio: number | null;
  verdict:
    | "ok"
    | "weak-boundary"
    | "text-only"
    | "fail-boundary"
    | "fail-icon"
    | "exempt-disabled"
    | "unknown";
  note: string;
};

export type HeadingRow = {
  level: number;
  text: string;
  visible: boolean;
  hidden: boolean;
  selector: string;
};

export type ImageRow = {
  i: number;
  selector: string;
  kind: "img" | "svg" | "role-img" | "input-image";
  alt: string | null;
  src: string;
  visible: boolean;
  hidden: boolean;
};

export type MetaRow = {
  lang: string;
  title: string;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  alternates: { hreflang: string; href: string }[];
  og: Record<string, string>;
  twitter: Record<string, string>;
  themeColor: string | null;
  viewport: string | null;
};

export type OverflowRow = {
  viewport: number;
  scrollWidth: number;
  overflow: number;
  offenders: {
    selector: string;
    text: string;
    left: number;
    right: number;
    width: number;
  }[];
};

export type ClipRow = {
  selector: string;
  text: string;
  how: "overflow" | "ellipsis" | "line-clamp";
  clippedBy: string;
  hiddenX: number;
  hiddenY: number;
  decorative: boolean;
};

// A live region: what a screen reader announces when its text changes.
export type LiveRow = {
  selector: string;
  role: string;
  live: string;
  text: string;
  visible: boolean;
};

export type Collected = {
  live: LiveRow[];
  viewport: {
    width: number;
    height: number;
    pageHeight: number;
    rootFontSize: number;
    bodyFontSize: number;
  };
  targets: TargetRow[];
  hiddenTargets: number;
  texts: TextRow[];
  controls: ControlRow[];
  headings: HeadingRow[];
  images: ImageRow[];
  meta: MetaRow | null;
  overflow: OverflowRow;
  clipped: ClipRow[];
  focus: string | null;
};

export type TextSize = { t: number; selector: string; size: number; text: string };

export type FocusStop = {
  body: boolean;
  n: number;
  k: number;
  tag: string;
  selector: string;
  text: string;
  rect: { x: number; y: number; width: number; height: number };
  offscreen: boolean;
  obscured: "no" | "partly" | "fully" | "offscreen";
  obscuredBy: string | null;
  bySticky: boolean;
  indicator: {
    visible: boolean;
    outline: string | null;
    changes: string[];
    ringContrast: number | null;
  };
  clippedBy: string | null;
  multiField: boolean;
};

export function installHelpers() {
  const w = window as unknown as { __ux?: UxHelpers };
  if (w.__ux) return;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const paint = canvas.getContext("2d", { willReadFrequently: true });
  const cache = new Map<string, Rgba | null>();
  const toAlpha = (value: string | undefined) =>
    value === undefined
      ? 1
      : value.endsWith("%")
        ? parseFloat(value) / 100
        : parseFloat(value);
  const color = (value: string | null | undefined): Rgba | null => {
    if (!value) return null;
    if (cache.has(value)) return cache.get(value)!;
    let out: Rgba | null = null;
    const rgb =
      /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(
        value,
      );
    const srgb =
      /^color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/.exec(
        value,
      );
    if (value === "transparent") out = [0, 0, 0, 0];
    else if (rgb) out = [+rgb[1], +rgb[2], +rgb[3], toAlpha(rgb[4])];
    else if (srgb)
      out = [
        Math.max(0, Math.min(255, +srgb[1] * 255)),
        Math.max(0, Math.min(255, +srgb[2] * 255)),
        Math.max(0, Math.min(255, +srgb[3] * 255)),
        toAlpha(srgb[4]),
      ];
    else if (paint) {
      // Any other syntax (oklch, lab, color-mix…): let the browser convert it to sRGB.
      paint.clearRect(0, 0, 1, 1);
      paint.fillStyle = "#000";
      paint.fillStyle = value;
      paint.fillRect(0, 0, 1, 1);
      const d = paint.getImageData(0, 0, 1, 1).data;
      out = [d[0], d[1], d[2], d[3] / 255];
    }
    cache.set(value, out);
    return out;
  };
  const over = (top: Rgba, bottom: Rgba): Rgba => {
    const a = top[3];
    return [
      top[0] * a + bottom[0] * (1 - a),
      top[1] * a + bottom[1] * (1 - a),
      top[2] * a + bottom[2] * (1 - a),
      1,
    ];
  };
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const luminance = (c: Rgba) =>
    0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);
  const ratio = (a: Rgba, b: Rgba) => {
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const hex = (value: Rgba | null) =>
    value
      ? "#" +
        value
          .slice(0, 3)
          .map((part) =>
            Math.round(Math.max(0, Math.min(255, part)))
              .toString(16)
              .padStart(2, "0"),
          )
          .join("")
      : null;
  const token = (node: Element) => {
    const tag = node.tagName.toLowerCase();
    // React's useId ids (":r1:") change between renders; don't build selectors on them.
    if (node.id && !/[:\s]/.test(node.id)) return `${tag}#${CSS.escape(node.id)}`;
    const classes = Array.from(node.classList)
      .filter((name) => !/^(light-only|dark-only|is-[\w-]+)$/.test(name))
      .slice(0, 2);
    return tag + classes.map((name) => "." + CSS.escape(name)).join("");
  };
  const selectorOf = (element: Element) => {
    const parts: string[] = [];
    let node: Element | null = element;
    while (node && node !== document.documentElement) {
      let part = token(node);
      const parent: Element | null = node.parentElement;
      if (parent && !part.includes("#")) {
        const sameTag = Array.from(parent.children).filter(
          (child) => child.tagName === node!.tagName,
        );
        if (sameTag.filter((child) => token(child) === part).length > 1)
          part += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      if (part.includes("#") || node === document.body || parts.length >= 4)
        break;
      node = parent;
    }
    return parts.join(" > ");
  };
  const textOf = (element: Element, max = 80) => {
    const value = (
      (element as HTMLElement).innerText ??
      element.textContent ??
      ""
    )
      .replace(/\s+/g, " ")
      .trim();
    return value.length > max ? value.slice(0, max - 1) + "…" : value;
  };
  const ignored = (element: Element) => !!element.closest("[data-ux-ignore]");
  // Visually hidden on purpose (sr-only): clipped to nothing, or squeezed into 1 px.
  const clippedAway = (element: Element) => {
    for (let node: Element | null = element; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (/rect\(\s*0(px)?[,\s]+0(px)?[,\s]+0(px)?[,\s]+0(px)?\s*\)/.test(style.clip)) return true;
      if (/inset\(\s*50%/.test(style.clipPath)) return true;
      if (style.overflow !== "visible") {
        const box = node.getBoundingClientRect();
        if (box.width <= 1 || box.height <= 1) return true;
      }
    }
    return false;
  };
  const shown = (element: Element) => {
    if (ignored(element)) return false;
    const visible = element.checkVisibility({
      opacityProperty: true,
      visibilityProperty: true,
      checkOpacity: true,
      checkVisibilityCSS: true,
    } as CheckVisibilityOptions);
    if (!visible) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && !clippedAway(element);
  };
  const backdrop = (element: Element | null) => {
    const layers: Rgba[] = [];
    let note = "";
    let node: Element | null = element;
    while (node) {
      const style = getComputedStyle(node);
      if (style.backgroundImage && style.backgroundImage !== "none" && !note)
        note = `background image or gradient on ${selectorOf(node)}`;
      const fill = color(style.backgroundColor);
      if (fill && fill[3] > 0) {
        layers.push(fill);
        if (fill[3] >= 0.999) break;
      }
      node = node.parentElement;
    }
    let result: Rgba = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) result = over(layers[i], result);
    return { color: result, note };
  };
  const opacity = (element: Element) => {
    let value = 1;
    for (let node: Element | null = element; node; node = node.parentElement)
      value *= parseFloat(getComputedStyle(node).opacity || "1");
    return value;
  };
  const sticky = (element: Element | null) => {
    for (let node = element; node && node !== document.body; node = node.parentElement) {
      const position = getComputedStyle(node).position;
      if (position === "sticky" || position === "fixed") return node;
    }
    return null;
  };
  w.__ux = {
    selectorOf,
    textOf,
    shown,
    ignored,
    color,
    over,
    ratio,
    hex,
    backdrop,
    opacity,
    sticky,
  };
}

export function collectPage(args: {
  scope: string | null;
  hints: ContrastHint[];
  meta: boolean;
}): Collected | null {
  const ux = (window as unknown as { __ux: UxHelpers }).__ux;
  const root = args.scope ? document.querySelector(args.scope) : document.body;
  if (!root) return null;
  const width = document.documentElement.clientWidth;
  const height = window.innerHeight;
  const sx = window.scrollX,
    sy = window.scrollY;
  const round = (value: number, digits = 2) => {
    const scale = 10 ** digits;
    return Math.round(value * scale) / scale;
  };
  const exposedText = (element: Element) => !element.closest("[aria-hidden='true']");

  // axe's color-contrast results, keyed by the element axe measured.
  const hints = new Map<Element, ContrastHint>();
  for (const hint of args.hints) {
    try {
      const element = document.querySelector(hint.selector);
      if (element) hints.set(element, hint);
    } catch {
      /* A selector this document can't parse: leave it to the ancestors estimate. */
    }
  }

  // ---- Text: size, role and contrast, per element that holds visible text.
  const byElement = new Map<Element, Text[]>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.nodeValue || !node.nodeValue.trim()) continue;
    const parent = node.parentElement;
    if (!parent || parent.closest("script, style, noscript, template")) continue;
    if (!byElement.has(parent)) byElement.set(parent, []);
    byElement.get(parent)!.push(node);
  }
  const texts: TextRow[] = [];
  const range = document.createRange();
  const contrastFor = (
    element: Element,
    foreground: string,
    large: boolean,
    alpha = 1,
  ): Contrast => {
    const required = large ? 3 : 4.5;
    const behind = ux.backdrop(element);
    const fg = ux.color(foreground);
    const estimate = fg
      ? ux.ratio(ux.over([fg[0], fg[1], fg[2], fg[3] * alpha], behind.color), behind.color)
      : null;
    const hint = hints.get(element);
    if (hint && hint.status !== "incomplete" && hint.ratio !== null)
      return {
        ratio: hint.ratio,
        fg: hint.fg,
        bg: hint.bg,
        required: hint.expected ?? required,
        source: "axe",
        note: "",
      };
    if (hint && hint.status === "incomplete")
      return {
        ratio: estimate === null ? null : round(estimate),
        fg: fg ? ux.hex(ux.over(fg, behind.color)) : null,
        bg: ux.hex(behind.color),
        required,
        source: "axe-incomplete",
        note: `axe couldn't decide (${hint.messageKey || "no reason given"}); ratio is the ancestors estimate`,
      };
    return {
      ratio: estimate === null ? null : round(estimate),
      fg: fg ? ux.hex(ux.over(fg, behind.color)) : null,
      bg: ux.hex(behind.color),
      required,
      source: estimate === null ? "unknown" : "ancestors",
      note: behind.note,
    };
  };
  // The line boxes of each visible text, for the clipping check below.
  const lineBoxes = new Map<Element, DOMRect[]>();
  for (const [element, nodes] of byElement) {
    if (!ux.shown(element)) continue;
    let area = 0;
    const boxes: DOMRect[] = [];
    for (const node of nodes) {
      range.selectNodeContents(node);
      for (const rect of Array.from(range.getClientRects())) {
        area += rect.width * rect.height;
        if (rect.width && rect.height) boxes.push(rect);
      }
    }
    // Visually hidden text (sr-only) has a 1 × 1 box.
    if (area < 4) continue;
    lineBoxes.set(element, boxes);
    const style = getComputedStyle(element);
    const size = parseFloat(style.fontSize);
    const weight = parseInt(style.fontWeight, 10) || 400;
    const text = nodes
      .map((node) => node.nodeValue)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const heading = element.closest("h1, h2, h3, h4, h5, h6, [role='heading']");
    const control = element.closest(
      "a, button, summary, label, legend, select, option, input, textarea, [role='button'], [role='link']",
    );
    const block = element.closest("p, li, dd, blockquote, figcaption, td, th");
    const frame = element.closest("footer")
      ? "footer"
      : element.closest("header")
        ? "header"
        : null;
    // All-caps lines are labels and kickers, not running text.
    const capitals =
      style.textTransform === "uppercase" ||
      (text === text.toUpperCase() && text !== text.toLowerCase());
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const disabled = element.closest(":disabled, [aria-disabled='true']");
    texts.push({
      selector: ux.selectorOf(element),
      text: text.length > 80 ? text.slice(0, 79) + "…" : text,
      chars: text.length,
      size: round(size),
      weight,
      role: heading
        ? "heading"
        : control
          ? "control"
          : block && text.length >= 20 && !capitals
            ? "body"
            : "other",
      frame,
      decorative: !exposedText(element),
      large,
      exempt: disabled
        ? "inactive control (WCAG 1.4.3 exempts it)"
        : !exposedText(element)
          ? "decorative, hidden from assistive technology"
          : null,
      contrast: contrastFor(
        element,
        style.webkitTextFillColor &&
          style.webkitTextFillColor !== style.color &&
          style.webkitTextFillColor !== "currentcolor"
          ? style.webkitTextFillColor
          : style.color,
        large,
        ux.opacity(element),
      ),
    });
  }
  // Field values and placeholders aren't text nodes.
  for (const field of Array.from(
    root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]), textarea",
    ),
  )) {
    if (!ux.shown(field)) continue;
    const style = getComputedStyle(field);
    const size = parseFloat(style.fontSize);
    const weight = parseInt(style.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const disabled = field.matches(":disabled");
    const base = {
      size: round(size),
      weight,
      role: "control" as const,
      frame: null,
      decorative: false,
      large,
      exempt: disabled ? "inactive control (WCAG 1.4.3 exempts it)" : null,
    };
    if (field.value)
      texts.push({
        ...base,
        selector: ux.selectorOf(field),
        text: `value: ${field.value.slice(0, 70)}`,
        chars: field.value.length,
        contrast: contrastFor(field, style.color, large),
      });
    else if (field.placeholder)
      texts.push({
        ...base,
        selector: ux.selectorOf(field) + "::placeholder",
        text: `placeholder: ${field.placeholder.slice(0, 64)}`,
        chars: field.placeholder.length,
        contrast: contrastFor(
          field,
          getComputedStyle(field, "::placeholder").color,
          large,
        ),
      });
  }

  // ---- Targets: everything a pointer or a finger can activate.
  const TARGETS =
    "a[href], area[href], button, summary, input:not([type=hidden]), select, textarea, audio[controls], video[controls], [role='button'], [role='link'], [role='checkbox'], [role='radio'], [role='switch'], [role='tab'], [role='menuitem'], [role='option'], [tabindex]:not([tabindex='-1'])";
  const candidates = Array.from(root.querySelectorAll(TARGETS)).filter(
    (element) => !ux.ignored(element),
  );
  let hiddenTargets = 0;
  const kindOf = (element: Element) => {
    const tag = element.tagName.toLowerCase();
    if (tag === "input") return `input:${(element as HTMLInputElement).type || "text"}`;
    if (tag === "a") return "link";
    if (["button", "summary", "select", "textarea", "audio", "video"].includes(tag))
      return tag;
    const role = element.getAttribute("role");
    return role ? `role:${role}` : `${tag}[tabindex]`;
  };
  const blockOf = (element: Element) => {
    let node = element.parentElement;
    while (node && getComputedStyle(node).display.startsWith("inline"))
      node = node.parentElement;
    return node;
  };
  const measured: { element: Element; row: TargetRow; rect: DOMRect }[] = [];
  candidates.forEach((element) => {
    element.setAttribute("data-ux-a", String(measured.length + hiddenTargets));
    if (!ux.shown(element)) {
      hiddenTargets++;
      return;
    }
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const field = element.matches("input, select, textarea");
    const text =
      element instanceof HTMLSelectElement
        ? (element.selectedOptions[0]?.text ?? "").trim()
        : field
          ? ""
          : ux.textOf(element, 60);
    // A label's own words, without the text of the field it wraps (a select's options).
    const labelWords = (label: HTMLLabelElement) => {
      const words: string[] = [];
      const walk = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
      while (walk.nextNode()) {
        const node = walk.currentNode;
        const parent = node.parentElement;
        if (!parent || element.contains(node) || parent.closest("select, option, textarea"))
          continue;
        if (ux.shown(parent) && node.nodeValue?.trim()) words.push(node.nodeValue.trim());
      }
      return words.join(" ").replace(/\s+/g, " ").slice(0, 80);
    };
    const labels = field
      ? Array.from((element as HTMLInputElement).labels ?? [])
          .map(labelWords)
          .filter(Boolean)
      : [];
    const label = field ? labels.join(" ") : text;
    let inline = false,
      underline: boolean | null = null,
      vsText: number | null = null;
    if (style.display === "inline" && element.tagName === "A") {
      const block = blockOf(element);
      const around = block ? ux.textOf(block, 100000) : "";
      inline = around.length > text.length + 1;
      if (inline && block) {
        underline =
          style.textDecorationLine.includes("underline") ||
          parseFloat(style.borderBottomWidth) > 0;
        const link = ux.color(style.color),
          body = ux.color(getComputedStyle(block).color);
        const behind = ux.backdrop(element).color;
        if (link && body)
          vsText = round(ux.ratio(ux.over(link, behind), ux.over(body, behind)));
      }
    }
    const row: TargetRow = {
      i: Number(element.getAttribute("data-ux-a")),
      selector: ux.selectorOf(element),
      kind: kindOf(element),
      text,
      label,
      x: round(rect.left + sx, 1),
      y: round(rect.top + sy, 1),
      width: round(rect.width, 1),
      height: round(rect.height, 1),
      lines: element.getClientRects().length,
      inline,
      underline,
      vsText,
      disabled:
        element.matches(":disabled") ||
        element.getAttribute("aria-disabled") === "true",
      offscreen: rect.bottom + sy <= 0 || rect.right + sx <= 0,
      uaControl: element.matches("audio, video"),
      spacingOk: null,
      gap: null,
    };
    measured.push({ element, row, rect });
  });
  const distanceToRect = (x: number, y: number, r: DOMRect) => {
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    return Math.hypot(dx, dy);
  };
  const rectGap = (a: DOMRect, b: DOMRect) => {
    const dx = Math.max(b.left - a.right, a.left - b.right, 0);
    const dy = Math.max(b.top - a.bottom, a.top - b.bottom, 0);
    return Math.hypot(dx, dy);
  };
  for (const target of measured) {
    if (target.row.offscreen) continue;
    const others = measured.filter(
      (other) =>
        other !== target &&
        !other.row.offscreen &&
        !other.element.contains(target.element) &&
        !target.element.contains(other.element),
    );
    target.row.gap = others.length
      ? round(Math.min(...others.map((other) => rectGap(target.rect, other.rect))), 1)
      : null;
    const small = target.rect.width < 24 || target.rect.height < 24;
    if (!small) continue;
    const cx = target.rect.left + target.rect.width / 2,
      cy = target.rect.top + target.rect.height / 2;
    target.row.spacingOk = others.every((other) => {
      if (distanceToRect(cx, cy, other.rect) < 12) return false;
      const otherSmall = other.rect.width < 24 || other.rect.height < 24;
      if (!otherSmall) return true;
      const ox = other.rect.left + other.rect.width / 2,
        oy = other.rect.top + other.rect.height / 2;
      return Math.hypot(cx - ox, cy - oy) >= 24;
    });
  }

  // ---- Controls: the non-text contrast of what identifies them (WCAG 1.4.11).
  const controls: ControlRow[] = [];
  for (const { element, row } of measured) {
    if (row.offscreen) continue;
    const style = getComputedStyle(element);
    const field = element.matches(
      "input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]), select, textarea",
    );
    const native = element.matches("input[type=checkbox], input[type=radio], audio, video");
    const outer = ux.backdrop(element.parentElement);
    const fillRaw = ux.color(style.backgroundColor);
    const fill = fillRaw && fillRaw[3] > 0.01 ? ux.over(fillRaw, outer.color) : null;
    const sides = ["Top", "Right", "Bottom", "Left"] as const;
    let borderWidth = 0,
      borderColor: string | null = null;
    for (const side of sides) {
      const widthValue = parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`));
      if (
        style.getPropertyValue(`border-${side.toLowerCase()}-style`) !== "none" &&
        widthValue > borderWidth
      ) {
        borderWidth = widthValue;
        borderColor = style.getPropertyValue(`border-${side.toLowerCase()}-color`);
      }
    }
    // A spread-only box-shadow ring draws a border too.
    const ring =
      /(rgba?\([^)]*\)|color\([^)]*\)|#[\da-f]{3,8})\s+0px\s+0px\s+0px\s+([\d.]+)px/i.exec(
        style.boxShadow || "",
      );
    if (!borderWidth && ring && parseFloat(ring[2]) > 0) {
      borderWidth = parseFloat(ring[2]);
      borderColor = ring[1];
    }
    const borderRaw = borderWidth ? ux.color(borderColor) : null;
    const border =
      borderRaw && borderRaw[3] > 0.01 ? ux.over(borderRaw, outer.color) : null;
    const fillRatio = fill ? ux.ratio(fill, outer.color) : null;
    const borderRatio = border ? ux.ratio(border, outer.color) : null;
    const hasText = !!row.text;
    let icon: Rgba | null = null;
    if (!hasText) {
      // The visible icon: the theme switch holds a moon and a sun, one of them hidden.
      const svg = Array.from(element.querySelectorAll("svg")).find((icon) => ux.shown(icon));
      if (svg) {
        const svgStyle = getComputedStyle(svg);
        const paint =
          svgStyle.stroke && svgStyle.stroke !== "none" ? svgStyle.stroke : svgStyle.fill;
        icon = ux.color(paint && paint !== "none" ? paint : svgStyle.color);
      } else {
        // Icons drawn with CSS, such as the menu's two lines.
        const bars = Array.from(element.querySelectorAll("span, i")).filter((part) => {
          const c = ux.color(getComputedStyle(part).backgroundColor);
          return c && c[3] > 0.01 && ux.shown(part);
        });
        if (bars.length) icon = ux.color(getComputedStyle(bars[0]).backgroundColor);
      }
    }
    const iconOn = fill || outer.color;
    const iconRatio = icon ? ux.ratio(ux.over(icon, iconOn), iconOn) : null;
    const pressed = element.getAttribute("aria-pressed");
    const states = [
      pressed === "true" ? "pressed" : pressed === "false" ? "not pressed" : "",
      element.getAttribute("aria-expanded") === "true" ||
      (element.tagName === "SUMMARY" && (element.parentElement as HTMLDetailsElement | null)?.open)
        ? "expanded"
        : "",
      (element as HTMLInputElement).checked ? "checked" : "",
    ].filter(Boolean);
    const boundary = Math.max(
      fillRatio && fillRatio > 1.05 ? fillRatio : 0,
      borderRatio ?? 0,
    );
    let verdict: ControlRow["verdict"];
    let note = outer.note;
    if (row.disabled) verdict = "exempt-disabled";
    else if (native) {
      verdict = "ok";
      note = "drawn by the browser";
    } else if (field) verdict = boundary >= 3 ? "ok" : "fail-boundary";
    else if (!hasText)
      verdict = iconRatio === null ? "unknown" : iconRatio >= 3 ? "ok" : "fail-icon";
    else if (boundary === 0 && !(fillRatio && fillRatio > 1.05) && !border)
      verdict = "text-only";
    else verdict = boundary >= 3 ? "ok" : "weak-boundary";
    if (row.kind === "link" && verdict === "text-only") continue;
    controls.push({
      selector: row.selector,
      kind: row.kind,
      text: row.text || row.label || (element.getAttribute("aria-label") ?? ""),
      state: states.join(", "),
      group:
        pressed === "true" || pressed === "false"
          ? ux.selectorOf(element.parentElement ?? element)
          : null,
      disabled: row.disabled,
      outer: ux.hex(outer.color),
      fill: ux.hex(fill),
      border: ux.hex(border),
      icon: ux.hex(icon ? ux.over(icon, iconOn) : null),
      fillRatio: fillRatio === null ? null : round(fillRatio),
      borderRatio: borderRatio === null ? null : round(borderRatio),
      iconRatio: iconRatio === null ? null : round(iconRatio),
      verdict,
      note,
    });
  }

  // ---- Headings, in document order.
  const headings: HeadingRow[] = Array.from(
    root.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading']"),
  )
    .filter((element) => !ux.ignored(element))
    .map((element) => ({
      level:
        Number(element.getAttribute("aria-level")) ||
        Number(element.tagName.slice(1)) ||
        2,
      text: ux.textOf(element, 120) || (element.textContent || "").trim().slice(0, 120),
      visible: ux.shown(element),
      hidden: !exposedText(element),
      selector: ux.selectorOf(element),
    }));

  // ---- Images and graphics, for alt text.
  const images: ImageRow[] = [];
  Array.from(
    root.querySelectorAll("img, svg, [role='img'], input[type=image]"),
  ).forEach((element, index) => {
    if (ux.ignored(element)) return;
    if (element.tagName.toLowerCase() === "svg" && element.parentElement?.closest("svg"))
      return;
    element.setAttribute("data-ux-img", String(index));
    const tag = element.tagName.toLowerCase();
    images.push({
      i: index,
      selector: ux.selectorOf(element),
      kind:
        tag === "img"
          ? "img"
          : tag === "svg"
            ? "svg"
            : tag === "input"
              ? "input-image"
              : "role-img",
      alt: element.getAttribute("alt"),
      src:
        (element as HTMLImageElement).currentSrc ||
        element.getAttribute("src") ||
        "",
      visible: ux.shown(element),
      hidden: !exposedText(element),
    });
  });

  // ---- Metadata, for the whole page only.
  let meta: MetaRow | null = null;
  if (args.meta) {
    const content = (selector: string) =>
      document.head.querySelector(selector)?.getAttribute("content") ?? null;
    const prefixed = (attribute: string, prefix: string) =>
      Object.fromEntries(
        Array.from(document.head.querySelectorAll(`meta[${attribute}^='${prefix}']`)).map(
          (element) => [
            element.getAttribute(attribute)!,
            element.getAttribute("content") ?? "",
          ],
        ),
      );
    meta = {
      lang: document.documentElement.getAttribute("lang") ?? "",
      title: document.title,
      description: content("meta[name='description']"),
      canonical:
        document.head.querySelector("link[rel='canonical']")?.getAttribute("href") ?? null,
      robots: content("meta[name='robots']"),
      alternates: Array.from(
        document.head.querySelectorAll("link[rel='alternate'][hreflang]"),
      ).map((element) => ({
        hreflang: element.getAttribute("hreflang") ?? "",
        href: element.getAttribute("href") ?? "",
      })),
      og: prefixed("property", "og:"),
      twitter: prefixed("name", "twitter:"),
      themeColor: content("meta[name='theme-color']"),
      viewport: content("meta[name='viewport']"),
    };
  }

  // ---- Horizontal overflow of the page itself.
  const scrollWidth = document.documentElement.scrollWidth;
  const offenders: OverflowRow["offenders"] = [];
  if (scrollWidth > width + 0.5) {
    const sticking: Element[] = [];
    for (const element of Array.from(document.body.querySelectorAll("*"))) {
      if (ux.ignored(element)) continue;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !(rect.right > width + 0.5 || rect.left < -0.5)) continue;
      if (getComputedStyle(element).position === "fixed") continue;
      let contained = false;
      for (
        let parent = element.parentElement;
        parent && parent !== document.body;
        parent = parent.parentElement
      ) {
        if (getComputedStyle(parent).overflowX !== "visible") {
          const box = parent.getBoundingClientRect();
          if (box.right <= width + 0.5 && box.left >= -0.5) {
            contained = true;
            break;
          }
        }
      }
      if (!contained) sticking.push(element);
    }
    for (const element of sticking) {
      if (sticking.some((other) => other !== element && other.contains(element))) continue;
      const rect = element.getBoundingClientRect();
      offenders.push({
        selector: ux.selectorOf(element),
        text: ux.textOf(element, 50),
        left: round(rect.left + sx, 1),
        right: round(rect.right + sx, 1),
        width: round(rect.width, 1),
      });
      if (offenders.length >= 25) break;
    }
  }

  // ---- Text cut off: its own line boxes reach outside a box that hides overflow, or it
  // ends in an ellipsis or a line clamp.
  const clipped: ClipRow[] = [];
  const clips = (value: string) => value === "hidden" || value === "clip";
  for (const [element, boxes] of lineBoxes) {
    const own = getComputedStyle(element);
    let how: ClipRow["how"] | null =
      own.textOverflow === "ellipsis" && element.scrollWidth > element.clientWidth + 1
        ? "ellipsis"
        : own.webkitLineClamp &&
            own.webkitLineClamp !== "none" &&
            element.scrollHeight > element.clientHeight + 1
          ? "line-clamp"
          : null;
    let by: Element | null = how ? element : null;
    let hiddenX = 0,
      hiddenY = 0;
    for (
      let node: Element | null = how ? null : element;
      node && node !== document.body && node !== document.documentElement;
      node = node.parentElement
    ) {
      const style = getComputedStyle(node);
      const x = clips(style.overflowX),
        y = clips(style.overflowY);
      if (!x && !y) continue;
      const box = node.getBoundingClientRect();
      const left = box.left + node.clientLeft,
        top = box.top + node.clientTop;
      const right = left + node.clientWidth,
        bottom = top + node.clientHeight;
      for (const line of boxes) {
        if (x) hiddenX = Math.max(hiddenX, left - line.left, line.right - right);
        if (y) hiddenY = Math.max(hiddenY, top - line.top, line.bottom - bottom);
      }
      if (hiddenX > 1 || hiddenY > 1) {
        how = "overflow";
        by = node;
        break;
      }
      hiddenX = hiddenY = 0;
    }
    if (!how || !by) continue;
    clipped.push({
      selector: ux.selectorOf(element),
      text: ux.textOf(element, 60),
      how,
      clippedBy: ux.selectorOf(by),
      hiddenX: round(Math.max(0, hiddenX), 1),
      hiddenY: round(Math.max(0, hiddenY), 1),
      decorative: !exposedText(element),
    });
    if (clipped.length >= 40) break;
  }

  const live: LiveRow[] = Array.from(
    root.querySelectorAll("[role='status'], [role='alert'], [role='log'], [aria-live]"),
  )
    .filter((element) => !ux.ignored(element))
    .map((element) => {
      const role = element.getAttribute("role") ?? "";
      return {
        selector: ux.selectorOf(element),
        role,
        live:
          element.getAttribute("aria-live") ??
          (role === "alert" ? "assertive" : "polite"),
        text: (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
        visible: ux.shown(element),
      };
    });

  const active = document.activeElement;
  return {
    live,
    viewport: {
      width,
      height,
      pageHeight: document.documentElement.scrollHeight,
      rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
      bodyFontSize: parseFloat(getComputedStyle(document.body).fontSize),
    },
    targets: measured.map((target) => target.row),
    hiddenTargets,
    texts,
    controls,
    headings,
    images,
    meta,
    overflow: {
      viewport: width,
      scrollWidth,
      overflow: Math.max(0, round(scrollWidth - width, 1)),
      offenders,
    },
    clipped,
    focus:
      active && active !== document.body
        ? `${ux.selectorOf(active)} “${ux.textOf(active, 50)}”`
        : null,
  };
}

// What the live regions say and where focus is, right now: taken before the slower checks,
// while the state is exactly what the screenshot shows.
export function liveNow(scope: string | null): Pick<Collected, "live" | "focus"> {
  const ux = (window as unknown as { __ux: UxHelpers }).__ux;
  const root = (scope ? document.querySelector(scope) : document.body) ?? document.body;
  const live = Array.from(
    root.querySelectorAll("[role='status'], [role='alert'], [role='log'], [aria-live]"),
  )
    .filter((element) => !ux.ignored(element))
    .map((element) => {
      const role = element.getAttribute("role") ?? "";
      return {
        selector: ux.selectorOf(element),
        role,
        live: element.getAttribute("aria-live") ?? (role === "alert" ? "assertive" : "polite"),
        text: (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
        visible: ux.shown(element),
      };
    });
  const active = document.activeElement;
  return {
    live,
    focus:
      active && active !== document.body
        ? `${ux.selectorOf(active)} “${ux.textOf(active, 50)}”`
        : null,
  };
}

// Font size of every element that holds visible text. With tag set, numbers each one
// (data-ux-t) so a second call after the font-size change can be compared one to one.
export function textSizes(tag: boolean): TextSize[] {
  const ux = (window as unknown as { __ux: UxHelpers }).__ux;
  const out: TextSize[] = [];
  const parents = new Set<Element>();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeValue?.trim() && node.parentElement) parents.add(node.parentElement);
  }
  let index = 0;
  for (const element of parents) {
    if (element.closest("script, style, noscript, template") || !ux.shown(element)) continue;
    if (tag) element.setAttribute("data-ux-t", String(index++));
    const t = Number(element.getAttribute("data-ux-t") ?? -1);
    if (t < 0) continue;
    out.push({
      t,
      selector: ux.selectorOf(element),
      size: parseFloat(getComputedStyle(element).fontSize),
      text: ux.textOf(element, 50),
    });
  }
  return out;
}

// What focusBaseline records; pass it in: page.evaluate(focusBaseline, FOCUS_PROPS).
export const FOCUS_PROPS = [
  "outline-style",
  "outline-width",
  "outline-color",
  "outline-offset",
  "box-shadow",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-top-width",
  "border-bottom-width",
  "background-color",
  "background-image",
  "color",
  "text-decoration-line",
  "text-decoration-color",
  "text-decoration-thickness",
  "opacity",
  "transform",
  "translate",
  "scale",
  "filter",
];

// Records how every focusable element looks before it has focus, and numbers it
// (data-ux-k), so focusInspect can tell what focus changed.
export function focusBaseline(props: string[]): number {
  type Signature = Record<string, string>;
  const signature = (node: Element, pseudo: string | null): Signature => {
    const style = getComputedStyle(node, pseudo);
    const out: Signature = {};
    for (const prop of props) out[prop] = style.getPropertyValue(prop);
    if (pseudo) {
      out.content = style.content;
      out.display = style.display;
    }
    return out;
  };
  const w = window as unknown as {
    __uxFocus?: {
      signature: typeof signature;
      base: Record<number, Record<string, Signature | null>>;
    };
  };
  const base: Record<number, Record<string, Signature | null>> = {};
  const list = Array.from(
    document.querySelectorAll(
      "a[href], area[href], button, input:not([type=hidden]), select, textarea, summary, iframe, audio[controls], video[controls], [tabindex], [contenteditable='true'], [contenteditable='']",
    ),
  );
  list.forEach((element, k) => {
    element.setAttribute("data-ux-k", String(k));
    base[k] = {
      self: signature(element, null),
      before: signature(element, "::before"),
      after: signature(element, "::after"),
      parent: element.parentElement ? signature(element.parentElement, null) : null,
    };
  });
  w.__uxFocus = { signature, base };
  return list.length;
}

export function focusInspect(n: number): FocusStop {
  const ux = (window as unknown as { __ux: UxHelpers }).__ux;
  type Signature = Record<string, string>;
  const focus = (
    window as unknown as {
      __uxFocus: {
        signature: (node: Element, pseudo: string | null) => Signature;
        base: Record<number, Record<string, Signature | null>>;
      };
    }
  ).__uxFocus;
  const element = document.activeElement;
  const empty = {
    n,
    k: -1,
    tag: "",
    selector: "",
    text: "",
    rect: { x: 0, y: 0, width: 0, height: 0 },
    offscreen: false,
    obscured: "no" as const,
    obscuredBy: null,
    bySticky: false,
    indicator: { visible: false, outline: null, changes: [], ringContrast: null },
    clippedBy: null,
    multiField: false,
  };
  if (!element || element === document.body || element === document.documentElement)
    return { body: true, ...empty };
  element.setAttribute("data-ux-stop", String(n));
  const k = Number(element.getAttribute("data-ux-k") ?? -1);
  const now: Record<string, Signature | null> = {
    self: focus.signature(element, null),
    before: focus.signature(element, "::before"),
    after: focus.signature(element, "::after"),
    parent: element.parentElement ? focus.signature(element.parentElement, null) : null,
  };
  const was = k >= 0 ? focus.base[k] : null;
  const outlineOn =
    now.self!["outline-style"] !== "none" &&
    parseFloat(now.self!["outline-width"]) > 0 &&
    (ux.color(now.self!["outline-color"])?.[3] ?? 1) > 0;
  const changes: string[] = [];
  if (was)
    for (const part of ["self", "before", "after", "parent"]) {
      const before = was[part],
        after = now[part];
      if (!before || !after) continue;
      for (const prop of Object.keys(after)) {
        if (before[prop] === after[prop]) continue;
        if (part === "self" && prop.startsWith("outline-") && !outlineOn) continue;
        if (part !== "self" && prop.startsWith("outline-") && after["outline-style"] === "none")
          continue;
        if (part !== "self" && after.display === "none" && before.display === "none") continue;
        changes.push(
          `${part === "self" ? "" : `${part} `}${prop}: ${before[prop]} → ${after[prop]}`,
        );
      }
    }
  const rect = element.getBoundingClientRect();
  const vw = document.documentElement.clientWidth,
    vh = window.innerHeight;
  const inView =
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < vh &&
    rect.left < vw;
  // The centre and a point a quarter of the way in from each edge: corners can be rounded.
  const cx = rect.left + rect.width / 2,
    cy = rect.top + rect.height / 2;
  const points: [number, number][] = [
    [cx, cy],
    [cx, rect.top + rect.height / 4],
    [cx, rect.bottom - rect.height / 4],
    [rect.left + rect.width / 4, cy],
    [rect.right - rect.width / 4, cy],
  ];
  let total = 0,
    covered = 0;
  let by: Element | null = null;
  for (const [x, y] of points) {
    if (x < 0 || y < 0 || x >= vw || y >= vh) continue;
    total++;
    const top = document.elementFromPoint(x, y);
    if (!top || top === element || element.contains(top) || top.contains(element)) continue;
    covered++;
    by = by || top;
  }
  const obscured: FocusStop["obscured"] = !inView || total === 0
    ? "offscreen"
    : covered === total
      ? "fully"
      : covered
        ? "partly"
        : "no";
  const stickyBy = by ? ux.sticky(by) : null;
  let clippedBy: string | null = null;
  const style = getComputedStyle(element);
  let ringContrast: number | null = null;
  let outline: string | null = null;
  if (outlineOn) {
    const grow = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
    outline = `${style.outlineWidth} ${style.outlineStyle} ${ux.hex(ux.color(style.outlineColor)) ?? style.outlineColor}, offset ${style.outlineOffset}`;
    const ring = ux.color(style.outlineColor);
    const behind = ux.backdrop(element.parentElement).color;
    if (ring) ringContrast = Math.round(ux.ratio(ux.over(ring, behind), behind) * 100) / 100;
    for (
      let parent = element.parentElement;
      parent && parent !== document.body;
      parent = parent.parentElement
    ) {
      const parentStyle = getComputedStyle(parent);
      if (parentStyle.overflowX === "visible" && parentStyle.overflowY === "visible") continue;
      const box = parent.getBoundingClientRect();
      const left = box.left + parent.clientLeft,
        top = box.top + parent.clientTop;
      const right = left + parent.clientWidth,
        bottom = top + parent.clientHeight;
      const cut = Math.max(
        left - (rect.left - grow),
        top - (rect.top - grow),
        rect.right + grow - right,
        rect.bottom + grow - bottom,
      );
      if (cut > 0.5) {
        clippedBy = `${ux.selectorOf(parent)} (by up to ${Math.round(cut * 10) / 10}px)`;
        break;
      }
    }
  }
  return {
    body: false,
    n,
    k,
    tag: element.tagName.toLowerCase(),
    selector: ux.selectorOf(element),
    text: ux.textOf(element, 60),
    rect: {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    offscreen: !inView,
    obscured,
    obscuredBy: by ? ux.selectorOf(stickyBy || by) : null,
    bySticky: !!stickyBy,
    indicator: {
      visible: changes.length > 0 && inView,
      outline,
      changes: changes.slice(0, 6),
      ringContrast,
    },
    clippedBy,
    multiField: element.matches(
      "input[type=date], input[type=time], input[type=datetime-local], input[type=month], input[type=week], audio, video",
    ),
  };
}
