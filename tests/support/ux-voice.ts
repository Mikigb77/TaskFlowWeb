// The demos' states for the UX web renders (tests/ux-renders.spec.ts).
//
// The real voice API is never called. Every request to /api/voice/* is answered here, in
// the shapes the site's own server code returns (src/app/api/voice/, src/lib/voice/):
// error bodies come from its failure() and DemoError, and the list of errors is read from
// its `new DemoError(…)` calls, so a new or reworded error is rendered on the next run.
// Requests to other origins are blocked; Cloudflare's script is replaced by a stand-in.
//
// Each scenario is one fresh visit that ends in one or more states. The locators use the
// demo's structure (classes, data-stage) rather than its copy, so rewording the copy
// doesn't break them; a structural change does, and the renders then fail loudly.
import { expect, type Page, type Route } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { checkAdmission, DemoError, NETWORK_LIMIT } from "../../src/lib/voice/policy";
import type { Draft } from "../../src/lib/voice/policy";
import { failure } from "../../src/lib/voice/security";
import { ca } from "../../src/content/site/ca";
import { en } from "../../src/content/site/en";
import { es } from "../../src/content/site/es";

export type Project = "desktop" | "mobile";
export type Theme = "light" | "dark";
// The home each scenario visits: the renders use English; the acceptance tests also run
// every scenario on /es/ and /ca/ (tests/ux-web-voice.spec.ts).
export type DemoLanguage = "en" | "es" | "ca";
const SITE = { en, es, ca };
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type ServerError = {
  status: number;
  code: string;
  error: string;
  source: string;
};

const MAIN_CODES = ["visitor_limit", "network_limit", "budget_pause", "processing", "unavailable"];
const AUDIO_CODES = ["invalid_audio", "audio_length", "too_large"];
// Errors the status request can also return when the demo opens.
const STATUS_CODES = ["paused", "not_ready", "edge_required", "unavailable"];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : full.endsWith(".ts") ? [full] : [];
  });
}

// Every distinct error the voice API can send, read from the server code.
export function serverErrors(root: string) {
  const errors: ServerError[] = [];
  const unread: string[] = [];
  const pattern = /new DemoError\(\s*(\d{3}),\s*"([a-z_]+)",\s*"((?:[^"\\]|\\.)*)"/g;
  for (const file of [
    ...files(path.join(root, "src", "lib", "voice")),
    ...files(path.join(root, "src", "app", "api", "voice")),
  ]) {
    const text = readFileSync(file, "utf8");
    const relative = path.relative(root, file).split(path.sep).join("/");
    const total = (text.match(/new DemoError\(/g) ?? []).length;
    let found = 0;
    for (const match of text.matchAll(pattern)) {
      found++;
      const line = text.slice(0, match.index).split("\n").length;
      errors.push({
        status: Number(match[1]),
        code: match[2],
        error: JSON.parse(`"${match[3]}"`) as string,
        source: `${relative}:${line}`,
      });
    }
    if (found < total) unread.push(`${relative}: ${total - found} of ${total}`);
  }
  // failure()'s answer to anything that isn't a DemoError.
  errors.push({
    status: 503,
    code: "unavailable",
    error: "",
    source: "src/lib/voice/security.ts (failure)",
  });
  const distinct = new Map<string, ServerError>();
  for (const error of errors)
    if (!distinct.has(`${error.code}\u0000${error.error}`))
      distinct.set(`${error.code}\u0000${error.error}`, error);
  return { errors: [...distinct.values()], unread };
}

// The JSON body and status the server sends for an error, from its own failure().
async function errorAnswer(error: ServerError) {
  const now = Date.now();
  let thrown: unknown = new DemoError(error.status, error.code, error.error);
  if (error.code === "unavailable" && !error.error) thrown = new Error("ux-renders");
  // The limits carry the time the allowance returns; let the policy compute it.
  if (error.code === "visitor_limit")
    try {
      checkAdmission([now - 3_600_000, now - 7_200_000, now - 10_800_000], [], 0, 1, now);
    } catch (limit) {
      thrown = limit;
    }
  if (error.code === "network_limit")
    try {
      checkAdmission([], Array(NETWORK_LIMIT).fill(now - 3_600_000), 0, 1, now);
    } catch (limit) {
      thrown = limit;
    }
  const quiet = console.error;
  console.error = () => {};
  try {
    const response = failure(thrown);
    return { status: response.status, json: (await response.json()) as Record<string, unknown> };
  } finally {
    console.error = quiet;
  }
}

export const TYPED =
  "On Friday at 5 p.m. I have a doctor’s appointment. Bring last month’s test results. Also buy coffee sometime.";
export const TRANSCRIPT =
  "On Friday at 5 p.m. I have a doctor’s appointment. Remind me to bring my test results. Call the plumber sometime, and buy coffee.";
const task = (draft: Partial<Draft> & { title: string }): Draft => ({
  date: null,
  time: null,
  priority: "low",
  notes: "",
  question: null,
  ...draft,
});
export const TASKS: Draft[] = [
  task({
    title: "Doctor appointment",
    date: "2026-10-23",
    time: "17:00",
    priority: "high",
    notes: "Bring my test results.",
  }),
  task({
    title: "Call the plumber",
    priority: "medium",
    question: "Did you mean this week or next week?",
  }),
  task({ title: "Buy coffee" }),
];
// Long result details expose feedback placed only at the end of a mobile list.
// Titles are neutral fixture data, so localized UI audits do not mistake them for copy.
export const COMPLETION_TASKS: Draft[] = TASKS.map((draft, index) => ({
  ...draft,
  title: `#${index + 1}`,
  notes: Array(14).fill(`2026-10-${23 + index} · 17:00 · 1234567890.`).join("\n"),
  question: index === 1 ? "2026-10-23?" : null,
}));
const SIX: Draft[] = [
  ...TASKS,
  task({ title: "Pick up the dry cleaning", date: "2026-10-21", notes: "The blue coat." }),
  task({ title: "Water the plants", date: "2026-10-20", time: "08:30" }),
  task({
    title: "Book a table for Saturday",
    date: "2026-10-24",
    priority: "medium",
    notes: "For four, around eight.",
  }),
];

type Answer =
  | { kind: "json"; status: number; json: unknown }
  | { kind: "hang" }
  | { kind: "offline" }
  | { kind: "html"; status: number };

export class VoiceStub {
  remaining = 3;
  resetAt: number | null = null;
  // What the next status and draft requests get.
  status: "ok" | "hang" | "offline" | "html" | ServerError = "ok";
  draft:
    | { tasks: Draft[]; remainingAfter?: number }
    | "hang"
    | "offline"
    | "html"
    | ServerError = { tasks: TASKS };
  // "hold": every security check waits until releaseToken(); "hold-next": the first passes,
  // as "pass" does, and every later one waits (the one after a failed request).
  turnstile: "pass" | "interactive" | "error" | "unreachable" | "hold" | "hold-next" = "pass";
  // After a draft error, what status says (a used allowance, after visitor_limit).
  remainingAfterError: number | null = null;
  requests = { status: 0, draft: 0 };
  unexpected: string[] = [];

  async install(page: Page, baseURL: string) {
    const origin = new URL(baseURL).origin;
    // Registered first, so it runs last: anything not stubbed below never leaves the page.
    await page.route(
      (url) => url.origin !== origin && url.hostname !== "challenges.cloudflare.com",
      (route) => route.abort("blockedbyclient"),
    );
    await page.route("**/api/voice/**", (route) => {
      this.unexpected.push(route.request().url());
      return route.fulfill({ status: 404, json: { error: "Not stubbed by the UX renders." } });
    });
    await page.route("https://challenges.cloudflare.com/**", (route) =>
      this.turnstile === "unreachable"
        ? route.abort("internetdisconnected")
        : route.fulfill({ contentType: "text/javascript", body: standIn(this.turnstile) }),
    );
    await page.route("**/api/voice/status/", (route) => this.answer(route, "status"));
    await page.route("**/api/voice/draft/", (route) => this.answer(route, "draft"));
  }

  private statusBody() {
    // src/app/api/voice/status/route.ts: usage() plus the session and the site key.
    return {
      remaining: this.remaining,
      resetAt: this.resetAt,
      testingUntil: null,
      developerCode: "00000000-0000-4000-8000-000000000000",
      siteKey: "ux-renders-site-key",
      maxSeconds: 60,
    };
  }

  // The server records the try when it admits a request, before the AI call: a request
  // still waiting, or one the AI couldn't turn into drafts, has used it.
  private useTry() {
    this.remaining = Math.max(0, this.remaining - 1);
    this.resetAt ??= Date.now() + 86_400_000;
  }

  private async answer(route: Route, kind: "status" | "draft") {
    this.requests[kind]++;
    let answer: Answer;
    const setting = kind === "status" ? this.status : this.draft;
    if (kind === "draft" && (setting === "hang" || (typeof setting === "object" && "code" in setting && setting.code === "invalid_draft")))
      this.useTry();
    if (setting === "hang") answer = { kind: "hang" };
    else if (setting === "offline") answer = { kind: "offline" };
    else if (setting === "html") answer = { kind: "html", status: 502 };
    else if (setting === "ok") answer = { kind: "json", status: 200, json: this.statusBody() };
    else if ("tasks" in setting) {
      if (setting.remainingAfter !== undefined) this.remaining = setting.remainingAfter;
      else this.remaining = Math.max(0, this.remaining - 1);
      if (this.remaining < 3 && !this.resetAt) this.resetAt = Date.now() + 86_400_000;
      // src/app/api/voice/draft/route.ts: the draft result plus usage().
      answer = {
        kind: "json",
        status: 200,
        json: {
          transcript: TRANSCRIPT,
          tasks: setting.tasks,
          remaining: this.remaining,
          resetAt: this.resetAt,
          testingUntil: null,
        },
      };
    } else {
      const { status, json } = await errorAnswer(setting);
      answer = { kind: "json", status, json };
      if (kind === "draft" && this.remainingAfterError !== null) {
        this.remaining = this.remainingAfterError;
        this.resetAt ??= Date.now() + 5 * 3_600_000;
      }
    }
    if (answer.kind === "hang") return; // Never answered: the page waits or times out.
    if (answer.kind === "offline") return route.abort("internetdisconnected");
    if (answer.kind === "html")
      return route.fulfill({
        status: answer.status,
        contentType: "text/html",
        body: "<!DOCTYPE html><html><head><title>502 Bad Gateway</title></head><body><h1>502 Bad Gateway</h1></body></html>",
      });
    return route.fulfill({
      status: answer.status,
      json: answer.json,
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  }
}

// A stand-in for Cloudflare Turnstile, the size of the real widget (300 × 65), marked so
// the audit skips it. In the "hold" modes a waiting check keeps its callback until the
// test calls releaseToken(page) (window.__uxReleaseToken). As the real one with
// appearance "interaction-only", it stays hidden unless it needs a tap or fails, and it
// calls before-interactive-callback when it needs a tap.
function standIn(mode: "pass" | "interactive" | "error" | "hold" | "hold-next") {
  return `(() => {
  const mode = ${JSON.stringify(mode)};
  const widgets = new Map();
  const held = new Map();
  let renders = 0;
  const passed = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1a7f37"/><path d="m7 12.5 3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Success!</span>';
  const brand = '<span style="margin-left:auto;text-align:right;font-size:9px;line-height:1.3;letter-spacing:.04em;opacity:.75">CLOUDFLARE<br>stand-in</span>';
  // Passes every waiting check still on the page; returns how many.
  window.__uxReleaseToken = () => {
    const waiting = [...held.entries()];
    held.clear();
    for (const [id, callback] of waiting) {
      const box = widgets.get(id);
      if (box) box.innerHTML = passed + brand;
      callback && callback("ux-renders-token");
    }
    return waiting.length;
  };
  window.turnstile = {
    render(element, options) {
      renders += 1;
      // What the page asked Cloudflare for, and how wide its holder was then (WEB-9).
      (window.__uxTurnstileOptions = window.__uxTurnstileOptions || []).push({
        appearance: options.appearance,
        retry: options.retry,
        size: options.size,
        width: element.clientWidth,
      });
      const dark = matchMedia("(prefers-color-scheme: dark)").matches;
      const box = document.createElement("div");
      box.setAttribute("data-ux-ignore", "Cloudflare Turnstile stand-in");
      box.style.cssText = "width:300px;height:65px;box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:0 12px;border:1px solid " + (dark ? "#5b5b5b" : "#e0e0e0") + ";background:" + (dark ? "#232323" : "#fafafa") + ";color:" + (dark ? "#fff" : "#232323") + ";font:14px/1.2 system-ui,sans-serif;";
      box.style.fontFamily = "Arial, Helvetica, sans-serif";
      const id = "ux-" + Math.random().toString(36).slice(2);
      const hold = mode === "hold" || (mode === "hold-next" && renders > 1);
      if (hold) {
        box.innerHTML = '<span>Verifying&hellip;</span>' + brand;
        held.set(id, options.callback);
      } else if (mode === "pass" || mode === "hold-next") {
        box.innerHTML = passed + brand;
        queueMicrotask(() => options.callback && options.callback("ux-renders-token"));
      } else if (mode === "interactive") {
        box.innerHTML = '<span style="width:24px;height:24px;box-sizing:border-box;border:2px solid #767676;border-radius:4px;background:' + (dark ? "#333" : "#fff") + '"></span><span>Verify you are human</span>' + brand;
        queueMicrotask(() => options["before-interactive-callback"] && options["before-interactive-callback"]());
      } else {
        box.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#d1242f"/><path d="M12 6.5v7M12 17v.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg><span>Error</span>' + brand;
        queueMicrotask(() => options["error-callback"] && options["error-callback"]());
      }
      if (options.appearance === "interaction-only" && mode !== "interactive" && mode !== "error")
        box.style.display = "none";
      element.append(box);
      widgets.set(id, box);
      return id;
    },
    reset() {},
    remove(id) {
      widgets.get(id)?.remove();
      widgets.delete(id);
      held.delete(id);
    },
  };
})();`;
}

type Microphone = "pending" | "denied" | "missing" | "busy" | "unsupported";

// Replaces getUserMedia, with Chromium's own error names and wording. Denied is a blocked
// microphone: the permission reads "denied" (WP64: a dismissed prompt reads "prompt").
async function microphone(page: Page, mode: Microphone) {
  await page.addInitScript((mode: Microphone) => {
    if (mode === "unsupported") {
      Object.defineProperty(Navigator.prototype, "mediaDevices", {
        configurable: true,
        get: () => undefined,
      });
      return;
    }
    const errors: Record<string, [string, string]> = {
      denied: ["NotAllowedError", "Permission denied"],
      missing: ["NotFoundError", "Requested device not found"],
      busy: ["NotReadableError", "Could not start audio source"],
    };
    navigator.mediaDevices.getUserMedia = () =>
      mode === "pending"
        ? new Promise<MediaStream>(() => {})
        : Promise.reject(new DOMException(errors[mode][1], errors[mode][0]));
    if (mode === "denied")
      navigator.permissions.query = () =>
        Promise.resolve({ state: "denied" } as PermissionStatus);
  }, mode);
}

// Playwright's fake clock, and the page's request timeout (AbortSignal.timeout) held by the
// test: expireTimeouts() aborts it, with the TimeoutError the browser would raise, once
// fake time has passed it. The clock keeps running, because axe needs the page's timers.
type Held = { controller: AbortController; ms: number; at: number };
export async function fakeTime(page: Page) {
  await page.clock.install();
  await page.addInitScript(() => {
    const held: { controller: AbortController; ms: number; at: number }[] = [];
    (window as unknown as { __uxTimeouts: typeof held }).__uxTimeouts = held;
    AbortSignal.timeout = (ms: number) => {
      const controller = new AbortController();
      held.push({ controller, ms, at: Date.now() });
      return controller.signal;
    };
  });
}
// The request timeouts the page has set since fakeTime(): each one's length and start.
export const heldTimeouts = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { __uxTimeouts: Held[] }).__uxTimeouts.map(({ ms, at }) => ({ ms, at })),
  );
export async function expireTimeouts(page: Page) {
  return page.evaluate(() => {
    const now = Date.now();
    for (const timeout of (window as unknown as { __uxTimeouts: Held[] }).__uxTimeouts)
      if (!timeout.controller.signal.aborted && timeout.at + timeout.ms <= now)
        timeout.controller.abort(new DOMException("signal timed out", "TimeoutError"));
  });
}

export const VOICE_PANEL = "#voice .voice-panel";

// The options each Turnstile render received since the page loaded, with the holder's width
// at that moment, as the stand-in recorded them.
export type TurnstileRender = { appearance?: string; retry?: string; size?: string; width: number };
export const turnstileRenders = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __uxTurnstileOptions?: TurnstileRender[] }).__uxTurnstileOptions ?? [],
  );

// With VoiceStub.turnstile "hold" or "hold-next": passes the security checks still waiting
// on the page, and returns how many there were.
export const releaseToken = (page: Page) =>
  page.evaluate(() => (window as unknown as { __uxReleaseToken: () => number }).__uxReleaseToken());

const stage = (page: Page, name: string) =>
  page.locator(`${VOICE_PANEL}[data-stage="${name}"]`).waitFor();
const alert = (page: Page) => page.locator(`${VOICE_PANEL} [role="alert"]`).waitFor();

async function openDemo(page: Page, home = "/") {
  await page.goto(`${home}#voice`);
  await page.locator("#voice .voice-intro button").click();
}
async function typeThought(page: Page) {
  await stage(page, "capture");
  await page.locator("#voice .voice-mode-link").click();
  await page.locator("#voice textarea").fill(TYPED);
}
async function submit(page: Page) {
  const button = page.locator("#voice .voice-submit");
  await expect(button).toBeEnabled({ timeout: 10_000 });
  await button.click();
}
// Two taps, as the app: Tap to talk, then Done, which stops and sends.
async function record(page: Page) {
  await stage(page, "capture");
  await page.locator("#voice .voice-record-button").click();
  const done = page.locator("#voice .voice-record-button.is-recording");
  await done.waitFor();
  await page.waitForTimeout(2500);
  await done.click();
}

export type DemoKit = {
  page: Page;
  voice: VoiceStub;
  project: Project;
  capture: (state: string) => Promise<void>;
};

export type Scenario = {
  key: string;
  themes: Theme[];
  projects: Project[];
  states: { key: string; what: string }[];
  did: string;
  answered: string;
  setup?: (page: Page, voice: VoiceStub) => Promise<void>;
  run: (kit: DemoKit) => Promise<void>;
};

const BOTH: Project[] = ["desktop", "mobile"];
const MAIN = { themes: ["light", "dark"] as Theme[], projects: BOTH };
const LIGHT = { themes: ["light"] as Theme[], projects: BOTH };
const PHONE = { themes: ["light"] as Theme[], projects: ["mobile"] as Project[] };
const quote = (error: ServerError) =>
  error.error ? `${error.status} \`${error.code}\`: “${error.error}”` : `${error.status} \`${error.code}\` (failure()'s fallback)`;

export function scenarios(
  root: string,
  language: DemoLanguage = "en",
): { list: Scenario[]; unread: string[] } {
  const { errors, unread } = serverErrors(root);
  const one = (code: string) => errors.find((error) => error.code === code)!;
  const home = language === "en" ? "/" : `/${language}/`;
  const open = (page: Page) => openDemo(page, home);
  const t = SITE[language].voice;
  // The recording timer at a given second (a regex fragment), in the page's language.
  const listening = (time: string) => escape(t.listening).replace(escape("{time}"), time);
  const list: Scenario[] = [
    {
      key: "voice-intro",
      ...MAIN,
      states: [{ key: "voice-intro", what: "The closed demo card, as a first visit finds it: the start button and the static example" }],
      did: "Arrived at `/#voice`",
      answered: "Nothing yet",
      run: async ({ page, capture }) => {
        await page.goto(`${home}#voice`);
        await page.locator(`${VOICE_PANEL}[data-stage="intro"]`).waitFor();
        await capture("voice-intro");
      },
    },
    {
      key: "voice-connecting",
      ...MAIN,
      states: [{ key: "voice-connecting", what: "Opening: the status check still running (‘One moment…’)" }],
      did: "Tapped “Try the live demo”",
      answered: "Status: no answer yet",
      setup: async (_page, voice) => {
        voice.status = "hang";
      },
      run: async ({ page, capture }) => {
        await open(page);
        await stage(page, "connecting");
        await capture("voice-connecting");
      },
    },
    ...[
      ...STATUS_CODES.map((code) => one(code)).filter(Boolean),
      "offline" as const,
      "html" as const,
    ].map((answer): Scenario => {
      const key =
        answer === "offline"
          ? "voice-connect-offline"
          : answer === "html"
            ? "voice-connect-gateway"
            : `voice-connect-${answer.code.replace(/_/g, "-")}`;
      return {
        key,
        ...(answer === "offline" || (typeof answer === "object" && answer.code === "paused")
          ? LIGHT
          : PHONE),
        states: [{ key, what: "Opening failed: the status check got an error" }],
        did: "Tapped “Try the live demo”",
        answered:
          answer === "offline"
            ? "Status: no connection (the request fails)"
            : answer === "html"
              ? "Status: 502 with an HTML error page, as a proxy sends"
              : `Status: ${quote(answer)} (${answer.source})`,
        setup: async (_page, voice) => {
          voice.status = answer;
        },
        run: async ({ page, capture }) => {
          await open(page);
          await alert(page);
          await capture(key);
        },
      };
    }),
    {
      key: "voice-capture",
      ...MAIN,
      states: [{ key: "voice-capture", what: "Ready to record: 3 tries left, the security check passed" }],
      did: "Opened the demo",
      answered: "Status: 3 of 3 tries left",
      run: async ({ page, capture }) => {
        await open(page);
        await stage(page, "capture");
        // The check has run; with interaction-only it stays hidden when it passes.
        await expect(page.locator("#voice [data-ux-ignore]")).toBeAttached();
        await capture("voice-capture");
      },
    },
    {
      key: "voice-typing",
      ...MAIN,
      states: [{ key: "voice-typing", what: "“Type instead”, with a thought typed" }],
      did: "Opened the demo, chose “Type instead” and typed a thought",
      answered: "Status: 3 of 3 tries left",
      run: async ({ page, capture }) => {
        await open(page);
        await typeThought(page);
        await capture("voice-typing");
      },
    },
    {
      key: "voice-check-pending",
      ...LIGHT,
      states: [{ key: "voice-check-pending", what: "The security check asks for a tap; Done waits" }],
      did: "Opened the demo and typed a thought",
      answered: "Status: 3 tries left; the Cloudflare stand-in waits for a tap",
      setup: async (_page, voice) => {
        voice.turnstile = "interactive";
      },
      run: async ({ page, capture }) => {
        await open(page);
        await typeThought(page);
        await capture("voice-check-pending");
      },
    },
    {
      key: "voice-check-unreachable",
      ...LIGHT,
      states: [
        { key: "voice-check-unreachable", what: "Cloudflare's script couldn't load: the message and Try again, the microphone off" },
        { key: "voice-check-gave-up", what: "It failed again after Try again: instead of the form, the static example, the reason under it, and the hand-over" },
      ],
      did: "Opened the demo; then tapped the security check's Try again",
      answered: "Status: 3 tries left; Cloudflare's script fails to load, every time",
      setup: async (_page, voice) => {
        voice.turnstile = "unreachable";
      },
      run: async ({ page, capture }) => {
        await open(page);
        await alert(page);
        await capture("voice-check-unreachable");
        await page.locator("#voice .voice-check-retry").click();
        await stage(page, "unverified");
        await alert(page);
        await capture("voice-check-gave-up");
      },
    },
    {
      key: "voice-check-error",
      ...PHONE,
      states: [{ key: "voice-check-error", what: "The security check reported an error" }],
      did: "Opened the demo",
      answered: "Status: 3 tries left; the Cloudflare stand-in calls its error callback",
      setup: async (_page, voice) => {
        voice.turnstile = "error";
      },
      run: async ({ page, capture }) => {
        await open(page);
        await alert(page);
        await capture("voice-check-error");
      },
    },
    ...(
      [
        ["pending", "voice-mic-waiting", MAIN, "Waiting for the microphone: the browser's permission prompt would be open"],
        ["denied", "voice-mic-denied", MAIN, "Microphone permission refused (NotAllowedError)"],
        ["missing", "voice-mic-missing", LIGHT, "No microphone on the device (NotFoundError)"],
        ["busy", "voice-mic-busy", PHONE, "The microphone is busy in another app (NotReadableError)"],
        ["unsupported", "voice-mic-unsupported", PHONE, "A browser that can't record (no getUserMedia)"],
      ] as const
    ).map(
      ([mode, key, where, what]): Scenario => ({
        key,
        ...where,
        states: [{ key, what }],
        did: "Opened the demo and tapped the microphone",
        answered: "Status: 3 tries left",
        setup: (page) => microphone(page, mode),
        run: async ({ page, capture }) => {
          await open(page);
          await stage(page, "capture");
          await page.locator("#voice .voice-record-button").click();
          if (mode === "pending")
            await expect(page.locator("#voice .voice-recorder .voice-hint")).toHaveText(t.micWaiting);
          else await alert(page);
          await capture(key);
        },
      }),
    ),
    {
      key: "voice-recording",
      ...MAIN,
      states: [
        { key: "voice-recording", what: "Recording, 5 s in" },
        { key: "voice-recording-50s", what: "Recording, 50 s in: 10 s before the 60 s limit" },
      ],
      did: "Opened the demo and tapped the microphone (the fake clock moves the timer)",
      answered: "Status: 3 tries left",
      setup: (page) => page.clock.install(),
      run: async ({ page, capture }) => {
        await open(page);
        await stage(page, "capture");
        await page.locator("#voice .voice-record-button").click();
        await page.locator("#voice .voice-record-button.is-recording").waitFor();
        // Each state at its second after the recording started, whatever the captures took.
        const started = await page.evaluate(() => Date.now());
        const at = async (seconds: number) => {
          const ms = started + seconds * 1000 - (await page.evaluate(() => Date.now()));
          if (ms > 0) await page.clock.fastForward(ms);
        };
        const timer = page.locator("#voice .voice-recorder .voice-hint");
        await at(5);
        await expect(timer).toHaveText(new RegExp(`^${listening("0:0[4-6]")}$`));
        await capture("voice-recording");
        await at(50.5);
        const left = (n: number) => escape(t.secondsLeft.other.replace("{n}", String(n)));
        await expect(timer).toHaveText(
          new RegExp(`^(?:${listening("0:50")} · ${left(10)}|${listening("0:51")} · ${left(9)})$`),
        );
        await capture("voice-recording-50s");
      },
    },
    {
      key: "voice-waiting",
      ...MAIN,
      states: [
        { key: "voice-waiting-01s", what: "Waiting for the tasks, 1 s in: ‘Understanding…’" },
        { key: "voice-waiting-10s", what: "Still waiting, 10 s in: the longer-wait line and Stop waiting" },
        { key: "voice-waiting-30s", what: "Still waiting, 30 s in" },
        { key: "voice-waiting-39s", what: "Still waiting, 39 s in, just before the page's timeout" },
        { key: "voice-timeout", what: "The page gives up: its own request timeout (40 s) has passed" },
      ],
      did: "Typed a thought and tapped Done; the fake clock moves time to each state's second, then the page's timeout fires with the browser's TimeoutError",
      answered: "Draft: no answer, ever; the try counts, as the server records it on admitting the request",
      setup: async (page, voice) => {
        voice.draft = "hang";
        await fakeTime(page);
      },
      run: async ({ page, capture }) => {
        await open(page);
        await typeThought(page);
        await submit(page);
        await stage(page, "processing");
        // Each state at its second after sending, whatever the captures in between took.
        const timeout = await page.evaluate(() => {
          const last = (window as unknown as { __uxTimeouts: Held[] }).__uxTimeouts.at(-1)!;
          return { ms: last.ms, at: last.at };
        });
        const at = async (seconds: number) => {
          const ms = timeout.at + seconds * 1000 - (await page.evaluate(() => Date.now()));
          if (ms > 0) await page.clock.fastForward(ms);
        };
        await at(1);
        await capture("voice-waiting-01s");
        await at(10);
        await capture("voice-waiting-10s");
        await at(30);
        await capture("voice-waiting-30s");
        await at(39);
        await capture("voice-waiting-39s");
        await at(timeout.ms / 1000 + 0.2);
        await expireTimeouts(page);
        await alert(page);
        await capture("voice-timeout");
      },
    },
    {
      key: "voice-stop-waiting",
      ...LIGHT,
      states: [{ key: "voice-stop-waiting", what: "Stop waiting tapped at 10 s: the text kept, the still-understanding message, and Try again to send it again" }],
      did: "Typed a thought and tapped Done; at 10 s, tapped Stop waiting",
      answered: "Draft: no answer, ever; the try counts, as the server records it on admitting the request",
      setup: async (page, voice) => {
        voice.draft = "hang";
        await page.clock.install();
      },
      run: async ({ page, capture }) => {
        await open(page);
        await typeThought(page);
        await submit(page);
        await stage(page, "processing");
        await page.clock.fastForward(10_500);
        await page.locator("#voice .voice-stop").click();
        await stage(page, "capture");
        await alert(page);
        await capture("voice-stop-waiting");
      },
    },
    {
      key: "voice-offline",
      ...LIGHT,
      states: [{ key: "voice-offline", what: "The connection dropped while sending" }],
      did: "Typed a thought and tapped Done",
      answered: "Draft: no connection (the request fails)",
      setup: async (_page, voice) => {
        voice.draft = "offline";
      },
      run: async ({ page, capture }) => {
        await open(page);
        await typeThought(page);
        await submit(page);
        await alert(page);
        await capture("voice-offline");
      },
    },
    {
      key: "voice-gateway",
      ...PHONE,
      states: [{ key: "voice-gateway", what: "An HTML error page instead of the API's answer" }],
      did: "Typed a thought and tapped Done",
      answered: "Draft: 502 with an HTML error page, as a proxy sends",
      setup: async (_page, voice) => {
        voice.draft = "html";
      },
      run: async ({ page, capture }) => {
        await open(page);
        await typeThought(page);
        await submit(page);
        await alert(page);
        await capture("voice-gateway");
      },
    },
    {
      key: "voice-resend",
      ...LIGHT,
      states: [
        { key: "voice-resend", what: "A recording's request failed (no connection): the alert and Try again" },
        { key: "voice-resend-waiting", what: "Try again tapped, the security check not back yet: Try again stays, unavailable; the hint says ‘One moment…’" },
      ],
      did: "Recorded about 2.5 s and tapped Done; then tapped Try again",
      answered: "Draft: no connection (the request fails); the Cloudflare stand-in holds the next check",
      setup: async (_page, voice) => {
        voice.draft = "offline";
        voice.turnstile = "hold-next";
      },
      run: async ({ page, capture }) => {
        await open(page);
        await record(page);
        await alert(page);
        const retry = page.locator("#voice .voice-retry");
        await expect(retry).toBeEnabled();
        await capture("voice-resend");
        await retry.click();
        await expect(retry).toBeDisabled();
        await capture("voice-resend-waiting");
      },
    },
    {
      key: "voice-result",
      ...MAIN,
      states: [
        { key: "voice-result", what: "Three tasks: one dated, one with a question, one undated; then the hand-over" },
        { key: "voice-result-open", what: "The same, with “See what I said” open" },
      ],
      did: "Typed a thought and tapped Done; then opened “See what I said”",
      answered: "Draft: 3 tasks; 2 of 3 tries left",
      run: async ({ page, capture }) => {
        await open(page);
        await typeThought(page);
        await submit(page);
        await stage(page, "review");
        await capture("voice-result");
        await page.locator("#voice .voice-transcript summary").click();
        await capture("voice-result-open");
      },
    },
    ...(
      [
        ["voice-result-one", [TASKS[0]], LIGHT, "One task"],
        ["voice-result-six", SIX, LIGHT, "Six tasks, the most the API returns"],
        ["voice-no-tasks", [], MAIN, "No tasks found in what was said"],
      ] as const
    ).map(
      ([key, tasks, where, what]): Scenario => ({
        key,
        ...where,
        states: [{ key, what }],
        did: "Typed a thought and tapped Done",
        answered: `Draft: ${tasks.length} task${tasks.length === 1 ? "" : "s"}`,
        setup: async (_page, voice) => {
          voice.draft = { tasks: [...tasks] };
        },
        run: async ({ page, capture }) => {
          await open(page);
          await typeThought(page);
          await submit(page);
          await stage(page, "review");
          await capture(key);
        },
      }),
    ),
    {
      key: "voice-tries-used",
      ...MAIN,
      states: [{ key: "voice-tries-used", what: "All three tries used: when they come back, and the hand-over; nothing to record or send" }],
      did: "Opened the demo",
      answered: "Status: 0 of 3 tries left, back in 5 hours",
      setup: async (_page, voice) => {
        voice.remaining = 0;
        voice.resetAt = Date.now() + 5 * 3_600_000;
      },
      run: async ({ page, capture }) => {
        await open(page);
        await stage(page, "tries-used");
        await capture("voice-tries-used");
      },
    },
    {
      key: "voice-last-try",
      ...LIGHT,
      states: [{ key: "voice-last-try", what: "Tasks from the last try: when the tries come back, in place of the action" }],
      did: "Opened the demo with 1 try left, typed a thought and tapped Done",
      answered: "Status: 1 of 3 tries left; draft: 3 tasks and 0 tries left",
      setup: async (_page, voice) => {
        voice.remaining = 1;
        voice.resetAt = Date.now() + 20 * 3_600_000;
        voice.draft = { tasks: TASKS, remainingAfter: 0 };
      },
      run: async ({ page, capture }) => {
        await open(page);
        await typeThought(page);
        await submit(page);
        await stage(page, "review");
        await capture("voice-last-try");
      },
    },
    ...errors.map((error): Scenario => {
      const sameCode = errors.filter((other) => other.code === error.code);
      const key = `voice-error-${error.code.replace(/_/g, "-")}${sameCode.length > 1 ? `-${sameCode.indexOf(error) + 1}` : ""}`;
      const audio = AUDIO_CODES.includes(error.code);
      const main = MAIN_CODES.includes(error.code) && sameCode.indexOf(error) === 0;
      return {
        key,
        themes: error.code === "budget_pause" ? ["light", "dark"] : ["light"],
        projects: main ? BOTH : ["mobile"],
        states: [{ key, what: `The API refused: \`${error.code}\`` }],
        did: audio
          ? "Recorded about 2.5 s and tapped Done"
          : "Typed a thought and tapped Done",
        answered: `Draft: ${quote(error)} (${error.source})${error.code === "visitor_limit" ? "; status then says 0 tries left" : error.code === "invalid_draft" ? "; the try counts, as the server records it before the AI call" : ""}`,
        setup: async (_page, voice) => {
          voice.draft = error;
          if (error.code === "visitor_limit") {
            voice.remaining = 1;
            voice.remainingAfterError = 0;
          }
        },
        run: async ({ page, capture }) => {
          await open(page);
          if (audio) await record(page);
          else {
            await typeThought(page);
            await submit(page);
          }
          // The last try refused: the panel shows the tries-used state instead of the error.
          if (error.code === "visitor_limit") await stage(page, "tries-used");
          else await alert(page);
          await capture(key);
        },
      };
    }),
  ];
  return { list, unread };
}
