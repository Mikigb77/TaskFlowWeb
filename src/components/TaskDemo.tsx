"use client";

import { useEffect, useRef, useState } from "react";

const examples = [
  {
    label: "An appointment",
    quote:
      "“Doctor on Friday at five p.m. Oh, and I need to bring my blood test results.”",
    title: "Doctor appointment",
    day: "2026-09-25",
    time: "17:00",
    priority: "High",
    notes: "Bring my blood test results.",
  },
  {
    label: "A workday",
    quote:
      "“I need to review the launch designs on Wednesday at ten. Check the mobile layouts first.”",
    title: "Review launch designs",
    day: "2026-09-23",
    time: "10:00",
    priority: "Medium",
    notes: "Check the mobile layouts first.",
  },
  {
    label: "A little me-time",
    quote:
      "“An evening walk on Thursday at six. Take the long route by the river.”",
    title: "Evening walk",
    day: "2026-09-24",
    time: "18:00",
    priority: "Low",
    notes: "Take the long route by the river.",
  },
];
type Draft = Pick<
  (typeof examples)[number],
  "title" | "day" | "time" | "priority" | "notes"
>;

function Arrow() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </svg>
  );
}
function Check() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function TaskDemo() {
  const [selected, setSelected] = useState(0);
  const [draft, setDraft] = useState<Draft>({ ...examples[0] });
  const [saved, setSaved] = useState(false);
  const [complete, setComplete] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const successHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    setReady(true);
  }, []);
  useEffect(() => {
    if (saved) successHeading.current?.focus({ preventScroll: true });
  }, [saved]);
  function choose(index: number) {
    setSelected(index);
    setDraft({ ...examples[index] });
    setSaved(false);
    setComplete(false);
    setError("");
    setAnnouncement(
      `${examples[index].label} example selected. Review your sample draft.`,
    );
  }
  function update(field: keyof Draft, value: string) {
    setError("");
    setDraft((current) => ({ ...current, [field]: value }));
  }
  const dateValue = new Date(
    `${draft.day || examples[selected].day}T12:00:00Z`,
  );
  const formattedDate = Number.isNaN(dateValue.getTime())
    ? "Choose a date"
    : new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(dateValue);
  return (
    <div className="task-demo">
      <div className="demo-thought">
        <div className="demo-step-label">
          <span>01</span> Start with a thought
        </div>
        <fieldset className="demo-examples" disabled={!ready}>
          <legend className="sr-only">Choose an example</legend>
          {examples.map((example, index) => (
            <button
              key={example.label}
              type="button"
              aria-pressed={selected === index}
              onClick={() => choose(index)}
            >
              {example.label}
            </button>
          ))}
        </fieldset>
        <blockquote key={selected}>{examples[selected].quote}</blockquote>
        <div className="demo-wave" aria-hidden="true">
          <div className="demo-mic">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <rect x="9" y="2" width="6" height="13" rx="3" />
              <path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8" />
            </svg>
          </div>
          <div className="wave-bars">
            {[
              10, 18, 13, 30, 23, 43, 31, 19, 38, 48, 29, 19, 35, 45, 25, 13,
              29, 38, 22, 15, 28, 17, 10, 18, 8,
            ].map((height, index) => (
              <i key={index} style={{ height: `${height}px` }} />
            ))}
          </div>
          <span>0:08</span>
        </div>
        <div className="demo-example-note">
          <span className="status-dot"></span> Interactive walkthrough · sample
          examples
        </div>
        <p className="demo-disclaimer">
          Pick an example and make the draft yours. This demo uses a sample week
          in September 2026. No microphone, AI request, or account needed.
        </p>
      </div>
      <div className="demo-draft">
        <div className="demo-step-label">
          <span>02</span>{" "}
          {saved
            ? "A little more headspace"
            : "Check the details. Make it yours."}
          <span className="demo-preview-badge">PREVIEW</span>
        </div>
        {!saved ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.title.trim()) {
                setError("Give your task a title before adding it.");
                return;
              }
              setSaved(true);
              setAnnouncement(
                `${draft.title.trim()} added to your website preview. Nothing was saved to an account.`,
              );
            }}
          >
            <div className="draft-heading">
              <span className="draft-icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" />
                </svg>
              </span>
              <div>
                <h3>A thought, all sorted.</h3>
                <p>A suggested draft. You have the final say.</p>
              </div>
            </div>
            <div className="demo-field">
              <label htmlFor="demo-title-input">Task title</label>
              <input
                id="demo-title-input"
                disabled={!ready}
                required
                maxLength={160}
                value={draft.title}
                onChange={(event) => update("title", event.target.value)}
              />
            </div>
            <div className="draft-schedule">
              <div className="demo-field">
                <label htmlFor="demo-date">Date</label>
                <input
                  id="demo-date"
                  disabled={!ready}
                  type="date"
                  required
                  min="2020-01-01"
                  max="2100-12-31"
                  value={draft.day}
                  onChange={(event) => update("day", event.target.value)}
                />
              </div>
              <div className="demo-field">
                <label htmlFor="demo-time">Time</label>
                <input
                  id="demo-time"
                  disabled={!ready}
                  type="time"
                  required
                  value={draft.time}
                  onChange={(event) => update("time", event.target.value)}
                />
              </div>
              <div className="demo-field">
                <label htmlFor="demo-priority">Priority</label>
                <select
                  id="demo-priority"
                  disabled={!ready}
                  value={draft.priority}
                  onChange={(event) => update("priority", event.target.value)}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
            <div className="demo-field">
              <label htmlFor="demo-notes">A note for later</label>
              <textarea
                id="demo-notes"
                disabled={!ready}
                rows={2}
                maxLength={8000}
                value={draft.notes}
                onChange={(event) => update("notes", event.target.value)}
              />
            </div>
            {error && (
              <p className="demo-error" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="button demo-save"
              disabled={!ready}
            >
              Add to my preview <Arrow />
            </button>
            <span className="demo-local-note">
              Just a little test drive. Your preview stays in this page.
            </span>
          </form>
        ) : (
          <div className="demo-success">
            <span className="success-icon">
              <Check />
            </span>
            <h3 ref={successHeading} tabIndex={-1}>
              {complete ? "That’s a good feeling." : "There. A little lighter."}
            </h3>
            <p>
              {complete
                ? "One thing done. A little room for the next."
                : "Your thought has a place. Now you can get on with your day."}
            </p>
            <div className={`saved-task ${complete ? "is-complete" : ""}`}>
              <button
                className="complete-task"
                type="button"
                aria-pressed={complete}
                aria-label={
                  complete
                    ? "Mark preview task incomplete"
                    : "Complete preview task"
                }
                onClick={() => {
                  setComplete(!complete);
                  setAnnouncement(
                    complete
                      ? "Preview task reopened."
                      : "Preview task completed.",
                  );
                }}
              >
                {complete && <Check />}
              </button>
              <div>
                <strong>{draft.title.trim()}</strong>
                <span>
                  {formattedDate} · {draft.time} · {draft.priority} priority
                </span>
                {draft.notes && <p>{draft.notes}</p>}
              </div>
            </div>
            <button
              type="button"
              className="text-link"
              onClick={() => choose((selected + 1) % examples.length)}
            >
              Try another thought <Arrow />
            </button>
            <span className="demo-local-note">
              This task is only in your website preview.
            </span>
          </div>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
