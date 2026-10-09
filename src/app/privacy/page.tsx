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
        This version has no analytics, advertising trackers, email collection,
        or sign-up form. Fonts and app screenshots are served with the website.
        This preview is hosted on Google Cloud Run, which processes standard
        connection information, such as IP addresses and request logs, when
        serving pages.
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
