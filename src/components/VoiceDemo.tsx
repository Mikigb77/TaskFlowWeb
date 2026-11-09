"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";
import VoiceExample from "./VoiceExample";
import { useSiteLanguage } from "./useSiteLanguage";
import { copy, homePath, type SiteLanguage } from "../content/site";
import type { Draft } from "../lib/voice/policy";
import { audioBase64, startRecorder } from "../lib/voice/recorder";

type Status = {
  remaining: number;
  resetAt: number | null;
  siteKey: string;
  testingUntil?: number | null;
  developerCode?: string;
};

// Dates and times in the page's language, never the browser's. The tries-used line
// names the weekday in full; the tasks' date lines use their own short one.
function dateFormats(language: SiteLanguage) {
  return {
    weekday: new Intl.DateTimeFormat(language, { weekday: "long" }),
    day: new Intl.DateTimeFormat(language, {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
    time: new Intl.DateTimeFormat(language, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

// A task's date line, as the app shows it: Today or Tomorrow by the visitor's own
// clock, otherwise weekday, day and month; then the time.
function dateLine(
  task: Draft,
  formats: ReturnType<typeof dateFormats>,
  t: Pick<Voice, "noDate" | "today" | "tomorrow">,
) {
  if (!task.date) return t.noDate;
  const [year, month, day] = task.date.split("-").map(Number);
  const [hour, minute] = (task.time ?? "12:00").split(":").map(Number);
  const at = new Date(year, month - 1, day, hour, minute);
  const now = new Date();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  const label =
    at.toDateString() === now.toDateString()
      ? t.today
      : at.toDateString() === tomorrow.toDateString()
        ? t.tomorrow
        : formats.day.format(at);
  return task.time ? `${label} · ${formats.time.format(at)}` : label;
}

type Voice = (typeof copy)[SiteLanguage]["voice"];
// What went wrong, in the visitor's words. `retry`: the same request can be sent again
// with Try again, without using another try. `fresh`, with `retry`: Try again keeps the
// text or the recording but sends it as a new request, with a new ID (the server answers
// a failed request's ID only with `previous_failure`). `off`: the static example
// replaces the form.
type Failure = {
  message: string;
  retry?: boolean;
  fresh?: boolean;
  off?: boolean;
  check?: boolean;
  triesUsed?: boolean;
};

// The API's refusals, by code (src/app/api/voice/draft/route.ts); the server's own
// message is never shown. Anything else means the demo isn't answering.
function failureFor(t: Voice, code: unknown): Failure {
  switch (code) {
    case "network_limit":
      return { message: t.errors.networkLimit };
    case "budget_pause":
    case "paused":
    case "not_ready":
    case "budget_config":
      return { message: t.errors.off, off: true };
    // One call that failed, not the demo off: Try again sends the words again, as a new request.
    case "unavailable":
      return { message: t.errors.notAnswering, retry: true, fresh: true };
    case "invalid_draft":
      return { message: t.errors.invalidDraft };
    case "invalid_audio":
    case "audio_length":
    case "too_large":
    case "payload":
      return { message: t.errors.recording };
    case "processing":
      return { message: t.errors.processing, retry: true };
    case "expired":
    case "previous_failure":
    case "request_id":
    case "session_required":
      return { message: t.errors.sayAgain };
    case "empty":
      return { message: t.errors.empty };
    case "visitor_limit":
      return { message: "", triesUsed: true };
    case "verification":
      return { message: "", check: true, retry: true };
    default:
      return { message: t.errors.notAnswering, retry: true };
  }
}

// A request's ID, in the form the server accepts (a lower-case version-4 UUID):
// crypto.randomUUID where the browser has it, random bytes otherwise (Safari before 15.4).
function newRequestId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4),
    hex.slice(4, 6),
    hex.slice(6, 8),
    hex.slice(8, 10),
    hex.slice(10),
  ]
    .map((part) => part.join(""))
    .join("-");
}

// The page's own limit on a request, 40 s (the model's is 35 s): AbortSignal.timeout
// where the browser has it, a timer otherwise (Safari before 16). Returns what clears it.
const pageLimit = 40_000;
function limitWait(expire: () => void) {
  if (typeof AbortSignal.timeout === "function") {
    const signal = AbortSignal.timeout(pageLimit);
    signal.addEventListener("abort", expire);
    return () => signal.removeEventListener("abort", expire);
  }
  const later = setTimeout(expire, pageLimit);
  return () => clearTimeout(later);
}

// After a NotAllowedError: true when the browser will ask again on the next tap (its
// prompt was dismissed); false when the microphone is blocked, or the browser can't tell.
async function microphoneAsksAgain() {
  try {
    const permission = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return permission.state === "prompt";
  } catch {
    return false;
  }
}

// The API's JSON body, or null when the answer isn't the demo's (an HTML error page, say).
async function readJson(response: Response) {
  if (!response.headers.get("content-type")?.includes("application/json"))
    return null;
  try {
    const data: unknown = await response.json();
    return data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

// The status request got an answer that isn't a status; `code` is the API's, if any.
class Refused extends Error {
  constructor(public code: unknown) {
    super("refused");
  }
}

type Turnstile = {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

// Cloudflare Turnstile. It shows only when Cloudflare needs a tap (interaction-only),
// in its compact size on cards narrower than its normal 300 px. It doesn't retry on its
// own: a failure is reported, and Try again mounts it again (a new `generation`).
function Verification({
  siteKey,
  onToken,
  onError,
  onTap,
  generation,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  onError: () => void;
  onTap: (waiting: boolean) => void;
  generation: number;
}) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false,
      widget: string | undefined;
    const mount = () => {
      if (!disposed && element.current && window.turnstile)
        widget = window.turnstile.render(element.current, {
          sitekey: siteKey,
          action: "voice_demo",
          theme: "auto",
          appearance: "interaction-only",
          size: element.current.clientWidth < 300 ? "compact" : "normal",
          retry: "never",
          callback: onToken,
          "expired-callback": () => onToken(""),
          "error-callback": () => {
            onToken("");
            onError();
          },
          "before-interactive-callback": () => onTap(true),
          "after-interactive-callback": () => onTap(false),
        });
    };
    let script = document.getElementById(
      "turnstile-script",
    ) as HTMLScriptElement | null;
    if (window.turnstile) mount();
    else {
      if (!script) {
        script = document.createElement("script");
        script.id = "turnstile-script";
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        // A script that failed to load won't fire again: remove it, so Try again loads a new one.
        const added = script;
        added.addEventListener("error", () => added.remove(), { once: true });
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount);
      script.addEventListener("error", failed);
    }
    function failed() {
      onError();
    }
    return () => {
      disposed = true;
      script?.removeEventListener("load", mount);
      script?.removeEventListener("error", failed);
      if (widget) window.turnstile?.remove(widget);
    };
  }, [siteKey, onToken, onError, onTap, generation]);
  return <div ref={element} className="voice-verification" />;
}

export default function VoiceDemo() {
  const language = useSiteLanguage();
  const t = copy[language].voice;
  // The start button stays disabled until the script has loaded.
  const [ready, setReady] = useState(false);
  const [developerTools, setDeveloperTools] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [retryPending, setRetryPending] = useState(false);
  const [opened, setOpened] = useState(false),
    [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"voice" | "text">("voice"),
    [text, setText] = useState("");
  const [token, setToken] = useState(""),
    [generation, setGeneration] = useState(0);
  const [recording, setRecording] = useState(false),
    [seconds, setSeconds] = useState(0),
    [audio, setAudio] = useState<Blob | null>(null);
  // Done was tapped: send as soon as the recording is ready and the security check's token arrives.
  const [pending, setPending] = useState(false);
  // The one status message, also used when every demo task is checked.
  const [announcement, setAnnouncement] = useState("");
  const [transcript, setTranscript] = useState(""),
    [tasks, setTasks] = useState<Draft[]>([]),
    [answered, setAnswered] = useState(false);
  // Completion belongs only to the current demo result, never an account.
  const [checkedTasks, setCheckedTasks] = useState<number[]>([]);
  // From 10 s of waiting: the line and Stop waiting.
  const [waitedLong, setWaitedLong] = useState(false);
  // The live demo is off: the static example and the message replace the form.
  const [off, setOff] = useState(false);
  // The security check: waiting for a tap, failed (with Try again), and failures in a row.
  const [needsTap, setNeedsTap] = useState(false),
    [checkFailed, setCheckFailed] = useState(false),
    [checkFailures, setCheckFailures] = useState(0);
  // The request being waited for, and why it was stopped, if it was.
  const waiting = useRef<{
    controller: AbortController;
    reason: "" | "stop" | "close" | "timeout";
  } | null>(null);
  // The API refused the check's token: its message and Try again stay until tapped.
  const [checkRefused, setCheckRefused] = useState(false);
  const checkRetried = useRef(false);
  const recorder = useRef<Awaited<ReturnType<typeof startRecorder>> | null>(
    null,
  );
  const requestId = useRef("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);
  const panel = useRef<HTMLDivElement>(null);
  const completionBanner = useRef<HTMLDivElement>(null);
  const taskPointer = useRef<number | null>(null);
  const taskId = useId();
  const revealCompletion = useRef(false);
  const stageHeading = useRef<HTMLHeadingElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const recordButton = useRef<HTMLButtonElement>(null);
  // The circle that follows the voice while listening; its size is set without re-rendering.
  const levelRing = useRef<HTMLSpanElement>(null);
  const textBox = useRef<HTMLTextAreaElement>(null);
  const submitButton = useRef<HTMLButtonElement>(null);
  // Where focus goes after switching between talking and typing.
  const focusNext = useRef<"text" | "record" | null>(null);
  const warned = useRef(false);
  const developerActive = (status?.testingUntil || 0) > now;
  const allowanceUsed = status?.remaining === 0 && !developerActive;
  // Every try used: the panel says when they come back, instead of the capture stage.
  // A request still to be retrieved (retryPending) doesn't use another try.
  // Two security-check failures in a row: the static example and the hand-over instead.
  const stage = !opened
    ? "intro"
    : busy
      ? "processing"
      : answered
        ? "review"
        : off
          ? "off"
          : !status
            ? "connecting"
            : allowanceUsed && !retryPending
              ? "tries-used"
              : checkFailures >= 2
                ? "unverified"
                : "capture";
  // The tries-used state replaces the server's own message for it; after two
  // security-check failures, the reason shows under the static example.
  const shownError =
    stage === "tries-used"
      ? ""
      : stage === "unverified"
        ? t.errors.unverified
        : error;
  const allComplete =
    stage === "review" &&
    !loading &&
    !shownError &&
    tasks.length > 0 &&
    tasks.every((_, index) => checkedTasks.includes(index));
  function clearCompletion() {
    setCheckedTasks([]);
    taskPointer.current = null;
    revealCompletion.current = false;
  }
  function toggleTask(index: number, checked: boolean) {
    const next = checked
      ? [...checkedTasks, index]
      : checkedTasks.filter((value) => value !== index);
    setCheckedTasks(next);
    revealCompletion.current =
      !allComplete &&
      checked &&
      taskPointer.current === index &&
      tasks.every((_, taskIndex) => next.includes(taskIndex));
    taskPointer.current = null;
  }
  useEffect(() => {
    const reveal = revealCompletion.current;
    revealCompletion.current = false;
    if (!allComplete || !reveal || !completionBanner.current) return;
    // Finish the native label/checkbox activation before measuring and revealing
    // the result. Undo, reset or unmount cancels this pending frame.
    const frame = window.requestAnimationFrame(() => {
      const banner = completionBanner.current;
      if (!banner) return;
      const bounds = banner.getBoundingClientRect();
      const headerBottom =
        document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0;
      const clearance = Math.max(0, headerBottom) + 12;
      const alreadyVisible =
        bounds.top >= clearance && bounds.bottom <= window.innerHeight;
      // Only a final pointer/touch action reveals an offscreen reward. Keyboard
      // completion keeps its checkbox context and uses the existing live status.
      // Even when visible, stop any pending native checkbox-focus scroll so it
      // cannot carry the banner out of view after this effect has finished.
      window.scrollBy({
        top: alreadyVisible ? 0 : bounds.top - clearance,
        behavior: "instant",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [allComplete]);
  const receiveToken = useCallback((value: string) => {
    setToken(value);
    if (!value) return;
    setNeedsTap(false);
    setCheckFailed(false);
    setCheckFailures(0);
  }, []);
  const receiveCheckError = useCallback(() => {
    setNeedsTap(false);
    setCheckFailed(true);
    setCheckFailures((value) => value + 1);
  }, []);
  const receiveTap = useCallback(
    (value: boolean) => {
      setNeedsTap(value);
      if (value) setAnnouncement(t.checkTap);
    },
    [t.checkTap],
  );
  const refresh = useCallback(async () => {
    const response = await fetch("/api/voice/status/", { cache: "no-store" });
    const data = await readJson(response);
    if (!response.ok || typeof data?.remaining !== "number")
      throw new Refused(data?.code);
    setStatus(data as unknown as Status);
  }, []);
  // The status request failed: no connection, the demo off, or no answer it understands.
  function statusFailed(reason: unknown) {
    const failed: Failure =
      reason instanceof Refused
        ? failureFor(t, reason.code)
        : { message: t.errors.offlineOpening };
    setOff(!!failed.off);
    setError(failed.message || t.errors.notAnswering);
  }
  useEffect(() => {
    setReady(true);
    setDeveloperTools(
      new URLSearchParams(window.location.search).get("developer") === "1",
    );
  }, []);
  useEffect(() => {
    const until = status?.testingUntil;
    if (!until) return;
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= until) {
        clearInterval(interval);
        void refresh().catch(() => {});
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [status?.testingUntil, refresh]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearInterval(timer.current);
      void recorder.current?.stop();
      waiting.current?.controller.abort();
    };
  }, []);
  // After 10 s of waiting, say it can take up to 40 s (the page's limit, pageLimit),
  // and offer Stop waiting.
  useEffect(() => {
    setWaitedLong(false);
    if (!busy) return;
    const later = setTimeout(() => {
      setWaitedLong(true);
      setAnnouncement(t.stillUnderstanding);
    }, 10_000);
    return () => clearTimeout(later);
  }, [busy, t.stillUnderstanding]);
  // Typing: keep Done in view with the text box, when the box takes focus and when a
  // phone keyboard opens over it (WEB-1308).
  const showDone = useCallback(() => {
    requestAnimationFrame(() => {
      if (document.activeElement === textBox.current)
        submitButton.current?.scrollIntoView({
          block: "nearest",
          behavior: "instant",
        });
    });
  }, []);
  useEffect(() => {
    if (mode !== "text" || stage !== "capture") return;
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", showDone);
    return () => viewport?.removeEventListener("resize", showDone);
  }, [mode, stage, showDone]);
  // The security check passed after its Try again: carry on where the visitor would.
  useEffect(() => {
    if (checkFailed || !checkRetried.current) return;
    checkRetried.current = false;
    (mode === "text" ? textBox.current : recordButton.current)?.focus();
  }, [checkFailed]);
  useEffect(() => {
    if (stage === "intro") return;
    // Switching between talking and typing (or a microphone error) moves focus
    // to the text box or the record button, where the visitor carries on.
    const next = focusNext.current;
    focusNext.current = null;
    if (next) {
      (next === "text" ? textBox.current : recordButton.current)?.focus();
      return;
    }
    // A stage replaces the previous view; keep both keyboard focus and the
    // result at the same visible card, including after the mobile keyboard closes.
    const target = shownError ? errorMessage.current : stageHeading.current;
    target?.focus({ preventScroll: true });
    const top = panel.current?.getBoundingClientRect().top;
    if (top !== undefined && (top < 88 || top > 160))
      panel.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [stage, shownError, mode]);
  const stop = useCallback(async () => {
    if (timer.current) clearInterval(timer.current);
    const active = recorder.current;
    recorder.current = null;
    const blob = await active?.stop();
    if (mounted.current) {
      setRecording(false);
      if (blob) setAudio(blob);
    }
  }, []);
  // Done, or the 60 s limit: stop listening and send.
  const finish = useCallback(async () => {
    setPending(true);
    await stop();
  }, [stop]);
  // Close demo while listening: the microphone stops and the recording is thrown away.
  // Nothing is sent and no try is used.
  function discardRecording() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    const active = recorder.current;
    recorder.current = null;
    setRecording(false);
    setPending(false);
    setAudio(null);
    // stop() ends every track before it resolves; what it returns is ignored.
    void active?.stop();
  }
  // While listening, the circle's halo follows the voice, read on each frame. With
  // reduced motion it moves in three steps (silent, speaking, loud) without easing.
  useEffect(() => {
    if (!recording) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0,
      shown = -1;
    const draw = () => {
      const raw = recorder.current?.level() ?? 0;
      const value = reduce ? (raw < 0.25 ? 0 : raw < 0.7 ? 0.5 : 1) : raw;
      if (value !== shown && levelRing.current) {
        shown = value;
        levelRing.current.style.setProperty("--level", value.toFixed(3));
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      levelRing.current?.style.removeProperty("--level");
    };
  }, [recording]);
  async function open() {
    setOpened(true);
    setLoading(true);
    setError("");
    setOff(false);
    try {
      await refresh();
    } catch (reason) {
      statusFailed(reason);
    } finally {
      setLoading(false);
    }
  }
  // The microphone can't be used: say why, by the error's name, and open the text box.
  function microphoneFailed(message: string) {
    setError(message);
    focusNext.current = "text";
    setMode("text");
    requestId.current = "";
  }
  async function record() {
    // Clearing an error would move focus to the heading; keep it on this button.
    if (error) focusNext.current = "record";
    setRetryPending(false);
    setError("");
    setAudio(null);
    setSeconds(0);
    setAnswered(false);
    clearCompletion();
    requestId.current = newRequestId();
    if (!navigator.mediaDevices?.getUserMedia) {
      microphoneFailed(t.micUnsupported);
      return;
    }
    try {
      setLoading(true);
      const active = await startRecorder();
      if (!mounted.current) {
        await active.stop();
        return;
      }
      recorder.current = active;
      setRecording(true);
      setAnnouncement(t.listeningStatus);
      warned.current = false;
      const started = Date.now();
      timer.current = setInterval(() => {
        const elapsed = Math.min(60, Math.floor((Date.now() - started) / 1000));
        setSeconds(elapsed);
        if (elapsed >= 50 && !warned.current) {
          warned.current = true;
          setAnnouncement(secondsLeft(10));
        }
        if (elapsed >= 60) void finish();
      }, 200);
    } catch (reason) {
      const name = (reason as Error).name;
      // Refused: a dismissed prompt asks again on the next tap; a blocked microphone doesn't.
      microphoneFailed(
        name === "NotAllowedError"
          ? (await microphoneAsksAgain())
            ? t.micDismissed
            : t.micBlocked
          : name === "NotFoundError"
            ? t.micMissing
            : t.micFailed,
      );
    } finally {
      setLoading(false);
    }
  }
  async function submit() {
    if (!token || busy || recording) return;
    setAnnouncement(t.understanding);
    setBusy(true);
    setError("");
    setAnswered(false);
    clearCompletion();
    const current = {
      controller: new AbortController(),
      reason: "" as "" | "stop" | "close" | "timeout",
    };
    waiting.current = current;
    let clearLimit = () => {};
    // Whether fetch was called: an error before it isn't the connection.
    let sent = false;
    let failed: Failure | null = null;
    let data: Record<string, unknown> | null = null;
    // Whatever throws while setting up or sending ends in the catch, never a lasting wait.
    try {
      requestId.current ||= newRequestId();
      clearLimit = limitWait(() => {
        current.reason ||= "timeout";
        current.controller.abort();
      });
      const body = JSON.stringify({
        ...(mode === "voice" && audio
          ? { audio: await audioBase64(audio) }
          : { text }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
      sent = true;
      const response = await fetch("/api/voice/draft/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Turnstile-Token": token,
          "X-Request-Id": requestId.current,
        },
        body,
        signal: current.controller.signal,
      });
      data = await readJson(response);
      if (!response.ok || !Array.isArray(data?.tasks))
        failed = failureFor(t, response.ok ? undefined : data?.code);
    } catch (reason) {
      failed = {
        message:
          sent && (reason as Error).name === "TypeError"
            ? t.errors.offline
            : t.errors.notAnswering,
        retry: true,
      };
    } finally {
      clearLimit();
      // Close demo may already have let it go, and a new request may be waiting.
      if (waiting.current === current) waiting.current = null;
    }
    // Stopped: by the page's limit, by Stop waiting (the still-understanding message:
    // the server carries on, and Try again resends it without another try), or by Close demo.
    const { reason } = current;
    if (reason)
      failed = {
        message:
          reason === "timeout" ? t.errors.timeout : t.errors.processing,
        retry: true,
      };
    // The result heading or the error alert takes focus and speaks for itself.
    setAnnouncement("");
    setBusy(false);
    setToken("");
    setGeneration((value) => value + 1);
    void refresh().catch(() => {});
    if (reason === "close") return;
    if (failed) {
      if (failed.triesUsed) {
        const retryAt = data?.retryAt;
        setStatus(
          (value) =>
            value && {
              ...value,
              remaining: 0,
              resetAt: typeof retryAt === "number" ? retryAt : value.resetAt,
            },
        );
      }
      setRetryPending(!!failed.retry);
      // Anything that can't be resent starts a new request next time; a refused
      // recording can't be sent again, so only Tap to talk remains.
      // A fresh one keeps the words, for Try again as a new request.
      if (!failed.retry) {
        requestId.current = "";
        if (mode === "voice") setAudio(null);
      } else if (failed.fresh) requestId.current = "";
      setOff(!!failed.off);
      // The API refused the security check's token: no try used; its Try again resends.
      setCheckRefused(!!failed.check);
      setError(failed.message);
      return;
    }
    const answer = data as {
      tasks: Draft[];
      transcript: string;
      remaining: number;
      resetAt: number | null;
      testingUntil?: number | null;
    };
    setRetryPending(false);
    clearCompletion();
    setTasks(answer.tasks);
    setTranscript(answer.transcript);
    setAnswered(true);
    setStatus(
      (value) =>
        value && {
          ...value,
          remaining: answer.remaining,
          resetAt: answer.resetAt,
          testingUntil: answer.testingUntil,
        },
    );
  }
  // Stop waiting, or Close demo while waiting: abort the request. Stop waiting keeps the
  // recording or the text, to send again with Try again.
  function stopWaiting(reason: "stop" | "close") {
    const current = waiting.current;
    if (!current) return;
    current.reason = reason;
    current.controller.abort();
  }
  // The security check's Try again: load it again if it has no token; a request the API
  // refused for it is resent as soon as there is one.
  function retryCheck() {
    checkRetried.current = checkFailed;
    if (!token) setGeneration((value) => value + 1);
    if (checkRefused) {
      setCheckRefused(false);
      setPending(true);
    }
  }
  // Close demo: back to the closed card, with nothing kept, even mid-wait.
  function startAgain() {
    discardRecording();
    setBusy(false);
    waiting.current = null;
    setAnswered(false);
    clearCompletion();
    setTasks([]);
    setTranscript("");
    setText("");
    setAudio(null);
    setSeconds(0);
    setMode("voice");
    setError("");
    setRetryPending(false);
    setToken("");
    setPending(false);
    setAnnouncement("");
    setOff(false);
    setNeedsTap(false);
    setCheckFailed(false);
    setCheckFailures(0);
    setCheckRefused(false);
    requestId.current = "";
  }
  // Done sends once the recording has stopped and the security check has passed.
  const sendNow = pending && !!token && !recording && !busy;
  useEffect(() => {
    if (!sendNow) return;
    setPending(false);
    // submit reads this render's recording or text; sendNow is what starts it.
    if (mode === "voice" ? audio : text.trim().length >= 3) void submit();
  }, [sendNow]);
  function switchMode(next: "voice" | "text") {
    focusNext.current = next === "text" ? "text" : "record";
    setMode(next);
    setRetryPending(false);
    requestId.current = "";
  }
  const testingSeconds = Math.max(
    0,
    Math.ceil(((status?.testingUntil || 0) - now) / 1000),
  );
  const unavailable = busy || loading || recording || pending;
  // The security check waits for a tap, or failed: nothing can be sent until it passes.
  const checkBlocked = (!token && (needsTap || checkFailed)) || checkRefused;
  const checkMessage = (checkFailed && !token) || checkRefused;
  // The record button is the Done button from the first tap until the recording is
  // sent, except while a recording is being resent with Try again.
  const listening = recording || (pending && mode === "voice" && !retryPending);
  // The record button waits: for the microphone, or, as Done, to send.
  const recordWaits = listening ? pending : loading;
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const number = new Intl.NumberFormat(language);
  const formats = dateFormats(language);
  const resetAt = status?.resetAt ? new Date(status.resetAt) : null;
  // ‘Today’ when the tries come back on the visitor's date; Spanish and Catalan say
  // «a la 1:30», not «a las/les», when the hour shown is 1.
  const resetToday = resetAt?.toDateString() === new Date().toDateString();
  const resetAtOne = resetAt
    ? formats.time
        .formatToParts(resetAt)
        .some((part) => part.type === "hour" && part.value === "1")
    : false;
  const triesUsedLine = resetAt
    ? t.triesUsed[
        resetToday
          ? resetAtOne
            ? "todayAtOne"
            : "today"
          : resetAtOne
            ? "onDayAtOne"
            : "onDay"
      ]
        .replace("{weekday}", formats.weekday.format(resetAt))
        .replace("{time}", formats.time.format(resetAt))
    : t.triesUsedLater;
  // From 50 s: the seconds still to go, in the page's language.
  function secondsLeft(count: number) {
    return t.secondsLeft[
      new Intl.PluralRules(language).select(count) === "one" ? "one" : "other"
    ].replace("{n}", number.format(count));
  }
  const thingsToAdd = t.thingsToAdd[
    new Intl.PluralRules(language).select(tasks.length) === "one"
      ? "one"
      : "other"
  ].replace("{n}", number.format(tasks.length));
  const privacyLine = (
    <p className="voice-privacy">
      {t.privacy}{" "}
      <a href={`${homePath(language)}privacy/#website`}>{t.privacyLink}</a>
    </p>
  );
  const alertBox = shownError ? (
    <p role="alert" className="voice-error" tabIndex={-1} ref={errorMessage}>
      {shownError}
    </p>
  ) : null;
  return (
    <section
      id="voice"
      lang={language}
      className="voice-section section-space"
      aria-labelledby="voice-title"
    >
      <div className="container">
        <div className="voice-heading" data-reveal>
          <h2 id="voice-title">{t.title}</h2>
          <p>{t.intro}</p>
          <span className="voice-trial-badge">{t.badge}</span>
        </div>
        <div className="voice-panel" ref={panel} data-stage={stage}>
          {!opened ? (
            <div className="voice-intro">
              <p>{t.speak}</p>
              <button
                className="button"
                onClick={open}
                ref={openButton}
                disabled={!ready}
              >
                {t.start} <Icon name="arrow" />
              </button>
              <noscript>
                <p className="voice-noscript">{t.noscript}</p>
              </noscript>
              <VoiceExample language={language} />
            </div>
          ) : (
            <>
              <div className="voice-topline">
                <span className="voice-trial-badge">
                  {developerActive
                    ? `Developer testing · ${Math.floor(testingSeconds / 60)}:${String(testingSeconds % 60).padStart(2, "0")} left`
                    : status && stage !== "off" && stage !== "unverified"
                      ? t.triesLeft.replace("{n}", String(status.remaining))
                      : t.liveDemo}
                </span>
                <button
                  className="text-link"
                  disabled={loading}
                  onClick={() => {
                    stopWaiting("close");
                    startAgain();
                    setOpened(false);
                    requestAnimationFrame(() => openButton.current?.focus());
                  }}
                >
                  {t.close}
                </button>
              </div>
              <p role="status" aria-atomic="true" className="voice-status">
                {allComplete
                  ? `${t.completionTitle} ${t.completionBody}`
                  : announcement}
              </p>
              {stage !== "off" && stage !== "unverified" && alertBox}
              {/* The live demo is off: the static example, the message under it, and the hand-over. */}
              {stage === "off" && (
                <div className="voice-off voice-stage">
                  <VoiceExample language={language} />
                  {alertBox}
                  <p className="voice-handover">{t.handOver}</p>
                </div>
              )}
              {/* Opening failed: the message above, and Try again. */}
              {stage === "connecting" && (
                <div className="voice-connecting">
                  {loading ? (
                    <h3 ref={stageHeading} tabIndex={-1}>
                      {t.starting}
                    </h3>
                  ) : (
                    <button className="button voice-again" onClick={open}>
                      {t.tryAgain}
                    </button>
                  )}
                </div>
              )}
              {busy && (
                <div className="voice-processing voice-stage">
                  <span className="voice-processing-orb" aria-hidden="true">
                    <Icon name="spark" size={30} />
                  </span>
                  <h3 ref={stageHeading} tabIndex={-1}>
                    {t.understanding}
                  </h3>
                  <div className="voice-processing-preview" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  {waitedLong && (
                    <>
                      <p className="voice-waiting-long">
                        {t.stillUnderstanding}
                      </p>
                      <button
                        className="text-link voice-stop"
                        onClick={() => stopWaiting("stop")}
                      >
                        {t.stopWaiting}
                      </button>
                    </>
                  )}
                </div>
              )}
              {status && stage === "capture" && (
                <div className="voice-stage">
                  <div className="voice-stage-heading voice-capture-heading">
                    <h3 ref={stageHeading} tabIndex={-1}>
                      {t.heading}
                    </h3>
                  </div>
                  {mode === "voice" ? (
                    <div className="voice-recorder">
                      <p className="voice-prompt">{t.example.quote}</p>
                      {/* While listening: the microphone, a picture whose halo follows the voice. */}
                      {listening && (
                        <span
                          className="voice-level"
                          aria-hidden="true"
                          ref={levelRing}
                        >
                          <Icon name="mic" size={32} />
                        </span>
                      )}
                      {/* Waiting for the microphone, and Done waiting to send, keep keyboard
                          focus: aria-disabled, not disabled, which would drop it to the page. */}
                      <button
                        id="voice-record"
                        ref={recordButton}
                        className={
                          listening
                            ? "button voice-record-button is-recording"
                            : "voice-record-button"
                        }
                        aria-labelledby={
                          listening ? undefined : "voice-record-label"
                        }
                        disabled={
                          !listening && (busy || pending || checkBlocked)
                        }
                        aria-disabled={recordWaits || undefined}
                        onClick={() => {
                          if (recordWaits) return;
                          void (listening ? finish() : record());
                        }}
                      >
                        {listening ? t.done : <Icon name="mic" size={32} />}
                      </button>
                      {!listening && (
                        <label
                          id="voice-record-label"
                          htmlFor="voice-record"
                          className="voice-record-label"
                        >
                          {t.talk}
                        </label>
                      )}
                      <p className="voice-hint">
                        {loading
                          ? t.micWaiting
                          : pending
                            ? t.starting
                            : recording
                              ? t.listening.replace("{time}", clock) +
                                (seconds >= 50
                                  ? ` · ${secondsLeft(60 - seconds)}`
                                  : "")
                              : t.micHint}
                      </p>
                    </div>
                  ) : (
                    <div className="voice-text">
                      <label className="voice-text-label" htmlFor="voice-text">
                        {t.textLabel}
                      </label>
                      <textarea
                        id="voice-text"
                        ref={textBox}
                        aria-describedby="voice-text-count"
                        maxLength={1500}
                        rows={4}
                        value={text}
                        disabled={busy}
                        placeholder={t.textPlaceholder}
                        onFocus={showDone}
                        onChange={(event) => {
                          setText(event.target.value);
                          setRetryPending(false);
                          requestId.current = "";
                          setAnswered(false);
                        }}
                      />
                      <p id="voice-text-count" className="voice-text-count">
                        {t.textCount
                          .replace("{n}", number.format(text.length))
                          .replace("{max}", number.format(1500))}
                      </p>
                    </div>
                  )}
                  {/* Talking: the privacy line before the security check. Typing: after
                      Done, so Done stays right under the box. The check keeps its one
                      place among these siblings, so switching never reloads it. */}
                  {mode === "voice" && privacyLine}
                  <Verification
                    siteKey={status.siteKey}
                    onToken={receiveToken}
                    onError={receiveCheckError}
                    onTap={receiveTap}
                    generation={generation}
                  />
                  {needsTap && !token && !checkMessage && (
                    <p className="voice-hint voice-check-line">{t.checkTap}</p>
                  )}
                  {checkMessage && (
                    <>
                      <p role="alert" className="voice-error voice-check-error">
                        {t.checkFailed}
                      </p>
                      <button
                        className="button voice-check-retry"
                        onClick={retryCheck}
                      >
                        {t.tryAgain}
                      </button>
                    </>
                  )}
                  {mode === "text" && (
                    <>
                      {pending && <p className="voice-hint">{t.starting}</p>}
                      {/* A request still to be retrieved is sent again with Try again,
                          without using another try. */}
                      <button
                        ref={submitButton}
                        className="button voice-submit"
                        disabled={
                          unavailable || checkBlocked || text.trim().length < 3
                        }
                        onClick={() => setPending(true)}
                      >
                        {retryPending && !checkBlocked ? t.tryAgain : t.done}
                      </button>
                      {privacyLine}
                      <p className="voice-text-pro">{t.textPro}</p>
                    </>
                  )}
                  {/* A recording whose request is still to be retrieved: send it again
                      without using another try. */}
                  {mode === "voice" &&
                    retryPending &&
                    audio &&
                    !recording &&
                    !checkBlocked && (
                    <button
                      className="button voice-retry"
                      // While it waits for the security check, it keeps keyboard focus:
                      // aria-disabled, not disabled, which would drop focus to the page.
                      disabled={unavailable && !pending}
                      aria-disabled={pending || undefined}
                      onClick={() => {
                        if (!pending) setPending(true);
                      }}
                    >
                      {t.tryAgain}
                    </button>
                  )}
                  <button
                    className="text-link voice-mode-link"
                    disabled={busy || recording || loading || pending}
                    onClick={() =>
                      switchMode(mode === "voice" ? "text" : "voice")
                    }
                  >
                    {mode === "voice" ? t.typeInstead : t.talkInstead}
                  </button>
                  <p className="voice-fine">
                    {developerActive &&
                      "Temporary developer access for this browser. Daily allowances resume when the timer ends. "}
                    {t.fine}
                  </p>
                </div>
              )}
              {stage === "review" && (
                <div className="voice-results voice-stage">
                  {tasks.length ? (
                    <>
                      <h3
                        className="voice-result-heading"
                        ref={stageHeading}
                        tabIndex={-1}
                      >
                        {thingsToAdd}
                      </h3>
                      {allComplete && (
                        <div className="voice-completion" ref={completionBanner}>
                          <p className="voice-completion-title">
                            <Icon name="leaf" size={24} />
                            <span>{t.completionTitle}</span>
                          </p>
                          <p className="voice-completion-body">
                            {t.completionBody}
                          </p>
                        </div>
                      )}
                      <ul className="voice-drafts">
                        {tasks.map((task, index) => (
                          <li className="voice-task-card" key={index}>
                            <div
                              className="voice-task-toggle"
                              onClickCapture={(event) => {
                                // Capture the actual pointer/touch click,
                                // including a title-label click before its
                                // forwarded detail-0 checkbox activation.
                                // toggleTask consumes the origin immediately.
                                if (event.detail > 0)
                                  taskPointer.current = index;
                              }}
                              onKeyDownCapture={() => {
                                taskPointer.current = null;
                              }}
                            >
                              <input
                                type="checkbox"
                                id={`${taskId}-${index}`}
                                aria-label={t.completeTask.replace(
                                  "{title}",
                                  task.title,
                                )}
                                checked={checkedTasks.includes(index)}
                                onChange={(event) =>
                                  toggleTask(index, event.target.checked)
                                }
                              />
                              {/* The app's completion circle, drawn under the transparent input. */}
                              <span
                                className="voice-task-circle"
                                aria-hidden="true"
                              >
                                <Icon name="check" size={16} />
                              </span>
                              {/* The heading is the title alone; tapping it still ticks the circle. */}
                              <h4>
                                <label
                                  htmlFor={`${taskId}-${index}`}
                                  className="voice-task-title"
                                >
                                  {task.title}
                                </label>
                              </h4>
                            </div>
                            <p className="voice-task-schedule">
                              <Icon name="calendar" size={16} />
                              {dateLine(task, formats, t)}
                            </p>
                            {task.notes && (
                              <p className="voice-task-notes">{task.notes}</p>
                            )}
                            {task.question && (
                              <p className="voice-question">
                                {t.checkDetail.replace(
                                  "{question}",
                                  task.question,
                                )}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="voice-handover">{t.handOver}</p>
                    </>
                  ) : (
                    <h3
                      className="voice-result-heading voice-message"
                      ref={stageHeading}
                      tabIndex={-1}
                    >
                      {t.noTasks}
                    </h3>
                  )}
                  {allowanceUsed ? (
                    <p className="voice-again-later">{triesUsedLine}</p>
                  ) : mode === "voice" ? (
                    <button className="button voice-again" onClick={record}>
                      {t.sayAgain}
                    </button>
                  ) : (
                    <button
                      className="button voice-again"
                      onClick={() => {
                        focusNext.current = "text";
                        setAnswered(false);
                        clearCompletion();
                        setError("");
                        setRetryPending(false);
                      }}
                    >
                      {t.changeText}
                    </button>
                  )}
                  {/* A typed result shows its text here only when Change the
                      text isn't there, after the last try. */}
                  {(mode === "voice" || allowanceUsed) && (
                    <details className="voice-transcript">
                      <summary>
                        {mode === "voice" ? t.seeWhatISaid : t.originalText}
                      </summary>
                      <p>{transcript}</p>
                    </details>
                  )}
                  <p className="voice-fine">{t.fine}</p>
                </div>
              )}
              {stage === "tries-used" && (
                <div className="voice-stage">
                  <h3
                    className="voice-result-heading voice-message"
                    ref={stageHeading}
                    tabIndex={-1}
                  >
                    {triesUsedLine}
                  </h3>
                  <p className="voice-handover">{t.handOver}</p>
                </div>
              )}
              {/* The security check failed twice: what TaskFlow does, why, and the hand-over. */}
              {stage === "unverified" && (
                <div className="voice-off voice-stage">
                  <VoiceExample language={language} />
                  {alertBox}
                  <p className="voice-handover">{t.handOver}</p>
                </div>
              )}
              {developerTools && status?.developerCode && (
                <details className="voice-developer-tools">
                  <summary>Developer testing</summary>
                  <p>Browser testing code</p>
                  <code>{status.developerCode}</code>
                  <p>
                    An authorized project owner can enable a temporary window
                    for this browser. This code and URL do not unlock it on
                    their own.
                  </p>
                  <button
                    className="text-link"
                    disabled={busy || recording || loading}
                    onClick={() =>
                      void refresh().catch(statusFailed)
                    }
                  >
                    Check developer access
                  </button>
                </details>
              )}
            </>
          )}
        </div>
        {/* WD2's free-plan line, in the closing card's words, under the card in every state. */}
        <p className="voice-plans">{copy[language].closing.plans}</p>
      </div>
    </section>
  );
}
