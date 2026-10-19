import type { SiteCopy } from "./types";

export const en: SiteCopy = {
  hero: {
    title: "Say it, and it’s on ",
    titleAccent: "your calendar.",
    description:
      "Tap one button and say what you need to do, even several things at once. TaskFlow puts each one on its day and can remind you before it. An app for Android™ phones.",
    primary: "Try it with your voice",
    secondary: "What it does",
    status: "Coming soon to Google Play. You can’t download it yet.",
    voiceQuote: "“Tomorrow, call the dentist and buy bread.”",
    imageAlt:
      "TaskFlow on an Android phone: tomorrow’s calendar with two tasks, Call the dentist and Buy bread, and the Add a task button.",
  },
  features: {
    title: "What TaskFlow does",
    calendar: {
      title: "Your day on one calendar",
      body: "See your tasks by day, week or month, beside the events from your phone’s calendars if you like. TaskFlow can remind you of tasks with a date: it asks once, the first time you add one.",
      header: "This week",
      weekdays: ["M", "T", "W", "T", "F", "S", "S"],
      events: [
        { title: "A fresh start", detail: "Review this week’s plans" },
        { title: "Some time outside", detail: "Your favorite walking route" },
      ],
    },
    voice: {
      title: "Say several things at once",
      body: "TaskFlow makes one task for each thing you say, with its day and time. Check them, then add them all with one tap.",
      link: "Try it with your voice",
    },
    details: {
      title: "Notes, checklists and files",
      body: "Add notes, a checklist or files to any task. Files are backed up to your account, up to 6 MB each.",
    },
    offline: {
      title: "Your tasks, even offline",
      body: "Your tasks are saved on your phone, so you can check and add them without internet. They’re saved to your account when you’re back online.",
    },
  },
  faq: {
    eyebrow: "A FEW GOOD QUESTIONS",
    title: "Glad you asked.",
    intro: ["A little more about TaskFlow", "and where we’re heading."],
    doodle: ["Less guesswork.", "More clarity."],
    items: [
      {
        question: "Can I download TaskFlow yet?",
        answer:
          "Not yet. TaskFlow is an app for Android phones, in Spanish, Catalan and English, coming soon to Google Play. Until then, you can try it with your voice on this page.",
      },
      {
        question: "Is TaskFlow free?",
        answer:
          "Yes. You get 10 free dictations a month, and one dictation can hold several tasks. When they’re used up, you keep adding tasks with a short form, with no limit, until they come back the next month. TaskFlow Pro, a monthly subscription that renews until you cancel it in Google Play, gives you unlimited dictation and file space (with a safety limit of 50 dictations a day), and also turns sentences you type into tasks. Its price isn’t set yet.",
      },
      {
        question: "Do I need an account?",
        answer:
          "Yes. You sign in once: tap Continue with Google, or use your email and a password, then type the 6-digit code we email you. Your tasks are kept in your account, so you don’t lose them if you change phones.",
      },
      {
        question: "How does voice-to-task work?",
        answer:
          "In the app, record what you need to do in your own words. TaskFlow transcribes your recording and uses AI to suggest tasks with titles, dates, times, priorities, and notes. Check and change the drafts before saving. AI processing needs an internet connection.",
      },
      {
        question: "Can I use it offline?",
        answer:
          "You can create, edit, and complete your own tasks stored on your phone while offline. Account sync, AI processing, and attachment transfers need a connection. Downloaded files work offline; shared-list content is removed when your device next learns that access has ended.",
      },
      {
        question: "Can I share a list?",
        answer:
          "The Android development app supports shared lists. A list owner invites an account and shares a code separately; recipients choose to accept. Editors can change tasks and files, while viewers can read them. This feature is still being tested before public release.",
      },
      {
        question: "Can I keep notes as well as tasks?",
        answer:
          "Yes. The development app has a separate Notes view for ideas and reference material, with optional checklists and links. Choose Task or Note when capturing. Typed notes work locally; recorded notes need online transcription and keep your wording without turning it into scheduled tasks.",
      },
    ],
  },
  closing: {
    title: "Coming soon to Android.",
    body: "TaskFlow isn’t on Google Play yet. Until then, you can try it with your voice on this page.",
    button: "Try it with your voice",
    plans:
      "Free with an account: 10 dictations a month, and tasks by hand with no limit. TaskFlow Pro, a monthly subscription: unlimited dictation and file space.",
  },
};
