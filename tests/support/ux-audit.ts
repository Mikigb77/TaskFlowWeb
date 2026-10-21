// The measured audit behind the UX web renders (tests/ux-renders.spec.ts): axe, target
// sizes, text sizes, contrast, what a screen reader gets, the keyboard path, headings,
// metadata, overflow, and lab performance (ux-perf.ts).
//
// Each test appends its measurements to its worker's file in artifacts/ux-web/.audit/ (one
// file per worker: thousands of small files are slow on /mnt/c). When a Playwright worker
// finishes, mergeAudit() turns everything there, the newest measurement of each page and
// state, into artifacts/ux-web/AUDIT.md, audit.json and aria/. To merge again, in WSL:
//   npx tsx tests/support/ux-audit.ts
import AxeBuilder from "@axe-core/playwright";
import type { CDPSession, Page } from "@playwright/test";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectPage,
  focusBaseline,
  focusInspect,
  FOCUS_PROPS,
  installHelpers,
  liveNow,
  textSizes,
  type ClipRow,
  type Collected,
  type ContrastHint,
  type FocusStop,
  type OverflowRow,
  type TextSize,
} from "./ux-collect";
import type { PerfRun } from "./ux-perf";
import { THROTTLING } from "./ux-perf";

export const AXE_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22a",
  "wcag22aa",
];

export type Combo = {
  page: string;
  language: string;
  viewport: string;
  theme: string;
};

export type AxeIssue = {
  id: string;
  impact: string | null;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: { target: string; html: string; summary: string }[];
};

export type AxeSummary = {
  version: string;
  tags: string[];
  violations: AxeIssue[];
  incomplete: AxeIssue[];
  passes: number;
};

export type AxName = { role: string; name: string };

export type ScreenReader = {
  landmarks: { role: string; name: string; element: string }[];
  landmarkIssues: string[];
  unnamed: { role: string; selector: string }[];
  imagesWithoutAlt: { selector: string; why: string; src: string }[];
  labelInName: { selector: string; role: string; visible: string; name: string }[];
  disclosures: { name: string; selector: string }[];
  outsideLandmarks: string[];
};

export type KeyStop = {
  n: number;
  selector: string;
  tag: string;
  text: string;
  role: string;
  name: string;
  visible: boolean;
  outline: string | null;
  changes: string[];
  ringContrast: number | null;
  obscured: FocusStop["obscured"];
  obscuredBy: string | null;
  bySticky: boolean;
  clippedBy: string | null;
  rect: FocusStop["rect"];
  screenshot: string | null;
};

export type Keyboard = {
  focusables: number;
  presses: number;
  end: "end" | "wrapped" | "trap" | "limit";
  trap: string | null;
  stops: KeyStop[];
};

export type PageAudit = Combo & {
  kind: "page" | "region";
  id: string;
  url: string;
  scope: string | null;
  state: string | null;
  // The state's place in INDEX.md's table, to list the demo states in the same order.
  stateIndex: number;
  renderedAt: string;
  browser: string;
  axe: AxeSummary;
  collected: Collected;
  screenReader: ScreenReader;
  keyboard: Keyboard | null;
  // The aria/ file's name, and the snapshot, which the merge writes there.
  aria: string | null;
  ariaText?: string;
};

export type Growth = {
  total: number;
  grew: number;
  partly: number;
  same: number;
  unchanged: { selector: string; size: number; text: string }[];
};

export type VariantAudit = Combo & {
  kind: "variant";
  id: string;
  url: string;
  variant: string;
  renderedAt: string;
  browser: string;
  size: { width: number; height: number; scale: number };
  rootFontSize: number;
  bodyFontSize: number;
  overflow: OverflowRow;
  clipped: ClipRow[];
  growth: Growth | null;
};

export type PerfAudit = {
  kind: "performance";
  id: string;
  page: string;
  language: string;
  url: string;
  renderedAt: string;
  browser: string;
  // The share of the machine's CPU time in use while measuring, in %, this test included:
  // other work slows a throttled CPU.
  busy: number;
  runs: PerfRun[];
};

const CONTROL_ROLES = new Set([
  "button",
  "link",
  "textbox",
  "searchbox",
  "combobox",
  "listbox",
  "checkbox",
  "radio",
  "switch",
  "slider",
  "spinbutton",
  "tab",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "treeitem",
  "DisclosureTriangle",
  "ToggleButton",
  "PopUpButton",
  // Chromium's roles for date and time fields; its "time" is the <time> element.
  "date",
  "DateTime",
  "InputTime",
]);
const QUIET_ROLES = new Set([
  "RootWebArea",
  "WebArea",
  "generic",
  "none",
  "presentation",
  "StaticText",
  "InlineTextBox",
  "LineBreak",
  "paragraph",
  "heading",
  "region",
  "main",
  "banner",
  "contentinfo",
  "navigation",
  "article",
  "section",
  "group",
  "list",
  "listitem",
  "document",
  "Iframe",
  "IframePresentational",
  "LabelText",
  "Legend",
  "Section",
  "ScrollArea",
]);
const IMAGE_ROLES = new Set([
  "image",
  "img",
  "graphics-document",
  "graphics-symbol",
  "SvgRoot",
  "svg",
]);
const LANDMARK_ROLES = new Set([
  "banner",
  "navigation",
  "main",
  "contentinfo",
  "complementary",
  "search",
  "form",
  "region",
]);

function issue(rule: {
  id: string;
  impact?: string | null;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: {
    target: unknown[];
    html: string;
    failureSummary?: string;
    any: { message: string }[];
  }[];
}): AxeIssue {
  return {
    id: rule.id,
    impact: rule.impact ?? null,
    help: rule.help,
    helpUrl: rule.helpUrl,
    tags: rule.tags.filter((tag) => /^wcag/.test(tag)),
    nodes: rule.nodes.map((node) => ({
      target: node.target.map(String).join(" "),
      html: node.html.replace(/\s+/g, " ").slice(0, 200),
      summary: (node.failureSummary || node.any[0]?.message || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300),
    })),
  };
}

export async function runAxe(page: Page, scope: string | null) {
  let builder = new AxeBuilder({ page })
    .withTags(AXE_TAGS)
    .setLegacyMode(true)
    .exclude("[data-ux-ignore]");
  if (scope) builder = builder.include(scope);
  const results = await builder.analyze();
  const hints: ContrastHint[] = [];
  const add = (
    status: ContrastHint["status"],
    rule: (typeof results.passes)[number] | undefined,
  ) => {
    for (const node of rule?.nodes ?? []) {
      if (node.target.length !== 1) continue;
      const data = (node.any[0]?.data ?? {}) as Record<string, unknown>;
      hints.push({
        selector: String(node.target[0]),
        status,
        fg: typeof data.fgColor === "string" ? data.fgColor : null,
        bg: typeof data.bgColor === "string" ? data.bgColor : null,
        ratio: typeof data.contrastRatio === "number" ? data.contrastRatio : null,
        expected: parseFloat(String(data.expectedContrastRatio ?? "")) || null,
        messageKey: typeof data.messageKey === "string" ? data.messageKey : null,
      });
    }
  };
  add("pass", results.passes.find((rule) => rule.id === "color-contrast"));
  add("fail", results.violations.find((rule) => rule.id === "color-contrast"));
  add("incomplete", results.incomplete.find((rule) => rule.id === "color-contrast"));
  const summary: AxeSummary = {
    version: results.testEngine.version,
    tags: AXE_TAGS,
    violations: results.violations.map(issue),
    incomplete: results.incomplete.map(issue),
    passes: results.passes.length,
  };
  return { summary, hints };
}

const normalize = (value: string) =>
  value
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(new RegExp("[^\\p{L}\\p{N}]+", "gu"), " ")
    .trim();

async function screenReader(cdp: CDPSession, collected: Collected, scoped: boolean) {
  const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
  type DomNode = typeof root;
  type Info = { a?: number; k?: number; img?: number; label: string };
  const dom = new Map<number, Info>();
  const visit = (node: DomNode) => {
    if (node.nodeType === 1) {
      const attributes = node.attributes ?? [];
      const get = (name: string) => {
        for (let i = 0; i < attributes.length; i += 2)
          if (attributes[i] === name) return attributes[i + 1];
        return undefined;
      };
      const number = (name: string) => {
        const value = get(name);
        return value === undefined ? undefined : Number(value);
      };
      const id = get("id");
      const first = get("class")?.trim().split(/\s+/)[0];
      dom.set(node.backendNodeId, {
        a: number("data-ux-a"),
        k: number("data-ux-k"),
        img: number("data-ux-img"),
        label: `${node.localName}${id && !/[:\s]/.test(id) ? "#" + id : first ? "." + first : ""}`,
      });
    }
    node.children?.forEach(visit);
    node.shadowRoots?.forEach(visit);
    if (node.contentDocument) visit(node.contentDocument);
  };
  visit(root);
  const { nodes } = await cdp.send("Accessibility.getFullAXTree", {});
  type AxNode = (typeof nodes)[number];
  const byId = new Map(nodes.map((node) => [node.nodeId, node]));
  const roleOf = (node: AxNode) => String(node.role?.value ?? "");
  const nameOf = (node: AxNode) => String(node.name?.value ?? "").trim();
  const isLandmark = (node: AxNode) => {
    const role = roleOf(node);
    return LANDMARK_ROLES.has(role) && (!!nameOf(node) || !["form", "region"].includes(role));
  };
  const targetNames = new Map<number, AxName>();
  const focusNames = new Map<number, AxName>();
  const imageNames = new Map<number, AxName & { ignored: boolean }>();
  const targetSelector = new Map(collected.targets.map((row) => [row.i, row.selector]));
  const report: ScreenReader = {
    landmarks: [],
    landmarkIssues: [],
    unnamed: [],
    imagesWithoutAlt: [],
    labelInName: [],
    disclosures: [],
    outsideLandmarks: [],
  };
  for (const node of nodes) {
    const info =
      node.backendDOMNodeId === undefined ? undefined : dom.get(node.backendDOMNodeId);
    const role = roleOf(node),
      name = nameOf(node);
    if (info?.img !== undefined)
      imageNames.set(info.img, { role, name, ignored: !!node.ignored });
    if (node.ignored) continue;
    if (info?.a !== undefined) targetNames.set(info.a, { role, name });
    if (info?.k !== undefined) focusNames.set(info.k, { role, name });
    const inScope = !scoped || info?.a !== undefined;
    if (!scoped && isLandmark(node))
      report.landmarks.push({ role, name, element: info?.label ?? "" });
    if (role === "DisclosureTriangle" && inScope)
      report.disclosures.push({
        name,
        selector:
          (info?.a !== undefined ? targetSelector.get(info.a) : undefined) ??
          info?.label ??
          "",
      });
    const focusable = (node.properties ?? []).some(
      (property) => property.name === "focusable" && property.value.value === true,
    );
    if (
      (CONTROL_ROLES.has(role) || (focusable && !QUIET_ROLES.has(role))) &&
      !name &&
      inScope
    )
      report.unnamed.push({
        role,
        selector:
          (info?.a !== undefined ? targetSelector.get(info.a) : undefined) ??
          info?.label ??
          "",
      });
  }
  for (const image of collected.images) {
    if (!image.visible || image.hidden) continue;
    const ax = imageNames.get(image.i);
    if (image.kind === "img" && image.alt === null)
      report.imagesWithoutAlt.push({
        selector: image.selector,
        why: "no alt attribute",
        src: image.src,
      });
    else if (ax && !ax.ignored && IMAGE_ROLES.has(ax.role) && !ax.name)
      report.imagesWithoutAlt.push({
        selector: image.selector,
        why: `exposed as ${ax.role} with no name`,
        src: image.src,
      });
  }
  for (const target of collected.targets) {
    if (!target.label || target.offscreen) continue;
    const ax = targetNames.get(target.i);
    if (!ax || !ax.name) continue;
    const visible = normalize(target.label);
    if (visible && !normalize(ax.name).includes(visible))
      report.labelInName.push({
        selector: target.selector,
        role: ax.role,
        visible: target.label,
        name: ax.name,
      });
  }
  if (!scoped) {
    const count = (role: string) =>
      report.landmarks.filter((landmark) => landmark.role === role).length;
    const main = count("main");
    if (main !== 1) report.landmarkIssues.push(main ? `${main} main landmarks` : "no main landmark");
    if (!count("banner")) report.landmarkIssues.push("no banner landmark (site header)");
    if (count("banner") > 1) report.landmarkIssues.push(`${count("banner")} banner landmarks`);
    if (!count("contentinfo"))
      report.landmarkIssues.push("no contentinfo landmark (site footer)");
    if (count("contentinfo") > 1)
      report.landmarkIssues.push(`${count("contentinfo")} contentinfo landmarks`);
    const navigation = report.landmarks.filter((landmark) => landmark.role === "navigation");
    const names = navigation.map((landmark) => landmark.name);
    if (navigation.length > 1 && names.filter((name) => !name).length)
      report.landmarkIssues.push(
        `${names.filter((name) => !name).length} of ${navigation.length} navigation landmarks have no name`,
      );
    for (const name of new Set(names.filter(Boolean)))
      if (names.filter((other) => other === name).length > 1)
        report.landmarkIssues.push(`navigation “${name}” appears ${names.filter((other) => other === name).length} times`);
    const outside = new Set<string>();
    for (const node of nodes) {
      if (node.ignored || roleOf(node) !== "StaticText" || !nameOf(node)) continue;
      let owner = "";
      let inside = false;
      for (
        let parent = node.parentId ? byId.get(node.parentId) : undefined;
        parent;
        parent = parent.parentId ? byId.get(parent.parentId) : undefined
      ) {
        if (isLandmark(parent)) {
          inside = true;
          break;
        }
        if (!owner && parent.backendDOMNodeId !== undefined)
          owner = dom.get(parent.backendDOMNodeId)?.label ?? "";
      }
      if (!inside) outside.add(`${owner || "?"}: “${nameOf(node).slice(0, 50)}”`);
    }
    report.outsideLandmarks = [...outside].slice(0, 30);
  }
  return { report, focusNames };
}

async function keyboardPath(
  page: Page,
  focusables: number,
  names: Map<number, AxName>,
  shots: { dir: string; name: string },
): Promise<Keyboard> {
  await page.evaluate(() => window.scrollTo(0, 0));
  const stops: KeyStop[] = [];
  const seen = new Map<string, number>();
  let end: Keyboard["end"] = "limit";
  let trap: string | null = null;
  let last = "",
    repeats = 0,
    screenshots = 0,
    presses = 0;
  mkdirSync(shots.dir, { recursive: true });
  for (; presses < 400; ) {
    presses++;
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(focusInspect, presses);
    if (stop.body) {
      end = "end";
      break;
    }
    const key = stop.k >= 0 ? `k${stop.k}` : `s${stop.selector}`;
    if (key === last) {
      // Date, time and audio controls hold several stops inside one element.
      if (stop.multiField && ++repeats < 8) continue;
      end = "trap";
      trap = `Tab stays on ${stop.selector}`;
      break;
    }
    repeats = 0;
    last = key;
    if (seen.has(key)) {
      const first = seen.get(key)!;
      if (first === 1) end = "wrapped";
      else {
        end = "trap";
        trap = `after stop ${stops.length}, Tab goes back to stop ${first} (${stop.selector}) without reaching the end of the page`;
      }
      break;
    }
    seen.set(key, stops.length + 1);
    const name = stop.k >= 0 ? names.get(stop.k) : undefined;
    const row: KeyStop = {
      n: stops.length + 1,
      selector: stop.selector,
      tag: stop.tag,
      text: stop.text,
      role: name?.role ?? "",
      name: name?.name ?? "",
      visible: stop.indicator.visible,
      outline: stop.indicator.outline,
      changes: stop.indicator.changes,
      ringContrast: stop.indicator.ringContrast,
      obscured: stop.obscured,
      obscuredBy: stop.obscuredBy,
      bySticky: stop.bySticky,
      clippedBy: stop.clippedBy,
      rect: stop.rect,
      screenshot: null,
    };
    // Evidence for every stop with a problem: focus not visible, covered, its ring cut off
    // or faint.
    const problem =
      !row.visible ||
      row.obscured !== "no" ||
      !!row.clippedBy ||
      (row.ringContrast !== null && row.ringContrast < 3);
    if ((row.n <= 3 || problem) && screenshots < 20) {
      const file = `${shots.name}.${String(row.n).padStart(2, "0")}.png`;
      await page.screenshot({ path: path.join(shots.dir, file) });
      row.screenshot = `focus/${file}`;
      screenshots++;
    }
    stops.push(row);
  }
  return { focusables, presses, end, trap, stops };
}

export async function auditPage(
  page: Page,
  combo: Combo & {
    id: string;
    url: string;
    out: string;
    state?: string;
    stateIndex?: number;
  },
  options: { scope: string | null; keyboard: boolean; aria: string | null },
): Promise<PageAudit> {
  await page.evaluate(installHelpers);
  const early = await page.evaluate(liveNow, options.scope);
  const ariaText = options.aria
    ? await page.locator(options.scope ?? "body").first().ariaSnapshot()
    : undefined;
  const axe = await runAxe(page, options.scope);
  const collected = await page.evaluate(collectPage, {
    scope: options.scope,
    hints: axe.hints,
    meta: !options.scope,
  });
  if (!collected) throw new Error(`Nothing matches ${options.scope} on ${combo.url}`);
  collected.live = early.live;
  collected.focus = early.focus;
  const focusables = options.keyboard ? await page.evaluate(focusBaseline, FOCUS_PROPS) : 0;
  const cdp = await page.context().newCDPSession(page);
  let result: Awaited<ReturnType<typeof screenReader>>;
  try {
    result = await screenReader(cdp, collected, !!options.scope);
  } finally {
    await cdp.detach().catch(() => {});
  }
  const keyboard = options.keyboard
    ? await keyboardPath(page, focusables, result.focusNames, {
        dir: path.join(combo.out, "focus"),
        name: combo.id,
      })
    : null;
  return {
    kind: options.scope ? "region" : "page",
    id: combo.id,
    page: combo.page,
    language: combo.language,
    viewport: combo.viewport,
    theme: combo.theme,
    url: combo.url,
    scope: options.scope,
    state: combo.state ?? null,
    stateIndex: combo.stateIndex ?? 0,
    renderedAt: new Date().toISOString(),
    browser: page.context().browser()?.version() ?? "",
    axe: axe.summary,
    collected,
    screenReader: result.report,
    keyboard,
    aria: options.aria,
    ariaText,
  };
}

// The root's font size and every text's; tag numbers the texts on the first call, so the
// next call compares the same elements.
export async function textSizesNow(page: Page, tag: boolean) {
  await page.evaluate(installHelpers);
  const sizes: TextSize[] = await page.evaluate(textSizes, tag);
  const root = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).fontSize),
  );
  return { root, sizes };
}

// sizes: every text's font size before and after the font-size change (textSizesNow), taken
// while the change was live.
export async function auditVariant(
  page: Page,
  combo: Combo & { id: string; url: string; variant: string },
  sizes: { before: TextSize[]; after: TextSize[] } | null,
): Promise<VariantAudit> {
  await page.evaluate(installHelpers);
  const collected = await page.evaluate(collectPage, { scope: null, hints: [], meta: false });
  if (!collected) throw new Error(`Nothing to measure on ${combo.url}`);
  let growth: Growth | null = null;
  if (sizes) {
    const { before, after } = sizes;
    const was = new Map(before.map((row) => [row.t, row]));
    const rows = after
      .map((row) => ({ ...row, before: was.get(row.t)?.size ?? 0 }))
      .filter((row) => row.before > 0);
    const factor = (row: (typeof rows)[number]) => row.size / row.before;
    const unchanged = new Map<string, { selector: string; size: number; text: string }>();
    for (const row of rows.filter((item) => factor(item) < 1.05))
      if (!unchanged.has(row.selector))
        unchanged.set(row.selector, {
          selector: row.selector,
          size: Math.round(row.size * 100) / 100,
          text: row.text,
        });
    growth = {
      total: rows.length,
      grew: rows.filter((row) => factor(row) >= 1.5).length,
      partly: rows.filter((row) => factor(row) >= 1.05 && factor(row) < 1.5).length,
      same: rows.filter((row) => factor(row) < 1.05).length,
      unchanged: [...unchanged.values()].slice(0, 60),
    };
  }
  const viewport = page.viewportSize() ?? { width: 0, height: 0 };
  return {
    kind: "variant",
    id: combo.id,
    page: combo.page,
    language: combo.language,
    viewport: combo.viewport,
    theme: combo.theme,
    url: combo.url,
    variant: combo.variant,
    renderedAt: new Date().toISOString(),
    browser: page.context().browser()?.version() ?? "",
    size: {
      width: viewport.width,
      height: viewport.height,
      scale: await page.evaluate(() => window.devicePixelRatio),
    },
    rootFontSize: collected.viewport.rootFontSize,
    bodyFontSize: collected.viewport.bodyFontSize,
    overflow: collected.overflow,
    clipped: collected.clipped,
    growth,
  };
}

// ---- Fragments and the merge.

function atomicWrite(file: string, text: string) {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  writeFileSync(temporary, text);
  renameSync(temporary, file);
}

type Kind = "pages" | "regions" | "variants" | "performance";

// One line per measurement, in a file of this worker's own: no two processes write to one file.
export function saveFragment(
  out: string,
  kind: Kind,
  id: string,
  data: PageAudit | VariantAudit | PerfAudit,
) {
  const dir = path.join(out, ".audit");
  mkdirSync(dir, { recursive: true });
  appendFileSync(
    path.join(dir, `${kind}.${process.pid}.ndjson`),
    JSON.stringify({ ...data, id }) + "\n",
  );
}

async function withLock(dir: string, run: () => void) {
  mkdirSync(dir, { recursive: true });
  const lock = path.join(dir, ".lock");
  const started = Date.now();
  for (;;) {
    try {
      mkdirSync(lock);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      // A worker that died while merging leaves its lock; a merge takes seconds.
      if (Date.now() - started > 60_000) rmSync(lock, { recursive: true, force: true });
      await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
    }
  }
  try {
    run();
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}

// The newest measurement of each id, from every worker's file. A line still being written
// doesn't parse yet; the next merge reads it.
function readFragments(dir: string) {
  const newest = new Map<string, { kind: Kind; data: { id: string; renderedAt: string } }>();
  if (existsSync(dir))
    for (const file of readdirSync(dir).filter((name) => name.endsWith(".ndjson"))) {
      const kind = file.split(".")[0] as Kind;
      for (const line of readFileSync(path.join(dir, file), "utf8").split("\n")) {
        if (!line.trim()) continue;
        let data: { id: string; renderedAt: string };
        try {
          data = JSON.parse(line);
        } catch {
          continue;
        }
        const key = `${kind}\u0000${data.id}`;
        const was = newest.get(key);
        if (!was || was.data.renderedAt <= data.renderedAt) newest.set(key, { kind, data });
      }
    }
  const of = <T>(kind: Kind) =>
    [...newest.values()].filter((entry) => entry.kind === kind).map((entry) => entry.data as unknown as T);
  return {
    pages: of<PageAudit>("pages"),
    regions: of<PageAudit>("regions"),
    variants: of<VariantAudit>("variants"),
    performance: of<PerfAudit>("performance"),
  };
}

export async function mergeAudit(out: string, order: string[] = []) {
  await withLock(path.join(out, ".audit"), () => writeAudit(out, order));
}

// ---- Markdown.

const LANGUAGE_ORDER = ["en", "es", "ca"];
const VIEWPORT_ORDER = ["desktop", "mobile"];
const THEME_ORDER = ["light", "dark"];

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();
}
function code(value: string | null | undefined) {
  return value ? "`" + value.replace(/`/g, "ʼ") + "`" : "";
}
function table(head: string[], rows: unknown[][]) {
  return [
    `| ${head.join(" | ")} |`,
    `|${head.map(() => "---").join("|")}|`,
    ...rows.map((row) => `| ${row.map(esc).join(" | ")} |`),
  ];
}
function kb(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}
function seconds(ms: number | null) {
  return ms === null ? "—" : `${(ms / 1000).toFixed(2)} s`;
}
function ratioText(value: number | null) {
  return value === null ? "—" : `${value.toFixed(2)}:1`;
}

function makeRank(order: string[]) {
  return (page: string) => {
    const index = order.indexOf(page);
    if (index >= 0) return index;
    if (page === "home") return -1;
    return order.length + (page === "not-found" ? 1000 : 0) + page.charCodeAt(0) / 1000;
  };
}

function sortCombos<T extends Combo>(items: T[], rank: (page: string) => number) {
  const index = (list: string[], value: string) => {
    const at = list.indexOf(value);
    return at < 0 ? list.length : at;
  };
  return [...items].sort(
    (a, b) =>
      rank(a.page) - rank(b.page) ||
      a.page.localeCompare(b.page) ||
      index(LANGUAGE_ORDER, a.language) - index(LANGUAGE_ORDER, b.language) ||
      index(VIEWPORT_ORDER, a.viewport) - index(VIEWPORT_ORDER, b.viewport) ||
      a.viewport.localeCompare(b.viewport) ||
      index(THEME_ORDER, a.theme) - index(THEME_ORDER, b.theme),
  );
}

// "privacy, terms (en, es, ca): desktop+mobile light+dark; home (en): mobile light"
function where(combos: Combo[], rank: (page: string) => number) {
  const byPageLanguage = new Map<string, Set<string>>();
  for (const combo of combos) {
    const key = `${combo.page}\u0000${combo.language}`;
    if (!byPageLanguage.has(key)) byPageLanguage.set(key, new Set());
    byPageLanguage.get(key)!.add(`${combo.viewport}\u0000${combo.theme}`);
  }
  const describe = (set: Set<string>) => {
    const pairs = [...set].map((pair) => pair.split("\u0000"));
    const viewports = [...new Set(pairs.map(([viewport]) => viewport))].sort(
      (a, b) => VIEWPORT_ORDER.indexOf(a) - VIEWPORT_ORDER.indexOf(b),
    );
    const themes = [...new Set(pairs.map(([, theme]) => theme))].sort(
      (a, b) => THEME_ORDER.indexOf(a) - THEME_ORDER.indexOf(b),
    );
    return viewports.length * themes.length === pairs.length
      ? `${viewports.join("+")} ${themes.join("+")}`
      : pairs.map(([viewport, theme]) => `${viewport} ${theme}`).join(", ");
  };
  // page → description → languages
  const byPage = new Map<string, Map<string, string[]>>();
  for (const [key, set] of byPageLanguage) {
    const [page, language] = key.split("\u0000");
    const text = describe(set);
    if (!byPage.has(page)) byPage.set(page, new Map());
    const languages = byPage.get(page)!;
    if (!languages.has(text)) languages.set(text, []);
    languages.get(text)!.push(language);
  }
  // (languages, description) → pages
  const merged = new Map<string, string[]>();
  for (const page of [...byPage.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)))
    for (const [text, languages] of byPage.get(page)!) {
      const sorted = languages.sort(
        (a, b) => LANGUAGE_ORDER.indexOf(a) - LANGUAGE_ORDER.indexOf(b),
      );
      const key = `${sorted.join(", ")}\u0000${text}`;
      if (!merged.has(key)) merged.set(key, []);
      merged.get(key)!.push(page);
    }
  return [...merged]
    .map(([key, pages]) => {
      const [languages, text] = key.split("\u0000");
      return `${pages.join(", ")} (${languages}): ${text}`;
    })
    .join("; ");
}

type Grouped<T> = { item: T; combos: Combo[]; values: string[] };
function group<T>(
  entries: { combo: Combo; item: T; value?: string }[],
  key: (item: T) => string,
) {
  const out = new Map<string, Grouped<T>>();
  for (const entry of entries) {
    const id = key(entry.item);
    if (!out.has(id)) out.set(id, { item: entry.item, combos: [], values: [] });
    const grouped = out.get(id)!;
    grouped.combos.push(entry.combo);
    if (entry.value !== undefined && !grouped.values.includes(entry.value))
      grouped.values.push(entry.value);
  }
  return [...out.values()];
}

const LIMIT = 150;
function capped<T>(lines: string[], rows: T[], render: (row: T) => unknown[], head: string[]) {
  lines.push(...table(head, rows.slice(0, LIMIT).map(render)));
  if (rows.length > LIMIT)
    lines.push("", `…and ${rows.length - LIMIT} more rows in \`audit.json\`.`);
}

function failsTarget(row: Collected["targets"][number]) {
  return (
    (row.width < 24 || row.height < 24) &&
    !row.inline &&
    !row.offscreen &&
    !row.disabled &&
    !row.uaControl &&
    row.spacingOk === false
  );
}
function under44(row: Collected["targets"][number]) {
  return (row.width < 44 || row.height < 44) && !row.inline && !row.offscreen && !row.disabled;
}
function textFails(row: Collected["texts"][number]) {
  return (
    !row.exempt &&
    row.contrast.ratio !== null &&
    row.contrast.source !== "axe-incomplete" &&
    row.contrast.ratio < row.contrast.required
  );
}
function textUnknown(row: Collected["texts"][number]) {
  return !row.exempt && (row.contrast.source === "axe-incomplete" || row.contrast.ratio === null);
}

function hexRatio(a: string, b: string) {
  const luminance = (value: string) => {
    const [r, g, bl] = [1, 3, 5].map((at) => {
      const c = parseInt(value.slice(at, at + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Toggle groups: the pressed button's colour against one that isn't pressed.
function toggleStates(entries: { combo: Combo; controls: Collected["controls"] }[]) {
  const out: {
    combo: Combo;
    item: { group: string; pressed: string; not: string; ratio: number };
  }[] = [];
  for (const entry of entries) {
    const groups = new Map<string, Collected["controls"]>();
    for (const row of entry.controls)
      if (row.group) groups.set(row.group, [...(groups.get(row.group) ?? []), row]);
    for (const [name, rows] of groups) {
      const on = rows.find((row) => row.state.split(", ").includes("pressed"));
      const off = rows.find((row) => row.state.split(", ").includes("not pressed"));
      const a = on?.fill ?? on?.outer,
        b = off?.fill ?? off?.outer;
      if (!on || !off || !a || !b) continue;
      out.push({
        combo: entry.combo,
        item: {
          group: name,
          pressed: `“${on.text}” ${a}${on.border ? `, border ${on.border}` : ""}`,
          not: `“${off.text}” ${b}${off.border ? `, border ${off.border}` : ""}`,
          ratio: Math.round(hexRatio(a, b) * 100) / 100,
        },
      });
    }
  }
  return group(
    out.map((row) => ({ combo: row.combo, item: row.item })),
    (item) => `${item.group}\u0000${item.ratio}`,
  );
}

function writeAudit(out: string, order: string[]) {
  const rank = makeRank(order);
  const base = path.join(out, ".audit");
  const fragments = readFragments(base);
  const pages = sortCombos(fragments.pages, rank);
  const regions = fragments.regions.sort(
    (a, b) =>
      (a.stateIndex ?? 0) - (b.stateIndex ?? 0) ||
      VIEWPORT_ORDER.indexOf(a.viewport) - VIEWPORT_ORDER.indexOf(b.viewport) ||
      THEME_ORDER.indexOf(a.theme) - THEME_ORDER.indexOf(b.theme),
  );
  const variants = sortCombos(fragments.variants, rank);
  const performance = fragments.performance.sort(
    (a, b) =>
      rank(a.page) - rank(b.page) ||
      LANGUAGE_ORDER.indexOf(a.language) - LANGUAGE_ORDER.indexOf(b.language),
  );
  const all = [...pages, ...regions, ...variants, ...performance];
  if (!all.length) return;
  const times = all.map((entry) => entry.renderedAt).sort();
  const browser = all.find((entry) => entry.browser)?.browser ?? "";
  const axeVersion = pages[0]?.axe.version ?? regions[0]?.axe.version ?? "";
  const root = path.resolve(out, "..", "..");
  const buildFile = path.join(root, ".next", "BUILD_ID");
  const built = existsSync(buildFile) ? statSync(buildFile).mtime.toISOString() : null;
  const metas = pages.filter((page) => page.collected.meta).map((page) => page.collected.meta!);
  const siteUrl =
    metas.map((meta) => meta.og["og:url"] || meta.canonical || "").find((value) => /^https?:/.test(value)) ??
    null;

  // ---- aria/: one file per page (or demo state) and language; two when desktop and
  // mobile differ.
  const ariaDir = path.join(out, "aria");
  const wanted = new Map<string, string>();
  const byName = new Map<string, Map<string, { url: string; text: string }>>();
  for (const entry of [...pages, ...regions])
    if (entry.aria && entry.ariaText !== undefined) {
      if (!byName.has(entry.aria)) byName.set(entry.aria, new Map());
      byName.get(entry.aria)!.set(entry.viewport, { url: entry.url, text: entry.ariaText });
    }
  const header = (url: string, label: string) =>
    `# Playwright ARIA snapshot (locator.ariaSnapshot) of ${url}, ${label}, light theme.\n# Chromium also exposes <summary> elements as disclosure buttons, which this snapshot leaves out; AUDIT.md lists them.\n`;
  for (const [name, views] of byName) {
    const desktop = views.get("desktop"),
      mobile = views.get("mobile");
    if (desktop && mobile && desktop.text === mobile.text)
      wanted.set(`${name}.txt`, header(desktop.url, "desktop and mobile (identical)") + desktop.text + "\n");
    else
      for (const [viewport, data] of views)
        wanted.set(`${name}.${viewport}.txt`, header(data.url, viewport) + data.text + "\n");
  }
  // Write only what changed since the last merge: each file on /mnt/c costs time.
  mkdirSync(ariaDir, { recursive: true });
  const manifestFile = path.join(base, "aria-written.json");
  let written: Record<string, string> = {};
  try {
    written = JSON.parse(readFileSync(manifestFile, "utf8"));
  } catch {
    written = {};
  }
  const present = new Set(readdirSync(ariaDir));
  for (const file of present)
    if (!wanted.has(file)) rmSync(path.join(ariaDir, file), { force: true });
  const now: Record<string, string> = {};
  for (const [file, text] of wanted) {
    now[file] = createHash("sha1").update(text).digest("hex");
    if (written[file] !== now[file] || !present.has(file)) atomicWrite(path.join(ariaDir, file), text);
  }
  atomicWrite(manifestFile, JSON.stringify(now));
  const lean = (entry: PageAudit) => ({ ...entry, ariaText: undefined });

  // ---- audit.json
  atomicWrite(
    path.join(out, "audit.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        measuredFrom: times[0],
        measuredTo: times.at(-1),
        chromium: browser,
        axe: axeVersion,
        axeTags: AXE_TAGS,
        build: built,
        siteUrl,
        performanceConditions: THROTTLING,
        notes: [
          "Measured in Chromium on the production build served by `npm run start`; see AUDIT.md for how to read each part.",
          "Performance is lab data, not field data.",
          "Contrast source 'axe' is axe-core's color-contrast check; 'ancestors' is an estimate from the element's ancestors' backgrounds; 'axe-incomplete' is where axe couldn't decide.",
        ],
        pages: pages.map(lean),
        demos: regions.map(lean),
        variants,
        performance,
        aria: [...wanted.keys()].sort(),
      },
      null,
      1,
    ),
  );

  // ---- AUDIT.md
  const lines: string[] = [];
  const add = (...more: string[]) => lines.push(...more);
  const combo = (entry: Combo): Combo => ({
    page: entry.page,
    language: entry.language,
    viewport: entry.viewport,
    theme: entry.theme,
  });
  add(
    "# Measured audit",
    "",
    `Measured in Chromium ${browser} with axe-core ${axeVersion}, on the production build served by \`npm run start\`${built ? ` (built ${built.slice(0, 16).replace("T", " ")} UTC)` : ""}. Written by \`tests/ux-renders.spec.ts\` (\`UX_RENDERS=1\`) from measurements taken ${times[0]?.slice(0, 16).replace("T", " ")}–${times.at(-1)?.slice(11, 16)} UTC. \`INDEX.md\` explains the renders.`,
    "",
    "How to read it:",
    "- **Measured, not estimated.** Every number comes from the rendered page in Chromium. The one estimate is labelled: text contrast from `ancestors`, used where axe didn't measure the element.",
    "- **Performance is lab data, not field data** (PF-2): one machine, one Chromium, throttled like Lighthouse's mobile preset, against the local server, with no CDN and no real phone. There is no CrUX data for the site.",
    "- **Automated checks catch only part of the barriers** (AX-11). A clean row doesn't prove a page works with a screen reader or a keyboard. Names come from Chromium's accessibility tree, which is what Chrome passes to TalkBack and NVDA; what they say aloud still needs a device.",
    "- **Where** lists the pages, languages, viewports and themes an item appears on. `desktop+mobile light+dark` means all four.",
    "- **Selectors** are built from tags, ids and the first two classes, so the same element has the same selector on every page and language.",
    `- \`audit.json\` holds every row, including passes. \`aria/\` holds Playwright's ARIA snapshots, and \`focus/\` the focus screenshots.`,
    siteUrl
      ? `- **Metadata:** this build had \`SITE_URL\` (${siteUrl}), as production builds do, so canonical, hreflang and \`og:url\` are what production serves.`
      : "- **Metadata:** this build had no `SITE_URL`, so the pages have no canonical, hreflang or `og:url`: `layout.tsx` and `legalMetadata()` add them only when it's set, and production builds set it (`Dockerfile`, `cloudbuild.yaml`). Build with `SITE_URL=https://taskflow.garbar.tech npm run build` to audit them; until then, section 11 can't judge them.",
    "",
    "Contents: 1 Summary · 2 Performance · 3 Text size and zoom · 4 axe · 5 Targets · 6 Text size · 7 Text contrast · 8 Control contrast · 9 Screen reader · 10 Keyboard · 11 Metadata · 12 Headings · 13 Demo states · 14 Tab order, page by page",
    "",
  );

  // 1. Summary
  add(
    "## 1. Summary",
    "",
    "Counts of distinct elements, per page, language, viewport and theme. The sections below list them.",
    "",
  );
  add(
    ...table(
      [
        "Page",
        "Lang",
        "Viewport",
        "Theme",
        "axe rules (nodes)",
        "Fail 2.5.8",
        "Under 44 px",
        "Text < 12 px",
        "Body < 16 px",
        "Text contrast fails (unsure)",
        "Control fails (weak)",
        "Unnamed / no alt",
        "Name ≠ label",
        "Focus not visible",
        "Hidden behind",
        "Keyboard end",
      ],
      pages.map((page) => {
        const c = page.collected;
        const kbd = page.keyboard;
        return [
          page.page,
          page.language,
          page.viewport,
          page.theme,
          `${page.axe.violations.length} (${page.axe.violations.reduce((sum, rule) => sum + rule.nodes.length, 0)})`,
          c.targets.filter(failsTarget).length,
          c.targets.filter(under44).length,
          c.texts.filter((row) => row.size < 12).length,
          c.texts.filter((row) => row.role === "body" && !row.frame && row.size < 16).length,
          `${c.texts.filter(textFails).length} (${c.texts.filter(textUnknown).length})`,
          `${c.controls.filter((row) => row.verdict.startsWith("fail")).length} (${c.controls.filter((row) => row.verdict === "weak-boundary").length})`,
          `${page.screenReader.unnamed.length} / ${page.screenReader.imagesWithoutAlt.length}`,
          page.screenReader.labelInName.length,
          kbd ? `${kbd.stops.filter((stop) => !stop.visible).length} of ${kbd.stops.length}` : "—",
          kbd ? kbd.stops.filter((stop) => stop.obscured === "fully").length : "—",
          kbd ? (kbd.end === "trap" ? "**trap**" : kbd.end === "limit" ? "**no end in 400**" : "ok") : "—",
        ];
      }),
    ),
    "",
  );

  // 2. Performance
  add(
    "## 2. Performance (lab data, not field data)",
    "",
    `Cold loads, cache off, ${THROTTLING.device}, ${THROTTLING.motion}. ${THROTTLING.label}: ${THROTTLING.latencyMs} ms latency, ${THROTTLING.downloadKbps.toFixed(0)} Kbps down, ${THROTTLING.uploadKbps.toFixed(0)} Kbps up, CPU ${THROTTLING.cpu}× slower. Served by the local production server (gzip, no CDN), so the network part is only the throttle.`,
    "",
    "Core Web Vitals thresholds (PF-1, judged at p75 of real visits): LCP good ≤ 2.5 s, poor > 4 s; CLS good ≤ 0.1, poor > 0.25. INP needs real interaction: it isn't measured, and TBT (≈, from long tasks after FCP) stands in for it, as Lighthouse does. Where a page was loaded more than once, the median run is shown with the range.",
    "",
    "CPU busy is the share of the whole machine's CPU time in use while the page was measured, the measurement included. The renders' command measures performance on its own, which keeps it low; a high figure means other work ran alongside, which slows the throttled CPU and inflates FCP and TBT.",
    "",
  );
  const rate = (value: number | null, good: number, poor: number) =>
    value === null ? "" : value <= good ? " ✓" : value > poor ? " ✗ poor" : " ⚠";
  add(
    ...table(
      ["Page", "Lang", "LCP", "CLS", "FCP", "TTFB", "TBT ≈", "JS (transfer / unzipped)", "Fonts", "Images", "Total", "LCP element", "CPU busy"],
      performance.map((entry) => {
        const runs = [...entry.runs].sort((a, b) => (a.lcp ?? 0) - (b.lcp ?? 0));
        const median = runs[Math.floor(runs.length / 2)];
        const range = (pick: (run: PerfRun) => number | null, format: (value: number | null) => string) =>
          runs.length > 1
            ? ` (${format(Math.min(...runs.map((run) => pick(run) ?? 0)))}–${format(Math.max(...runs.map((run) => pick(run) ?? 0)))}, ${runs.length} runs)`
            : "";
        return [
          entry.page,
          entry.language,
          `${seconds(median.lcp)}${rate(median.lcp, 2500, 4000)}${range((run) => run.lcp, seconds)}`,
          `${median.cls.toFixed(3)}${rate(median.cls, 0.1, 0.25)}`,
          seconds(median.fcp),
          seconds(median.ttfb),
          `${median.tbt} ms`,
          `${median.bytes.js.count} files, ${kb(median.bytes.js.transfer)} / ${kb(median.bytes.js.decoded)}`,
          `${median.fonts.files.map((file) => `${path.basename(file.url)} ${kb(file.transfer)}`).join(", ") || "none"}${median.fonts.arrivedAfterFcp !== null && median.fonts.arrivedAfterFcp > 0 ? `, arrives ${median.fonts.arrivedAfterFcp} ms after FCP` : ""}`,
          `${median.bytes.image.count}, ${kb(median.bytes.image.transfer)}`,
          `${median.bytes.total.count} requests, ${kb(median.bytes.total.transfer)}`,
          (median.lcpElement ?? "—").replace(/https?:\/\/[^/\s]+/g, ""),
          entry.busy === undefined ? "—" : `${entry.busy}%`,
        ];
      }),
    ),
    "",
  );
  for (const entry of performance) {
    const runs = [...entry.runs].sort((a, b) => (a.lcp ?? 0) - (b.lcp ?? 0));
    const median = runs[Math.floor(runs.length / 2)];
    const notes = [
      median.clsSources.length ? `layout shifts: ${median.clsSources.join("; ")}` : "",
      median.failed.length ? `failed requests: ${median.failed.join(", ")}` : "",
      `images: ${median.images.map((image) => `${image.url} ${kb(image.transfer)}`).join(", ") || "none"}`,
      `fonts in use: ${median.fonts.faces.join(", ") || "none"}`,
    ].filter(Boolean);
    add(`- **${entry.page} ${entry.language}:** ${notes.join(" · ")}`);
  }
  add("");

  // 3. Text size and zoom
  add(
    "## 3. Text size and zoom",
    "",
    "Light theme. `text200`: the browser's default font size doubled (16 → 32 px), as Chrome's font-size setting does; only text sized in rem, em or % grows. `zoom200`: desktop at 200% zoom (720 × 500 CSS px). `w320`: a 320 px-wide phone, WCAG's reflow width (1.4.10). Overflow is how far the page scrolls sideways.",
    "",
  );
  add(
    ...table(
      ["Page", "Lang", "Variant", "Viewport (CSS px)", "Root / body font", "Scrolls sideways", "Sticking out", "Clipped text", "Text that grew"],
      variants.map((entry) => [
        entry.page,
        entry.language,
        entry.variant,
        `${entry.size.width} × ${entry.size.height} @${entry.size.scale}`,
        `${entry.rootFontSize} / ${entry.bodyFontSize} px`,
        entry.overflow.overflow ? `**+${entry.overflow.overflow} px**` : "no",
        entry.overflow.offenders.slice(0, 3).map((row) => `${code(row.selector)} to ${row.right}`).join(", "),
        entry.clipped.length ? `${entry.clipped.length}` : "none",
        !entry.growth
          ? ""
          : !entry.growth.grew && !entry.growth.partly
            ? `**none** of ${entry.growth.total}: every size is in px`
            : `${entry.growth.grew} of ${entry.growth.total} doubled${entry.growth.partly ? `, ${entry.growth.partly} grew less` : ""}, ${entry.growth.same} stayed`,
      ]),
    ),
    "",
  );
  // List what didn't grow only where other text did; a page where nothing grew says so above.
  const unchanged = group(
    variants
      .filter((entry) => entry.growth && (entry.growth.grew || entry.growth.partly))
      .flatMap((entry) =>
        (entry.growth?.unchanged ?? []).map((row) => ({ combo: combo(entry), item: row, value: `${row.size}px` })),
      ),
    (row) => row.selector,
  );
  if (unchanged.length) {
    add("Text that didn't grow at `text200` on pages where other text did (its size is in px):", "");
    capped(lines, unchanged, (row) => [code(row.item.selector), row.values.join(", "), row.item.text, where(row.combos, rank)], ["Element", "Size", "Text", "Where"]);
    add("");
  }
  const clippedText = group(
    [...pages, ...variants].flatMap((entry) =>
      ("collected" in entry ? entry.collected.clipped : entry.clipped).map((row) => ({
        combo: combo(entry),
        item: row,
        value: `${row.hiddenX ? `${row.hiddenX} px across` : ""}${row.hiddenX && row.hiddenY ? ", " : ""}${row.hiddenY ? `${row.hiddenY} px down` : ""}`,
      })),
    ),
    (row) => `${row.selector}\u0000${row.clippedBy}`,
  );
  add(`**Text cut off** (its lines reach outside a box that hides overflow, or end in an ellipsis), at 100% and in the variants above: ${clippedText.length}.`, "");
  if (clippedText.length)
    capped(lines, clippedText, (row) => [code(row.item.selector), row.item.text, row.item.how === "overflow" ? `by ${code(row.item.clippedBy)}` : row.item.how, row.values.filter(Boolean).join("; "), row.item.decorative ? "yes" : "", where(row.combos, rank)], ["Element", "Text", "Cut", "Hidden", "Decorative", "Where"]);
  add("");

  // 4. axe
  add(
    "## 4. axe (WCAG 2.2 A and AA)",
    "",
    `Rules tagged ${AXE_TAGS.map((tag) => code(tag)).join(", ")}. Violations first, then what axe couldn't decide and left for a person.`,
    "",
  );
  const violations = group(
    pages.flatMap((page) =>
      page.axe.violations.flatMap((rule) =>
        rule.nodes.map((node) => ({ combo: combo(page), item: { rule, node } })),
      ),
    ),
    ({ rule, node }) => `${rule.id}\u0000${node.target}`,
  );
  if (!violations.length) add("No violations on any page.", "");
  else
    capped(lines, violations, (row) => [row.item.rule.id, row.item.rule.impact ?? "", row.item.rule.tags.join(" "), code(row.item.node.target), row.item.node.summary, where(row.combos, rank)], ["Rule", "Impact", "WCAG", "Element", "What fails", "Where"]);
  add("");
  const incomplete = group(
    pages.flatMap((page) =>
      page.axe.incomplete.flatMap((rule) =>
        rule.nodes.map((node) => ({ combo: combo(page), item: { rule, node } })),
      ),
    ),
    ({ rule, node }) => `${rule.id}\u0000${node.target}`,
  );
  if (incomplete.length) {
    add("Needs review (axe incomplete):", "");
    capped(lines, incomplete, (row) => [row.item.rule.id, code(row.item.node.target), row.item.node.summary || row.item.rule.help, where(row.combos, rank)], ["Rule", "Element", "Why", "Where"]);
    add("");
  }

  // 5. Targets
  add(
    "## 5. Target sizes",
    "",
    "Rendered boxes in CSS px (CT-6). WCAG 2.5.8 (AA) asks 24 × 24, unless a 24 px circle around the target touches no other target (the spacing exception), the target is a link inside a sentence (the inline exception), or the browser draws it. 44 × 44 is TaskFlow's bar (2.5.5 AAA, Apple 44 pt, Android 48 dp). Gap is the distance to the nearest other target; CT-6 asks 8 px.",
    "",
  );
  const targetEntries = (filter: (row: Collected["targets"][number]) => boolean) =>
    group(
      pages.flatMap((page) =>
        page.collected.targets.filter(filter).map((row) => ({
          combo: combo(page),
          item: row,
          value: `${row.width} × ${row.height}`,
        })),
      ),
      (row) => `${row.selector}\u0000${row.text}`,
    ).sort((a, b) => Math.min(a.item.width, a.item.height) - Math.min(b.item.width, b.item.height));
  const failing = targetEntries(failsTarget);
  add(`**Fail WCAG 2.5.8** (under 24 px with no exception): ${failing.length}.`, "");
  if (failing.length)
    capped(lines, failing, (row) => [code(row.item.selector), row.item.kind, row.item.text, row.values.join(", "), row.item.gap ?? "", where(row.combos, rank)], ["Element", "Kind", "Text", "Size", "Gap", "Where"]);
  add("");
  const small = targetEntries((row) => under44(row) && !failsTarget(row));
  add(`**Under 44 × 44** (not inline, not failing 2.5.8): ${small.length}.`, "");
  capped(lines, small, (row) => [code(row.item.selector), row.item.kind, row.item.text, row.values.join(", "), row.item.spacingOk === true ? "24 px circle clear" : "", row.item.gap ?? "", where(row.combos, rank)], ["Element", "Kind", "Text", "Size", "2.5.8", "Gap", "Where"]);
  add("");
  const inline = group(
    pages.flatMap((page) =>
      page.collected.targets
        .filter((row) => row.inline)
        .map((row) => ({ combo: combo(page), item: row, value: `${row.height}` })),
    ),
    (row) => `${row.selector}\u0000${row.text}`,
  );
  add(
    `**Links inside sentences** (WCAG 2.5.8 exempts them): ${inline.length}. WCAG 1.4.1 needs them told apart by more than colour: an underline, or 3:1 against the text around them plus another cue on focus and hover.`,
    "",
  );
  capped(lines, inline, (row) => [code(row.item.selector), row.item.text, `${row.values.join(", ")} px`, row.item.underline ? "yes" : "**no**", ratioText(row.item.vsText), where(row.combos, rank)], ["Link", "Text", "Height", "Underlined", "vs text", "Where"]);
  add("");

  // 6. Text size
  add(
    "## 6. Text size",
    "",
    "Computed font sizes in CSS px (RD-5: body text ≥ 16 px, small print ≥ 12 px). Body text is running text of 20 characters or more in `p`, `li`, `dd`, `blockquote`, `figcaption` or table cells, outside the header and footer. Text inside `aria-hidden` is included: people still see it.",
    "",
  );
  const tiny = group(
    pages.flatMap((page) =>
      page.collected.texts
        .filter((row) => row.size < 12)
        .map((row) => ({ combo: combo(page), item: row, value: `${row.size}` })),
    ),
    (row) => row.selector,
  ).sort((a, b) => a.item.size - b.item.size);
  add(`**Under 12 px:** ${tiny.length} elements.`, "");
  capped(lines, tiny, (row) => [code(row.item.selector), `${row.values.join(", ")} px`, row.item.role + (row.item.decorative ? ", decorative" : ""), row.item.text, where(row.combos, rank)], ["Element", "Size", "Kind", "Text", "Where"]);
  add("");
  const bodySmall = group(
    pages.flatMap((page) =>
      page.collected.texts
        .filter((row) => row.role === "body" && !row.frame && row.size < 16)
        .map((row) => ({ combo: combo(page), item: row, value: `${row.size}` })),
    ),
    (row) => row.selector,
  ).sort((a, b) => a.item.size - b.item.size);
  add(`**Body text under 16 px:** ${bodySmall.length} elements.`, "");
  capped(lines, bodySmall, (row) => [code(row.item.selector), `${row.values.join(", ")} px`, row.item.text, where(row.combos, rank)], ["Element", "Size", "Text", "Where"]);
  add("", "Share of visible characters by size, light theme:", "");
  add(
    ...table(
      ["Page", "Lang", "Viewport", "< 12 px", "12–14 px", "14–16 px", "≥ 16 px"],
      pages
        .filter((page) => page.theme === "light")
        .map((page) => {
          const bands = [0, 0, 0, 0];
          for (const row of page.collected.texts) {
            const length = row.chars ?? row.text.length;
            bands[row.size < 12 ? 0 : row.size < 14 ? 1 : row.size < 16 ? 2 : 3] += length;
          }
          const total = bands.reduce((sum, value) => sum + value, 0) || 1;
          return [page.page, page.language, page.viewport, ...bands.map((value) => `${Math.round((value / total) * 100)}%`)];
        }),
    ),
    "",
  );

  // 7. Text contrast
  add(
    "## 7. Text contrast",
    "",
    "WCAG 1.4.3 (AX-2): 4.5:1, or 3:1 for large text (≥ 24 px, or ≥ 18.66 px bold). Ratios aren't rounded up. Source `axe` is axe-core's stacking-aware measurement; `ancestors` is an estimate from the backgrounds of the element's ancestors, used where axe didn't measure (such as text inside `aria-hidden`).",
    "",
  );
  const contrastEntries = (filter: (row: Collected["texts"][number]) => boolean) =>
    group(
      pages.flatMap((page) =>
        page.collected.texts.filter(filter).map((row) => ({
          combo: combo(page),
          item: row,
          value: `${row.contrast.ratio?.toFixed(2)}:1 (${row.contrast.fg} on ${row.contrast.bg})`,
        })),
      ),
      (row) => `${row.selector}\u0000${row.contrast.fg}\u0000${row.contrast.bg}`,
    ).sort((a, b) => (a.item.contrast.ratio ?? 0) - (b.item.contrast.ratio ?? 0));
  const textFailing = contrastEntries(textFails);
  add(`**Fail:** ${textFailing.length}.`, "");
  if (textFailing.length)
    capped(lines, textFailing, (row) => [code(row.item.selector), row.item.text, ratioText(row.item.contrast.ratio), `${row.item.contrast.required}:1`, `${row.item.contrast.fg} on ${row.item.contrast.bg}`, `${row.item.size} px ${row.item.weight}`, row.item.contrast.source, where(row.combos, rank)], ["Element", "Text", "Ratio", "Needs", "Colours", "Size", "Source", "Where"]);
  add("");
  const textUnsure = contrastEntries(textUnknown);
  add(`**Couldn't be measured for sure:** ${textUnsure.length}. Check these on the renders.`, "");
  if (textUnsure.length)
    capped(lines, textUnsure, (row) => [code(row.item.selector), row.item.text, ratioText(row.item.contrast.ratio), row.item.contrast.note, where(row.combos, rank)], ["Element", "Text", "Estimate", "Why", "Where"]);
  add("");
  // Contrast belongs to a colour pair: list each pair once, lowest ratio first.
  for (const theme of THEME_ORDER) {
    type Pair = {
      fg: string;
      bg: string;
      ratio: number;
      needs: number;
      fails: number;
      elements: Set<string>;
      smallest: number;
      examples: string[];
      combos: Combo[];
    };
    const pairs = new Map<string, Pair>();
    for (const page of pages.filter((entry) => entry.theme === theme))
      for (const row of page.collected.texts) {
        const { ratio, fg, bg, required, source } = row.contrast;
        if (row.exempt || ratio === null || source === "axe-incomplete" || !fg || !bg) continue;
        const key = `${fg}\u0000${bg}`;
        let pair = pairs.get(key);
        if (!pair)
          pairs.set(
            key,
            (pair = { fg, bg, ratio, needs: required, fails: 0, elements: new Set(), smallest: row.size, examples: [], combos: [] }),
          );
        pair.ratio = Math.min(pair.ratio, ratio);
        pair.needs = Math.max(pair.needs, required);
        if (textFails(row)) pair.fails++;
        if (!pair.elements.has(row.selector)) {
          pair.elements.add(row.selector);
          if (pair.examples.length < 3) pair.examples.push(`“${row.text.slice(0, 32)}”`);
        }
        pair.smallest = Math.min(pair.smallest, row.size);
        if (!pair.combos.some((other) => other.page === page.page && other.language === page.language && other.viewport === page.viewport))
          pair.combos.push(combo(page));
      }
    const rows = [...pairs.values()].sort((a, b) => a.ratio - b.ratio);
    add(`**Every text colour pair, ${theme} theme:** ${rows.length}, lowest ratio first. Needs is the strictest minimum among the pair's elements.`, "");
    capped(
      lines,
      rows,
      (pair) => [
        `${ratioText(pair.ratio)}${pair.ratio < pair.needs ? " ✗" : ""}`,
        `${pair.needs}:1`,
        pair.fg,
        pair.bg,
        pair.elements.size,
        `${pair.smallest} px`,
        pair.fails || "",
        pair.examples.join(", "),
        where(pair.combos, rank),
      ],
      ["Ratio", "Needs", "Text", "Background", "Elements", "Smallest", "Fail", "Examples", "Where"],
    );
    add("");
  }
  const exemptLow = contrastEntries((row) => !!row.exempt && row.contrast.ratio !== null && row.contrast.ratio < row.contrast.required);
  if (exemptLow.length) {
    add(`**Below the minimum but exempt** (inactive controls, decoration hidden from assistive technology): ${exemptLow.length}.`, "");
    capped(lines, exemptLow, (row) => [code(row.item.selector), row.item.text, ratioText(row.item.contrast.ratio), row.item.exempt ?? "", where(row.combos, rank)], ["Element", "Text", "Ratio", "Why exempt", "Where"]);
    add("");
  }

  // 8. Control contrast
  add(
    "## 8. Control contrast (non-text)",
    "",
    "WCAG 1.4.11: what identifies a control needs 3:1 against what's next to it. A field's boundary must reach it; an icon-only control's icon must; a text button's fill or border needn't, because its words identify it, but under 3:1 it's a weak signifier (CT-5). Colours are composited over the background behind the control.",
    "",
  );
  const controlEntries = (verdicts: string[]) =>
    group(
      pages.flatMap((page) =>
        page.collected.controls
          .filter((row) => verdicts.includes(row.verdict))
          .map((row) => ({
            combo: combo(page),
            item: row,
            value: `fill ${ratioText(row.fillRatio)}, border ${ratioText(row.borderRatio)}${row.iconRatio !== null ? `, icon ${ratioText(row.iconRatio)}` : ""}`,
          })),
      ),
      // The background separates light from dark, so each theme gets its own row.
      (row) => `${row.selector}\u0000${row.verdict}\u0000${row.outer}`,
    );
  const controlFails = controlEntries(["fail-boundary", "fail-icon"]);
  add(`**Fail:** ${controlFails.length}.`, "");
  if (controlFails.length)
    capped(lines, controlFails, (row) => [code(row.item.selector), row.item.kind, row.item.text, row.item.verdict === "fail-icon" ? "icon under 3:1" : "boundary under 3:1", row.values.join("; "), `${row.item.outer} behind`, where(row.combos, rank)], ["Control", "Kind", "Name", "Problem", "Ratios", "Background", "Where"]);
  add("");
  const weak = controlEntries(["weak-boundary"]);
  add(`**Weak boundary** (allowed, but a weak signifier): ${weak.length}.`, "");
  if (weak.length)
    capped(lines, weak, (row) => [code(row.item.selector), row.item.text, row.item.state, row.values.join("; "), `${row.item.fill ?? "—"} on ${row.item.outer}`, where(row.combos, rank)], ["Control", "Name", "State", "Ratios", "Colours", "Where"]);
  add("");
  const unknownControls = controlEntries(["unknown"]);
  if (unknownControls.length) {
    add(`**Couldn't be judged:** ${unknownControls.length}.`, "");
    capped(lines, unknownControls, (row) => [code(row.item.selector), row.item.text, row.item.note, where(row.combos, rank)], ["Control", "Name", "Note", "Where"]);
    add("");
  }
  const toggles = toggleStates(pages.map((page) => ({ combo: combo(page), controls: page.collected.controls })));
  add(
    `**Toggle buttons** (\`aria-pressed\`): ${toggles.length} groups. 1.4.11 asks 3:1 between what shows the state and what's next to it, unless something else shows it too (weight, an icon, a check). Here, the pressed button's colour against the one that isn't pressed.`,
    "",
  );
  if (toggles.length)
    capped(lines, toggles, (row) => [code(row.item.group), row.item.pressed, row.item.not, `${ratioText(row.item.ratio)}${row.item.ratio < 3 ? " ✗" : ""}`, where(row.combos, rank)], ["Group", "Pressed", "Not pressed", "Ratio", "Where"]);
  add("");

  // 9. Screen reader
  add(
    "## 9. Screen reader",
    "",
    "From Chromium's accessibility tree. Unnamed controls and images without alt fail WCAG 1.1.1 or 4.1.2; a name that doesn't contain the visible label fails 2.5.3 (people using voice control say what they see).",
    "",
  );
  const lightPages = pages.filter((page) => page.theme === "light");
  const unnamed = group(
    lightPages.flatMap((page) => page.screenReader.unnamed.map((row) => ({ combo: combo(page), item: row }))),
    (row) => `${row.role}\u0000${row.selector}`,
  );
  add(`**Controls with no name:** ${unnamed.length}.`, "");
  if (unnamed.length) capped(lines, unnamed, (row) => [row.item.role, code(row.item.selector), where(row.combos, rank)], ["Role", "Element", "Where"]);
  add("");
  const noAlt = group(
    lightPages.flatMap((page) => page.screenReader.imagesWithoutAlt.map((row) => ({ combo: combo(page), item: row }))),
    (row) => row.selector,
  );
  add(`**Images without alt text:** ${noAlt.length}.`, "");
  if (noAlt.length) capped(lines, noAlt, (row) => [code(row.item.selector), row.item.why, row.item.src, where(row.combos, rank)], ["Image", "Why", "Source", "Where"]);
  add("");
  const mismatch = group(
    lightPages.flatMap((page) => page.screenReader.labelInName.map((row) => ({ combo: combo(page), item: row }))),
    (row) => `${row.selector}\u0000${row.name}`,
  );
  add(`**Accessible name doesn't contain the visible text (2.5.3):** ${mismatch.length}.`, "");
  if (mismatch.length) capped(lines, mismatch, (row) => [code(row.item.selector), row.item.role, row.item.visible, row.item.name, where(row.combos, rank)], ["Element", "Role", "Visible text", "Accessible name", "Where"]);
  add("");
  const disclosures = group(
    lightPages.flatMap((page) => page.screenReader.disclosures.map((row) => ({ combo: combo(page), item: row }))),
    (row) => `${row.selector}\u0000${row.name}`,
  );
  if (disclosures.length) {
    add(
      `**Disclosure buttons (\`<summary>\`):** ${disclosures.length}. Chromium exposes them as buttons with these names; Playwright's snapshots in \`aria/\` leave them out.`,
      "",
    );
    capped(lines, disclosures, (row) => [code(row.item.selector), row.item.name || "**(no name)**", where(row.combos, rank)], ["Element", "Name", "Where"]);
    add("");
  }
  add("**Landmarks**, per page, language and viewport (light theme):", "");
  add(
    ...table(
      ["Page", "Lang", "Viewport", "Landmarks", "Problems", "Text outside landmarks"],
      lightPages.map((page) => [
        page.page,
        page.language,
        page.viewport,
        page.screenReader.landmarks
          .map((landmark) => `${landmark.role}${landmark.name ? ` “${landmark.name}”` : ""}`)
          .join(", "),
        page.screenReader.landmarkIssues.join("; ") || "none",
        page.screenReader.outsideLandmarks.slice(0, 4).join("; ") +
          (page.screenReader.outsideLandmarks.length > 4 ? ` +${page.screenReader.outsideLandmarks.length - 4}` : ""),
      ]),
    ),
    "",
    `ARIA snapshots: ${[...wanted.keys()].filter((file) => !/^(voice|sample)-/.test(file)).map((file) => code(`aria/${file}`)).join(", ")}.`,
    "",
  );

  // 10. Keyboard
  add(
    "## 10. Keyboard",
    "",
    "Tab pressed from the top of each page until focus leaves it. A focus indicator counts as visible when focus changes how the element (or its parent, or its ::before/::after) is drawn while it's on screen. Hidden behind: every sampled point of the focused element is covered by something else, such as the sticky header (WCAG 2.4.11). Ring contrast is the outline against the background behind it (1.4.11; 2.4.13 is AAA). The screenshots are in `focus/`: the first 3 stops of every page, and every stop with a problem below (up to 20 a page).",
    "",
  );
  const keyed = pages.filter((page) => page.keyboard);
  add(
    ...table(
      ["Page", "Lang", "Viewport", "Theme", "Stops", "End", "Not visible", "Hidden behind", "Partly hidden", "Ring clipped", "Ring < 3:1"],
      keyed.map((page) => {
        const stops = page.keyboard!.stops;
        return [
          page.page,
          page.language,
          page.viewport,
          page.theme,
          stops.length,
          page.keyboard!.end === "trap" ? `**trap:** ${page.keyboard!.trap}` : page.keyboard!.end === "limit" ? "**no end after 400 presses**" : "reached the end",
          stops.filter((stop) => !stop.visible).length,
          stops.filter((stop) => stop.obscured === "fully").length,
          stops.filter((stop) => stop.obscured === "partly").length,
          stops.filter((stop) => stop.clippedBy).length,
          stops.filter((stop) => stop.ringContrast !== null && stop.ringContrast < 3).length,
        ];
      }),
    ),
    "",
  );
  const stopIssues = (filter: (stop: KeyStop) => boolean, value: (stop: KeyStop) => string) =>
    group(
      keyed.flatMap((page) =>
        page.keyboard!.stops.filter(filter).map((stop) => ({ combo: combo(page), item: stop, value: value(stop) })),
      ),
      (stop) => stop.selector,
    );
  const notVisible = stopIssues((stop) => !stop.visible, (stop) => stop.screenshot ?? "");
  add(`**Focus not visible:** ${notVisible.length}.`, "");
  if (notVisible.length)
    capped(lines, notVisible, (row) => [code(row.item.selector), `${row.item.role} “${row.item.name}”`, row.item.obscured === "offscreen" ? "off screen when focused" : "no visible change", row.values.filter(Boolean).slice(0, 2).map(code).join(", "), where(row.combos, rank)], ["Element", "Name", "Why", "Screenshot", "Where"]);
  add("");
  const hidden = stopIssues((stop) => stop.obscured === "fully" || stop.obscured === "partly", (stop) => `${stop.obscured} by ${stop.obscuredBy ?? "?"}${stop.bySticky ? " (sticky)" : ""}`);
  add(`**Hidden or partly hidden when focused:** ${hidden.length}.`, "");
  if (hidden.length)
    capped(lines, hidden, (row) => [code(row.item.selector), `${row.item.role} “${row.item.name}”`, row.values.join("; "), where(row.combos, rank)], ["Element", "Name", "Covered", "Where"]);
  add("");
  const clippedRings = stopIssues((stop) => !!stop.clippedBy, (stop) => stop.clippedBy ?? "");
  add(`**Focus ring cut off by a scrolling or clipping container:** ${clippedRings.length}.`, "");
  if (clippedRings.length)
    capped(lines, clippedRings, (row) => [code(row.item.selector), `“${row.item.name}”`, row.values.join("; "), where(row.combos, rank)], ["Element", "Name", "Clipped by", "Where"]);
  add("");
  const faintRings = stopIssues((stop) => stop.ringContrast !== null && stop.ringContrast < 3, (stop) => ratioText(stop.ringContrast));
  add(`**Focus ring under 3:1:** ${faintRings.length}.`, "");
  if (faintRings.length)
    capped(lines, faintRings, (row) => [code(row.item.selector), `“${row.item.name}”`, row.item.outline ?? "", row.values.join(", "), where(row.combos, rank)], ["Element", "Name", "Outline", "Ratio", "Where"]);
  add("");

  // 11. Metadata
  add(
    "## 11. Metadata",
    "",
    "From each page's `<head>` (ML-2, ML-3, ML-8, ML-9). `lang` should match the route. Pages that exist in more than one language need hreflang for en, es, ca and `x-default`, including themselves.",
    "",
  );
  const metaPages = pages.filter((page) => page.collected.meta && page.viewport === "desktop" && page.theme === "light");
  const expectedLanguages = (pageKey: string) => [...new Set(pages.filter((page) => page.page === pageKey).map((page) => page.language))];
  const titleCount = new Map<string, number>();
  for (const page of metaPages) titleCount.set(page.collected.meta!.title, (titleCount.get(page.collected.meta!.title) ?? 0) + 1);
  add(
    ...table(
      ["Page", "Lang", "lang", "Title", "Description", "Canonical", "hreflang", "og:", "twitter:", "Problems"],
      metaPages.map((page) => {
        const meta = page.collected.meta!;
        const problems: string[] = [];
        if (meta.lang !== page.language) problems.push(`lang is “${meta.lang || "missing"}”, not “${page.language}”`);
        if (!meta.title) problems.push("no title");
        if ((titleCount.get(meta.title) ?? 0) > 1) problems.push("title shared with another page or language");
        if (!meta.description) problems.push("no description");
        const languages = expectedLanguages(page.page);
        const hreflangs = meta.alternates.map((alternate) => alternate.hreflang);
        if (languages.length > 1) {
          for (const language of [...languages, "x-default"])
            if (!hreflangs.includes(language)) problems.push(`no hreflang ${language}`);
        }
        if (siteUrl && !meta.canonical) problems.push("no canonical");
        for (const tag of ["og:title", "og:description", "og:image", "og:locale"])
          if (!meta.og[tag]) problems.push(`no ${tag}`);
        if (siteUrl && !meta.og["og:url"]) problems.push("no og:url");
        if (meta.og["og:title"] && meta.twitter["twitter:title"] && meta.og["og:title"] !== meta.twitter["twitter:title"])
          problems.push("twitter:title differs from og:title");
        if (meta.twitter["twitter:title"] && meta.twitter["twitter:title"] !== meta.title && meta.twitter["twitter:title"] !== meta.og["og:title"])
          problems.push("twitter:title isn't this page's title");
        return [
          page.page,
          page.language,
          meta.lang || "—",
          meta.title,
          meta.description ? `${meta.description.length} chars` : "—",
          meta.canonical ?? "—",
          hreflangs.join(", ") || "—",
          Object.keys(meta.og).map((key) => key.replace("og:", "")).join(", ") || "—",
          Object.keys(meta.twitter).map((key) => key.replace("twitter:", "")).join(", ") || "—",
          problems.join("; ") || "none",
        ];
      }),
    ),
    "",
    "Descriptions and link-preview text, as served:",
    "",
    ...table(
      ["Page", "Lang", "description", "og:title", "og:description", "og:image", "twitter:title"],
      metaPages.map((page) => {
        const meta = page.collected.meta!;
        return [page.page, page.language, meta.description ?? "—", meta.og["og:title"] ?? "—", meta.og["og:description"] ?? "—", meta.og["og:image"] ?? "—", meta.twitter["twitter:title"] ?? "—"];
      }),
    ),
    "",
  );

  // 12. Headings
  add(
    "## 12. Headings",
    "",
    "The outline per page and language, desktop light (AX-5: descriptive headings in order; one `h1` by convention). Problems: a level skipped going down, no `h1`, more than one `h1`, an empty heading. Mobile differences are noted.",
    "",
  );
  for (const page of pages.filter((entry) => entry.viewport === "desktop" && entry.theme === "light")) {
    const headings = page.collected.headings.filter((heading) => !heading.hidden);
    const problems: string[] = [];
    const h1 = headings.filter((heading) => heading.level === 1).length;
    if (!h1) problems.push("no h1");
    if (h1 > 1) problems.push(`${h1} h1s`);
    headings.forEach((heading, index) => {
      if (!heading.text) problems.push(`empty h${heading.level} (${heading.selector})`);
      const previous = headings[index - 1];
      if (previous && heading.level > previous.level + 1)
        problems.push(`h${previous.level} → h${heading.level} at “${heading.text.slice(0, 40)}”`);
    });
    const mobile = pages.find((entry) => entry.page === page.page && entry.language === page.language && entry.viewport === "mobile" && entry.theme === "light");
    const outline = (list: typeof headings) => list.map((heading) => `${heading.level}:${heading.text}`).join("\n");
    const differs = mobile && outline(mobile.collected.headings.filter((heading) => !heading.hidden)) !== outline(headings);
    add(
      `**${page.page} ${page.language}** — ${problems.join("; ") || "no problems"}${differs ? "; on mobile the outline differs (see audit.json)" : ""}`,
      "",
      "```",
      ...headings.map((heading) => `${"  ".repeat(heading.level - 1)}h${heading.level} ${heading.text}${heading.visible ? "" : "  (not visible)"}`),
      "```",
      "",
    );
  }

  // 13. Demo states
  add(
    "## 13. Demo states",
    "",
    "The same checks inside the demo card, for each state INDEX.md lists (the voice API stubbed, never called). Focus is where focus is after the state appears; Announced is the text of the card's live regions, which screen readers read when it changes.",
    "",
  );
  add(
    ...table(
      ["State", "Viewport", "Theme", "axe rules (nodes)", "Fail 2.5.8", "Under 44 px", "Text < 12 px", "Text contrast fails", "Control fails", "Unnamed", "Focus", "Announced"],
      regions.map((entry) => {
        const c = entry.collected;
        return [
          entry.state ?? entry.page,
          entry.viewport,
          entry.theme,
          `${entry.axe.violations.length} (${entry.axe.violations.reduce((sum, rule) => sum + rule.nodes.length, 0)})`,
          c.targets.filter(failsTarget).length,
          c.targets.filter(under44).length,
          c.texts.filter((row) => row.size < 12).length,
          c.texts.filter(textFails).length,
          c.controls.filter((row) => row.verdict.startsWith("fail")).length,
          entry.screenReader.unnamed.length,
          c.focus ?? "page",
          c.live.filter((row) => row.text).map((row) => `${row.role || row.live}: ${row.text}`).join(" · ") || "—",
        ];
      }),
    ),
    "",
  );
  const regionCombo = (entry: PageAudit): Combo => ({ page: entry.state ?? entry.page, language: entry.language, viewport: entry.viewport, theme: entry.theme });
  const regionViolations = group(
    regions.flatMap((entry) => entry.axe.violations.flatMap((rule) => rule.nodes.map((node) => ({ combo: regionCombo(entry), item: { rule, node } })))),
    ({ rule, node }) => `${rule.id}\u0000${node.target}`,
  );
  add(`**axe violations in the demos:** ${regionViolations.length}.`, "");
  if (regionViolations.length)
    capped(lines, regionViolations, (row) => [row.item.rule.id, code(row.item.node.target), row.item.node.summary, where(row.combos, rank)], ["Rule", "Element", "What fails", "Where"]);
  add("");
  const regionTargets = group(
    regions.flatMap((entry) => entry.collected.targets.filter((row) => under44(row)).map((row) => ({ combo: regionCombo(entry), item: row, value: `${row.width} × ${row.height}` }))),
    (row) => `${row.selector}\u0000${row.text}`,
  ).sort((a, b) => Math.min(a.item.width, a.item.height) - Math.min(b.item.width, b.item.height));
  add(`**Targets under 44 × 44 in the demos:** ${regionTargets.length}${regionTargets.some((row) => failsTarget(row.item)) ? ", some failing 2.5.8 (marked)" : ""}.`, "");
  if (regionTargets.length)
    capped(lines, regionTargets, (row) => [code(row.item.selector), row.item.text, row.values.join(", "), failsTarget(row.item) ? "**fails 2.5.8**" : row.item.spacingOk ? "24 px circle clear" : "", where(row.combos, rank)], ["Element", "Text", "Size", "2.5.8", "Where"]);
  add("");
  const regionText = group(
    regions.flatMap((entry) => entry.collected.texts.filter((row) => row.size < 12 || textFails(row)).map((row) => ({ combo: regionCombo(entry), item: row, value: `${row.size} px, ${ratioText(row.contrast.ratio)}` }))),
    (row) => row.selector,
  );
  add(`**Small or low-contrast text in the demos:** ${regionText.length}.`, "");
  if (regionText.length)
    capped(lines, regionText, (row) => [code(row.item.selector), row.item.text, row.values.join("; "), textFails(row.item) ? `**below ${row.item.contrast.required}:1**` : "", where(row.combos, rank)], ["Element", "Text", "Size, contrast", "Contrast", "Where"]);
  add("");
  const regionControls = group(
    regions.flatMap((entry) => entry.collected.controls.filter((row) => row.verdict.startsWith("fail") || row.verdict === "weak-boundary").map((row) => ({ combo: regionCombo(entry), item: row, value: `fill ${ratioText(row.fillRatio)}, border ${ratioText(row.borderRatio)}${row.iconRatio !== null ? `, icon ${ratioText(row.iconRatio)}` : ""}` }))),
    (row) => `${row.selector}\u0000${row.verdict}\u0000${row.outer}`,
  );
  add(`**Control contrast in the demos (fails and weak boundaries):** ${regionControls.length}.`, "");
  if (regionControls.length)
    capped(lines, regionControls, (row) => [code(row.item.selector), row.item.text, row.item.verdict, row.values.join("; "), where(row.combos, rank)], ["Control", "Name", "Verdict", "Ratios", "Where"]);
  add("");
  const regionToggles = toggleStates(regions.map((entry) => ({ combo: regionCombo(entry), controls: entry.collected.controls })));
  add(`**Toggle buttons in the demos** (the pressed colour against the one not pressed; 1.4.11 asks 3:1 unless something else shows the state): ${regionToggles.length}.`, "");
  if (regionToggles.length)
    capped(lines, regionToggles, (row) => [code(row.item.group), row.item.pressed, row.item.not, `${ratioText(row.item.ratio)}${row.item.ratio < 3 ? " ✗" : ""}`, where(row.combos, rank)], ["Group", "Pressed", "Not pressed", "Ratio", "Where"]);
  add("");
  const regionNames = group(
    regions.flatMap((entry) => [
      ...entry.screenReader.unnamed.map((row) => ({ combo: regionCombo(entry), item: { selector: row.selector, problem: `${row.role} with no name` } })),
      ...entry.screenReader.labelInName.map((row) => ({ combo: regionCombo(entry), item: { selector: row.selector, problem: `visible “${row.visible}”, name “${row.name}” (2.5.3)` } })),
    ]),
    (row) => `${row.selector}\u0000${row.problem}`,
  );
  add(`**Names in the demos** (unnamed controls; names that don't contain the visible label): ${regionNames.length}.`, "");
  if (regionNames.length)
    capped(lines, regionNames, (row) => [code(row.item.selector), row.item.problem, where(row.combos, rank)], ["Element", "Problem", "Where"]);
  add("");

  // 14. Tab order
  add(
    "## 14. Tab order, page by page",
    "",
    "Every stop, in order, with Chromium's role and accessible name. ✓ the focus indicator is visible (the outline and its contrast when there is one); ✗ it isn't. Light and dark are shown side by side. Roles are Chromium's own: `DisclosureTriangle` is a `<summary>`, which screen readers announce as a button that's collapsed or expanded; `Date` and `InputTime` are date and time fields.",
    "",
  );
  for (const page of keyed.filter((entry) => entry.theme === "light")) {
    const darkPage = keyed.find((entry) => entry.page === page.page && entry.language === page.language && entry.viewport === page.viewport && entry.theme === "dark");
    const dark = darkPage && {
      keyboard: {
        stops: page.keyboard!.stops.map(
          (stop) =>
            darkPage.keyboard!.stops.find((other) => other.n === stop.n && other.selector === stop.selector) ??
            darkPage.keyboard!.stops.find((other) => other.selector === stop.selector)!,
        ),
      },
    };
    add(`<details><summary><b>${page.page} ${page.language} ${page.viewport}</b>: ${page.keyboard!.stops.length} stops, ${page.keyboard!.end === "trap" ? "trap" : "reaches the end"}</summary>`, "");
    const mark = (stop: KeyStop | undefined) =>
      !stop
        ? "—"
        : `${stop.visible ? "✓" : "✗"}${stop.ringContrast !== null ? ` ${stop.ringContrast.toFixed(2)}:1` : stop.visible ? ` ${stop.changes[0]?.split(":")[0] ?? ""}` : ""}${stop.obscured === "fully" ? " hidden" : stop.obscured === "partly" ? " partly hidden" : stop.obscured === "offscreen" ? " off screen" : ""}`;
    add(
      ...table(
        ["#", "Role", "Name", "Element", "Light", "Dark"],
        page.keyboard!.stops.map((stop) => [stop.n, stop.role, stop.name || "**(no name)**", code(stop.selector), mark(stop), mark(dark?.keyboard?.stops[stop.n - 1])]),
      ),
      "",
      "</details>",
      "",
    );
  }
  atomicWrite(path.join(out, "AUDIT.md"), lines.join("\n"));
}

// Merge by hand: npx tsx tests/support/ux-audit.ts
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "artifacts", "ux-web");
  mergeAudit(out).then(
    () => console.log(`Merged ${path.join(out, "AUDIT.md")}`),
    (error) => {
      console.error(error);
      process.exit(1);
    },
  );
}
