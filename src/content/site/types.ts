export type SiteLanguage = "en" | "es" | "ca";

// Every visible string of the home, the frame and the 404, one object per language.
export type SiteCopy = {
  // The home's title and link preview (title, description, the preview image's alt).
  meta: {
    title: string;
    description: string;
    imageAlt: string;
  };
  // The 404 page's block in this language.
  notFound: {
    title: string;
    body: string;
    home: string;
    deleteAccount: string;
  };
  // The header and its phone menu, on every page.
  frame: {
    home: string;
    navigation: string;
    voice: string;
    features: string;
    questions: string;
    comingSoon: string;
    menu: string;
    language: string;
    appearance: string;
    light: string;
    dark: string;
    toDark: string;
    toLight: string;
    // The first Tab stop on every page; it moves focus to the main content.
    skipToContent: string;
    // The footer, on every page.
    footer: {
      navigation: string;
      legal: string;
      privacy: string;
      terms: string;
      legalNotice: string;
      deleteAccount: string;
      support: string;
      // `{company}` stands for the operator's name.
      operator: string;
      trademark: string;
      backToTop: string;
    };
  };
  hero: {
    // `title` ends with the space before `titleAccent`, so the heading's name keeps it.
    title: string;
    titleAccent: string;
    description: string;
    primary: string;
    secondary: string;
    status: string;
    voiceQuote: string;
    imageAlt: string;
  };
  features: {
    title: string;
    calendar: {
      title: string;
      body: string;
      header: string;
      weekdays: string[];
      events: { title: string; detail: string }[];
    };
    voice: { title: string; body: string; link: string };
    details: { title: string; body: string };
    offline: { title: string; body: string };
  };
  faq: {
    title: string;
    items: { question: string; answer: string }[];
  };
  closing: {
    title: string;
    body: string;
    button: string;
    // WD2's free-plan line, worded as decided.
    plans: string;
  };
  // The live demo (#voice).
  voice: {
    title: string;
    intro: string;
    // The demo's own limit, under the intro paragraph.
    badge: string;
    // The closed card: the languages and length, the start button, the no-JavaScript line.
    speak: string;
    start: string;
    noscript: string;
    // WD1's static example, laid out like the app's result.
    example: {
      label: string;
      quote: string;
      heading: string;
      tasks: { title: string; date: string }[];
    };
    // Under the record button; the link goes to the privacy page's #website section.
    privacy: string;
    privacyLink: string;
    // Under the capture stage.
    fine: string;
    // While the demo opens (the app's captureStarting).
    starting: string;
    // The open demo's top line. `{n}` stands for the tries left.
    triesLeft: string;
    liveDemo: string;
    close: string;
    // The capture stage's heading (the app's rememberPrompt).
    heading: string;
    // The record button's visible label, and the line under it before the first tap.
    talk: string;
    micHint: string;
    // While the browser's microphone prompt is open.
    micWaiting: string;
    // Stops listening and sends; in typing mode, sends (the app's done).
    done: string;
    // Resends a recording or text whose request is still to be retrieved, without another try
    // (the app's retry).
    tryAgain: string;
    // The visible timer; `{time}` is minutes:seconds (the app's listeningSeconds).
    listening: string;
    // Spoken once each: when listening starts, at 50 s (also shown), and when sent.
    listeningStatus: string;
    tenSecondsLeft: string;
    understanding: string;
    // The links between talking and typing (the app's captureTypeInstead, and back).
    typeInstead: string;
    talkInstead: string;
    // Typing mode: the text box's label and placeholder (the app's teaching example).
    textLabel: string;
    textPlaceholder: string;
    // `{n}` and `{max}` are formatted with Intl.NumberFormat in the page's language.
    textCount: string;
    // Typing mode only: in the app, typed sentences into tasks is TaskFlow Pro.
    textPro: string;
    // Microphone errors, by the error's name; each is followed by the text box.
    micBlocked: string;
    micMissing: string;
    micFailed: string;
    micUnsupported: string;
    // The result, as the app shows it (captureThingsToAdd); `{n}` is the number of tasks.
    thingsToAdd: { one: string; other: string };
    // A task's date line without a date (the app's noDate).
    noDate: string;
    // A question from the AI; `{question}` is its text (the app's reviewResolve).
    checkDetail: string;
    // Local demo feedback when every generated task is checked.
    completionTitle: string;
    completionBody: string;
    // Under the tasks, and in the tries-used state: what the app does, and that it isn't out yet.
    handOver: string;
    // The result's action: a spoken result starts listening again; a typed one goes back to the text.
    sayAgain: string;
    changeText: string;
    // The transcript's summary (the app's reviewOriginal).
    seeWhatISaid: string;
    // A result with no tasks (the app's captureNoTasks).
    noTasks: string;
    // Every try used. `{weekday}` and `{time}` come from resetAt, in the page's language:
    // `today` when it falls on the visitor's date, `AtOne` when the hour shown is 1.
    triesUsed: {
      onDay: string;
      onDayAtOne: string;
      today: string;
      todayAtOne: string;
    };
    triesUsedLater: string;
    // While waiting: from 10 s, the line and the button that stops waiting.
    stillUnderstanding: string;
    stopWaiting: string;
    // The security check: waiting for a tap, and failing to load (with Try again).
    checkTap: string;
    checkFailed: string;
    // Failures, by what happened; the server's own messages are never shown.
    errors: {
      offline: string;
      // Opening the demo with no connection: nothing has been said yet.
      offlineOpening: string;
      notAnswering: string;
      timeout: string;
      networkLimit: string;
      // Shown under the static example.
      off: string;
      // Shown under the static example after the security check fails twice.
      unverified: string;
      invalidDraft: string;
      recording: string;
      processing: string;
      sayAgain: string;
      // The app's captureEmptyInput.
      empty: string;
    };
  };
};
