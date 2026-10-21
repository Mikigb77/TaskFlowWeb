// Acceptance tests for the live demo from the UX web loop, run 2026-10-18-site, that prove
// held changes (VoiceDemo.tsx holds the other session's uncommitted work): WP33's tries-used
// line, and round 1's WP26 (the intro, the static example, the privacy line), WP27 (one tap
// to talk, Done sends, typing, microphone errors, announcements) and WP28 (the result as
// the app shows it, the hand-over, tries used), and round 2's WP39 (the full weekday, one
// way to resend a recording, a status that clears), and round 3's WP42 (Try again stays put
// while the resend waits), and batch 4's WP29 (waiting, failures and the security check in
// plain words, in the page's language, at a readable size), and batch 5's WP46 (WEB-6, WEB-9
// and WEB-109 verified), WP48 (the demo in the page's language) and WP49 (the held Try
// again's ring, the privacy line). This file stays uncommitted with them.
// Every /api/voice/* request is stubbed (tests/support/ux-web.ts); the recordings use
// Chromium's fake microphone.
import type { Locator, Page } from "@playwright/test";
import type { Project, Scenario, VoiceStub } from "./support/ux-voice";
import {
  expireTimeouts,
  fakeTime,
  heldTimeouts,
  releaseToken,
  scenarios,
  serverErrors,
  TASKS,
  TRANSCRIPT,
  turnstileRenders,
  VOICE_PANEL,
} from "./support/ux-voice";
import { ca } from "../src/content/site/ca";
import { en } from "../src/content/site/en";
import { es } from "../src/content/site/es";
import {
  axeViolations,
  contrast,
  doubleTextSize,
  expect,
  homeUrl,
  hydrated,
  type Language,
  LANGUAGES,
  parseColor,
  ROOT,
  rootFontSize,
  smallestText,
  test,
  THEMES,
} from "./support/ux-web";
import { CLOSING, TRY_VOICE } from "./support/ux-web-copy";

test.use({
  colorScheme: "light",
  launchOptions: {
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
});

type Copy = Record<Language, string>;
// The plan's exact copy (WP26–WP28), for the checks that are about the wording.
const VOICE = {
  title: { en: "Try it with your voice", es: "Pruébalo con tu voz", ca: "Prova-ho amb la teva veu" } as Copy,
  intro: {
    en: "Say a few things you need to do, and when. You’ll see the tasks TaskFlow would add.",
    es: "Di algunas cosas que tengas que hacer y cuándo. Verás las tareas que TaskFlow añadiría.",
    ca: "Digues algunes coses que hagis de fer i quan. Veuràs les tasques que TaskFlow afegiria.",
  } as Copy,
  badge: {
    en: "This demo: 3 tries a day, no sign-up",
    es: "Esta demo: 3 intentos al día, sin registrarte",
    ca: "Aquesta demo: 3 intents al dia, sense registrar-te",
  } as Copy,
  start: { en: "Try the live demo", es: "Probar la demo en directo", ca: "Prova la demo en directe" } as Copy,
  noscript: {
    en: "Turn on JavaScript to try it with your voice.",
    es: "Activa JavaScript para probarlo con tu voz.",
    ca: "Activa JavaScript per provar-ho amb la teva veu.",
  } as Copy,
  example: {
    label: { en: "For example, say:", es: "Por ejemplo, di:", ca: "Per exemple, digues:" } as Copy,
    quote: {
      en: "“Tomorrow, call the dentist and buy bread.”",
      es: "«Mañana, llamar al dentista y comprar pan.»",
      ca: "«Demà, trucar al dentista i comprar pa.»",
    } as Copy,
    heading: { en: "2 things to add", es: "2 cosas para añadir", ca: "2 coses per afegir" } as Copy,
    cards: {
      en: [
        ["Call the dentist", "Tomorrow"],
        ["Buy bread", "Tomorrow"],
      ],
      es: [
        ["Llamar al dentista", "Mañana"],
        ["Comprar pan", "Mañana"],
      ],
      ca: [
        ["Trucar al dentista", "Demà"],
        ["Comprar pa", "Demà"],
      ],
    } as Record<Language, [string, string][]>,
  },
  privacy: {
    en: "What you say or type goes to Google only when you tap Done. We don’t keep your recording, and the text is deleted automatically after 24 hours.",
    es: "Lo que dices o escribes va a Google solo cuando tocas Listo. No guardamos tu grabación, y el texto se borra automáticamente pasadas 24 horas.",
    ca: "El que dius o escrius va a Google només quan toques Fet. No desem la gravació, i el text s’esborra automàticament passades 24 hores.",
  } as Copy,
  privacyLink: {
    en: "How we use your data",
    es: "Cómo usamos tus datos",
    ca: "Com fem servir les teves dades",
  } as Copy,
  talk: { en: "Tap to talk", es: "Toca para hablar", ca: "Toca per parlar" } as Copy,
  done: { en: "Done", es: "Listo", ca: "Fet" } as Copy,
  typeInstead: { en: "Type instead", es: "Escribir", ca: "Escriu" } as Copy,
  textLabel: {
    en: "Type what you need to do",
    es: "Escribe lo que tienes que hacer",
    ca: "Escriu el que has de fer",
  } as Copy,
  count: {
    en: "0 / 1,500 characters",
    es: "0 / 1500 caracteres",
    ca: "0 / 1.500 caràcters",
  } as Copy,
  textPro: {
    en: "In the app, turning typed sentences into tasks is part of TaskFlow Pro. Without Pro, you say them, or add each task with a short form.",
    es: "En la app, convertir frases escritas en tareas es parte de TaskFlow Pro. Sin Pro, las dices, o añades cada tarea con un formulario sencillo.",
    ca: "A l’aplicació, convertir frases escrites en tasques forma part de TaskFlow Pro. Sense Pro, les dius, o afegeixes cada tasca amb un formulari senzill.",
  } as Copy,
  mic: {
    denied: {
      en: "The microphone is off for this page. Turn it on in your browser’s settings for this site, or type instead.",
      es: "El micrófono está desactivado para esta página. Actívalo en los ajustes del navegador para este sitio o escribe.",
      ca: "El micròfon està desactivat per a aquesta pàgina. Activa’l a la configuració del navegador per a aquest lloc o escriu.",
    } as Copy,
    missing: {
      en: "We can’t find a microphone on this device. You can type instead.",
      es: "No encontramos ningún micrófono en este dispositivo. Puedes escribir.",
      ca: "No trobem cap micròfon en aquest dispositiu. Pots escriure.",
    } as Copy,
    other: {
      en: "The microphone isn’t responding. Close other apps that may be using it and try again, or type instead.",
      es: "El micrófono no responde. Cierra otras apps que puedan estar usándolo y vuelve a probar, o escribe.",
      ca: "El micròfon no respon. Tanca altres aplicacions que el puguin estar fent servir i torna-ho a provar, o escriu.",
    } as Copy,
    unsupported: {
      en: "This browser can’t record your voice. You can type instead.",
      es: "Este navegador no puede grabar tu voz. Puedes escribir.",
      ca: "Aquest navegador no pot gravar la teva veu. Pots escriure.",
    } as Copy,
  },
  listening: { en: "Listening", es: "Escuchando", ca: "S’està escoltant" } as Copy,
  tenSeconds: { en: "10 seconds left", es: "Quedan 10 segundos", ca: "Queden 10 segons" } as Copy,
  understanding: { en: "Understanding…", es: "Entendiendo…", ca: "Entenent…" } as Copy,
  twoThings: { en: "2 things to add", es: "2 cosas para añadir", ca: "2 coses per afegir" } as Copy,
  noDate: { en: "No date", es: "Sin fecha", ca: "Sense data" } as Copy,
  handOver: {
    en: "In the app: tap Add a task, say it, tap Done, and add it to your calendar. Coming soon to Google Play.",
    es: "En la app: toca Añadir tarea, dilo, toca Listo y añádelo al calendario. Muy pronto en Google Play.",
    ca: "A l’aplicació: toca Afegeix una tasca, digues-ho, toca Fet i afegeix-ho al calendari. Molt aviat a Google Play.",
  } as Copy,
  seeWhatISaid: { en: "See what I said", es: "Ver lo que dije", ca: "Mostra què he dit" } as Copy,
  noTasks: {
    en: "No tasks were found. Your words are kept. That used a try.",
    es: "No se encontraron tareas. Tus palabras se conservan. Ha contado como un intento.",
    ca: "No s’ha trobat cap tasca. Les teves paraules es conserven. Ha comptat com un intent.",
  } as Copy,
  triesUsedStart: {
    en: "You’ve used this demo’s 3 tries.",
    es: "Ya has usado los 3 intentos de esta demo.",
    ca: "Ja has fet servir els 3 intents d’aquesta demo.",
  } as Copy,
};
// Words and controls the round removed from every state of the demo.
const GONE_WORDS = [
  /checking your allowance/i,
  /voice-to-task/i,
  /a minute is plenty/i,
  /free tries/i,
  /no account/i,
  /rolling 24 hours/i,
  /task \d/i,
  /priority/i,
];
const GONE_BUTTONS = [
  "Create drafts",
  "Record a thought",
  "Type it instead",
  "Record again",
  "Add to preview list",
  "Edit original thought",
  "Try a new thought",
  "Edit drafts",
];
const TYPED = "Tomorrow at 5 p.m. call the dentist, and buy bread sometime.";

const demo = (page: Page) => page.locator("#voice");
const panel = (page: Page) => page.locator(VOICE_PANEL);
const stage = (page: Page, name: string) => page.locator(`${VOICE_PANEL}[data-stage="${name}"]`);

// Always a fresh load: going to the same address plus #voice would only scroll.
async function openDemo(page: Page, language: Language) {
  await page.goto(homeUrl(language));
  const start = demo(page).getByRole("button", { name: VOICE.start[language], exact: true });
  await expect(start).toBeEnabled({ timeout: 15_000 });
  await start.click();
}
async function capture(page: Page, language: Language) {
  await openDemo(page, language);
  await expect(stage(page, "capture")).toBeVisible();
}
async function typeAndSend(page: Page, language: Language, text = TYPED) {
  await capture(page, language);
  await demo(page).getByRole("button", { name: VOICE.typeInstead[language], exact: true }).click();
  await demo(page).getByRole("textbox", { name: VOICE.textLabel[language], exact: true }).fill(text);
  const done = demo(page).getByRole("button", { name: VOICE.done[language], exact: true });
  await expect(done).toBeEnabled({ timeout: 10_000 });
  await done.click();
  await expect(stage(page, "review")).toBeVisible();
}
const talkButton = (page: Page, language: Language) =>
  demo(page).getByRole("button", { name: VOICE.talk[language] });

// The fill of an element against the card behind it.
async function fillAgainstCard(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const card = element.closest(".voice-panel")!;
    return {
      fill: getComputedStyle(element).backgroundColor,
      card: getComputedStyle(card).backgroundColor,
      border: getComputedStyle(element).borderTopColor,
      page: getComputedStyle(document.body).backgroundColor,
    };
  });
}

test("WEB-6: with every try used, the demo's status line says when they return and promises no walkthrough", async ({
  page,
  voice,
}, testInfo) => {
  const scenario = scenarios(ROOT).list.find((entry) => entry.key === "voice-tries-used");
  expect(scenario, "the voice-tries-used scenario in tests/support/ux-voice.ts").toBeDefined();
  await scenario!.setup?.(page, voice);
  await scenario!.run({
    page,
    voice,
    project: testInfo.project.name as Project,
    capture: async () => {},
  });
  // WP28 replaced the status line with the tries-used state's heading.
  const line = page.locator("#voice").getByRole("heading").filter({ hasText: /You can try again (on|today)/ });
  await expect(line).toHaveCount(1);
  await expect(line).toBeVisible();
  const text = ((await line.textContent()) ?? "").replace(/\s+/g, " ").trim();
  expect(text).not.toMatch(/walkthrough/i);
  expect(text).toContain("You’ve used this demo’s 3 tries.");
  expect(text).toMatch(/\.$/);
  expect((await page.locator("#voice").textContent()) ?? "").not.toMatch(/walkthrough/i);
  expect(voice.unexpected).toEqual([]);
});

// ---- WP26: the intro, the static example, the privacy line ----

test("WEB-6, WEB-18: without JavaScript each home's demo shows the static example, a disabled start button and the noscript line", async ({
  browser,
  baseURL,
}, testInfo) => {
  const mobile = testInfo.project.name === "mobile";
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    ...(mobile ? { viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true } : {}),
  });
  const page = await context.newPage();
  const external: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url());
  });
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    const section = demo(page);
    const example = section.locator(".voice-example");
    await expect(example, url).toBeVisible();
    await expect(example.getByText(VOICE.example.label[language], { exact: true }), url).toBeVisible();
    await expect(example.getByText(VOICE.example.quote[language], { exact: true }), url).toBeVisible();
    await expect(example.getByText(VOICE.example.heading[language], { exact: true }), url).toBeVisible();
    const cards = example.getByRole("listitem");
    await expect(cards, url).toHaveCount(2);
    for (const [i, [title, date]] of VOICE.example.cards[language].entries()) {
      await expect(cards.nth(i), url).toBeVisible();
      // The title, then the date line.
      expect(((await cards.nth(i).innerText()) ?? "").replace(/\s+/g, " ").trim(), url).toBe(`${title} ${date}`);
    }
    expect(await example.locator("input, textarea, select, button").count(), `${url}: inputs in the example`).toBe(0);
    await expect(section.getByRole("button", { name: VOICE.start[language], exact: true }), url).toBeDisabled();
    await expect(section.getByText(VOICE.noscript[language], { exact: true }), url).toBeVisible();
  }
  expect(external).toEqual([]);
  await context.close();
});

test("WEB-18: with JavaScript, the start button is enabled once the page has loaded, and the noscript line is absent", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await expect(demo(page).getByRole("button", { name: VOICE.start[language], exact: true })).toBeEnabled({
      timeout: 15_000,
    });
    await expect(demo(page).getByText(VOICE.noscript[language], { exact: true })).toBeHidden();
  }
});

test("WEB-12, WEB-16: the demo's heading has no eyebrow and no orb, says the given h2 and paragraph, with the badge below the paragraph", async ({
  page,
}, testInfo) => {
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await hydrated(page);
    await expect(demo(page).locator(".eyebrow, .section-eyebrow"), url).toHaveCount(0);
    await expect(demo(page).locator(".voice-mic-orb"), url).toHaveCount(0);
    await expect(demo(page).getByRole("heading", { level: 2 }), url).toHaveText(VOICE.title[language]);
    const paragraph = demo(page).getByText(VOICE.intro[language], { exact: true });
    await expect(paragraph, url).toBeVisible();
    const badge = demo(page).getByText(VOICE.badge[language], { exact: true });
    await expect(badge, url).toBeVisible();
    const p = (await paragraph.boundingBox())!;
    const b = (await badge.boundingBox())!;
    expect(b.y, `${url} (${testInfo.project.name}): the badge's top against the paragraph's bottom`).toBeGreaterThanOrEqual(
      p.y + p.height - 0.5,
    );
    // Under the paragraph, not in a far column.
    expect(b.x, `${url}: the badge's left edge`).toBeLessThan(p.x + p.width / 2);
  }
});

test("WEB-4: on a phone, tapping the hero's ‘Try it with your voice’ puts the demo's start button in the viewport", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The phone (390 × 664).");
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    await hydrated(page);
    await page.locator(".hero").getByRole("link", { name: TRY_VOICE[language], exact: true }).tap();
    await expect(page).toHaveURL(/#voice$/);
    await expect(
      demo(page).getByRole("button", { name: VOICE.start[language], exact: true }),
      homeUrl(language),
    ).toBeInViewport({ ratio: 1 });
  }
});

test("WEB-207: once open, the privacy line sits under the record button and its link goes to the privacy page's demo section in the page's language", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await capture(page, language);
    const line = demo(page).locator("p").filter({ hasText: VOICE.privacy[language] });
    await expect(line, language).toHaveCount(1);
    await expect(line, language).toBeVisible();
    const button = (await talkButton(page, language).boundingBox())!;
    const box = (await line.boundingBox())!;
    expect(box.y, `${language}: the privacy line's top against the record button's bottom`).toBeGreaterThan(
      button.y + button.height,
    );
    const link = line.getByRole("link", { name: VOICE.privacyLink[language], exact: true });
    const href = new URL((await link.getAttribute("href"))!, page.url());
    expect(`${href.pathname}${href.hash}`, language).toBe(`${homeUrl(language)}privacy/#website`);
    await link.click();
    await expect(page, language).toHaveURL(new RegExp(`${homeUrl(language)}privacy/#website$`));
    await expect(page.locator("#website-title"), language).toBeInViewport();
  }
});

test("WEB-6: the static example's text computes 14 px or more", async ({ page }) => {
  for (const language of LANGUAGES) {
    await page.goto(homeUrl(language));
    const smallest = await smallestText(page, "#voice .voice-example");
    expect(smallest, homeUrl(language)).not.toBeNull();
    expect(smallest!.size, `${homeUrl(language)}: “${smallest!.text}”`).toBeGreaterThanOrEqual(14);
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} demo intro axe`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-6, WEB-18, WEB-12: axe reports no violations on each home with JavaScript off and on (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        const url = homeUrl(language);
        await page.goto(url);
        await hydrated(page);
        expect(await axeViolations(page), `${url} with JavaScript`).toEqual([]);
        // axe needs JavaScript to run, so the page a browser without JavaScript shows is
        // rebuilt: the server's HTML without its scripts, with the <noscript> content shown.
        const html = (await (await page.request.get(url)).text())
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<\/?noscript>/gi, "");
        // Written into the page at its own address, so its styles load as they would.
        await page.setContent(html, { waitUntil: "load" });
        await expect(panel(page), "the site's styles applied").toHaveCSS("border-top-left-radius", "28px");
        await expect(demo(page).getByText(VOICE.noscript[language], { exact: true })).toBeVisible();
        await expect(demo(page).getByRole("button", { name: VOICE.start[language], exact: true })).toBeDisabled();
        expect(await axeViolations(page), `${url} without JavaScript`).toEqual([]);
      }
    });
  });
}

// ---- Every stubbed state: the removed words and controls stay gone ----

for (const scenario of scenarios(ROOT).list) {
  test(`WEB-12, WEB-9, WEB-7: the ${scenario.key} state shows none of the removed words or controls`, async ({
    page,
    voice,
  }, testInfo) => {
    const project = testInfo.project.name as Project;
    test.skip(!scenario.projects.includes(project), `${scenario.key} runs on ${scenario.projects.join(", ")}.`);
    test.setTimeout(90_000);
    await scenario.setup?.(page, voice);
    const seen: string[] = [];
    await scenario.run({
      page,
      voice,
      project,
      capture: async (state) => {
        seen.push(state);
        const text = ((await demo(page).innerText()) ?? "").replace(/\s+/g, " ");
        for (const word of GONE_WORDS) expect(text, `${state}: ${word}`).not.toMatch(word);
        await expect(demo(page).locator("[aria-pressed]"), `${state}: aria-pressed`).toHaveCount(0);
        await expect(demo(page).locator("audio"), `${state}: audio`).toHaveCount(0);
        for (const name of GONE_BUTTONS)
          await expect(demo(page).getByRole("button", { name, exact: true }), `${state}: “${name}”`).toHaveCount(0);
        // WD2's line, directly under the card, in every state.
        const plans = demo(page).getByText(CLOSING.plans.en, { exact: true });
        await expect(plans, `${state}: WD2's line`).toBeVisible();
      },
    });
    expect(seen.length).toBeGreaterThan(0);
    expect(voice.unexpected).toEqual([]);
  });
}

// ---- WP27: one tap to talk, Done sends ----

test("WEB-9: once the demo is open, a spoken result takes exactly two clicks: Tap to talk, then Done", async ({ page }) => {
  for (const language of LANGUAGES) {
    await capture(page, language);
    let clicks = 0;
    await talkButton(page, language).click();
    clicks++;
    const done = demo(page).getByRole("button", { name: VOICE.done[language], exact: true });
    await expect(done, language).toBeVisible();
    await page.waitForTimeout(1500);
    await done.click();
    clicks++;
    await expect(stage(page, "review"), language).toBeVisible({ timeout: 15_000 });
    await expect(demo(page).getByRole("heading", { level: 3 }).first(), language).toHaveText(
      new RegExp(`^${TASKS.length} `),
    );
    expect(clicks).toBe(2);
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} record button`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-16: the record button is 72 px or more, filled at 3:1 against the card, named by its label, and becomes Done (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        await capture(page, language);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const button = talkButton(page, language);
        await expect(button, language).toBeVisible();
        // Its accessible name contains its visible label.
        await expect(demo(page).getByText(VOICE.talk[language], { exact: true }), language).toBeVisible();
        const box = (await button.boundingBox())!;
        expect(box.width, `${language}: width`).toBeGreaterThanOrEqual(72);
        expect(box.height, `${language}: height`).toBeGreaterThanOrEqual(72);
        const colours = await fillAgainstCard(page, "#voice .voice-record-button");
        expect(
          contrast(parseColor(colours.fill), parseColor(colours.card)),
          `${language}: the fill ${colours.fill} on the card ${colours.card}`,
        ).toBeGreaterThanOrEqual(3);
        await button.click();
        await expect(demo(page).getByRole("button", { name: VOICE.done[language], exact: true }), language).toBeVisible();
      }
    });
  });
}

// getUserMedia replaced, with Chromium's own error names, or absent.
async function microphone(page: Page, mode: "denied" | "missing" | "other" | "unsupported") {
  await page.addInitScript((mode) => {
    if (mode === "unsupported") {
      Object.defineProperty(Navigator.prototype, "mediaDevices", { configurable: true, get: () => undefined });
      return;
    }
    const error =
      mode === "denied"
        ? new DOMException("Permission denied", "NotAllowedError")
        : mode === "missing"
          ? new DOMException("Requested device not found", "NotFoundError")
          : new Error("Could not start audio source");
    navigator.mediaDevices.getUserMedia = () => Promise.reject(error);
  }, mode);
}

for (const mode of ["denied", "missing", "other", "unsupported"] as const) {
  test(`WEB-14: when the microphone can't be used (${mode}), the mapped message shows as an alert and the text box opens with focus`, async ({
    page,
  }) => {
    await microphone(page, mode);
    for (const language of LANGUAGES) {
      await capture(page, language);
      await talkButton(page, language).click();
      const alert = demo(page).getByRole("alert");
      await expect(alert, language).toHaveText(VOICE.mic[mode][language]);
      const box = demo(page).getByRole("textbox", { name: VOICE.textLabel[language], exact: true });
      await expect(box, language).toBeVisible();
      await expect(box, language).toBeFocused();
    }
  });
}

test("WEB-15: while recording, the timer isn't live, and the one status line speaks only at the start, at 50 s and when sent", async ({
  page,
}) => {
  await page.clock.install();
  for (const language of ["en", "es"] as const) {
    await capture(page, language);
    // Every text any role=status in the demo takes, in order.
    await page.evaluate(() => {
      const spoken: string[] = [];
      (window as unknown as { __spoken: string[] }).__spoken = spoken;
      const note = () => {
        for (const element of document.querySelectorAll("#voice [role=status]")) {
          const text = (element.textContent ?? "").trim();
          if (text && spoken.at(-1) !== text) spoken.push(text);
        }
      };
      new MutationObserver(note).observe(document.querySelector("#voice")!, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    });
    const spoken = () => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
    await talkButton(page, language).click();
    const done = demo(page).getByRole("button", { name: VOICE.done[language], exact: true });
    await expect(done).toBeVisible();
    const timer = demo(page).locator(".voice-recorder .voice-hint");
    await page.clock.fastForward(5_000);
    await expect(timer).toHaveText(new RegExp(`^${VOICE.listening[language]} · 0:0[4-6]$`));
    // Neither the timer nor anything around it is a live region.
    const live = await timer.evaluate((element) => {
      const found: string[] = [];
      for (let e: Element | null = element; e && e.id !== "voice"; e = e.parentElement) {
        if (e.hasAttribute("aria-live")) found.push(`${e.tagName} aria-live=${e.getAttribute("aria-live")}`);
        const role = e.getAttribute("role");
        if (role && ["status", "alert", "log", "timer", "marquee"].includes(role)) found.push(`${e.tagName} role=${role}`);
      }
      return found;
    });
    expect(live, `${language}: live regions on the timer`).toEqual([]);
    expect(await spoken(), `${language}: spoken by 5 s`).toEqual([VOICE.listening[language]]);
    await page.clock.fastForward(45_500);
    await expect(timer).toHaveText(
      new RegExp(`^${VOICE.listening[language]} · 0:5[01] · ${VOICE.tenSeconds[language]}$`),
    );
    expect(await spoken(), `${language}: spoken by 50 s`).toEqual([VOICE.listening[language], VOICE.tenSeconds[language]]);
    await page.clock.fastForward(3_000);
    expect(await spoken(), `${language}: spoken by 53 s`).toEqual([VOICE.listening[language], VOICE.tenSeconds[language]]);
    await done.click();
    await page.clock.runFor(1_000);
    await expect
      .poll(async () => (await spoken()).slice(0, 3), { message: `${language}: spoken when sent` })
      .toEqual([VOICE.listening[language], VOICE.tenSeconds[language], VOICE.understanding[language]]);
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} typing`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-402, WEB-502: in typing mode the text box's edge is 3:1, it's named by its label alone, the counter is tied to it, and the Pro line shows only there (${theme})`, async ({
      page,
    }) => {
      for (const language of LANGUAGES) {
        await capture(page, language);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(demo(page).getByText(VOICE.textPro[language], { exact: true }), `${language}: voice mode`).toHaveCount(0);
        await demo(page).getByRole("button", { name: VOICE.typeInstead[language], exact: true }).click();
        const box = demo(page).getByRole("textbox", { name: VOICE.textLabel[language], exact: true });
        await expect(box, language).toBeVisible();
        await expect(demo(page).getByText(VOICE.textPro[language], { exact: true }), language).toBeVisible();
        const tie = await box.evaluate((element) => {
          const ids = (element.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
          const counters = ids.map((id) => document.getElementById(id));
          return {
            described: counters.map((counter) => counter?.textContent?.trim() ?? null),
            inLabel: counters.some((counter) => !!counter?.closest("label")),
            sizes: counters.map((counter) => (counter ? parseFloat(getComputedStyle(counter).fontSize) : 0)),
          };
        });
        expect(tie.described, `${language}: aria-describedby`).toEqual([VOICE.count[language]]);
        expect(tie.inLabel, `${language}: the counter inside the label`).toBe(false);
        for (const size of tie.sizes) expect(size, `${language}: the counter's size`).toBeGreaterThanOrEqual(12);
        const colours = await fillAgainstCard(page, "#voice textarea");
        expect(
          contrast(parseColor(colours.border), parseColor(colours.card)),
          `${language}: the edge ${colours.border} on the card ${colours.card}`,
        ).toBeGreaterThanOrEqual(3);
        expect(
          contrast(parseColor(colours.border), parseColor(colours.fill)),
          `${language}: the edge ${colours.border} on the box's own fill ${colours.fill}`,
        ).toBeGreaterThanOrEqual(3);
        expect(
          contrast(parseColor(colours.border), parseColor(colours.page)),
          `${language}: the edge ${colours.border} on the page ${colours.page}`,
        ).toBeGreaterThanOrEqual(3);
      }
    });
  });
}

for (const theme of THEMES) {
  test.describe(`${theme} capture axe`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-9, WEB-16, WEB-402: axe reports no violations in the capture, recording and typing states (${theme})`, async ({
      page,
    }) => {
      await capture(page, "en");
      expect(await axeViolations(page), "capture").toEqual([]);
      await talkButton(page, "en").click();
      await expect(demo(page).getByRole("button", { name: VOICE.done.en, exact: true })).toBeVisible();
      expect(await axeViolations(page), "recording").toEqual([]);
      await capture(page, "en");
      await demo(page).getByRole("button", { name: VOICE.typeInstead.en, exact: true }).click();
      await demo(page).getByRole("textbox", { name: VOICE.textLabel.en, exact: true }).fill(TYPED);
      expect(await axeViolations(page), "typing").toEqual([]);
    });
  });
}

// ---- WP28: the result, the hand-over, tries used ----

test("WEB-104: on each home, WD2's line sits directly under the demo's card in the intro, capture, result, error and tries-used states", async ({
  page,
  voice,
}) => {
  const check = async (language: Language, state: string) => {
    const plans = demo(page).getByText(CLOSING.plans[language], { exact: true });
    await expect(plans, `${language} ${state}`).toBeVisible();
    const placed = await plans.evaluate((line) => {
      const card = line.previousElementSibling;
      return {
        afterCard: !!card?.classList.contains("voice-panel"),
        gap: line.getBoundingClientRect().top - (card?.getBoundingClientRect().bottom ?? 0),
      };
    });
    expect(placed.afterCard, `${language} ${state}: right after the card`).toBe(true);
    expect(placed.gap, `${language} ${state}: below the card`).toBeGreaterThanOrEqual(0);
    expect(placed.gap, `${language} ${state}: close under the card`).toBeLessThanOrEqual(64);
  };
  for (const language of LANGUAGES) {
    voice.remaining = 3;
    voice.resetAt = null;
    voice.draft = { tasks: TASKS };
    await page.goto(`${homeUrl(language)}#voice`);
    await check(language, "intro");
    await typeAndSend(page, language);
    await check(language, "result");
    await capture(page, language);
    await check(language, "capture");
    voice.draft = "offline";
    await demo(page).getByRole("button", { name: VOICE.typeInstead[language], exact: true }).click();
    await demo(page).getByRole("textbox", { name: VOICE.textLabel[language], exact: true }).fill(TYPED);
    await demo(page).getByRole("button", { name: VOICE.done[language], exact: true }).click();
    await expect(demo(page).getByRole("alert")).toBeVisible();
    await check(language, "error");
    voice.remaining = 0;
    voice.resetAt = Date.now() + 5 * 3_600_000;
    await openDemo(page, language);
    await expect(stage(page, "tries-used")).toBeVisible();
    await check(language, "tries used");
  }
});

test("WEB-7: after a result, the demo hands over to the app in the page's language, with no task-manager controls", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await typeAndSend(page, language);
    await expect(demo(page).getByText(VOICE.handOver[language], { exact: true }), language).toBeVisible();
    expect(VOICE.handOver[language]).toContain("Google Play");
    for (const name of GONE_BUTTONS)
      await expect(demo(page).getByRole("button", { name, exact: true }), `${language}: “${name}”`).toHaveCount(0);
    await expect(demo(page).locator("fieldset, select, input[type=date]"), language).toHaveCount(0);
    const text = (await demo(page).innerText()).replace(/\s+/g, " ");
    expect(text, language).not.toMatch(/task \d/i);
    expect(text, language).not.toMatch(/priority/i);
  }
});

test("WEB-9, WEB-108: a two-task result is headed as the app heads it, each card is title then date line, and an undated task says No date", async ({
  page,
  voice,
}) => {
  voice.draft = { tasks: [TASKS[0], TASKS[2]] };
  for (const language of LANGUAGES) {
    voice.remaining = 3;
    voice.draft = { tasks: [TASKS[0], TASKS[2]] };
    await typeAndSend(page, language);
    await expect(demo(page).getByRole("heading", { level: 3 }).first(), language).toHaveText(VOICE.twoThings[language]);
    const cards = demo(page).locator(".voice-task-card");
    await expect(cards, language).toHaveCount(2);
    for (const i of [0, 1]) {
      const lines = (await cards.nth(i).innerText()).split("\n").map((line) => line.trim()).filter(Boolean);
      expect(lines[0], `${language} card ${i + 1}: the title first`).toBe(i === 0 ? TASKS[0].title : TASKS[2].title);
    }
    const undated = (await cards.nth(1).innerText()).split("\n").map((line) => line.trim()).filter(Boolean);
    expect(undated[1], `${language}: the undated task's date line`).toBe(VOICE.noDate[language]);
  }
});

test.describe("an English browser on the Spanish page", () => {
  test.use({ locale: "en-US", timezoneId: "Europe/Madrid" });
  test("WEB-2: on /es/ the tasks' dates and the tries-used line are in Spanish, not in the browser's language", async ({
    page,
    voice,
  }) => {
    // Monday 19 October 2026, 18:00 in Madrid: on the Friday itself the line would rightly
    // say «hoy».
    await page.clock.setFixedTime(new Date("2026-10-19T18:00:00+02:00"));
    voice.draft = { tasks: [TASKS[0]] };
    await typeAndSend(page, "es");
    const card = demo(page).locator(".voice-task-card").first();
    await expect(card).toContainText("vie, 23 oct · 17:00");
    // Friday 23 October 2026, 17:00 in Madrid.
    voice.remaining = 0;
    voice.resetAt = Date.parse("2026-10-23T17:00:00+02:00");
    await openDemo(page, "es");
    await expect(stage(page, "tries-used")).toBeVisible();
    await expect(demo(page).getByRole("heading", { level: 3 })).toHaveText(
      "Ya has usado los 3 intentos de esta demo. Podrás volver a probar el viernes a las 17:00.",
    );
  });
});

test("WEB-9: the ‘See what I said’ summary row is 44 px tall or more", async ({ page }) => {
  for (const language of LANGUAGES) {
    await typeAndSend(page, language);
    const summary = demo(page).locator("summary").filter({ hasText: VOICE.seeWhatISaid[language] });
    await expect(summary, language).toBeVisible();
    expect((await summary.boundingBox())!.height, language).toBeGreaterThanOrEqual(44);
  }
});

test("WEB-7: with every try used, the first text after the badge is the tries-used message, in the first screen, with nothing to tap or disabled", async ({
  page,
  voice,
}) => {
  voice.remaining = 0;
  voice.resetAt = Date.now() + 5 * 3_600_000;
  for (const language of LANGUAGES) {
    await openDemo(page, language);
    await expect(stage(page, "tries-used")).toBeVisible();
    const first = await panel(page).evaluate((card) => {
      const topline = card.querySelector(".voice-topline");
      const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement!;
        if (!node.textContent?.trim() || (topline && topline.contains(parent))) continue;
        const { width, height } = parent.getBoundingClientRect();
        if (!parent.checkVisibility() || width <= 1 || height <= 1) continue;
        return parent.closest("h3, p, div")!.textContent!.trim();
      }
      return null;
    });
    expect(first, language).toMatch(new RegExp(`^${VOICE.triesUsedStart[language].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    const heading = demo(page).getByRole("heading", { level: 3 });
    await expect(heading, language).toBeInViewport({ ratio: 1 });
    await expect(talkButton(page, language), language).toHaveCount(0);
    await expect(demo(page).getByRole("button", { name: VOICE.done[language], exact: true }), language).toHaveCount(0);
    await expect(demo(page).locator("button:disabled"), language).toHaveCount(0);
  }
});

test("WEB-12: a result with no tasks says so in the app's words, with no tick", async ({ page, voice }) => {
  for (const language of LANGUAGES) {
    voice.remaining = 3;
    voice.draft = { tasks: [] };
    await typeAndSend(page, language);
    const results = demo(page).locator(".voice-results");
    await expect(results.getByRole("heading", { level: 3 }), language).toHaveText(VOICE.noTasks[language]);
    await expect(results.locator("svg"), `${language}: icons in the no-tasks result`).toHaveCount(0);
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} result axe`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-7, WEB-108, WEB-12: axe reports no violations in the result, no-tasks and tries-used states (${theme})`, async ({
      page,
      voice,
    }) => {
      await typeAndSend(page, "en");
      await demo(page).locator("summary").click();
      expect(await axeViolations(page), "result, “See what I said” open").toEqual([]);
      voice.draft = { tasks: [] };
      await typeAndSend(page, "en");
      expect(await axeViolations(page), "no tasks").toEqual([]);
      voice.remaining = 0;
      voice.resetAt = Date.now() + 5 * 3_600_000;
      await openDemo(page, "en");
      await expect(stage(page, "tries-used")).toBeVisible();
      expect(await axeViolations(page), "tries used").toEqual([]);
    });
  });
}

// ---- Round 2, WP39: the weekday in full, one way to resend, a status that clears ----

const SITE = { en, es, ca };
const flat = (text: string | null) => (text ?? "").replace(/\s+/g, " ").trim();
const badgeNumber = async (page: Page) =>
  Number(/\d+/.exec(flat(await demo(page).locator(".voice-topline .voice-trial-badge").textContent()))?.[0]);
// A server error by its code, as the site's server sends it (read from its own code).
const SERVER_ERRORS = serverErrors(ROOT).errors;
const serverError = (code: string, status?: number) => {
  const found = SERVER_ERRORS.find((error) => error.code === code && (status === undefined || error.status === status));
  if (!found) throw new Error(`The server has no ${code} error${status ? ` with ${status}` : ""}.`);
  return found;
};
// Two taps: Tap to talk, then Done, which stops and sends (Chromium's fake microphone).
async function recordAndSend(page: Page, language: Language) {
  await capture(page, language);
  await talkButton(page, language).click();
  const done = demo(page).getByRole("button", { name: VOICE.done[language], exact: true });
  await expect(done, language).toBeVisible();
  await page.waitForTimeout(1500);
  await done.click();
}
// The buttons in the capture stage that are drawn filled (a background that isn't transparent).
// Each is named by its label (aria-labelledby) or its text.
const filledButtons = (page: Page) =>
  stage(page, "capture").evaluate((root) => {
    const alpha = (value: string) => {
      const match = /rgba?\(([^)]+)\)/.exec(value);
      if (!match) return value === "transparent" ? 0 : 1;
      const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return parts[3] ?? 1;
    };
    return [...root.querySelectorAll("button")]
      .filter((button) => button.checkVisibility() && alpha(getComputedStyle(button).backgroundColor) > 0)
      .map((button) => {
        const labelledBy = button.getAttribute("aria-labelledby");
        return labelledBy
          ? (document.getElementById(labelledBy)?.textContent ?? "").trim()
          : (button.textContent ?? "").trim();
      });
  });

// Monday 19 October 2026 at 18:00 in Madrid (CEST, before the clocks change on the 25th).
const MONDAY_18 = new Date("2026-10-19T18:00:00+02:00");
const TUESDAY_09 = new Date("2026-10-20T09:00:00+02:00");
const TUESDAY_17 = Date.parse("2026-10-20T17:00:00+02:00");
const TUESDAY_0130 = Date.parse("2026-10-20T01:30:00+02:00");
// The plan's exact sentences (WP39 acceptance).
const TRIES_USED = {
  tuesdayAt5: {
    en: "You’ve used this demo’s 3 tries. You can try again on Tuesday at 5:00 PM.",
    es: "Ya has usado los 3 intentos de esta demo. Podrás volver a probar el martes a las 17:00.",
    ca: "Ja has fet servir els 3 intents d’aquesta demo. Hi podràs tornar a provar dimarts a les 17:00.",
  } as Copy,
  todayAt5: {
    en: "You’ve used this demo’s 3 tries. You can try again today at 5:00 PM.",
    es: "Ya has usado los 3 intentos de esta demo. Podrás volver a probar hoy a las 17:00.",
    ca: "Ja has fet servir els 3 intents d’aquesta demo. Hi podràs tornar a provar avui a les 17:00.",
  } as Copy,
  tuesdayAt0130: {
    en: "You’ve used this demo’s 3 tries. You can try again on Tuesday at 1:30 AM.",
    es: "Ya has usado los 3 intentos de esta demo. Podrás volver a probar el martes a la 1:30.",
    ca: "Ja has fet servir els 3 intents d’aquesta demo. Hi podràs tornar a provar dimarts a la 1:30.",
  } as Copy,
};
const SHORT_WEEKDAY = [/\bTue /, /\bel mar /, /\bdt\./];

test.describe("WP39: the tries-used line, in Madrid", () => {
  test.use({ timezoneId: "Europe/Madrid", colorScheme: "light" });

  for (const [name, now, resetAt, expected] of [
    ["the next day", MONDAY_18, TUESDAY_17, TRIES_USED.tuesdayAt5],
    ["later today", TUESDAY_09, TUESDAY_17, TRIES_USED.todayAt5],
    ["the next day at 1:30", MONDAY_18, TUESDAY_0130, TRIES_USED.tuesdayAt0130],
  ] as const) {
    test(`WEB-716: with every try used and the tries back ${name}, the line names the full weekday or ‘today’, in each language`, async ({
      page,
      voice,
    }) => {
      expect(new Intl.DateTimeFormat("en", { weekday: "long", timeZone: "Europe/Madrid" }).format(MONDAY_18)).toBe("Monday");
      await page.clock.setFixedTime(now);
      voice.remaining = 0;
      voice.resetAt = resetAt;
      for (const language of LANGUAGES) {
        await openDemo(page, language);
        await expect(stage(page, "tries-used"), language).toBeVisible();
        const heading = stage(page, "tries-used").getByRole("heading", { level: 3 });
        await expect(heading, language).toBeVisible();
        const line = flat(await heading.textContent());
        expect(line, `${language}: the tries-used line`).toBe(expected[language]);
        for (const short of SHORT_WEEKDAY) expect(line, `${language}: a short weekday`).not.toMatch(short);
        expect(line, `${language}: never ‘tomorrow’`).not.toMatch(/tomorrow|mañana|demà/i);
      }
      expect(voice.unexpected).toEqual([]);
    });
  }

  test("WEB-716: a last-try result says the same sentence under the tasks, whose cards keep the short weekday", async ({
    page,
    voice,
  }) => {
    await page.clock.setFixedTime(MONDAY_18);
    for (const language of LANGUAGES) {
      voice.remaining = 1;
      voice.resetAt = TUESDAY_17;
      voice.draft = { tasks: TASKS, remainingAfter: 0 };
      await typeAndSend(page, language);
      const again = demo(page).locator(".voice-again-later");
      await expect(again, language).toBeVisible();
      expect(flat(await again.textContent()), `${language}: the last-try line`).toBe(TRIES_USED.tuesdayAt5[language]);
      // TASKS[0] is on Friday 23 October: its card's date line keeps the short weekday.
      const schedule = demo(page).locator(".voice-task-card").first().locator(".voice-task-schedule");
      if (language === "es") expect(flat(await schedule.textContent()), "es: the Friday card").toMatch(/^vie,/);
      if (language === "en") expect(flat(await schedule.textContent()), "en: the Friday card").toMatch(/^Fri,/);
    }
  });
});

for (const code of ["audio_length", "invalid_audio", "too_large"]) {
  test(`WEB-717: after a refused recording (${code}), the alert shows, there's no Done to resend it, and Tap to talk is the only filled control`, async ({
    page,
    voice,
  }) => {
    voice.draft = serverError(code);
    for (const language of ["en", "es"] as const) {
      const before = voice.requests.draft;
      await recordAndSend(page, language);
      await expect(demo(page).getByRole("alert"), language).toBeVisible({ timeout: 15_000 });
      expect(voice.requests.draft - before, `${language}: draft requests`).toBe(1);
      const capturing = stage(page, "capture");
      await expect(capturing, language).toBeVisible();
      await expect(capturing.getByRole("button", { name: VOICE.done[language], exact: true }), language).toHaveCount(0);
      await expect(capturing.locator(".voice-submit"), language).toHaveCount(0);
      await expect(capturing.locator(".voice-retry"), language).toHaveCount(0);
      await expect(talkButton(page, language), language).toBeEnabled();
      expect(await filledButtons(page), `${language}: filled controls`).toEqual([VOICE.talk[language]]);
    }
    expect(voice.unexpected).toEqual([]);
  });
}

for (const failure of ["offline", "502"] as const) {
  test(`WEB-717: after a recording's request fails (${failure}), one Try again resends it with the same request id, and the tries don't drop`, async ({
    page,
    voice,
  }) => {
    // The server's store keeps a request by its id: the same id returns it without using
    // a try (src/lib/voice/store.ts); a new id would use one. Registered after the stub,
    // so it runs first, then hands the request to the stub.
    const ids: string[] = [];
    await page.route("**/api/voice/draft/", (route) => {
      const id = route.request().headers()["x-request-id"] ?? "";
      ids.push(id);
      if (ids.length > 1)
        voice.draft = id === ids[0] ? { tasks: TASKS, remainingAfter: voice.remaining } : { tasks: TASKS };
      return route.fallback();
    });
    for (const language of LANGUAGES) {
      voice.remaining = 3;
      voice.resetAt = null;
      voice.draft = failure === "offline" ? "offline" : "html";
      voice.requests.status = 0;
      ids.length = 0;
      await recordAndSend(page, language);
      await expect(demo(page).getByRole("alert"), language).toBeVisible({ timeout: 15_000 });
      const capturing = stage(page, "capture");
      const retry = capturing.locator(".voice-retry");
      await expect(retry, language).toHaveCount(1);
      await expect(retry, language).toHaveAccessibleName(SITE[language].voice.tryAgain);
      await expect(retry, language).toHaveText(SITE[language].voice.tryAgain);
      await expect(capturing.getByRole("button", { name: VOICE.done[language], exact: true }), language).toHaveCount(0);
      await expect(capturing.locator(".voice-submit"), language).toHaveCount(0);
      await expect(retry, language).toBeEnabled();
      // The status the page asks for after the failure has arrived.
      await expect
        .poll(() => voice.requests.status, { message: `${language}: the status after the failure` })
        .toBeGreaterThanOrEqual(2);
      await expect(demo(page).locator(".voice-topline .voice-trial-badge"), language).toHaveText(
        SITE[language].voice.triesLeft.replace("{n}", String(voice.remaining)),
      );
      const tries = await badgeNumber(page);
      await retry.click();
      await expect(stage(page, "review"), language).toBeVisible({ timeout: 15_000 });
      expect(ids.length, `${language}: draft requests`).toBe(2);
      expect(ids[0], `${language}: the first request's id`).not.toBe("");
      expect(ids[1], `${language}: the resent request's id`).toBe(ids[0]);
      await expect
        .poll(() => voice.requests.status, { message: `${language}: the status after the result` })
        .toBeGreaterThanOrEqual(3);
      await expect(demo(page).locator(".voice-topline .voice-trial-badge"), language).toHaveText(
        SITE[language].voice.triesLeft.replace("{n}", String(tries)),
      );
      expect(await badgeNumber(page), `${language}: tries left`).toBe(tries);
    }
    expect(voice.unexpected).toEqual([]);
  });
}

// ---- Round 3, WP42: Try again stays put while the resend waits for its security check ----

// The plan's exact copy (WP42 acceptance).
const ONE_MOMENT: Copy = { en: "One moment…", es: "Un momento…", ca: "Un moment…" };
const TRY_AGAIN: Copy = { en: "Try again", es: "Reintentar", ca: "Torna-ho a provar" };
const recordButton = (page: Page) => page.locator("#voice-record");
const captureHint = (page: Page) => stage(page, "capture").locator(".voice-hint");

// The X-Request-Id of each draft request. The server's store keeps a request by its id: the
// same id returns it without using a try (src/lib/voice/store.ts); a new id would use one.
// Registered after the stub, so it runs first, then hands the request to the stub.
async function draftIds(page: Page, voice: VoiceStub) {
  const ids: string[] = [];
  await page.route("**/api/voice/draft/", (route) => {
    const id = route.request().headers()["x-request-id"] ?? "";
    ids.push(id);
    if (ids.length > 1)
      voice.draft = id === ids[0] ? { tasks: TASKS, remainingAfter: voice.remaining } : { tasks: TASKS };
    return route.fallback();
  });
  return ids;
}

// Records and sends; the draft request fails in a way it can be resent, and the security
// check after it is held (the stand-in's "hold-next"). Returns Try again and the tries left
// that the badge shows once the status after the failure has arrived.
async function failRecording(
  page: Page,
  voice: VoiceStub,
  language: Language,
  failure: "offline" | "502",
  ids: string[],
) {
  voice.remaining = 3;
  voice.resetAt = null;
  voice.draft = failure === "offline" ? "offline" : "html";
  voice.turnstile = "hold-next";
  voice.requests.status = 0;
  ids.length = 0;
  await recordAndSend(page, language);
  await expect(demo(page).getByRole("alert"), language).toBeVisible({ timeout: 15_000 });
  const retry = stage(page, "capture").locator(".voice-retry");
  await expect(retry, language).toBeEnabled();
  await expect
    .poll(() => voice.requests.status, { message: `${language}: the status after the failure` })
    .toBeGreaterThanOrEqual(2);
  await expect(demo(page).locator(".voice-topline .voice-trial-badge"), language).toHaveText(
    SITE[language].voice.triesLeft.replace("{n}", String(voice.remaining)),
  );
  expect(ids.length, `${language}: draft requests before Try again`).toBe(1);
  return { retry, tries: await badgeNumber(page) };
}

for (const failure of ["offline", "502"] as const) {
  test(`WEB-719: after a recording's request fails (${failure}), Try again stays in place, disabled and focused, while the resend waits; no Done appears; then the result comes with the same request id`, async ({
    page,
    voice,
  }) => {
    const ids = await draftIds(page, voice);
    for (const language of LANGUAGES) {
      const { retry, tries } = await failRecording(page, voice, language, failure, ids);
      await retry.click();

      // While the resend waits for its security check.
      await expect(retry, language).toBeVisible();
      await expect(retry, language).toHaveAccessibleName(TRY_AGAIN[language]);
      await expect(retry, language).toBeDisabled();
      await expect(retry, language).toBeFocused();
      await expect(demo(page).getByRole("button", { name: VOICE.done[language], exact: true }), language).toHaveCount(0);
      await expect(recordButton(page), language).not.toHaveClass(/(^|\s)is-recording(\s|$)/);
      await expect(recordButton(page), language).toBeDisabled();
      await expect(recordButton(page), language).toHaveAccessibleName(VOICE.talk[language]);
      await expect(captureHint(page), language).toHaveText(ONE_MOMENT[language]);
      // Focus stays on it, not only for a moment: the browser's focus fix-up runs after a render.
      await page.waitForTimeout(500);
      expect(
        await retry.evaluate((element) => element === document.activeElement),
        `${language}: Try again still has focus`,
      ).toBe(true);
      expect(ids.length, `${language}: no draft request since the failure`).toBe(1);

      // The security check passes: the resend goes, with the same id, and uses no try.
      expect(await releaseToken(page), `${language}: held security checks`).toBeGreaterThanOrEqual(1);
      await expect(stage(page, "review"), language).toBeVisible({ timeout: 15_000 });
      expect(ids.length, `${language}: draft requests in all`).toBe(2);
      expect(ids[0], `${language}: the first request's id`).not.toBe("");
      expect(ids[1], `${language}: the resent request's id`).toBe(ids[0]);
      await expect
        .poll(() => voice.requests.status, { message: `${language}: the status after the result` })
        .toBeGreaterThanOrEqual(3);
      await expect(demo(page).locator(".voice-topline .voice-trial-badge"), language).toHaveText(
        SITE[language].voice.triesLeft.replace("{n}", String(tries)),
      );
      expect(await badgeNumber(page), `${language}: tries left`).toBe(tries);
    }
    expect(voice.unexpected).toEqual([]);
  });
}

test("WEB-719: the normal path is unchanged: after Done, with the security check still waiting, it stays Done, disabled, with One moment… under it, and there's no Try again", async ({
  page,
  voice,
}) => {
  voice.turnstile = "hold";
  await capture(page, "en");
  await talkButton(page, "en").click();
  await expect(recordButton(page)).toHaveClass(/(^|\s)is-recording(\s|$)/);
  await expect(recordButton(page)).toHaveAccessibleName(VOICE.done.en);
  await page.waitForTimeout(1500);
  await recordButton(page).click();
  await expect(recordButton(page)).toHaveAccessibleName(VOICE.done.en);
  await expect(recordButton(page)).toBeDisabled();
  await expect(captureHint(page)).toHaveText(ONE_MOMENT.en);
  await expect(demo(page).locator(".voice-retry")).toHaveCount(0);
  expect(voice.requests.draft, "draft requests before the check passes").toBe(0);
  expect(await releaseToken(page), "held security checks").toBe(1);
  await expect(stage(page, "review")).toBeVisible({ timeout: 15_000 });
  expect(voice.requests.draft, "draft requests").toBe(1);
  expect(voice.unexpected).toEqual([]);
});

for (const theme of THEMES) {
  test.describe(`${theme} WP42 axe`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-719: axe reports no violations while Try again waits for the security check (${theme})`, async ({
      page,
      voice,
    }) => {
      const ids = await draftIds(page, voice);
      const { retry } = await failRecording(page, voice, "en", "offline", ids);
      await retry.click();
      await expect(retry).toBeDisabled();
      await expect(captureHint(page)).toHaveText(ONE_MOMENT.en);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(await axeViolations(page), "Try again waiting").toEqual([]);
    });
  });
}

test("WEB-717: typed mode is unchanged: after a failed send, Done is still there and enabled, and there's no Try again", async ({
  page,
  voice,
}) => {
  voice.draft = serverError("invalid_draft");
  await capture(page, "en");
  await demo(page).getByRole("button", { name: VOICE.typeInstead.en, exact: true }).click();
  await demo(page).getByRole("textbox", { name: VOICE.textLabel.en, exact: true }).fill(TYPED);
  const done = demo(page).locator(".voice-submit");
  await expect(done).toBeEnabled({ timeout: 10_000 });
  await done.click();
  await expect(demo(page).getByRole("alert")).toBeVisible({ timeout: 15_000 });
  await expect(stage(page, "capture")).toBeVisible();
  await expect(done).toHaveCount(1);
  await expect(done).toHaveAccessibleName(VOICE.done.en);
  await expect(done).toBeEnabled({ timeout: 10_000 });
  await expect(demo(page).locator(".voice-retry")).toHaveCount(0);
});

test("WEB-718: the hidden status says Understanding… only while waiting, and is empty after a result, no tasks and an error", async ({
  page,
  voice,
}) => {
  const status = demo(page).locator(".voice-status");
  for (const language of ["en", "es"] as const) {
    // While waiting: the request never answers.
    voice.draft = "hang";
    await capture(page, language);
    await demo(page).getByRole("button", { name: VOICE.typeInstead[language], exact: true }).click();
    await demo(page).getByRole("textbox", { name: VOICE.textLabel[language], exact: true }).fill(TYPED);
    const done = demo(page).getByRole("button", { name: VOICE.done[language], exact: true });
    await expect(done).toBeEnabled({ timeout: 10_000 });
    await done.click();
    await expect(stage(page, "processing"), language).toBeVisible();
    await expect(status, `${language}: while waiting`).toHaveText(VOICE.understanding[language]);

    voice.remaining = 3;
    voice.draft = { tasks: TASKS };
    await typeAndSend(page, language);
    await expect(status, `${language}: after a result`).toHaveText("");

    voice.draft = { tasks: [] };
    await typeAndSend(page, language);
    await expect(status, `${language}: after no tasks`).toHaveText("");

    // A typed error.
    voice.remaining = 3;
    voice.draft = serverError("invalid_draft");
    await capture(page, language);
    await demo(page).getByRole("button", { name: VOICE.typeInstead[language], exact: true }).click();
    await demo(page).getByRole("textbox", { name: VOICE.textLabel[language], exact: true }).fill(TYPED);
    await expect(done).toBeEnabled({ timeout: 10_000 });
    await done.click();
    await expect(demo(page).getByRole("alert"), language).toBeVisible({ timeout: 15_000 });
    await expect(status, `${language}: after a typed error`).toHaveText("");

    // A spoken error (the stub has used tries for the earlier steps: give them back).
    voice.remaining = 3;
    voice.draft = serverError("audio_length");
    await recordAndSend(page, language);
    await expect(demo(page).getByRole("alert"), language).toBeVisible({ timeout: 15_000 });
    await expect(status, `${language}: after a spoken error`).toHaveText("");
  }
});

for (const theme of THEMES) {
  test.describe(`${theme} WP39 axe`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-716, WEB-717, WEB-718: axe reports no violations after a last-try result, a refused recording and a recording to resend (${theme})`, async ({
      page,
      voice,
    }) => {
      voice.remaining = 1;
      voice.resetAt = Date.now() + 20 * 3_600_000;
      voice.draft = { tasks: TASKS, remainingAfter: 0 };
      await typeAndSend(page, "en");
      await expect(demo(page).locator(".voice-again-later")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(await axeViolations(page), "last-try result").toEqual([]);

      voice.remaining = 3;
      voice.resetAt = null;
      voice.draft = serverError("audio_length");
      await recordAndSend(page, "es");
      await expect(demo(page).getByRole("alert")).toBeVisible({ timeout: 15_000 });
      expect(await axeViolations(page), "refused recording (es)").toEqual([]);

      voice.draft = "offline";
      await recordAndSend(page, "en");
      await expect(demo(page).locator(".voice-retry")).toBeVisible({ timeout: 15_000 });
      expect(await axeViolations(page), "recording to resend").toEqual([]);
    });
  });
}

// ---- Batch 4, round 1, WP29: waiting, failures and the security check ----

type Voice = (typeof en)["voice"];
type ErrorKey = keyof Voice["errors"];
// The plan's exact copy (WP29 brief), for the one test that's about the wording; the other
// tests read it from src/content/site/, so a correct rewording there breaks only that one.
const WP29_COPY = {
  understanding: { en: "Understanding…", es: "Entendiendo…", ca: "Entenent…" },
  stillUnderstanding: {
    en: "Still understanding. This can take up to half a minute.",
    es: "Sigo entendiendo. Puede tardar hasta medio minuto.",
    ca: "Encara ho estic entenent. Pot trigar fins a mig minut.",
  },
  stopWaiting: { en: "Stop waiting", es: "Dejar de esperar", ca: "Deixa d’esperar" },
  tryAgain: { en: "Try again", es: "Reintentar", ca: "Torna-ho a provar" },
  checkTap: {
    en: "Tap the security check above to continue.",
    es: "Toca la comprobación de seguridad de arriba para continuar.",
    ca: "Toca la comprovació de seguretat de dalt per continuar.",
  },
  checkFailed: {
    en: "The security check didn’t load. Check your connection, then tap Try again.",
    es: "La comprobación de seguridad no se ha cargado. Revisa la conexión y toca Reintentar.",
    ca: "La comprovació de seguretat no s’ha carregat. Revisa la connexió i toca Torna-ho a provar.",
  },
  errors: {
    offline: {
      en: "No connection. Check Wi-Fi or mobile data and try again. What you said is kept, and trying again won’t cost an extra try.",
      es: "No hay conexión. Revisa el wifi o los datos móviles e inténtalo de nuevo. Lo que dijiste se conserva y volver a probar no te costará otro intento.",
      ca: "No hi ha connexió. Revisa la wifi o les dades mòbils i torna-ho a provar. El que has dit es conserva i tornar-ho a provar no et costarà cap altre intent.",
    },
    // WP43 (WEB-721): opening with no connection, before anything has been said.
    offlineOpening: {
      en: "No connection. Check Wi-Fi or mobile data and try again.",
      es: "No hay conexión. Revisa el wifi o los datos móviles e inténtalo de nuevo.",
      ca: "No hi ha connexió. Revisa la wifi o les dades mòbils i torna-ho a provar.",
    },
    notAnswering: {
      en: "The demo isn’t answering right now. Try again in a few minutes.",
      es: "La demo no responde ahora mismo. Vuelve a probar en unos minutos.",
      ca: "La demo no respon ara mateix. Torna-ho a provar d’aquí a uns minuts.",
    },
    timeout: {
      en: "This is taking too long. Try again in a moment; it won’t use another try.",
      es: "Está tardando demasiado. Vuelve a probar en un momento; no gastará otro intento.",
      ca: "Està trigant massa. Torna-ho a provar d’aquí a un moment; no gastarà cap altre intent.",
    },
    networkLimit: {
      en: "Many people on this network have tried the demo. Try again later, or from another connection.",
      es: "Mucha gente en esta red ha probado la demo. Vuelve a probar más tarde o desde otra conexión.",
      ca: "Molta gent d’aquesta xarxa ha provat la demo. Torna-ho a provar més tard o des d’una altra connexió.",
    },
    off: {
      en: "The live demo is off for now. The example above shows what TaskFlow does.",
      es: "La demo en directo está parada por ahora. El ejemplo de arriba muestra lo que hace TaskFlow.",
      ca: "La demo en directe està aturada de moment. L’exemple de dalt mostra què fa TaskFlow.",
    },
    // WP43 (WEB-723): under the static example after the security check fails twice.
    unverified: {
      en: "The security check didn’t load, so the live demo can’t run here. The example above shows what TaskFlow does.",
      es: "La comprobación de seguridad no se ha cargado, así que la demo en directo no puede funcionar aquí. El ejemplo de arriba muestra lo que hace TaskFlow.",
      ca: "La comprovació de seguretat no s’ha carregat, així que la demo en directe no pot funcionar aquí. L’exemple de dalt mostra què fa TaskFlow.",
    },
    invalidDraft: {
      en: "We couldn’t turn that into tasks, and it used a try. Say what you need to do, and when.",
      es: "No hemos podido convertirlo en tareas y ha contado como un intento. Di qué tienes que hacer y cuándo.",
      ca: "No ho hem pogut convertir en tasques i ha comptat com un intent. Digues què has de fer i quan.",
    },
    recording: {
      en: "We couldn’t hear that recording. Record it again; it didn’t use a try.",
      es: "No hemos podido oír la grabación. Grábala otra vez; no ha contado como intento.",
      ca: "No hem pogut sentir l’enregistrament. Torna’l a gravar; no ha comptat com un intent.",
    },
    processing: {
      en: "Still understanding. Try again in a moment; it won’t use another try.",
      es: "Sigo entendiendo. Vuelve a probar en un momento; no gastará otro intento.",
      ca: "Encara ho estic entenent. Torna-ho a provar d’aquí a un moment; no gastarà cap altre intent.",
    },
    sayAgain: {
      en: "Something went wrong. Say it again.",
      es: "Algo ha fallado. Vuelve a decirlo.",
      ca: "Alguna cosa ha fallat. Torna-ho a dir.",
    },
    empty: {
      en: "Say or type what you need to do first.",
      es: "Primero di o escribe lo que necesitas hacer.",
      ca: "Primer digues o escriu què has de fer.",
    },
  } as Record<ErrorKey, Copy>,
};

// The brief's table: which message each API code shows. A code it doesn't name falls back
// to ‘The demo isn’t answering’; visitor_limit shows the tries-used state, verification
// the security check's message and its Try again.
const MESSAGE_BY_CODE: Record<string, ErrorKey | "triesUsed" | "check"> = {
  network_limit: "networkLimit",
  budget_pause: "off",
  paused: "off",
  not_ready: "off",
  budget_config: "off",
  unavailable: "off",
  invalid_draft: "invalidDraft",
  invalid_audio: "recording",
  audio_length: "recording",
  too_large: "recording",
  payload: "recording",
  processing: "processing",
  expired: "sayAgain",
  previous_failure: "sayAgain",
  request_id: "sayAgain",
  session_required: "sayAgain",
  empty: "empty",
  visitor_limit: "triesUsed",
  verification: "check",
};
// One error per code, as the server sends it.
const CODES = [...new Map(SERVER_ERRORS.map((error) => [error.code, error])).values()];
// Words a browser or a proxy would put in a message.
const BROWSER_WORDS = /fetch|json|token|doctype/i;
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const closeButton = (page: Page, language: Language) =>
  demo(page).getByRole("button", { name: SITE[language].voice.close, exact: true });
const textBox = (page: Page, language: Language) =>
  demo(page).getByRole("textbox", { name: VOICE.textLabel[language], exact: true });
async function typeThought(page: Page, language: Language, text = TYPED) {
  await capture(page, language);
  await demo(page).getByRole("button", { name: VOICE.typeInstead[language], exact: true }).click();
  await textBox(page, language).fill(text);
}
async function sendTyped(page: Page) {
  const send = demo(page).locator(".voice-submit");
  await expect(send).toBeEnabled({ timeout: 10_000 });
  await send.click();
}
// Drawn filled: a background that isn't transparent.
const isFilled = (locator: Locator) =>
  locator.evaluate((element) => {
    const match = /rgba?\(([^)]+)\)/.exec(getComputedStyle(element).backgroundColor);
    const parts = match ? match[1].split(/[\s,/]+/).filter(Boolean).map(Number) : [0, 0, 0, 0];
    return (parts[3] ?? 1) > 0;
  });
const triesBadge = (page: Page) => demo(page).locator(".voice-topline .voice-trial-badge");

test("WEB-13, WEB-401, WEB-12, WEB-403, WEB-2: the demo's waiting, failure and security-check messages are the plan's copy in each language", async () => {
  for (const language of LANGUAGES) {
    const t = SITE[language].voice;
    expect(t.understanding, `${language}: understanding`).toBe(WP29_COPY.understanding[language]);
    expect(t.stillUnderstanding, `${language}: the 10-second line`).toBe(WP29_COPY.stillUnderstanding[language]);
    expect(t.stopWaiting, `${language}: Stop waiting`).toBe(WP29_COPY.stopWaiting[language]);
    expect(t.tryAgain, `${language}: Try again`).toBe(WP29_COPY.tryAgain[language]);
    expect(t.checkTap, `${language}: the tap line`).toBe(WP29_COPY.checkTap[language]);
    expect(t.checkFailed, `${language}: the check failed`).toBe(WP29_COPY.checkFailed[language]);
    for (const [key, copy] of Object.entries(WP29_COPY.errors))
      expect(t.errors[key as ErrorKey], `${language}: errors.${key}`).toBe(copy[language]);
  }
});

test("WEB-13: while waiting, the heading says Understanding… with nothing under it; at 10 s the longer-wait line and Stop waiting appear; Close demo stays enabled", async ({
  page,
  voice,
}) => {
  await page.clock.install();
  for (const language of LANGUAGES) {
    const t = SITE[language].voice;
    voice.remaining = 3;
    voice.draft = "hang";
    await typeThought(page, language);
    await sendTyped(page);
    await expect(stage(page, "processing"), language).toBeVisible();
    // What the waiting stage shows, under the badge and Close demo.
    const waiting = demo(page).locator(".voice-processing");
    await expect(waiting.getByRole("heading", { level: 3 }), language).toHaveText(t.understanding);
    // Only the heading: no subline, no ‘Your drafts will appear right here…’.
    expect(flat(await waiting.innerText()), `${language}: the waiting stage at 0 s`).toBe(t.understanding);
    await expect(closeButton(page, language), `${language}: Close demo at 0 s`).toBeEnabled();
    // 9 s: still only the heading.
    await page.clock.fastForward(9_000);
    await expect(waiting.getByText(t.stillUnderstanding), `${language}: the line at 9 s`).toHaveCount(0);
    await expect(waiting.getByRole("button", { name: t.stopWaiting }), `${language}: Stop waiting at 9 s`).toHaveCount(0);
    // 10 s: the line and Stop waiting.
    await page.clock.fastForward(1_500);
    await expect(waiting.getByText(t.stillUnderstanding, { exact: true }), `${language}: the line at 10 s`).toBeVisible();
    await expect(
      waiting.getByRole("button", { name: t.stopWaiting, exact: true }),
      `${language}: Stop waiting at 10 s`,
    ).toBeEnabled();
    await expect(closeButton(page, language), `${language}: Close demo at 10 s`).toBeEnabled();
  }
  expect(voice.unexpected).toEqual([]);
});

test("WEB-13, WEB-724: Stop waiting keeps the typed text, says it's still understanding, and offers a filled Try again, which sends it again without using another try", async ({
  page,
  voice,
}) => {
  await page.clock.install();
  const ids = await draftIds(page, voice);
  for (const language of LANGUAGES) {
    const t = SITE[language].voice;
    voice.remaining = 3;
    voice.resetAt = null;
    voice.draft = "hang";
    voice.requests.status = 0;
    ids.length = 0;
    await typeThought(page, language);
    await sendTyped(page);
    await expect(stage(page, "processing"), language).toBeVisible();
    await page.clock.fastForward(10_500);
    await demo(page).getByRole("button", { name: t.stopWaiting, exact: true }).click();
    await expect(stage(page, "capture"), language).toBeVisible();
    // WEB-724: the still-understanding message, focused.
    const alert = demo(page).getByRole("alert");
    await expect(alert, language).toHaveText(t.errors.processing);
    await expect(alert, `${language}: the message has focus`).toBeFocused();
    await expect(textBox(page, language), `${language}: the text kept`).toHaveValue(TYPED);
    const retry = demo(page).locator(".voice-submit");
    await expect(retry, language).toHaveAccessibleName(t.tryAgain);
    await expect(retry, language).toBeEnabled({ timeout: 10_000 });
    expect(await isFilled(retry), `${language}: Try again is filled`).toBe(true);
    // The status after stopping has arrived: the badge shows what the server counted.
    await expect
      .poll(() => voice.requests.status, { message: `${language}: the status after stopping` })
      .toBeGreaterThanOrEqual(2);
    await expect(triesBadge(page), language).toHaveText(t.triesLeft.replace("{n}", String(voice.remaining)));
    const tries = await badgeNumber(page);
    await retry.click();
    await expect(stage(page, "review"), language).toBeVisible({ timeout: 15_000 });
    expect(ids.length, `${language}: draft requests`).toBe(2);
    expect(ids[1], `${language}: the resent request's id`).toBe(ids[0]);
    await expect
      .poll(() => voice.requests.status, { message: `${language}: the status after the result` })
      .toBeGreaterThanOrEqual(3);
    await expect(triesBadge(page), language).toHaveText(t.triesLeft.replace("{n}", String(tries)));
  }
  expect(voice.unexpected).toEqual([]);
});

test("WEB-13, WEB-724: Stop waiting keeps a recording, says it's still understanding: Try again resends it with the same request id", async ({ page, voice }) => {
  await page.clock.install();
  const ids = await draftIds(page, voice);
  voice.draft = "hang";
  await recordAndSend(page, "en");
  await expect(stage(page, "processing")).toBeVisible();
  await page.clock.fastForward(10_500);
  await demo(page).getByRole("button", { name: en.voice.stopWaiting, exact: true }).click();
  await expect(stage(page, "capture")).toBeVisible();
  await expect(demo(page).getByRole("alert")).toHaveText(en.voice.errors.processing);
  await expect(demo(page).getByRole("alert"), "the message has focus").toBeFocused();
  const retry = stage(page, "capture").locator(".voice-retry");
  await expect(retry).toHaveAccessibleName(en.voice.tryAgain);
  await expect(retry).toBeEnabled({ timeout: 10_000 });
  expect(await isFilled(retry), "Try again is filled").toBe(true);
  await retry.click();
  await expect(stage(page, "review")).toBeVisible({ timeout: 15_000 });
  expect(ids.length, "draft requests").toBe(2);
  expect(ids[1], "the resent request's id").toBe(ids[0]);
  expect(voice.unexpected).toEqual([]);
});

test("WEB-13: Close demo while waiting stops the request and closes the demo, with no message", async ({ page, voice }) => {
  voice.draft = "hang";
  await typeThought(page, "en");
  await sendTyped(page);
  await expect(stage(page, "processing")).toBeVisible();
  const stopped = page.waitForEvent("requestfailed", {
    predicate: (request) => request.url().includes("/api/voice/draft/"),
    timeout: 10_000,
  });
  await closeButton(page, "en").click();
  await expect(stage(page, "intro")).toBeVisible();
  await stopped;
  await expect(demo(page).getByRole("alert")).toHaveCount(0);
  await expect(demo(page).getByRole("button", { name: VOICE.start.en, exact: true })).toBeFocused();
});

test("WEB-13: the page gives up after 40 s, not before, with the timeout message and Try again", async ({ page, voice }) => {
  await fakeTime(page);
  for (const language of ["en", "es"] as const) {
    const t = SITE[language].voice;
    voice.remaining = 3;
    voice.draft = "hang";
    await typeThought(page, language);
    await sendTyped(page);
    await expect(stage(page, "processing"), language).toBeVisible();
    const timeout = (await heldTimeouts(page)).at(-1)!;
    const at = async (seconds: number) => {
      const ms = timeout.at + seconds * 1000 - (await page.evaluate(() => Date.now()));
      if (ms > 0) await page.clock.fastForward(ms);
      await expireTimeouts(page);
    };
    await at(39.5);
    await expect(stage(page, "processing"), `${language}: still waiting at 39.5 s`).toBeVisible();
    await expect(demo(page).getByRole("alert"), `${language}: no alert at 39.5 s`).toHaveCount(0);
    await at(40.2);
    await expect(demo(page).getByRole("alert"), `${language}: at 40 s`).toHaveText(t.errors.timeout);
    await expect(stage(page, "capture"), language).toBeVisible();
    await expect(textBox(page, language), `${language}: the text kept`).toHaveValue(TYPED);
    await expect(demo(page).locator(".voice-submit"), language).toHaveAccessibleName(t.tryAgain);
  }
});

for (const failure of ["offline", "html"] as const) {
  const what = failure === "offline" ? "no connection" : "a 502 HTML page";
  test(`WEB-401, WEB-721: when opening the demo gets ${what}, the panel shows the mapped message and Try again, with no browser words`, async ({
    page,
    voice,
  }) => {
    for (const language of LANGUAGES) {
      const t = SITE[language].voice;
      voice.status = failure;
      await openDemo(page, language);
      const alert = demo(page).getByRole("alert");
      // WEB-721: opening offline doesn't say what was said is kept; nothing has been said yet.
      await expect(alert, language).toHaveText(failure === "offline" ? t.errors.offlineOpening : t.errors.notAnswering);
      expect(await alert.innerText(), `${language}: browser words`).not.toMatch(BROWSER_WORDS);
      const again = stage(page, "connecting").getByRole("button", { name: t.tryAgain, exact: true });
      await expect(again, language).toBeVisible();
      expect(await isFilled(again), `${language}: Try again is filled`).toBe(true);
      // Only the message and Try again: no heading, no second retry.
      await expect(stage(page, "connecting").getByRole("heading"), language).toHaveCount(0);
      const text = flat(await panel(page).innerText());
      for (const gone of ["Let’s try that again", "Try connecting again"])
        expect(text, `${language}: “${gone}”`).not.toContain(gone);
      expect(text, `${language}: browser words in the panel`).not.toMatch(BROWSER_WORDS);
      voice.status = "ok";
      await again.click();
      await expect(stage(page, "capture"), `${language}: after Try again`).toBeVisible();
    }
    expect(voice.unexpected).toEqual([]);
  });

  test(`WEB-401: when sending gets ${what}, the alert shows the mapped message, no browser words, and a filled Try again`, async ({
    page,
    voice,
  }) => {
    for (const language of LANGUAGES) {
      const t = SITE[language].voice;
      voice.remaining = 3;
      voice.draft = failure;
      await typeThought(page, language);
      await sendTyped(page);
      const alert = demo(page).getByRole("alert");
      await expect(alert, language).toHaveText(failure === "offline" ? t.errors.offline : t.errors.notAnswering, {
        timeout: 15_000,
      });
      expect(await alert.innerText(), `${language}: browser words`).not.toMatch(BROWSER_WORDS);
      expect(flat(await panel(page).innerText()), `${language}: browser words in the panel`).not.toMatch(BROWSER_WORDS);
      const retry = demo(page).locator(".voice-submit");
      await expect(retry, language).toHaveAccessibleName(t.tryAgain);
      await expect(retry, language).toBeEnabled({ timeout: 10_000 });
      expect(await isFilled(retry), `${language}: Try again is filled`).toBe(true);
    }
    expect(voice.unexpected).toEqual([]);
  });
}

for (const error of CODES) {
  const shows = MESSAGE_BY_CODE[error.code] ?? "notAnswering";
  const named =
    shows === "triesUsed"
      ? "the tries-used state"
      : shows === "check"
        ? "the security check's message and Try again"
        : `errors.${shows}`;
  test(`WEB-12: the API's ${error.code} shows ${named} in each language, never the server's words`, async ({
    page,
    voice,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The mapping is the same on both projects; every state runs on both in the scans below.");
    for (const language of LANGUAGES) {
      const t = SITE[language].voice;
      voice.remaining = 3;
      voice.resetAt = null;
      voice.draft = error;
      voice.remainingAfterError = error.code === "visitor_limit" ? 0 : null;
      await typeThought(page, language);
      await sendTyped(page);
      if (shows === "triesUsed") {
        await expect(stage(page, "tries-used"), language).toBeVisible({ timeout: 15_000 });
        expect(
          flat(await stage(page, "tries-used").getByRole("heading", { level: 3 }).textContent()),
          language,
        ).toMatch(new RegExp(`^${escapeRegExp(VOICE.triesUsedStart[language])}`));
        await expect(demo(page).getByRole("alert"), language).toHaveCount(0);
      } else if (shows === "check") {
        await expect(demo(page).getByRole("alert"), language).toHaveText(t.checkFailed, { timeout: 15_000 });
        await expect(stage(page, "capture").locator(".voice-check-retry"), language).toHaveAccessibleName(t.tryAgain);
      } else {
        const alert = demo(page).getByRole("alert");
        await expect(alert, language).toHaveText(t.errors[shows], { timeout: 15_000 });
        if (shows === "off") {
          // WP26's static example directly above the message.
          const example = stage(page, "off").locator(".voice-example");
          await expect(example, `${language}: the static example`).toBeVisible();
          expect(
            await alert.evaluate(
              (element) => element.previousElementSibling?.classList.contains("voice-example") ?? false,
            ),
            `${language}: the example is the element right before the message`,
          ).toBe(true);
          const [above, below] = [(await example.boundingBox())!, (await alert.boundingBox())!];
          expect(below.y, `${language}: the message starts under the example`).toBeGreaterThanOrEqual(
            above.y + above.height - 1,
          );
          expect(below.y - (above.y + above.height), `${language}: the gap between them`).toBeLessThanOrEqual(48);
        }
      }
      const text = flat(await panel(page).innerText());
      if (error.error) expect(text, `${language}: the server's own message`).not.toContain(error.error);
      expect(text, `${language}: browser words`).not.toMatch(BROWSER_WORDS);
    }
    expect(voice.unexpected).toEqual([]);
  });
}

// ---- WP29: the security check ----

const recordControl = (page: Page) => page.locator("#voice-record");

test("WEB-403: when Cloudflare's script can't load, the panel says so with a Try again in place, the microphone stays off, and a check that then passes turns it on", async ({
  page,
  voice,
}) => {
  for (const language of ["en", "es"] as const) {
    const t = SITE[language].voice;
    voice.turnstile = "unreachable";
    await capture(page, language);
    await expect(demo(page).getByRole("alert"), language).toHaveText(t.checkFailed);
    const retry = stage(page, "capture").getByRole("button", { name: t.tryAgain, exact: true });
    await expect(retry, language).toBeVisible();
    await expect(recordControl(page), `${language}: the microphone before a token`).toBeDisabled();
    voice.turnstile = "pass";
    await retry.click();
    await expect(recordControl(page), `${language}: the microphone once the check passed`).toBeEnabled({
      timeout: 10_000,
    });
    await expect(demo(page).getByRole("alert"), `${language}: the message once the check passed`).toHaveCount(0);
    await expect(retry, language).toHaveCount(0);
  }
  expect(voice.unexpected).toEqual([]);
});

test("WEB-403, WEB-723: after the security check fails twice, the static example, the reason (focused) and the hand-over replace the form", async ({
  page,
  voice,
}) => {
  for (const language of ["en", "ca"] as const) {
    const t = SITE[language].voice;
    voice.turnstile = "unreachable";
    await capture(page, language);
    await stage(page, "capture").getByRole("button", { name: t.tryAgain, exact: true }).click();
    const gaveUp = stage(page, "unverified");
    await expect(gaveUp, language).toBeVisible({ timeout: 10_000 });
    await expect(gaveUp.locator(".voice-example"), `${language}: the static example`).toBeVisible();
    await expect(gaveUp.getByText(t.handOver, { exact: true }), `${language}: the hand-over`).toBeVisible();
    // WEB-723: the reason, between the example and the hand-over, with focus; the only alert.
    const alert = demo(page).getByRole("alert");
    await expect(alert, language).toHaveCount(1);
    await expect(alert, language).toHaveText(t.errors.unverified);
    await expect(alert, `${language}: the reason has focus`).toBeFocused();
    expect(
      await alert.evaluate((element) => [
        element.previousElementSibling?.classList.contains("voice-example") ?? false,
        element.nextElementSibling?.classList.contains("voice-handover") ?? false,
      ]),
      `${language}: the example before the reason, the hand-over after it`,
    ).toEqual([true, true]);
    await expect(recordControl(page), `${language}: no microphone`).toHaveCount(0);
    await expect(demo(page).getByRole("textbox"), `${language}: no text box`).toHaveCount(0);
    await expect(
      demo(page).locator(".voice-submit, .voice-mode-link"),
      `${language}: no send or Type instead`,
    ).toHaveCount(0);
  }
  expect(voice.unexpected).toEqual([]);
});

test("WEB-403: while the security check waits for a tap, the tap line sits directly above the disabled send", async ({
  page,
  voice,
}) => {
  voice.turnstile = "interactive";
  for (const language of LANGUAGES) {
    const t = SITE[language].voice;
    await capture(page, language);
    // The visible line (the hidden live status says the same words once).
    const line = stage(page, "capture").locator("p:not([role='status'])", { hasText: t.checkTap });
    await expect(line, `${language}: one tap line`).toHaveCount(1);
    await expect(line, language).toHaveText(t.checkTap);
    await expect(line, `${language}: the tap line by the microphone`).toBeVisible();
    await expect(recordControl(page), `${language}: the microphone`).toBeDisabled();
    await demo(page).getByRole("button", { name: VOICE.typeInstead[language], exact: true }).click();
    await textBox(page, language).fill(TYPED);
    const send = demo(page).locator(".voice-submit");
    await expect(line, `${language}: the tap line by the send`).toBeVisible();
    await expect(send, language).toBeDisabled();
    expect(
      await line.evaluate((element) => element.nextElementSibling?.classList.contains("voice-submit") ?? false),
      `${language}: the send is the next element after the line`,
    ).toBe(true);
    const [above, below] = [(await line.boundingBox())!, (await send.boundingBox())!];
    const gap = below.y - (above.y + above.height);
    expect(gap, `${language}: the gap from the line to the send`).toBeGreaterThanOrEqual(0);
    expect(gap, `${language}: the gap from the line to the send`).toBeLessThanOrEqual(24);
  }
});

test("WEB-403: with a check that passes on its own, no security-check box shows, and its holder has no aria-label", async ({
  page,
  voice,
}) => {
  voice.turnstile = "pass";
  await capture(page, "en");
  await expect(page.locator("#voice [data-ux-ignore]")).toBeAttached();
  await expect(recordControl(page)).toBeEnabled({ timeout: 10_000 });
  const holder = demo(page).locator(".voice-verification");
  await expect(holder).toHaveCount(1);
  await expect(holder).toBeHidden();
  await expect(holder).not.toHaveAttribute("aria-label", /.*/);
});

test("WEB-403: the API's verification refusal shows the check's message and a Try again in place that resends", async ({
  page,
  voice,
}) => {
  voice.draft = serverError("verification");
  await typeThought(page, "en");
  await sendTyped(page);
  await expect(demo(page).getByRole("alert")).toHaveText(en.voice.checkFailed, { timeout: 15_000 });
  const retry = stage(page, "capture").locator(".voice-check-retry");
  await expect(retry).toHaveAccessibleName(en.voice.tryAgain);
  await expect(demo(page).locator(".voice-submit")).toBeDisabled();
  voice.draft = { tasks: TASKS };
  const before = voice.requests.draft;
  await retry.click();
  await expect(stage(page, "review")).toBeVisible({ timeout: 15_000 });
  expect(voice.requests.draft - before, "draft requests after Try again").toBe(1);
  expect(voice.unexpected).toEqual([]);
});

// ---- WP29: type in rem ----

// Every visible text in #voice and its computed size, outside Cloudflare's widget.
const voiceTextSizes = (page: Page) =>
  page.locator("#voice").evaluate((root) => {
    const found: { text: string; size: number; element: string }[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim();
      const parent = node.parentElement;
      if (!text || !parent || !parent.checkVisibility() || parent.closest("[data-ux-ignore]")) continue;
      const { width, height } = parent.getBoundingClientRect();
      if (width <= 1 || height <= 1) continue; // Visually hidden (screen-reader only).
      found.push({
        text: text.slice(0, 50),
        size: parseFloat(getComputedStyle(parent).fontSize),
        element: `${parent.tagName.toLowerCase()}.${[...parent.classList].join(".")}`,
      });
    }
    return found;
  });

test("WEB-8: the demo's text follows the browser's text size, and its error box is 16 px", async ({ page, voice }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Once is enough: the CSS is the same on both projects.");
  const states = async () => {
    voice.remaining = 3;
    voice.draft = "offline";
    await capture(page, "en");
    const capturing = await voiceTextSizes(page);
    await demo(page).getByRole("button", { name: VOICE.typeInstead.en, exact: true }).click();
    await textBox(page, "en").fill(TYPED);
    const typing = await voiceTextSizes(page);
    await sendTyped(page);
    const alert = demo(page).getByRole("alert");
    await expect(alert).toBeVisible({ timeout: 15_000 });
    const failed = await voiceTextSizes(page);
    const alertSize = parseFloat(await alert.evaluate((element) => getComputedStyle(element).fontSize));
    return { texts: [...capturing, ...typing, ...failed], alertSize };
  };
  const normal = await states();
  expect(normal.alertSize, "the error box at 100%").toBe(16);
  await doubleTextSize(page);
  const doubled = await states();
  expect(await rootFontSize(page), "the root at 200%").toBe(32);
  expect(doubled.alertSize, "the error box at 200%").toBe(32);
  // Each text, matched by its element and words, follows the root. Text in px wouldn't move;
  // text in rem doubles; the few sized with clamp() between two rem sizes and a vw share
  // (the section's h2, the prompt) grow by less.
  const stayed = normal.texts.flatMap((before) => {
    const after = doubled.texts.find((text) => text.element === before.element && text.text === before.text);
    return after && after.size < before.size * 1.2 ? [{ ...before, after: after.size }] : [];
  });
  const doubledText = normal.texts.filter((before) =>
    doubled.texts.some((text) => text.element === before.element && text.text === before.text && Math.abs(text.size - before.size * 2) <= 0.5),
  );
  expect(doubledText.length, "texts that doubled").toBeGreaterThan(normal.texts.length / 2);
  expect(stayed, "demo text that didn't grow with the browser's text size").toEqual([]);
  expect(normal.texts.length).toBeGreaterThan(5);
});

// ---- WP29: every stubbed state, in each theme and on both projects ----

// The words the brief removes from every state (WEB-12). ‘Tomorrow’ is checked outside the
// teaching example (WD1's static example and the prompt above the microphone), which says
// ‘Tomorrow, call the dentist and buy bread.’ on purpose.
const WP29_WORDS = [
  /allowance/i,
  /rolling/i,
  /submission/i,
  /sync/i,
  /AI call/i,
  /voice-to-task/i,
  /draft/i,
  /request/i,
  /PCM/,
  /chunk/i,
  /timezone/i,
  /tomorrow/i,
];
// Batch 5, WP46: the words no state of the demo says, in any of its languages (WEB-9,
// WEB-109), the walkthrough no message names (WEB-6), and the developer-only text, which
// shows only with ?developer=1.
const WP46_WORDS = [
  /draft/i,
  /borrador/i,
  /esborrany/i,
  /allowance/i,
  /transcri/i,
  /sync/i,
  /sincroniz/i,
  /sincronitz/i,
  /voice-to-task/i,
  /shared list/i,
  /MiB/,
  /Whenever you[’']re ready/i,
  /Create drafts/i,
  /Record again/i,
  /Task 1/i,
  /priority/i,
  /walkthrough/i,
  /\bsample\b/i,
  /recorrido/i,
  /recorregut/i,
  /Developer testing/i,
  /Browser testing code/i,
  /Check developer access/i,
];
// English a Spanish or Catalan page mustn't show (WEB-2).
const ENGLISH = [/\bthe /i, /\byour /i, /\btries\b/i, /Try again/i, /\bDone\b/, /Listening/i, /Understanding/i, /Close demo/i];
// What the stub answers stands for the AI's: tasks and transcript in the language spoken.
const STUB_WORDS = [
  TRANSCRIPT,
  ...TASKS.flatMap((task) => [task.title, task.notes, task.question ?? ""]),
  "Pick up the dry cleaning",
  "The blue coat.",
  "Water the plants",
  "Book a table for Saturday",
  "For four, around eight.",
].filter(Boolean);

// The demo's visible text, without Cloudflare's widget, and without the elements `skip` matches.
const demoText = (page: Page, skip: string[]) =>
  page.locator("#voice").evaluate((root, skip) => {
    const parts: string[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || !parent.checkVisibility()) continue;
      if (parent.closest("[data-ux-ignore], script, style, noscript, template")) continue;
      if (skip.some((selector) => parent.closest(selector))) continue;
      parts.push(node.textContent ?? "");
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }, skip);

async function runScenario(
  scenario: Scenario,
  page: Page,
  voice: VoiceStub,
  project: Project,
  check: (state: string) => Promise<void>,
) {
  await scenario.setup?.(page, voice);
  const seen: string[] = [];
  await scenario.run({
    page,
    voice,
    project,
    capture: async (state) => {
      seen.push(state);
      await check(state);
    },
  });
  expect(seen.length, `${scenario.key}: states reached`).toBeGreaterThan(0);
  expect(voice.unexpected).toEqual([]);
}

for (const theme of THEMES) {
  test.describe(`${theme} WP29 states`, () => {
    test.use({ colorScheme: theme });
    for (const scenario of scenarios(ROOT).list) {
      test(`WEB-12, WEB-8, WEB-403, WEB-9, WEB-109: in ${scenario.key} (${theme}), #voice shows none of the removed words, no text under 12 px, and axe finds nothing`, async ({
        page,
        voice,
      }, testInfo) => {
        test.setTimeout(120_000);
        await runScenario(scenario, page, voice, testInfo.project.name as Project, async (state) => {
          await expect(page.locator("html"), state).toHaveAttribute("data-theme", theme);
          const text = await demoText(page, [".voice-example", ".voice-prompt"]);
          for (const word of WP29_WORDS) expect(text, `${state}: ${word}`).not.toMatch(word);
          const all = await demoText(page, []);
          for (const word of WP46_WORDS) expect(all, `${state}: ${word}`).not.toMatch(word);
          const small = (await voiceTextSizes(page)).filter(({ size }) => size < 12);
          expect(small, `${state}: text under 12 px`).toEqual([]);
          expect(await axeViolations(page), `${state}: axe`).toEqual([]);
        });
      });
    }
  });
}

for (const language of ["es", "ca"] as const) {
  for (const scenario of scenarios(ROOT, language).list) {
    test(`WEB-2, WEB-9, WEB-109: on /${language}/, ${scenario.key} shows no English and none of the removed words in #voice`, async ({ page, voice }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "The words are the same on both projects.");
      test.setTimeout(120_000);
      await runScenario(scenario, page, voice, "desktop", async (state) => {
        const all = await demoText(page, []);
        for (const word of WP46_WORDS) expect(all, `/${language}/ ${state}: ${word}`).not.toMatch(word);
        let text = all;
        for (const words of STUB_WORDS) text = text.split(words).join(" ");
        for (const word of ENGLISH) expect(text, `/${language}/ ${state}: ${word}`).not.toMatch(word);
      });
    });
  }
}

// ---- Batch 4, round 2, WP43: honest messages when opening fails, the check gives up, or
// you stop waiting ----

// The plan's exact copy (WP43's acceptance checks); the messages are in WP29_COPY above.
const WP43_COPY = {
  liveDemo: { en: "Live demo", es: "Demo en directo", ca: "Demo en directe" } as Copy,
  fullTries: { en: "3 of 3 tries left", es: "3 de 3 intentos disponibles", ca: "3 de 3 intents disponibles" } as Copy,
};
// What the sending message promises, which opening mustn't: nothing has been said yet.
const KEPT = /kept|conserva/i;

async function badgeSays(page: Page, expected: string, what: string) {
  const badge = triesBadge(page);
  await expect(badge, what).toHaveText(expected);
  expect(flat(await badge.textContent()), `${what}: a number in the badge`).not.toMatch(/\d/);
}

for (const theme of THEMES) {
  test.describe(`${theme} WP43`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-721: opening the demo with no connection says only to check the connection, with a filled Try again under it, and axe finds nothing (${theme})`, async ({
      page,
      voice,
    }) => {
      for (const language of LANGUAGES) {
        voice.status = "offline";
        await openDemo(page, language);
        await expect(page.locator("html"), language).toHaveAttribute("data-theme", theme);
        const alert = panel(page).getByRole("alert");
        await expect(alert, language).toHaveText(WP29_COPY.errors.offlineOpening[language], { timeout: 15_000 });
        expect(flat(await alert.innerText()), `${language}: what was said is kept`).not.toMatch(KEPT);
        const again = stage(page, "connecting").getByRole("button", { name: WP29_COPY.tryAgain[language], exact: true });
        await expect(again, language).toBeVisible();
        expect(await isFilled(again), `${language}: Try again is filled`).toBe(true);
        const [message, button] = [(await alert.boundingBox())!, (await again.boundingBox())!];
        expect(button.y, `${language}: Try again under the message`).toBeGreaterThanOrEqual(message.y + message.height - 1);
        expect(await axeViolations(page), `${language}: axe`).toEqual([]);
      }
      expect(voice.unexpected).toEqual([]);
    });

    test(`WEB-723: after the security check fails twice, the panel shows the example, then the reason with focus, then the hand-over, its only alert, and axe finds nothing (${theme})`, async ({
      page,
      voice,
    }) => {
      for (const language of LANGUAGES) {
        const t = SITE[language].voice;
        voice.turnstile = "unreachable";
        await capture(page, language);
        await expect(page.locator("html"), language).toHaveAttribute("data-theme", theme);
        await stage(page, "capture").getByRole("button", { name: WP29_COPY.tryAgain[language], exact: true }).click();
        const gaveUp = stage(page, "unverified");
        await expect(gaveUp, language).toBeVisible({ timeout: 10_000 });
        const reason = gaveUp.getByRole("alert");
        await expect(reason, language).toHaveText(WP29_COPY.errors.unverified[language]);
        await expect(reason, `${language}: the reason has focus`).toBeFocused();
        await expect(panel(page).getByRole("alert"), `${language}: alerts in the panel`).toHaveCount(1);
        const example = gaveUp.locator(".voice-example");
        const handOver = gaveUp.getByText(t.handOver, { exact: true });
        await expect(example, `${language}: the static example`).toBeVisible();
        await expect(handOver, `${language}: the hand-over`).toBeVisible();
        const [above, middle, below] = [
          (await example.boundingBox())!,
          (await reason.boundingBox())!,
          (await handOver.boundingBox())!,
        ];
        expect(middle.y, `${language}: the reason under the example`).toBeGreaterThanOrEqual(above.y + above.height - 1);
        expect(below.y, `${language}: the hand-over under the reason`).toBeGreaterThanOrEqual(middle.y + middle.height - 1);
        expect(await axeViolations(page), `${language}: axe`).toEqual([]);
      }
      expect(voice.unexpected).toEqual([]);
    });
  });
}

test("WEB-722: in the off stage (paused at opening, or a send refused with budget_pause) and the unverified stage the badge says Live demo, with no number; in the capture stage it still counts the tries", async ({
  page,
  voice,
}) => {
  for (const language of LANGUAGES) {
    voice.status = "ok";
    voice.remaining = 3;
    voice.resetAt = null;
    voice.turnstile = "pass";
    voice.draft = { tasks: TASKS };
    await capture(page, language);
    await expect(triesBadge(page), `${language}: capture`).toHaveText(WP43_COPY.fullTries[language]);

    // Off: the status answers 503 paused.
    const paused = serverError("paused");
    expect(paused.status, "the server's paused status").toBe(503);
    voice.status = paused;
    await openDemo(page, language);
    await expect(stage(page, "off"), `${language}: paused at opening`).toBeVisible({ timeout: 15_000 });
    await badgeSays(page, WP43_COPY.liveDemo[language], `${language}: off, paused at opening`);

    // Off: the status answers, and the send is refused with budget_pause.
    voice.status = "ok";
    voice.draft = serverError("budget_pause");
    await typeThought(page, language);
    await sendTyped(page);
    await expect(stage(page, "off"), `${language}: budget_pause after sending`).toBeVisible({ timeout: 15_000 });
    await badgeSays(page, WP43_COPY.liveDemo[language], `${language}: off, budget_pause`);

    // Unverified: the security stand-in fails twice.
    voice.draft = { tasks: TASKS };
    voice.turnstile = "unreachable";
    await capture(page, language);
    await stage(page, "capture").getByRole("button", { name: WP29_COPY.tryAgain[language], exact: true }).click();
    await expect(stage(page, "unverified"), `${language}: unverified`).toBeVisible({ timeout: 10_000 });
    await badgeSays(page, WP43_COPY.liveDemo[language], `${language}: unverified`);
  }
  expect(voice.unexpected).toEqual([]);
});

// ---- Batch 5: WP46 (verification of WEB-6, WEB-9 and WEB-109's demo part), WP48 (the demo
// marked in the page's language, WEB-707) and WP49 (the held Try again's focus ring, WEB-720;
// the privacy line, WEB-730) ----

test("WEB-9: Turnstile is rendered interaction-only, never retrying, compact when its holder is narrower than 300 px and normal otherwise", async ({
  page,
  voice,
}, testInfo) => {
  const viewport = page.viewportSize()!;
  expect(
    [viewport.width, viewport.height],
    `${testInfo.project.name}: the viewport`,
  ).toEqual(testInfo.project.name === "mobile" ? [390, 664] : [1440, 1000]);
  voice.turnstile = "pass";
  for (const language of LANGUAGES) {
    await capture(page, language);
    await expect(recordButton(page), language).toBeEnabled({ timeout: 10_000 });
    const renders = await turnstileRenders(page);
    expect(renders.length, `${language}: Turnstile renders`).toBeGreaterThanOrEqual(1);
    const holder = demo(page).locator(".voice-verification");
    await expect(holder, language).toHaveCount(1);
    const width = await holder.evaluate((element) => element.clientWidth);
    for (const render of renders) {
      expect(render.appearance, `${language}: appearance`).toBe("interaction-only");
      expect(render.retry, `${language}: retry`).toBe("never");
      expect(render.size, `${language}: size for a ${render.width} px holder`).toBe(
        render.width < 300 ? "compact" : "normal",
      );
    }
    const last = renders.at(-1)!;
    expect(last.width, `${language}: the holder's width when Turnstile rendered, against now`).toBe(width);
    expect(last.size, `${language}: size for the ${width} px holder`).toBe(width < 300 ? "compact" : "normal");
  }
  expect(voice.unexpected).toEqual([]);
});

test("WEB-9: ‘Type instead’ is a text-link button, not a toggle, in each language", async ({ page }) => {
  for (const language of LANGUAGES) {
    await capture(page, language);
    const typeInstead = demo(page).getByRole("button", { name: VOICE.typeInstead[language], exact: true });
    await expect(typeInstead, language).toHaveCount(1);
    await expect(typeInstead, language).toHaveClass(/(^|\s)text-link(\s|$)/);
    await expect(typeInstead, `${language}: aria-pressed`).not.toHaveAttribute("aria-pressed", /.*/);
    await expect(demo(page).getByRole("switch"), `${language}: switches`).toHaveCount(0);
    await expect(demo(page).getByRole("checkbox"), `${language}: checkboxes`).toHaveCount(0);
    expect(await isFilled(typeInstead), `${language}: Type instead has no fill`).toBe(false);
  }
});

test("WEB-6, WEB-109: no string the demo can show, in any language, names a walkthrough or uses the removed words", () => {
  const strings = (value: unknown): string[] =>
    typeof value === "string"
      ? [value]
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : [];
  for (const language of LANGUAGES) {
    const found = strings(SITE[language].voice).filter((text) => WP46_WORDS.some((word) => word.test(text)));
    expect(found, `${language}: voice strings with a removed word`).toEqual([]);
  }
});

// The language a screen reader would use for an element: its nearest [lang].
const nearestLang = (locator: Locator) =>
  locator.evaluate((element) => element.closest("[lang]")?.getAttribute("lang") ?? null);
const langsInside = (page: Page) =>
  demo(page).evaluate((root) => [...root.querySelectorAll("[lang]")].map((element) => element.outerHTML.slice(0, 80)));

test("WEB-707: on each home the demo's heading, start button, static example and plans line take the page's language", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await hydrated(page);
    await expect(demo(page), url).toHaveAttribute("lang", language);
    const parts: [string, Locator][] = [
      ["#voice h2", demo(page).getByRole("heading", { level: 2 })],
      ["the start button", demo(page).getByRole("button", { name: VOICE.start[language], exact: true })],
      [
        "the example's quote",
        demo(page).locator(".voice-example").getByText(VOICE.example.quote[language], { exact: true }),
      ],
      [".voice-plans", demo(page).locator(".voice-plans")],
    ];
    for (const [name, locator] of parts) {
      await expect(locator, `${url}: ${name}`).toHaveCount(1);
      expect(await nearestLang(locator), `${url}: ${name}'s nearest [lang]`).toBe(language);
    }
    expect(await langsInside(page), `${url}: other lang attributes inside #voice`).toEqual([]);
  }
});

test("WEB-707: once the demo is open on /es/ and /ca/, the capture heading, the record button's label and a result's heading take the page's language", async ({
  page,
  voice,
}) => {
  for (const language of ["es", "ca"] as const) {
    const t = SITE[language].voice;
    await capture(page, language);
    const heading = stage(page, "capture").getByRole("heading", { level: 3 });
    await expect(heading, language).toHaveText(t.heading);
    expect(await nearestLang(heading), `${language}: the capture heading`).toBe(language);
    const record = recordButton(page);
    await expect(record, language).toHaveAccessibleName(VOICE.talk[language]);
    const label = await record.evaluate((button) => {
      const id = button.getAttribute("aria-labelledby");
      const element = id ? document.getElementById(id) : button;
      return {
        text: (element?.textContent ?? "").trim(),
        lang: element?.closest("[lang]")?.getAttribute("lang") ?? null,
      };
    });
    expect(label, `${language}: the record button's label`).toEqual({ text: VOICE.talk[language], lang: language });
    expect(await langsInside(page), `${language}: other lang attributes inside #voice (capture)`).toEqual([]);

    voice.remaining = 3;
    voice.draft = { tasks: TASKS };
    await demo(page).getByRole("button", { name: VOICE.typeInstead[language], exact: true }).click();
    await demo(page).getByRole("textbox", { name: VOICE.textLabel[language], exact: true }).fill(TYPED);
    const done = demo(page).getByRole("button", { name: VOICE.done[language], exact: true });
    await expect(done, language).toBeEnabled({ timeout: 10_000 });
    await done.click();
    await expect(stage(page, "review"), language).toBeVisible({ timeout: 15_000 });
    const result = stage(page, "review").getByRole("heading", { level: 3 }).first();
    await expect(result, language).toHaveText(new RegExp(`^${TASKS.length} `));
    expect(await nearestLang(result), `${language}: the result's heading`).toBe(language);
    expect(await langsInside(page), `${language}: other lang attributes inside #voice (result)`).toEqual([]);
  }
  expect(voice.unexpected).toEqual([]);
});

test("WEB-707: without JavaScript, the server's HTML marks #voice in the page's language", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  for (const language of LANGUAGES) {
    const url = homeUrl(language);
    await page.goto(url);
    await expect(page.locator("section#voice"), url).toHaveAttribute("lang", language);
    expect(await nearestLang(page.locator("#voice h2")), `${url}: #voice h2`).toBe(language);
    expect(await langsInside(page), `${url}: other lang attributes inside #voice`).toEqual([]);
  }
  await context.close();
});

// The page's --green, as the plan gives it (src/styles/global.css).
const GREEN = { light: "rgb(23, 110, 89)", dark: "rgb(158, 213, 179)" };

for (const theme of THEMES) {
  test.describe(`${theme} WP49 held Try again`, () => {
    test.use({ colorScheme: theme });
    test(`WEB-720: Try again pressed from the keyboard while the security check waits keeps full opacity and a 3 px --green ring at 3:1 or more; Tap to talk stays dimmed; axe finds nothing (${theme})`, async ({
      page,
      voice,
    }) => {
      test.setTimeout(120_000);
      const ids = await draftIds(page, voice);
      for (const language of LANGUAGES) {
        const { retry } = await failRecording(page, voice, language, "offline", ids);
        await expect(page.locator("html"), language).toHaveAttribute("data-theme", theme);
        await retry.focus();
        await page.keyboard.press("Enter");
        await expect(retry, language).toHaveAttribute("aria-disabled", "true");
        await expect(retry, language).toBeFocused();
        await expect(captureHint(page), language).toHaveText(ONE_MOMENT[language]);
        const look = await retry.evaluate((button) => {
          const style = getComputedStyle(button);
          return {
            focusVisible: button.matches(":focus-visible"),
            opacity: style.opacity,
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            outlineColor: style.outlineColor,
            background: style.backgroundColor,
            panel: getComputedStyle(button.closest(".voice-panel")!).backgroundColor,
          };
        });
        expect(look.focusVisible, `${language}: Try again matches :focus-visible`).toBe(true);
        expect(look.opacity, `${language}: Try again's opacity`).toBe("1");
        expect(look.outlineStyle, `${language}: the ring's style`).toBe("solid");
        expect(look.outlineWidth, `${language}: the ring's width`).toBe("3px");
        expect(look.outlineColor, `${language}: the ring's colour`).toBe(GREEN[theme]);
        const ring = contrast(parseColor(look.outlineColor), parseColor(look.panel));
        expect(ring, `${language}: the ring against the panel (${look.outlineColor} on ${look.panel})`).toBeGreaterThanOrEqual(3);
        expect(look.background, `${language}: Try again's fill isn't the full --green`).not.toBe(GREEN[theme]);
        // The shared rule still dims every other unavailable button.
        await expect(recordButton(page), language).toBeDisabled();
        await expect(recordButton(page), language).toHaveAccessibleName(VOICE.talk[language]);
        await expect(recordButton(page), `${language}: Tap to talk's opacity`).toHaveCSS("opacity", "0.55");
        expect(await axeViolations(page), `${language}: axe while Try again waits`).toEqual([]);
        expect(await releaseToken(page), `${language}: held security checks`).toBeGreaterThanOrEqual(1);
        await expect(stage(page, "review"), language).toBeVisible({ timeout: 15_000 });
      }
      expect(voice.unexpected).toEqual([]);
    });
  });
}

test("WEB-730: in voice and typing modes the privacy line says Google, not Google's AI, in the plan's words, then links to the privacy page's demo section", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    await capture(page, language);
    for (const mode of ["voice", "typing"] as const) {
      if (mode === "typing")
        await demo(page).getByRole("button", { name: VOICE.typeInstead[language], exact: true }).click();
      const line = stage(page, "capture").locator(".voice-privacy");
      await expect(line, `${language} ${mode}`).toHaveCount(1);
      await expect(line, `${language} ${mode}`).toBeVisible();
      expect(flat(await line.innerText()), `${language} ${mode}: the line`).toBe(
        `${VOICE.privacy[language]} ${VOICE.privacyLink[language]}`,
      );
      const link = line.getByRole("link");
      await expect(link, `${language} ${mode}`).toHaveCount(1);
      await expect(link, `${language} ${mode}`).toHaveAccessibleName(VOICE.privacyLink[language]);
      const href = new URL((await link.getAttribute("href"))!, page.url());
      expect(`${href.pathname}${href.hash}`, `${language} ${mode}: the link`).toBe(
        `${homeUrl(language)}privacy/#website`,
      );
      expect(flat(await demo(page).innerText()), `${language} ${mode}: #voice`).not.toMatch(/Google[’']s AI|IA de Google/);
    }
  }
});
