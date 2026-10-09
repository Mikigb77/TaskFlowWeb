import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Your privacy on this website — TaskFlow",
  description:
    "How the TaskFlow marketing preview handles your theme preference and interactive demo.",
  alternates: process.env.SITE_URL ? { canonical: "/privacy/" } : undefined,
};
export default function PrivacyPage() {
  return (
    <article className="prose-page container">
      <a href="/" className="inline-link">
        ← Back to TaskFlow
      </a>
      <p className="eyebrow section-eyebrow">A LITTLE CLARITY</p>
      <h1>
        Your privacy
        <br />
        on this website.
      </h1>
      <p className="prose-lead">
        This is a marketing preview of TaskFlow. Here is what happens when you
        explore it.
      </p>
      <h2>Your appearance preference</h2>
      <p>
        If you switch between light and dark mode, this website remembers your
        choice in your browser’s local storage. You can remove it by clearing
        this site’s browser data.
      </p>
      <h2>The interactive walkthrough</h2>
      <p>
        The walkthrough uses built-in example tasks. Your edits stay in this
        page’s memory and disappear when you reload or leave. The demo does not
        access your microphone, send your text to an AI service, or save tasks
        to an account.
      </p>
      <h2>Website services</h2>
      <p>
        There are no advertising trackers, email collection, or sign-up forms.
        Fonts and app screenshots are served with the website. Cloudflare and
        Google Cloud Run process connection information, including IP addresses
        and request logs, to deliver and protect the site.
      </p>
      <h2>The optional live voice demo</h2>
      <p>
        Opening the live demo loads Cloudflare Turnstile to check for automated
        abuse and sets a secure, essential visitor cookie for the three-try
        allowance. It lasts up to 30 days. Cloudflare receives browser and
        connection signals for this security check. Recording starts only after
        you press the microphone button and allow access. Recordings stay in
        your browser until you press “Create drafts”.
      </p>
      <p>
        Creating drafts sends your recording or typed text and timezone to our
        server and Google’s managed Gemini service. Processing uses a global
        endpoint and may occur outside your country. Avoid confidential or
        sensitive information in this public demonstration. We do not store
        recordings. An encrypted copy of the transcript and generated drafts is
        kept temporarily so retrying the same request does not cause another AI
        call. It becomes inaccessible after 24 hours and is then queued for
        automatic deletion; the database may take additional time to remove it.
      </p>
      <p>
        We store a keyed hash of your network address and short-lived attempt
        timestamps to enforce limits. Those records expire after 48 hours and
        are queued for deletion. Aggregate monthly counts, audio duration, token
        usage, and estimated costs are retained to manage the demo’s budget.
        They contain no recordings or task text. Drafts you edit in the preview
        list remain in this page’s memory and disappear on reload. Nothing is
        added to an app account or calendar.
      </p>
      <h2>The mobile app is separate</h2>
      <p>
        The mobile app’s account, backup, and AI voice features use backend
        services. This website notice describes only the marketing preview.
        App-specific privacy information and support contact details will be
        provided before a public app launch.
      </p>
      <p className="prose-updated">Last updated: 9 October 2026</p>
    </article>
  );
}
