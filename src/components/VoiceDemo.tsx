"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import type { Draft } from "../lib/voice/policy";
import { audioBase64, startRecorder } from "../lib/voice/recorder";

type Status = { remaining: number; resetAt: number | null; siteKey: string };
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
          ? "Microphone access was not allowed. You can still type your plans below."
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
  const unavailable =
    busy || loading || recording || (status?.remaining === 0 && !retryPending);
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
        <div className="voice-panel">
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
              <button className="button" onClick={open}>
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
                  {status ? `${status.remaining} of 3 tries left` : "Live demo"}
                </span>
                <button
                  className="text-link"
                  disabled={busy || recording || loading}
                  onClick={() => {
                    setOpened(false);
                    setToken("");
                    setAudio(null);
                  }}
                >
                  Close demo
                </button>
              </div>
              {loading && (
                <p role="status">
                  {status
                    ? "Getting your microphone ready…"
                    : "Checking your allowance…"}
                </p>
              )}
              {status && (
                <>
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
                        <Icon name="mic" size={28} />
                      </button>
                      <p aria-live="polite">
                        {recording
                          ? `Recording · ${seconds}s / 60s`
                          : audio
                            ? "Recording ready. Listen before sending."
                            : "Tap to record · up to 60 seconds"}
                      </p>
                      {audioUrl && (
                        <audio
                          controls
                          src={audioUrl}
                          aria-label="Your recording"
                        />
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
                  {(status.remaining > 0 || retryPending) && (
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
                    {busy ? "Making a little clarity…" : "Create drafts"}
                    <Icon name="arrow" />
                  </button>
                  <p className="voice-fine">
                    Three attempts in a rolling 24 hours. Shared-network limits
                    also apply. AI can make mistakes; check every draft. These
                    preview tasks stay on this page and do not sync to the app.
                  </p>
                  {status.remaining === 0 && (
                    <p role="status">
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
                </>
              )}
              {error && (
                <p role="alert" className="voice-error">
                  {error}
                </p>
              )}
              {!status && !loading && (
                <button className="text-link" onClick={open}>
                  Try connecting again
                </button>
              )}
              {answered && (
                <div className="voice-results" aria-live="polite">
                  <div className="voice-results-heading">
                    <h3>
                      {saved
                        ? "Your preview list"
                        : `${tasks.length} ${tasks.length === 1 ? "draft" : "drafts"}, ready for your eye.`}
                    </h3>
                    <span>AI suggestion · you decide</span>
                  </div>
                  <details>
                    <summary>Your transcript</summary>
                    <p>{transcript}</p>
                  </details>
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
                          <small>
                            {task.date || "Whenever you’re ready"}
                            {task.time ? ` · ${task.time}` : ""}
                          </small>
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
                          <fieldset className="voice-draft" key={index}>
                            <legend>Task {index + 1}</legend>
                            <label>
                              Title
                              <input
                                required
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
                                  edit(index, "priority", event.target.value)
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
                            {task.question && (
                              <p className="voice-question">
                                Check this: {task.question}
                              </p>
                            )}
                          </fieldset>
                        ))}
                      </div>
                      {!!tasks.length && (
                        <button className="button" type="submit">
                          Add to preview list <Icon name="check" />
                        </button>
                      )}
                    </form>
                  )}
                  {saved && (
                    <button
                      className="text-link"
                      onClick={() => setSaved(false)}
                    >
                      Edit drafts
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
