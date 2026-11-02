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
      privacy: "Privacy Policy",
      terms: "Terms and Conditions",
      legalNotice: "Legal Notice",
      deleteAccount: "Delete account",
      support: "Email support",
      operator: "A product by {company}",
      trademark: "Android is a trademark of Google\u00a0LLC.",
      backToTop: "Back to top",
    },
  },
  hero: {
    title: "Say it, and it’s on ",
    titleAccent: "your calendar.",
    description:
      "An app for Android™ phones: tap one button and say what you need to do, even several things at once. TaskFlow puts each one on its day and can remind you beforehand.",
    primary: "Try it with your voice",
    secondary: "What it does",
    status: "Coming soon to Google Play. You can’t download it yet.",
    free: "Free with an account: 10 dictations a month, and tasks by hand with no limit.",
    voiceQuote: "“Tomorrow, call the dentist and buy bread.”",
    imageAlt:
      "TaskFlow on an Android phone: tomorrow’s calendar with two tasks, Call the dentist and Buy bread, and the Add a task button.",
  },
  features: {
    title: "What TaskFlow does",
    calendar: {
      title: "Your day on one calendar",
      body: "See your tasks by day, week or month, beside the events from your phone’s calendars if you like. TaskFlow can remind you of tasks with a date, more and more often as the day gets closer.",
      header: "This week",
      weekdays: ["M", "T", "W", "T", "F", "S", "S"],
      events: [
        { title: "A fresh start", detail: "Review this week’s plans" },
        { title: "Some time outside", detail: "Your favorite walking route" },
      ],
    },
    voice: {
      title: "Say several things at once",
      body: "TaskFlow makes one task for each thing you say, with its day and time. Check them, then add them all with one tap. In the app, you can also move all of yesterday’s tasks to tomorrow by voice, or complete many at once.",
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
        answer: [
          "Yes. You get 10 free dictations a month, and one dictation can hold several tasks. When they’re used up, you keep adding tasks with a short form, with no limit, until they come back the next month. Reminders are free too, even the ones that come more and more often as the day gets closer.",
          "TaskFlow Pro is a monthly subscription that renews until you cancel it in Google Play. It gives you unlimited dictation and file space (with a safety limit of 50 dictations a day). It also turns sentences you type into tasks, and lets you ask for reminders in your own words. Its price isn’t set yet.",
        ],
      },
      {
        question: "Do I need an account?",
        answer:
          "Yes. The first time, tap Continue with Google; or tap Continue with email, choose a password and type the 6-digit code we email you. Your tasks are kept in your account, so you don’t lose them if you change phones.",
      },
      {
        question: "How do I add tasks by voice?",
        answer:
          "Tap Add a task and say what you need to do, in your own words; several things at once is fine. Tap Done, and TaskFlow shows one task for each, with its day and time. Add them all with one tap. You can also ask what you have this week, or move, change, complete or delete tasks by voice, even all of yesterday’s at once. TaskFlow shows the change first, and you can undo it. Understanding what you say needs the internet: your words are sent to Google.",
      },
      {
        question: "Can I add something that repeats?",
        answer:
          "Yes. Say “every Monday” or “every day at 9” when you add it, or tap More details and choose Repeat. Each time shows on your calendar, and TaskFlow can remind you.",
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
          "Yes. The Notes tab keeps what you want to remember that isn’t a task, like a gift idea. Tap Add a note, then write or dictate it; add links or a checklist if you like.",
      },
      {
        question: "Can I add tasks from my home screen or from WhatsApp?",
        answer:
          "Yes. Use the Dictate a task widget or shortcut, or share a message to TaskFlow from another app, such as WhatsApp.",
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
  voice: {
    title: "Try it with your voice",
    intro:
      "Say a few things you need to do, and when. You’ll see the tasks TaskFlow would add.",
    badge: "This demo: 3 tries a day, no sign-up",
    speak: "Speak in English, Spanish or Catalan, for up to a minute.",
    start: "Try the live demo",
    noscript: "Turn on JavaScript to try it with your voice.",
    example: {
      label: "For example, say:",
      quote: "“Tomorrow, call the dentist and buy bread.”",
      heading: "2 things to add",
      tasks: [
        { title: "Call the dentist", date: "Tomorrow" },
        { title: "Buy bread", date: "Tomorrow" },
      ],
    },
    privacy:
      "What you say or type goes to Google only when you tap Done or the minute is up. We don’t keep your recording, and the text is deleted automatically after 24 hours.",
    privacyLink: "How we use your data",
    fine: "It can get dates wrong, so check them. Nothing here is saved to the app.",
    starting: "One moment…",
    triesLeft: "{n} of 3 tries left",
    liveDemo: "Live demo",
    close: "Close demo",
    heading: "What would you like to remember?",
    talk: "Tap to talk",
    micHint: "Up to a minute. Your browser will ask to use the microphone.",
    micWaiting: "Waiting for the microphone…",
    done: "Done",
    tryAgain: "Try again",
    listening: "Listening · {time}",
    listeningStatus: "Listening",
    secondsLeft: { one: "1 second left", other: "{n} seconds left" },
    understanding: "Understanding…",
    typeInstead: "Type instead",
    talkInstead: "Talk instead",
    textLabel: "Type what you need to do",
    textPlaceholder: "Tomorrow, call the dentist and buy bread.",
    textCount: "{n} / {max} characters",
    textPro:
      "In the app, turning typed sentences into tasks is part of TaskFlow Pro. Without Pro, you say them, or add each task with a short form.",
    micBlocked:
      "The microphone is off for this page. Turn it on in your browser’s settings for this site, or type instead.",
    micDismissed:
      "To talk, tap Talk instead and allow the microphone when your browser asks. Or type here.",
    micMissing:
      "We can’t find a microphone on this device. You can type instead.",
    micFailed:
      "The microphone isn’t responding. Close other apps that may be using it and try again, or type instead.",
    micUnsupported:
      "This browser can’t record your voice. You can type instead.",
    thingsToAdd: { one: "1 thing to add", other: "{n} things to add" },
    noDate: "No date",
    today: "Today",
    tomorrow: "Tomorrow",
    checkDetail: "Check this detail: {question}",
    completionTitle: "All clear. Take a breath.",
    completionBody: "Imagine a little more calm in your day.",
    handOver:
      "In the app: tap Add a task, say it, tap Done, and add it to your calendar. Coming soon to Google Play.",
    sayAgain: "Say it again",
    changeText: "Change the text",
    seeWhatISaid: "See what I said",
    originalText: "Original text",
    completeTask: "Complete {title}",
    noTasks:
      "I didn’t find a task. Say what and when, for example: “Tomorrow, call the dentist.” That used a try.",
    triesUsed: {
      onDay:
        "You’ve used this demo’s 3 tries. You can try again on {weekday} at {time}.",
      onDayAtOne:
        "You’ve used this demo’s 3 tries. You can try again on {weekday} at {time}.",
      today:
        "You’ve used this demo’s 3 tries. You can try again today at {time}.",
      todayAtOne:
        "You’ve used this demo’s 3 tries. You can try again today at {time}.",
    },
    triesUsedLater: "You’ve used this demo’s 3 tries. You can try again later.",
    stillUnderstanding: "Still understanding. It can take up to 40 seconds.",
    stopWaiting: "Stop waiting",
    checkTap: "Tap the security check above to continue.",
    checkFailed:
      "The security check didn’t load. Check your connection, then tap Try again.",
    errors: {
      offline:
        "No connection. Check Wi-Fi or mobile data and try again. Your words are kept, and trying again won’t cost an extra try.",
      offlineOpening: "No connection. Check Wi-Fi or mobile data and try again.",
      notAnswering:
        "The demo isn’t answering right now. Try again in a few minutes.",
      timeout:
        "This is taking too long. Try again in a moment; it won’t use another try.",
      networkLimit:
        "Many people on this network have tried the demo. Try again later, or from another connection.",
      off: "The live demo is off for now. The example above shows what TaskFlow does.",
      unverified:
        "The security check didn’t load, so the live demo can’t run here. The example above shows what TaskFlow does.",
      invalidDraft:
        "We couldn’t turn that into tasks. Say what you need to do, and when.",
      recording:
        "We couldn’t hear that recording. Record it again; it didn’t use a try.",
      processing:
        "Still understanding. Try again in a moment; it won’t use another try.",
      sayAgain: "Something went wrong. Please try again.",
      empty: "Say or type what you need to do first.",
    },
  },
};
