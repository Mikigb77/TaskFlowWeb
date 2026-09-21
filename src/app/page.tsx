import Icon from "../components/Icon";
import Phone from "../components/Phone";
import TaskDemo from "../components/TaskDemo";
const faqs = [
  [
    "Can I download TaskFlow yet?",
    "TaskFlow is currently in development, with Android as the first testing platform. A public download is coming later. For now, explore the real app screens and try the interactive walkthrough on this page.",
  ],
  [
    "How does voice-to-task work?",
    "In the app, record what you need to do in your own words. TaskFlow transcribes your recording and uses AI to suggest a title, date, time, priority, and notes. You can check and change the draft before saving. Voice capture needs an internet connection and a signed-in account.",
  ],
  [
    "Can I use it offline?",
    "You can create, edit, and complete tasks stored on your phone while offline. Account sync and AI voice capture need a connection. Local attachments stay on the device where you added them.",
  ],
  [
    "Do I need an account?",
    "You can start planning locally without an account. Sign in to sync your tasks with the backend and use voice capture. Account recovery is available if you forget your password.",
  ],
  [
    "Will TaskFlow be free?",
    "Launch pricing has not been announced. We are still testing the app and its AI features, so there are no paid plans or subscriptions to sign up for on this website.",
  ],
];

import { ThemeToggle } from "../components/ThemeProvider";

export default function HomePage() {
  return (
    <>
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">
            <span className="status-dot"></span> A LITTLE FOCUS. A LITTLE FLOW.
          </div>
          <h1 id="hero-title">
            Make room
            <br />
            for a{" "}
            <span className="hero-accent">
              clearer day.
              <svg viewBox="0 0 470 18" fill="none" aria-hidden="true">
                <path
                  d="M3 12C138 0 293 2 462 8M29 16c151-7 288-5 401-2"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="hero-description">
            Big plans. Small reminders. All the things in between.
            <br className="desktop-break" /> Bring them together in one calm
            space, and get back to living.
          </p>
          <div className="hero-buttons">
            <a href="#demo" className="button">
              See it in action <Icon name="arrow" />
            </a>
            <a href="#features" className="text-link">
              Meet TaskFlow{" "}
              <span className="link-circle">
                <Icon name="chevron" size={15} />
              </span>
            </a>
          </div>
          <div className="hero-footnote">
            <span className="mini-check">
              <Icon name="check" size={12} />
            </span>{" "}
            Less organizing. More getting on with your day.
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="A preview of the TaskFlow mobile app"
        >
          <div className="hero-stage" aria-hidden="true">
            <span className="orbit orbit-one"></span>
            <span className="orbit orbit-two"></span>
            <span className="stage-cross">+</span>
            <span className="stage-dot"></span>
            <span className="stage-caption">A LITTLE SPACE TO THINK.</span>
          </div>
          <div className="floating-note note-voice">
            <span className="note-icon">
              <Icon name="mic" size={20} />
            </span>
            <div>
              <small>JUST SAY THE WORD</small>
              <strong>“A walk at six.”</strong>
            </div>
            <div className="mini-wave" aria-hidden="true">
              {[8, 16, 23, 12, 29, 18, 9].map((height) => (
                <i key={height} style={{ height: `${height}px` }}></i>
              ))}
            </div>
          </div>
          <Phone eager className="hero-phone" />
          <div className="floating-note note-done">
            <span className="done-check">
              <Icon name="check" size={20} />
            </span>
            <div>
              <strong>Make a little time for you</strong>
              <small>That belongs on your list, too.</small>
            </div>
            <span className="note-spark" aria-hidden="true">
              <Icon name="asterisk" size={28} />
            </span>
          </div>
          <span className="hero-art-label">
            <span></span> YOUR DAY, LOOKING A LITTLE LIGHTER.
          </span>
        </div>
      </section>

      <div className="promise-bar container" aria-label="TaskFlow at a glance">
        <span>
          <Icon name="calendar" /> A clearer calendar
        </span>
        <span>
          <Icon name="mic" /> Your words, into action
        </span>
        <span>
          <Icon name="notes" /> Every detail, together
        </span>
        <span>
          <Icon name="leaf" /> A calmer kind of productive
        </span>
      </div>

      <section
        id="features"
        className="features-section section-space container"
        aria-labelledby="features-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow section-eyebrow">
              <span>01 /</span> FIND YOUR EVERYDAY FLOW
            </p>
            <h2 id="features-title">
              A place for everything.
              <br />
              <span className="muted-heading">A little space for you.</span>
            </h2>
          </div>
          <p>
            Life comes with enough moving parts.
            <br />
            Your to-do list doesn’t need to be another one.
          </p>
        </div>
        <div className="feature-grid">
          <article className="feature-calendar feature-card">
            <div className="feature-card-copy">
              <span className="feature-icon">
                <Icon name="calendar" size={23} />
              </span>
              <h3>See the shape of your day.</h3>
              <p>
                Start with your calendar. Zoom out to the month or settle into
                the week, with your tasks right where they belong.
              </p>
            </div>
            <div className="calendar-illustration" aria-hidden="true">
              <div className="calendar-mini-header">
                <span>A good week ahead</span>
                <span>
                  September <b>2026</b>
                </span>
              </div>
              <div className="mini-week">
                {[
                  ["M", "21"],
                  ["T", "22"],
                  ["W", "23"],
                  ["T", "24"],
                  ["F", "25"],
                  ["S", "26"],
                  ["S", "27"],
                ].map(([day, date], i) => (
                  <div
                    key={i}
                    className={`mini-day ${i === 0 ? "selected" : ""}`}
                  >
                    <span>{day}</span>
                    <strong>{date}</strong>
                    <i></i>
                  </div>
                ))}
              </div>
              <div className="mini-event">
                <span className="event-time">10:00</span>
                <span className="event-line"></span>
                <div>
                  <strong>A fresh start</strong>
                  <small>Review this week’s plans</small>
                </div>
                <span className="event-dot"></span>
              </div>
              <div className="mini-event event-secondary">
                <span className="event-time">18:00</span>
                <span className="event-line"></span>
                <div>
                  <strong>Some time outside</strong>
                  <small>Your favorite walking route</small>
                </div>
                <Icon name="leaf" size={19} />
              </div>
            </div>
          </article>
          <article className="feature-voice feature-card">
            <div className="feature-card-copy">
              <span className="feature-icon">
                <Icon name="mic" size={23} />
              </span>
              <h3>Say it. Get on with it.</h3>
              <p>
                Turn a passing thought into a task. Speak naturally, then review
                the details before you save.
              </p>
              <a href="#demo" className="inline-link">
                Give it a try <Icon name="arrow" size={17} />
              </a>
            </div>
            <div className="voice-illustration" aria-hidden="true">
              <div className="voice-orbit"></div>
              <div className="voice-orbit outer"></div>
              <div className="voice-circle">
                <Icon name="mic" size={32} />
              </div>
              <div className="voice-caption">
                One less thing to hold in your head.
              </div>
            </div>
          </article>
          <article className="feature-details feature-card">
            <span className="feature-icon">
              <Icon name="notes" size={23} />
            </span>
            <h3>The little details matter.</h3>
            <p>
              Notes, priorities, and attachments. Keep what you need beside what
              you need to do.
            </p>
            <div className="detail-chips" aria-hidden="true">
              <span>
                <Icon name="flag" size={13} /> High priority
              </span>
              <span>
                <Icon name="notes" size={13} /> Bring the results
              </span>
            </div>
          </article>
          <article className="feature-offline feature-card">
            <span className="feature-icon">
              <Icon name="wifiOff" size={23} />
            </span>
            <h3>Life doesn’t always have Wi-Fi.</h3>
            <p>
              Keep planning with tasks on your phone. Sign in to back them up
              when you’re connected.
            </p>
            <div className="offline-status">
              <span className="status-dot"></span> Your plans can come along.
            </div>
          </article>
        </div>
      </section>

      <section
        id="demo"
        className="demo-section section-space"
        aria-labelledby="demo-title"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow section-eyebrow">
                <span>02 /</span> FROM THOUGHT TO TASK
              </p>
              <h2 id="demo-title">
                You have a lot on your mind.
                <br />
                <span className="muted-heading">Let a little of it go.</span>
              </h2>
            </div>
            <p>
              No perfect wording. No field-by-field thinking.
              <br />A few words are all it takes to get started.
            </p>
          </div>
          <TaskDemo />
          <noscript>
            <p className="noscript-note">
              Enable JavaScript to try the interactive demo. In the app, your
              words become an editable draft with a title, schedule, priority,
              and notes.
            </p>
          </noscript>
        </div>
      </section>

      <section
        id="appearance"
        className="appearance-section section-space container"
        aria-labelledby="appearance-title"
      >
        <div className="appearance-visual">
          <div className="appearance-halo" aria-hidden="true"></div>
          <Phone screen="tasks" className="appearance-phone" />
          <span className="appearance-tag">
            <span className="status-dot"></span> A GOOD LOOK, ANY TIME OF DAY.
          </span>
        </div>
        <div className="appearance-copy">
          <p className="eyebrow section-eyebrow">
            <span>03 /</span> MADE TO FEEL LIKE YOU
          </p>
          <h2 id="appearance-title">
            A softer start.
            <br />A quieter finish.
          </h2>
          <p>
            Bright mornings or late-night plans. Find your flow in light or dark
            mode, with the same thoughtful details in every view.
          </p>
          <div className="appearance-options">
            <span>
              <Icon name="sun" /> A little light
            </span>
            <span className="appearance-divider"></span>
            <span>
              <Icon name="moon" /> A little dark
            </span>
          </div>
          <ThemeToggle variant="mood" />
          <p className="appearance-footnote">
            Tap to change the whole website, too.
          </p>
        </div>
      </section>

      <section
        id="questions"
        className="faq-section section-space container"
        aria-labelledby="questions-title"
      >
        <div className="faq-intro">
          <p className="eyebrow section-eyebrow">
            <span>04 /</span> A FEW GOOD QUESTIONS
          </p>
          <h2 id="questions-title">Glad you asked.</h2>
          <p>
            A little more about TaskFlow
            <br />
            and where we’re heading.
          </p>
          <div className="faq-doodle" aria-hidden="true">
            <Icon name="spark" size={56} />
            <span>
              Less guesswork.
              <br />
              More clarity.
            </span>
          </div>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question} className="faq-item" name="questions">
              <summary>
                {question}
                <span className="faq-plus">
                  <Icon name="plus" size={18} />
                </span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        id="get-taskflow"
        className="closing-section container"
        aria-labelledby="closing-title"
      >
        <div className="closing-card">
          <div className="closing-spark" aria-hidden="true">
            <Icon name="asterisk" size={44} />
          </div>
          <p className="eyebrow">GOOD DAYS START WITH A LITTLE SPACE.</p>
          <h2 id="closing-title">
            Less on your mind.
            <br />
            More room for life.
          </h2>
          <p>
            Your next chapter of getting things done
            <br />
            can feel a little different.
          </p>
          <a href="#demo" className="button button-lime">
            Find your flow <Icon name="arrow" />
          </a>
          <span className="launch-note">
            <span></span> Android app in development · Public download coming
            soon
          </span>
          <div className="closing-orbit" aria-hidden="true"></div>
        </div>
      </section>
    </>
  );
}
