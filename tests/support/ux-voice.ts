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

export type Project = "desktop" | "mobile";
export type Theme = "light" | "dark";

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
  turnstile: "pass" | "interactive" | "error" | "unreachable" = "pass";
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
// the audit skips it.
function standIn(mode: "pass" | "interactive" | "error") {
  return `(() => {
  const mode = ${JSON.stringify(mode)};
  const widgets = new Map();
  window.turnstile = {
    render(element, options) {
      const dark = matchMedia("(prefers-color-scheme: dark)").matches;
      const box = document.createElement("div");
      box.setAttribute("data-ux-ignore", "Cloudflare Turnstile stand-in");
      box.style.cssText = "width:300px;height:65px;box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:0 12px;border:1px solid " + (dark ? "#5b5b5b" : "#e0e0e0") + ";background:" + (dark ? "#232323" : "#fafafa") + ";color:" + (dark ? "#fff" : "#232323") + ";font:14px/1.2 system-ui,sans-serif;";
      const brand = '<span style="margin-left:auto;text-align:right;font-size:9px;line-height:1.3;letter-spacing:.04em;opacity:.75">CLOUDFLARE<br>stand-in</span>';
      box.style.fontFamily = "Arial, Helvetica, sans-serif";
      if (mode === "pass") {
        box.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1a7f37"/><path d="m7 12.5 3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Success!</span>' + brand;
        queueMicrotask(() => options.callback && options.callback("ux-renders-token"));
      } else if (mode === "interactive") {
        box.innerHTML = '<span style="width:24px;height:24px;box-sizing:border-box;border:2px solid #767676;border-radius:4px;background:' + (dark ? "#333" : "#fff") + '"></span><span>Verify you are human</span>' + brand;
      } else {
        box.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#d1242f"/><path d="M12 6.5v7M12 17v.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg><span>Error</span>' + brand;
        queueMicrotask(() => options["error-callback"] && options["error-callback"]());
      }
      element.append(box);
      const id = "ux-" + Math.random().toString(36).slice(2);
      widgets.set(id, box);
      return id;
    },
    reset() {},
    remove(id) {
      widgets.get(id)?.remove();
      widgets.delete(id);
    },
  };
})();`;
}

type Microphone = "pending" | "denied" | "missing" | "busy" | "unsupported";

// Replaces getUserMedia, with Chromium's own error names and wording.
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
  }, mode);
}

// Playwright's fake clock, and the page's request timeout (AbortSignal.timeout) held by the
// test: expireTimeouts() aborts it, with the TimeoutError the browser would raise, once
// fake time has passed it. The clock keeps running, because axe needs the page's timers.
type Held = { controller: AbortController; ms: number; at: number };
async function fakeTime(page: Page) {
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
async function expireTimeouts(page: Page) {
  return page.evaluate(() => {
    const now = Date.now();
    for (const timeout of (window as unknown as { __uxTimeouts: Held[] }).__uxTimeouts)
      if (!timeout.controller.signal.aborted && timeout.at + timeout.ms <= now)
        timeout.controller.abort(new DOMException("signal timed out", "TimeoutError"));
  });
}

export const VOICE_PANEL = "#voice .voice-panel";
export const SAMPLE_PANEL = "#demo .task-demo";

const stage = (page: Page, name: string) =>
  page.locator(`${VOICE_PANEL}[data-stage="${name}"]`).waitFor();
const alert = (page: Page) => page.locator(`${VOICE_PANEL} [role="alert"]`).waitFor();

async function openDemo(page: Page) {
  await page.goto("/#voice");
  await page.locator("#voice .voice-intro button").click();
}
async function typeThought(page: Page) {
  await stage(page, "capture");
  await page.locator("#voice .voice-modes button").nth(1).click();
  await page.locator("#voice textarea").fill(TYPED);
}
async function submit(page: Page) {
  const button = page.locator("#voice .voice-submit");
  await expect(button).toBeEnabled({ timeout: 10_000 });
  await button.click();
}
async function record(page: Page) {
  await stage(page, "capture");
  await page.locator("#voice .voice-record-button").click();
  const stop = page.locator("#voice .voice-record-button.is-recording");
  await stop.waitFor();
  await page.waitForTimeout(2500);
  await stop.click();
  await stage(page, "recorded");
}

export type DemoKit = {
  page: Page;
  voice: VoiceStub;
  project: Project;
  capture: (state: string) => Promise<void>;
};

export type Scenario = {
  key: string;
  region: "voice" | "sample";
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

export function scenarios(root: string): { list: Scenario[]; unread: string[] } {
  const { errors, unread } = serverErrors(root);
  const one = (code: string) => errors.find((error) => error.code === code)!;
  const list: Scenario[] = [
    {
      key: "voice-intro",
      region: "voice",
      ...MAIN,
      states: [{ key: "voice-intro", what: "The closed demo card, as a first visit finds it" }],
      did: "Arrived at `/#voice`",
      answered: "Nothing yet",
      run: async ({ page, capture }) => {
        await page.goto("/#voice");
        await page.locator(`${VOICE_PANEL}[data-stage="intro"]`).waitFor();
        await capture("voice-intro");
      },
    },
    {
      key: "voice-connecting",
      region: "voice",
      ...MAIN,
      states: [{ key: "voice-connecting", what: "Opening: the allowance check still running" }],
      did: "Tapped “Try the live demo”",
      answered: "Status: no answer yet",
      setup: async (_page, voice) => {
        voice.status = "hang";
      },
      run: async ({ page, capture }) => {
        await openDemo(page);
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
        region: "voice",
        ...(answer === "offline" || (typeof answer === "object" && answer.code === "paused")
          ? LIGHT
          : PHONE),
        states: [{ key, what: "Opening failed: the allowance check got an error" }],
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
          await openDemo(page);
          await alert(page);
          await capture(key);
        },
      };
    }),
    {
      key: "voice-capture",
      region: "voice",
      ...MAIN,
      states: [{ key: "voice-capture", what: "Ready to record: 3 tries left, the security check passed" }],
      did: "Opened the demo",
      answered: "Status: 3 of 3 tries left",
      run: async ({ page, capture }) => {
        await openDemo(page);
        await stage(page, "capture");
        await expect(page.locator("#voice [data-ux-ignore]")).toBeVisible();
        await capture("voice-capture");
      },
    },
    {
      key: "voice-typing",
      region: "voice",
      ...MAIN,
      states: [{ key: "voice-typing", what: "“Type it instead”, with a thought typed" }],
      did: "Opened the demo, chose “Type it instead” and typed a thought",
      answered: "Status: 3 of 3 tries left",
      run: async ({ page, capture }) => {
        await openDemo(page);
        await typeThought(page);
        await capture("voice-typing");
      },
    },
    {
      key: "voice-check-pending",
      region: "voice",
      ...LIGHT,
      states: [{ key: "voice-check-pending", what: "The security check asks for a tap; “Create drafts” waits" }],
      did: "Opened the demo and typed a thought",
      answered: "Status: 3 tries left; the Cloudflare stand-in waits for a tap",
      setup: async (_page, voice) => {
        voice.turnstile = "interactive";
      },
      run: async ({ page, capture }) => {
        await openDemo(page);
        await typeThought(page);
        await capture("voice-check-pending");
      },
    },
    {
      key: "voice-check-unreachable",
      region: "voice",
      ...LIGHT,
      states: [{ key: "voice-check-unreachable", what: "Cloudflare's script couldn't load" }],
      did: "Opened the demo",
      answered: "Status: 3 tries left; Cloudflare's script fails to load",
      setup: async (_page, voice) => {
        voice.turnstile = "unreachable";
      },
      run: async ({ page, capture }) => {
        await openDemo(page);
        await alert(page);
        await capture("voice-check-unreachable");
      },
    },
    {
      key: "voice-check-error",
      region: "voice",
      ...PHONE,
      states: [{ key: "voice-check-error", what: "The security check reported an error" }],
      did: "Opened the demo",
      answered: "Status: 3 tries left; the Cloudflare stand-in calls its error callback",
      setup: async (_page, voice) => {
        voice.turnstile = "error";
      },
      run: async ({ page, capture }) => {
        await openDemo(page);
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
        region: "voice",
        ...where,
        states: [{ key, what }],
        did: "Opened the demo and tapped the microphone",
        answered: "Status: 3 tries left",
        setup: (page) => microphone(page, mode),
        run: async ({ page, capture }) => {
          await openDemo(page);
          await stage(page, "capture");
          await page.locator("#voice .voice-record-button").click();
          if (mode === "pending")
            await expect(page.locator("#voice .voice-recorder [aria-live]")).not.toHaveText(/Tap to record/);
          else await alert(page);
          await capture(key);
        },
      }),
    ),
    {
      key: "voice-recording",
      region: "voice",
      ...MAIN,
      states: [
        { key: "voice-recording", what: "Recording, 5 s in" },
        { key: "voice-recording-50s", what: "Recording, 50 s in: 10 s before the 60 s limit" },
      ],
      did: "Opened the demo and tapped the microphone (the fake clock moves the timer)",
      answered: "Status: 3 tries left",
      setup: (page) => page.clock.install(),
      run: async ({ page, capture }) => {
        await openDemo(page);
        await stage(page, "capture");
        await page.locator("#voice .voice-record-button").click();
        await page.locator("#voice .voice-record-button.is-recording").waitFor();
        // Each state at its second after the recording started, whatever the captures took.
        const started = await page.evaluate(() => Date.now());
        const at = async (seconds: number) => {
          const ms = started + seconds * 1000 - (await page.evaluate(() => Date.now()));
          if (ms > 0) await page.clock.fastForward(ms);
        };
        const timer = page.locator("#voice .voice-recorder [aria-live]");
        await at(5);
        await expect(timer).toHaveText(/· [4-6]s \//);
        await capture("voice-recording");
        await at(50);
        await expect(timer).toHaveText(/· (49|50|51)s \//);
        await capture("voice-recording-50s");
      },
    },
    {
      key: "voice-recorded",
      region: "voice",
      ...MAIN,
      states: [{ key: "voice-recorded", what: "Recorded: listen back, record again or create drafts" }],
      did: "Recorded about 2.5 s with the fake microphone and stopped",
      answered: "Status: 3 tries left",
      run: async ({ page, capture }) => {
        await openDemo(page);
        await record(page);
        await capture("voice-recorded");
      },
    },
    {
      key: "voice-waiting",
      region: "voice",
      ...MAIN,
      states: [
        { key: "voice-waiting-01s", what: "Waiting for the drafts, 1 s in" },
        { key: "voice-waiting-10s", what: "Still waiting, 10 s in" },
        { key: "voice-waiting-30s", what: "Still waiting, 30 s in" },
        { key: "voice-waiting-54s", what: "Still waiting, 54 s in" },
        { key: "voice-timeout", what: "The page gives up: its own request timeout (55 s) has passed" },
      ],
      did: "Typed a thought and tapped “Create drafts”; the fake clock moves time to each state's second, then the page's timeout fires with the browser's TimeoutError",
      answered: "Draft: no answer, ever; the try counts, as the server records it on admitting the request",
      setup: async (page, voice) => {
        voice.draft = "hang";
        await fakeTime(page);
      },
      run: async ({ page, capture }) => {
        await openDemo(page);
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
        await at(54);
        await capture("voice-waiting-54s");
        await at(timeout.ms / 1000 + 0.2);
        await expireTimeouts(page);
        await alert(page);
        await capture("voice-timeout");
      },
    },
    {
      key: "voice-offline",
      region: "voice",
      ...LIGHT,
      states: [{ key: "voice-offline", what: "The connection dropped while sending" }],
      did: "Typed a thought and tapped “Create drafts”",
      answered: "Draft: no connection (the request fails)",
      setup: async (_page, voice) => {
        voice.draft = "offline";
      },
      run: async ({ page, capture }) => {
        await openDemo(page);
        await typeThought(page);
        await submit(page);
        await alert(page);
        await capture("voice-offline");
      },
    },
    {
      key: "voice-gateway",
      region: "voice",
      ...PHONE,
      states: [{ key: "voice-gateway", what: "An HTML error page instead of the API's answer" }],
      did: "Typed a thought and tapped “Create drafts”",
      answered: "Draft: 502 with an HTML error page, as a proxy sends",
      setup: async (_page, voice) => {
        voice.draft = "html";
      },
      run: async ({ page, capture }) => {
        await openDemo(page);
        await typeThought(page);
        await submit(page);
        await alert(page);
        await capture("voice-gateway");
      },
    },
    {
      key: "voice-result",
      region: "voice",
      ...MAIN,
      states: [
        { key: "voice-result", what: "Three drafts to review: one dated, one with a question, one undated" },
        { key: "voice-result-open", what: "The same, with “Edit task 1” and “Your transcript” open" },
        { key: "voice-preview", what: "After “Add to preview list”, with the first task checked off" },
      ],
      did: "Typed a thought and tapped “Create drafts”; then opened task 1 and the transcript; then added them to the preview list and checked one off",
      answered: "Draft: 3 tasks; 2 of 3 tries left",
      run: async ({ page, capture }) => {
        await openDemo(page);
        await typeThought(page);
        await submit(page);
        await stage(page, "review");
        await capture("voice-result");
        await page.locator("#voice .voice-task-edit summary").first().click();
        await page.locator("#voice .voice-transcript summary").click();
        await capture("voice-result-open");
        await page.locator("#voice .voice-task-edit summary").first().click();
        await page.locator("#voice .voice-results .voice-submit").click();
        await stage(page, "preview");
        await page.locator("#voice .voice-saved-task").first().click();
        await capture("voice-preview");
      },
    },
    ...(
      [
        ["voice-result-one", [TASKS[0]], LIGHT, "One draft"],
        ["voice-result-six", SIX, LIGHT, "Six drafts, the most the API returns"],
        ["voice-no-tasks", [], MAIN, "No tasks found in what was said"],
      ] as const
    ).map(
      ([key, tasks, where, what]): Scenario => ({
        key,
        region: "voice",
        ...where,
        states: [{ key, what }],
        did: "Typed a thought and tapped “Create drafts”",
        answered: `Draft: ${tasks.length} task${tasks.length === 1 ? "" : "s"}`,
        setup: async (_page, voice) => {
          voice.draft = { tasks: [...tasks] };
        },
        run: async ({ page, capture }) => {
          await openDemo(page);
          await typeThought(page);
          await submit(page);
          await stage(page, "review");
          await capture(key);
        },
      }),
    ),
    {
      key: "voice-tries-used",
      region: "voice",
      ...MAIN,
      states: [{ key: "voice-tries-used", what: "All three tries used: recording and sending are off" }],
      did: "Opened the demo",
      answered: "Status: 0 of 3 tries left, back in 5 hours",
      setup: async (_page, voice) => {
        voice.remaining = 0;
        voice.resetAt = Date.now() + 5 * 3_600_000;
      },
      run: async ({ page, capture }) => {
        await openDemo(page);
        await stage(page, "capture");
        await capture("voice-tries-used");
      },
    },
    {
      key: "voice-last-try",
      region: "voice",
      ...LIGHT,
      states: [{ key: "voice-last-try", what: "Drafts from the last try: “Try a new thought” is off" }],
      did: "Opened the demo with 1 try left, typed a thought and tapped “Create drafts”",
      answered: "Status: 1 of 3 tries left; draft: 3 tasks and 0 tries left",
      setup: async (_page, voice) => {
        voice.remaining = 1;
        voice.resetAt = Date.now() + 20 * 3_600_000;
        voice.draft = { tasks: TASKS, remainingAfter: 0 };
      },
      run: async ({ page, capture }) => {
        await openDemo(page);
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
        region: "voice",
        themes: error.code === "budget_pause" ? ["light", "dark"] : ["light"],
        projects: main ? BOTH : ["mobile"],
        states: [{ key, what: `The API refused: \`${error.code}\`` }],
        did: audio
          ? "Recorded about 2.5 s and tapped “Create drafts”"
          : "Typed a thought and tapped “Create drafts”",
        answered: `Draft: ${quote(error)} (${error.source})${error.code === "visitor_limit" ? "; status then says 0 tries left" : error.code === "invalid_draft" ? "; the try counts, as the server records it before the AI call" : ""}`,
        setup: async (_page, voice) => {
          voice.draft = error;
          if (error.code === "visitor_limit") {
            voice.remaining = 1;
            voice.remainingAfterError = 0;
          }
        },
        run: async ({ page, capture }) => {
          await openDemo(page);
          if (audio) await record(page);
          else await typeThought(page);
          await submit(page);
          await alert(page);
          await capture(key);
        },
      };
    }),
    {
      key: "sample",
      region: "sample",
      ...MAIN,
      states: [
        { key: "sample-start", what: "The sample walkthrough as it loads: the first example" },
        { key: "sample-no-title", what: "“Add to my preview” with a title of only spaces (an empty title gets the browser's own bubble instead, outside the page)" },
        { key: "sample-added", what: "Added to the preview" },
        { key: "sample-done", what: "The preview task checked off" },
      ],
      did: "Arrived at `/#demo`; replaced the title with spaces and tapped “Add to my preview”; typed a title and added it; checked it off",
      answered: "Nothing: the walkthrough never calls the API",
      run: async ({ page, capture }) => {
        await page.goto("/#demo");
        await expect(page.locator("#demo-title-input")).toBeEnabled();
        await capture("sample-start");
        await page.locator("#demo-title-input").fill("   ");
        await page.locator("#demo .demo-save").click();
        await page.locator("#demo .demo-error").waitFor();
        await capture("sample-no-title");
        await page.locator("#demo-title-input").fill("Doctor appointment");
        await page.locator("#demo .demo-save").click();
        await page.locator("#demo .demo-success").waitFor();
        await capture("sample-added");
        await page.locator("#demo .complete-task").click();
        await expect(page.locator("#demo .saved-task.is-complete")).toBeVisible();
        await capture("sample-done");
      },
    },
  ];
  return { list, unread };
}
