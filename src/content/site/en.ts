import type { SiteCopy } from "./types";

export const en: SiteCopy = {
  meta: {
    title: "TaskFlow — Say it, and it’s on your calendar",
    description:
      "Note down what you need to do, and TaskFlow puts it on your calendar. Say several things at once. For Android phones, coming soon to Google Play.",
    imageAlt:
      "TaskFlow’s calendar on an Android phone, with “Call the dentist” and “Buy bread” on tomorrow",
  },
  notFound: {
    title: "Page not found",
    body: "This address doesn’t exist on the TaskFlow website.",
    home: "Go to the TaskFlow home page",
    deleteAccount: "Delete account",
  },
  frame: {
    home: "TaskFlow home",
    navigation: "Main navigation",
    voice: "Try it with your voice",
    features: "What it does",
    questions: "Questions",
    comingSoon: "Coming soon to Android",
    menu: "Menu",
    language: "Language",
    appearance: "Appearance",
    light: "Light",
    dark: "Dark",
    toDark: "Switch to dark mode",
    toLight: "Switch to light mode",
    skipToContent: "Skip to content",
    footer: {
      navigation: "Footer navigation",
      legal: "Legal and privacy",
      privacy: "Privacy",
      terms: "Terms and Conditions",
      legalNotice: "Legal Notice",
      deleteAccount: "Delete account",
      support: "Email support",
      operator: "A product by {company}",
      trademark: "Android is a trademark of Google LLC.",
      backToTop: "Back to top",
    },
  },
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
    title: "Questions",
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
        question: "How do I add tasks by voice?",
        answer:
          "Tap Add a task and say what you need to do, in your own words; several things at once is fine. Tap Done, and TaskFlow shows one task for each, with its day and time. Add them all with one tap. You can also ask what you have this week, or move, change or delete a task by voice: TaskFlow shows the change first, and you can undo it. It needs the internet: your words are sent to Google to be turned into tasks.",
      },
      {
        question: "Can I use it offline?",
        answer:
          "Yes. Your tasks are saved on your phone, so you can check, add and complete them without internet. Saving to your account, understanding what you say, and uploading files need a connection.",
      },
      {
        question: "Can I share tasks with my family?",
        answer:
          "Yes. Share a project, such as Home or Shopping: tap Share and invite someone by email. Once they accept, everyone in the project sees its tasks. Each task shows who created it, and you can see just one person’s tasks.",
      },
      {
        question: "Can I keep notes as well as tasks?",
        answer:
          "Yes. The Notes tab keeps what you want to remember that isn’t a task, like a Wi-Fi password. Tap Add a note, then write or dictate it; add links or a checklist if you like.",
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
