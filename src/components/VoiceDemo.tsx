"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import type { Draft } from "../lib/voice/policy";
import { audioBase64, startRecorder } from "../lib/voice/recorder";

type Status = {
  remaining: number;
  resetAt: number | null;
  siteKey: string;
  testingUntil?: number | null;
  developerCode?: string;
};

function scheduleLabel(task: Draft) {
  const date = task.date
    ? new Date(`${task.date}T12:00:00`).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "Whenever you’re ready";
  return `${date}${task.time ? ` · ${task.time}` : ""}`;
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

function Verification({
  siteKey,
  onToken,
  onError,
  generation,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  onError: (error: string) => void;
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
          callback: onToken,
          "expired-callback": () => onToken(""),
          "error-callback": () => {
            onToken("");
            onError(
              "The security check could not load. Please reopen the live demo.",
            );
          },
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
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount);
      script.addEventListener("error", failed);
    }
    function failed() {
      onError(
        "The security check could not load. Check your connection or try again later.",
      );
    }
    return () => {
      disposed = true;
      script?.removeEventListener("load", mount);
      script?.removeEventListener("error", failed);
      if (widget) window.turnstile?.remove(widget);
    };
  }, [siteKey, onToken, onError, generation]);
  return (
    <div
      ref={element}
      className="voice-verification"
      aria-label="Security verification"
    />
  );
}

export default function VoiceDemo() {
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
    [audio, setAudio] = useState<Blob | null>(null),
    [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState(""),
    [tasks, setTasks] = useState<Draft[]>([]),
    [saved, setSaved] = useState(false),
    [complete, setComplete] = useState<number[]>([]),
    [answered, setAnswered] = useState(false);
  const recorder = useRef<Awaited<ReturnType<typeof startRecorder>> | null>(
    null,
  );
  const requestId = useRef("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);
  const panel = useRef<HTMLDivElement>(null);
  const stageHeading = useRef<HTMLHeadingElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const stage = !opened
    ? "intro"
    : busy
      ? "processing"
      : answered
        ? saved
          ? "preview"
          : "review"
        : !status
          ? "connecting"
          : mode === "voice" && audio
            ? "recorded"
            : "capture";
  const receiveToken = useCallback((value: string) => setToken(value), []);
  const receiveError = useCallback((value: string) => setError(value), []);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/voice/status/", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.error || "The live demo is temporarily unavailable.",
      );
    setStatus(data as Status);
  }, []);
  useEffect(() => {
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
    };
  }, []);
  useEffect(() => {
    if (!audio) {
      setAudioUrl("");
      return;
    }
    const url = URL.createObjectURL(audio);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);
  useEffect(() => {
    if (stage === "intro") return;
    // A stage replaces the previous view; keep both keyboard focus and the
    // result at the same visible card, including after the mobile keyboard closes.
    const target = error ? errorMessage.current : stageHeading.current;
    target?.focus({ preventScroll: true });
    const top = panel.current?.getBoundingClientRect().top;
    if (top !== undefined && (top < 88 || top > 160))
      panel.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [stage, error]);
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
  async function open() {
    setOpened(true);
    setLoading(true);
    setError("");
    try {
      await refresh();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setLoading(false);
    }
  }
  async function record() {
    setRetryPending(false);
    setError("");
    setAudio(null);
    setSeconds(0);
    setAnswered(false);
    requestId.current = crypto.randomUUID();
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "This browser cannot record audio. Try the text option instead.",
        );
      setLoading(true);
      const active = await startRecorder();
      if (!mounted.current) {
        await active.stop();
        return;
      }
      recorder.current = active;
      setRecording(true);
      const started = Date.now();
      timer.current = setInterval(() => {
        const elapsed = Math.min(60, Math.floor((Date.now() - started) / 1000));
        setSeconds(elapsed);
        if (elapsed >= 60) void stop();
      }, 200);
    } catch (reason) {
      setError(
        (reason as Error).name === "NotAllowedError"
          ? "Microphone access was not allowed. You can still use “Type it instead”."
          : (reason as Error).message,
      );
    } finally {
      setLoading(false);
    }
  }
  async function submit() {
    if (!token || busy || recording) return;
    setBusy(true);
    setError("");
    setAnswered(false);
    setSaved(false);
    setComplete([]);
    requestId.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/api/voice/draft/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Turnstile-Token": token,
          "X-Request-Id": requestId.current,
        },
        body: JSON.stringify({
          ...(mode === "voice" && audio
            ? { audio: await audioBase64(audio) }
            : { text }),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        }),
        signal: AbortSignal.timeout(55_000),
      });
      const data = await response.json();
      if (!response.ok) {
        setRetryPending(data.code === "processing" || response.status === 503);
        if (response.status === 422) requestId.current = "";
        throw new Error(
          data.error || "The draft could not be created. Please try again.",
        );
      }
      setRetryPending(false);
      setTasks(data.tasks);
      setTranscript(data.transcript);
      setAnswered(true);
      setStatus(
        (value) =>
          value && {
            ...value,
            remaining: data.remaining,
            resetAt: data.resetAt,
            testingUntil: data.testingUntil,
          },
      );
    } catch (reason) {
      if (["TimeoutError", "TypeError"].includes((reason as Error).name))
        setRetryPending(true);
      setError(
        (reason as Error).name === "TimeoutError"
          ? "This is taking longer than expected. Try again to retrieve this request without another AI call."
          : (reason as Error).message,
      );
    } finally {
      setBusy(false);
      setToken("");
      setGeneration((value) => value + 1);
      void refresh().catch(() => {});
    }
  }
  function edit(index: number, key: keyof Draft, value: string) {
    setTasks((items) =>
      items.map((task, i) =>
        i === index
          ? {
              ...task,
              [key]:
                value ||
                (["date", "time", "question"].includes(key) ? null : ""),
              ...(key === "date" && !value ? { time: null } : {}),
            }
          : task,
      ),
    );
  }
  function startAgain() {
    setAnswered(false);
    setSaved(false);
    setTasks([]);
    setTranscript("");
    setComplete([]);
    setText("");
    setAudio(null);
    setSeconds(0);
    setMode("voice");
    setError("");
    setRetryPending(false);
    setToken("");
    requestId.current = "";
  }
  const developerActive = (status?.testingUntil || 0) > now;
  const allowanceUsed = status?.remaining === 0 && !developerActive;
  const testingSeconds = Math.max(
    0,
    Math.ceil(((status?.testingUntil || 0) - now) / 1000),
  );
  const unavailable =
    busy || loading || recording || (allowanceUsed && !retryPending);
  return (
    <section
      id="voice"
      className="voice-section section-space"
      aria-labelledby="voice-title"
    >
      <div className="container">
        <div className="voice-heading">
          <div>
            <p className="eyebrow">YOUR WORDS. YOUR NEXT STEP.</p>
            <h2 id="voice-title">Say it. See it take shape.</h2>
            <p>
              Try real voice-to-task, right here. One thought or a few plans —
              turn them into a little clarity.
            </p>
          </div>
          <span className="voice-trial-badge">3 free tries · no account</span>
        </div>
        <div className="voice-panel" ref={panel} data-stage={stage}>
          {!opened ? (
            <div className="voice-intro">
              <span className="voice-mic-orb">
                <Icon name="mic" size={32} />
              </span>
              <h3>A minute is plenty.</h3>
              <p>
                Speak in English, Spanish, or Catalan. Review the transcript,
                then make the drafts your own.
              </p>
              <button className="button" onClick={open} ref={openButton}>
                Try the live demo <Icon name="arrow" />
              </button>
              <p className="voice-fine">
                Up to 60 seconds. Audio or text is sent to Google for AI
                processing only when you choose “Create drafts”.{" "}
                <a href="/privacy/">How we protect your data</a>
              </p>
            </div>
          ) : (
            <>
              <div className="voice-topline">
                <span className="voice-trial-badge">
                  {developerActive
                    ? `Developer testing · ${Math.floor(testingSeconds / 60)}:${String(testingSeconds % 60).padStart(2, "0")} left`
                    : status
                      ? `${status.remaining} of 3 tries left`
                      : "Live demo"}
                </span>
                <button
                  className="text-link"
                  disabled={busy || recording || loading}
                  onClick={() => {
                    startAgain();
                    setOpened(false);
                    requestAnimationFrame(() => openButton.current?.focus());
                  }}
                >
                  Close demo
                </button>
              </div>
              {error && (
                <p
                  role="alert"
                  className="voice-error"
                  tabIndex={-1}
                  ref={errorMessage}
                >
                  {error}
                </p>
              )}
              {!status && (
                <div className="voice-connecting">
                  <h3 ref={stageHeading} tabIndex={-1}>
                    {loading
                      ? "Getting your demo ready…"
                      : "Let’s try that again."}
                  </h3>
                  {loading ? (
                    <p role="status">Checking your allowance…</p>
                  ) : (
                    <button className="text-link" onClick={open}>
                      Try connecting again
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
                    Making a little clarity…
                  </h3>
                  <p role="status">
                    Finding the tasks, dates, and details in your words.
                  </p>
                  <div className="voice-processing-preview" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p className="voice-fine">
                    Your drafts will appear right here. You’ll have the final
                    say.
                  </p>
                </div>
              )}
              {status && !busy && !answered && (
                <div className="voice-stage">
                  <div className="voice-stage-heading voice-capture-heading">
                    <h3 ref={stageHeading} tabIndex={-1}>
                      {audio && mode === "voice"
                        ? "Ready when you are."
                        : "What’s on your mind?"}
                    </h3>
                    <p>
                      {audio && mode === "voice"
                        ? "Listen back, or turn your words into tasks."
                        : "Say a little. We’ll help you make a plan."}
                    </p>
                  </div>
                  <div className="voice-modes" aria-label="Choose input">
                    <button
                      aria-pressed={mode === "voice"}
                      disabled={busy || recording || loading}
                      onClick={() => {
                        setMode("voice");
                        setRetryPending(false);
                        requestId.current = "";
                      }}
                    >
                      {" "}
                      <Icon name="mic" size={18} /> Record a thought
                    </button>
                    <button
                      aria-pressed={mode === "text"}
                      disabled={busy || recording || loading}
                      onClick={() => {
                        setMode("text");
                        setRetryPending(false);
                        requestId.current = "";
                      }}
                    >
                      Type it instead
                    </button>
                  </div>
                  {mode === "voice" ? (
                    <div className="voice-recorder">
                      {!audio && (
                        <>
                          <p className="voice-prompt">
                            “On Friday at 5 p.m., I have a doctor’s appointment.
                            Remind me to bring my test results.”
                          </p>
                          <button
                            className={`voice-record-button ${recording ? "is-recording" : ""}`}
                            aria-label={
                              recording ? "Stop recording" : "Start recording"
                            }
                            disabled={!recording && unavailable}
                            onClick={recording ? stop : record}
                          >
                            {recording ? (
                              <span className="voice-stop-icon" />
                            ) : (
                              <Icon name="mic" size={28} />
                            )}
                          </button>
                        </>
                      )}
                      <p aria-live="polite">
                        {loading
                          ? "Getting your microphone ready…"
                          : recording
                            ? `Recording · ${seconds}s / 60s`
                            : audio
                              ? "Recording ready. Listen before sending."
                              : "Tap to record · up to 60 seconds"}
                      </p>
                      {audioUrl && (
                        <>
                          <audio
                            controls
                            src={audioUrl}
                            aria-label="Your recording"
                          />
                          <button
                            className="text-link"
                            onClick={record}
                            disabled={unavailable}
                          >
                            Record again
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <label className="voice-text-label">
                      What is on your mind?
                      <textarea
                        maxLength={1500}
                        rows={4}
                        value={text}
                        disabled={busy}
                        placeholder="On Friday at 5 p.m. I have a doctor’s appointment. Bring last month’s test results. Also buy coffee sometime."
                        onChange={(event) => {
                          setText(event.target.value);
                          setRetryPending(false);
                          requestId.current = "";
                          setAnswered(false);
                        }}
                      />
                      <span>{text.length} / 1,500 characters</span>
                    </label>
                  )}
                  {(!allowanceUsed || retryPending) && (
                    <Verification
                      siteKey={status.siteKey}
                      onToken={receiveToken}
                      onError={receiveError}
                      generation={generation}
                    />
                  )}
                  <button
                    className="button voice-submit"
                    disabled={
                      unavailable ||
                      !token ||
                      (mode === "voice" ? !audio : text.trim().length < 3)
                    }
                    onClick={submit}
                  >
                    Create drafts
                    <Icon name="arrow" />
                  </button>
                  <p className="voice-fine">
                    {developerActive
                      ? "Temporary developer access for this browser. Daily allowances resume when the timer ends. "
                      : "Three submissions in a rolling 24 hours. Recording and editing do not use a try. Shared-network limits also apply. "}
                    AI can make mistakes; check every draft. These preview tasks
                    stay on this page and do not sync to the app.
                  </p>
                </div>
              )}
              {answered && !busy && (
                <div className="voice-results voice-stage">
                  <div className="voice-stage-heading">
                    <p className="voice-result-label">
                      <Icon name="check" size={16} />
                      {saved
                        ? "A LITTLE LIGHTER"
                        : tasks.length
                          ? "READY TO REVIEW"
                          : "NO TASKS YET"}
                    </p>
                    <h3 ref={stageHeading} tabIndex={-1}>
                      {saved
                        ? "Your preview list"
                        : tasks.length
                          ? `${tasks.length} ${tasks.length === 1 ? "draft" : "drafts"}, ready for you.`
                          : "Let’s give that another go."}
                    </h3>
                    <p>
                      {saved
                        ? "Try checking one off. That’s one less thing on your mind."
                        : "A little structure for your thoughts. Check the details or edit anything."}
                    </p>
                  </div>
                  {!tasks.length && (
                    <p>
                      No tasks were found. Try describing something you want to
                      do.
                    </p>
                  )}
                  {saved ? (
                    tasks.map((task, index) => (
                      <button
                        className={`voice-saved-task ${complete.includes(index) ? "is-complete" : ""}`}
                        key={index}
                        onClick={() =>
                          setComplete((values) =>
                            values.includes(index)
                              ? values.filter((value) => value !== index)
                              : [...values, index],
                          )
                        }
                        aria-pressed={complete.includes(index)}
                      >
                        <span className="voice-task-circle">
                          {complete.includes(index) && (
                            <Icon name="check" size={14} />
                          )}
                        </span>
                        <span>
                          <strong>{task.title}</strong>
                          <small>{scheduleLabel(task)}</small>
                          {task.notes && <small>{task.notes}</small>}
                        </span>
                      </button>
                    ))
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        setSaved(true);
                      }}
                    >
                      <div className="voice-drafts">
                        {tasks.map((task, index) => (
                          <div className="voice-task-card" key={index}>
                            <div className="voice-task-card-topline">
                              <span>Task {index + 1}</span>
                              <span
                                className={`voice-priority voice-priority-${task.priority}`}
                              >
                                {task.priority} priority
                              </span>
                            </div>
                            <h4>{task.title || "Untitled task"}</h4>
                            <p className="voice-task-schedule">
                              <Icon
                                name={task.date ? "calendar" : "leaf"}
                                size={16}
                              />
                              {scheduleLabel(task)}
                            </p>
                            {task.notes && (
                              <p className="voice-task-notes">{task.notes}</p>
                            )}
                            {task.question && (
                              <p className="voice-question">
                                Check this: {task.question}
                              </p>
                            )}
                            <details className="voice-task-edit">
                              <summary>Edit task {index + 1}</summary>
                              <fieldset className="voice-draft">
                                <legend>Task {index + 1} details</legend>
                                <label>
                                  Title
                                  <input
                                    required
                                    onInvalid={(event) => {
                                      const details =
                                        event.currentTarget.closest("details");
                                      if (details) details.open = true;
                                    }}
                                    maxLength={120}
                                    value={task.title}
                                    onChange={(event) =>
                                      edit(index, "title", event.target.value)
                                    }
                                  />
                                </label>
                                <div className="voice-draft-row">
                                  <label>
                                    Date <small>optional</small>
                                    <input
                                      type="date"
                                      value={task.date || ""}
                                      onChange={(event) =>
                                        edit(index, "date", event.target.value)
                                      }
                                    />
                                  </label>
                                  <label>
                                    Time <small>optional</small>
                                    <input
                                      type="time"
                                      disabled={!task.date}
                                      value={task.time || ""}
                                      onChange={(event) =>
                                        edit(index, "time", event.target.value)
                                      }
                                    />
                                  </label>
                                </div>
                                <label>
                                  Priority
                                  <select
                                    value={task.priority}
                                    onChange={(event) =>
                                      edit(
                                        index,
                                        "priority",
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                  </select>
                                </label>
                                <label>
                                  Notes
                                  <textarea
                                    rows={2}
                                    maxLength={1500}
                                    value={task.notes}
                                    onChange={(event) =>
                                      edit(index, "notes", event.target.value)
                                    }
                                  />
                                </label>
                              </fieldset>
                            </details>
                          </div>
                        ))}
                      </div>
                      {!!tasks.length && (
                        <button className="button voice-submit" type="submit">
                          Add to preview list <Icon name="check" />
                        </button>
                      )}
                    </form>
                  )}
                  <div className="voice-result-actions">
                    {saved ? (
                      <button
                        className="text-link"
                        onClick={() => setSaved(false)}
                      >
                        Edit drafts
                      </button>
                    ) : (
                      <button
                        className="text-link"
                        disabled={allowanceUsed}
                        onClick={() => {
                          setAnswered(false);
                          setError("");
                          setRetryPending(false);
                        }}
                      >
                        Edit original thought
                      </button>
                    )}
                    <button
                      className="text-link"
                      disabled={allowanceUsed}
                      onClick={startAgain}
                    >
                      Try a new thought <Icon name="arrow" size={16} />
                    </button>
                  </div>
                  <details className="voice-transcript">
                    <summary>Your transcript</summary>
                    <p>{transcript}</p>
                  </details>
                  <p className="voice-fine">
                    AI can make mistakes. These preview tasks stay on this page
                    and do not sync to the app.
                  </p>
                </div>
              )}
              {allowanceUsed && !busy && (
                <p className="voice-fine" role="status">
                  Your allowance returns{" "}
                  {status.resetAt
                    ? new Date(status.resetAt).toLocaleString(undefined, {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "tomorrow"}
                  . The sample walkthrough below is always available.
                </p>
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
                      void refresh().catch((reason) =>
                        setError((reason as Error).message),
                      )
                    }
                  >
                    Check developer access
                  </button>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
