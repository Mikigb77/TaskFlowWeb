// Acceptance tests for the UX web loop, run 2026-11-05-pages: WP270 (WEB-1901, WEB-1902,
// WEB-1903). Privacy §7's ‘Meeting recordings’ bullet says when a meeting is deleted or made
// into a note as the app does it: the 7 days are for a recording the app asks about (one cut off
// before Stop, or a quiet Stop), counted from the app's question, the 30 days cover whatever is
// left on the server, finished or not, and Discard reaches the server once the phone is online.
// The release notes repeat the same rules. The version is 2026-11-06, the publication day: WEB-213's and
// WEB-109's tests in tests/ux-web-legal.spec.ts prove it, and check.py runs `npm run legal:check`.
// Its own file so it can't collide with WP271's block at the end of ux-web-legal.spec.ts.
import { test as plain, type Page } from "./support/test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  axeViolations,
  expect,
  hydrated,
  type Language,
  LANGUAGES,
  pageUrl,
  ROOT,
  scrollsSideways,
  test,
  THEMES,
} from "./support/ux-web";

type Copy = Record<Language, string>;
const flat = (text: string | null) => (text ?? "").replace(/\s+/g, " ").trim();
const fontsReady = (page: Page) => page.evaluate(() => document.fonts.ready.then(() => undefined));

// The brief's exact bullet, in each language.
const BULLET: Copy = {
  en: "Meeting recordings: our server deletes each piece’s audio once it has been turned into text, and the meeting’s text once the app has saved its notes. Whatever is left of a meeting on our server, finished or not, is deleted 30 days after its last piece arrived. A recording the app asks you about, and that you leave unanswered, becomes a note 7 days after it asks. Discarding a meeting deletes it from your phone at once, and from our server as soon as your phone is online. Deleting your account deletes its meetings.",
  es: "Reuniones grabadas: nuestro servidor borra el audio de cada parte cuando ya es texto, y el texto de la reunión cuando la app ha guardado sus notas. Lo que quede de una reunión en nuestro servidor, terminada o no, se borra 30 días después de recibir su última parte. Una grabación por la que la app te pregunta, y que dejas sin responder, se convierte en una nota 7 días después de que te pregunte. Descartar una reunión la borra del teléfono al momento, y de nuestro servidor en cuanto el teléfono tiene conexión. Eliminar tu cuenta borra sus reuniones.",
  ca: "Reunions enregistrades: el nostre servidor esborra l’àudio de cada part quan ja és text, i el text de la reunió quan l’app n’ha desat les notes. El que quedi d’una reunió al nostre servidor, acabada o no, s’esborra 30 dies després de rebre’n l’última part. Un enregistrament pel qual l’app et pregunta, i que deixes sense resposta, es converteix en una nota 7 dies després que te’n pregunti. Descartar una reunió l’esborra del telèfon a l’instant, i del nostre servidor tan bon punt el telèfon té connexió. Suprimir el compte n’esborra les reunions.",
};
const LABEL: Copy = { en: "Meeting recordings:", es: "Reuniones grabadas:", ca: "Reunions enregistrades:" };
// WEB-1901, R1-WP270-1: the 7-day sentence covers every recording the app asks about, a cut-off
// one (meetingStoppedCut) and a quiet Stop (stopQuiet, meetingQuietQuestion) alike, so it names
// the app's question rather than Stop.
const ASKS: Copy = { en: "the app asks you about", es: "la app te pregunta", ca: "l’app et pregunta" };
const STOP: Copy = { en: "pressed Stop", es: "pulsaras Parar", ca: "premessis Atura" };
const SEVEN_DAYS: Copy = { en: "7 days", es: "7 días", ca: "7 dies" };
// The old sentences' wording, which no legal file may still hold.
const GONE = [
  "you stop but don’t finish",
  "paras pero no terminas",
  "atures però no acabes",
  "A meeting that is never finished",
  "Una reunión que nunca se termina",
  "Una reunió que no s’acaba mai",
  "on our server at once",
  "a la vez del teléfono y de nuestro servidor",
  "alhora del telèfon i del nostre servidor",
];

const meetingBullet = (page: Page, language: Language) =>
  page
    .locator(".legal-body section#retention li")
    .filter({ hasText: new RegExp(`^\\s*${LABEL[language]}`) });

test("WEB-1901, WEB-1902, WEB-1903: privacy §7's ‘Meeting recordings’ bullet has the brief's exact text in each language, and its 7-day sentence covers every recording the app asks about", async ({
  page,
}) => {
  for (const language of LANGUAGES) {
    const url = pageUrl(language, "privacy");
    await page.goto(url);
    const bullet = meetingBullet(page, language);
    await expect(bullet, `${url} #retention: one ‘${LABEL[language]}’ bullet`).toHaveCount(1);
    await expect(bullet, `${url} #retention`).toBeVisible();
    await expect(bullet, `${url} #retention: the meeting bullet`).toHaveText(BULLET[language]);
    const sevenDays = flat(await bullet.innerText())
      .split(/(?<=\.)\s+/)
      .find((sentence) => sentence.includes(SEVEN_DAYS[language]));
    expect(sevenDays, `${url}: the 7-day sentence`).toBeDefined();
    expect(sevenDays, `${url}: the 7-day sentence names the app's question`).toContain(ASKS[language]);
    expect(sevenDays, `${url}: the 7-day sentence doesn't leave out a quiet Stop`).not.toContain(STOP[language]);
  }
});

plain("WEB-1901, WEB-1902, WEB-1903: src/content/legal/ holds none of the old meeting sentences, in any language", () => {
  const folder = path.join(ROOT, "src", "content", "legal");
  const files = readdirSync(folder);
  expect(files).toEqual(expect.arrayContaining(["en.ts", "es.ts", "ca.ts"]));
  const found: string[] = [];
  for (const file of files) {
    const text = readFileSync(path.join(folder, file), "utf8");
    for (const words of GONE) if (text.includes(words)) found.push(`${file}: “${words}”`);
  }
  expect(found).toEqual([]);
});

plain("WEB-1901, WEB-1902, WEB-1903: docs/LEGAL_RELEASE.md states the same meeting rules as §7", () => {
  const release = readFileSync(path.join(ROOT, "docs", "LEGAL_RELEASE.md"), "utf8");
  expect(release).not.toContain("Discard deletes it at once");
  expect(release).not.toContain("A stopped recording left unanswered is finished into a note on the phone after 7 days");
  expect(release).toContain("finished or not");
  expect(release).toContain("7 days after the app first asks about it");
});

for (const theme of THEMES) {
  test.describe(`${theme} WP270`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-1901, WEB-1902, WEB-1903: at 390 × 664, the Spanish and Catalan meeting bullet stays inside the content column, and axe reports no violations (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile", "A 390 px phone.");
      for (const language of ["es", "ca"] as const) {
        const url = pageUrl(language, "privacy");
        await page.goto(url);
        await hydrated(page);
        await fontsReady(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(page.viewportSize(), url).toEqual({ width: 390, height: 664 });
        expect(await scrollsSideways(page), `${url}: sideways scroll`).toBe(false);
        const bullet = meetingBullet(page, language);
        await expect(bullet, url).toHaveCount(1);
        await bullet.scrollIntoViewIfNeeded();
        const column = await page.locator(".legal-body").boundingBox();
        const box = await bullet.boundingBox();
        expect(column, `${url}: the content column`).not.toBeNull();
        expect(box, `${url}: the meeting bullet`).not.toBeNull();
        expect(box!.x, `${url}: the bullet's left edge`).toBeGreaterThanOrEqual(column!.x - 0.5);
        expect(box!.x + box!.width, `${url}: the bullet's right edge`).toBeLessThanOrEqual(column!.x + column!.width + 0.5);
        expect(box!.x + box!.width, `${url}: the bullet's right edge on screen`).toBeLessThanOrEqual(390.5);
        const overflow = await bullet.evaluate((element) => element.scrollWidth - element.clientWidth);
        expect(overflow, `${url}: text overflowing the bullet`).toBeLessThanOrEqual(0);
        expect(await axeViolations(page), `${url} (${theme})`).toEqual([]);
      }
    });
  });
}

test("WEB-1901, WEB-1902, WEB-1903: at 320 × 800, the Spanish and Catalan privacy pages don't scroll sideways, and the meeting bullet reflows inside the screen", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The narrowest phone.");
  await page.setViewportSize({ width: 320, height: 800 });
  for (const language of ["es", "ca"] as const) {
    const url = pageUrl(language, "privacy");
    await page.goto(url);
    await hydrated(page);
    await fontsReady(page);
    expect(await scrollsSideways(page), `${url} at 320 px`).toBe(false);
    const bullet = meetingBullet(page, language);
    await expect(bullet, url).toHaveCount(1);
    const box = await bullet.boundingBox();
    expect(box, `${url}: the meeting bullet`).not.toBeNull();
    expect(box!.x, `${url}: left edge`).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, `${url}: right edge`).toBeLessThanOrEqual(320.5);
    expect(box!.height, `${url}: wraps onto several lines`).toBeGreaterThan(60);
  }
});

// Run 2026-11-05-pages, round 2: WP272 (WEB-2004). The meeting bullet's last rendered line holds
// two words or more on a phone, in every language: Spanish ends on «sus reuniones.», not on the
// one word «reuniones.». Measured from the text's line boxes: each word's Range rect, grouped by
// its line top, so a wrap the eye sees is what the test sees.
async function lastLineWords(page: Page, language: Language) {
  const bullet = meetingBullet(page, language);
  await expect(bullet).toHaveCount(1);
  await bullet.scrollIntoViewIfNeeded();
  return bullet.evaluate((element) => {
    const words: { text: string; top: number }[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      // \s includes the no-break space: «sus reuniones.» is two words to a reader.
      for (const match of text.matchAll(/\S+/g)) {
        const range = document.createRange();
        range.setStart(node, match.index!);
        range.setEnd(node, match.index! + match[0].length);
        const rects = [...range.getClientRects()].filter((rect) => rect.width > 0);
        if (!rects.length) continue;
        // A word broken across lines (overflow-wrap) counts on its last line.
        const rect = rects[rects.length - 1];
        words.push({ text: match[0], top: rect.top });
      }
    }
    const lastTop = Math.max(...words.map((word) => word.top));
    const last = words.filter((word) => Math.abs(word.top - lastTop) < 2);
    return { lines: new Set(words.map((word) => Math.round(word.top))).size, last: last.map((word) => word.text) };
  });
}

const PHONES = [
  { width: 390, height: 664 },
  { width: 320, height: 800 },
];

for (const theme of THEMES) {
  test.describe(`${theme} WP272`, () => {
    test.use({ colorScheme: theme });

    test(`WEB-2004: on a phone, the meeting bullet's last line holds two words or more in every language, and Spanish ends on «sus reuniones.» (${theme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile", "Phone widths: 390 × 664 and 320 × 800.");
      for (const size of PHONES) {
        await page.setViewportSize(size);
        for (const language of LANGUAGES) {
          const url = pageUrl(language, "privacy");
          await page.goto(url);
          await hydrated(page);
          await fontsReady(page);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          const where = `${url} at ${size.width} × ${size.height} (${theme})`;
          const { lines, last } = await lastLineWords(page, language);
          expect(lines, `${where}: the bullet wraps`).toBeGreaterThan(1);
          expect(last.length, `${where}: words on the bullet's last line: ${last.join(" ")}`).toBeGreaterThanOrEqual(2);
          if (language === "es") expect(last.slice(-2), `${where}: the last line`).toEqual(["sus", "reuniones."]);
        }
      }
    });
  });
}

// ---- Run 2026-11-06-pages, round 2: WP274 (WEB-2107) ----
// docs/LEGAL_RELEASE.md is the release record behind privacy §7's meeting rules and §4's Vertex AI
// wording. A merge (d9f0a3d) dropped its meeting-notes section and put back the Gemini API terms
// link; WP274 restores both from commit 20e6826. The section's text at 20e6826 (lines 32–40) is
// kept byte for byte in tests/support/legal-release-meetings-20e6826.md, taken with
// `git show 20e6826:docs/LEGAL_RELEASE.md | sed -n 32,40p`. The meeting rules themselves are the
// WEB-1901–WEB-1903 test above; WEB-109's and WEB-729's are in tests/ux-web-legal.spec.ts.
const releaseDoc = () => readFileSync(path.join(ROOT, "docs", "LEGAL_RELEASE.md"), "utf8").replace(/\r\n/g, "\n");
const MEETINGS_HEADING = "## Evidence behind meeting-notes and AI wording";
const DELETION_HEADING = "## Evidence behind deletion wording";
const OPERATING_HEADING = "## Operating the published policy";
const MEETINGS_SECTION_20E6826 = readFileSync(
  path.join(ROOT, "tests", "support", "legal-release-meetings-20e6826.md"),
  "utf8",
)
  .replace(/\r\n/g, "\n")
  .trimEnd();
const headings = (text: string) => text.split("\n").filter((line) => /^##? /.test(line));

plain("WEB-2107: docs/LEGAL_RELEASE.md has one ‘Evidence behind meeting-notes and AI wording’ section, between the deletion evidence and ‘Operating the published policy’, with 20e6826's text unchanged", () => {
  const release = releaseDoc();
  const all = headings(release);
  expect(all.filter((line) => line === MEETINGS_HEADING), "the meeting-notes heading, once").toHaveLength(1);
  expect(all.filter((line) => line === DELETION_HEADING), "the deletion heading, once").toHaveLength(1);
  expect(all.filter((line) => line === OPERATING_HEADING), "the operating heading, once").toHaveLength(1);
  // The heading that comes right before it and right after it.
  const at = all.indexOf(MEETINGS_HEADING);
  expect(all[at - 1], "the heading before the meeting-notes section").toBe(DELETION_HEADING);
  expect(all[at + 1], "the heading after the meeting-notes section").toBe(OPERATING_HEADING);
  // The section, from its heading to the next heading, equals lines 32–40 at 20e6826,
  // with one blank line before it and one before ‘Operating the published policy’.
  const start = release.indexOf(`\n\n${MEETINGS_HEADING}\n`);
  expect(start, "one blank line before the meeting-notes heading").toBeGreaterThan(0);
  expect(release.charAt(start - 1), "only one blank line before the meeting-notes heading").not.toBe("\n");
  const end = release.indexOf(`\n\n${OPERATING_HEADING}\n`, start);
  expect(end, "one blank line before ‘Operating the published policy’").toBeGreaterThan(start);
  const section = release.slice(start + 2, end);
  expect(section, "the section's text, as at 20e6826").toBe(MEETINGS_SECTION_20E6826);
  // The bullets the finding names, so a wrong fixture can't pass on its own.
  expect(MEETINGS_SECTION_20E6826.split("\n").filter((line) => line.startsWith("- "))).toHaveLength(5);
  for (const words of [
    "Version 2026-11-06 adds meeting notes",
    "Meeting notes are Pro only, with up to 20 hours a month",
    "The server transcribes each piece on Vertex AI",
    "Whatever is left of a meeting on the server, finished or not, is deleted 30 days after its last piece arrived",
    "7 days after the app first asks about it",
    "Account deletion deletes meetings, because the rows cascade from the user.",
    "Every AI call goes through Vertex AI with application credentials, and there is no Gemini API key",
    "The training sentence rests on Google Cloud's Service Specific Terms",
  ]) {
    expect(section, `the section says “${words}”`).toContain(words);
  }
});

plain("WEB-2107: docs/LEGAL_RELEASE.md's primary references name the Google Cloud service terms (Vertex AI), not the Gemini API terms", () => {
  const release = releaseDoc();
  const references = release.slice(release.indexOf("\n## Primary references\n"));
  expect(release.indexOf("\n## Primary references\n"), "the Primary references section").toBeGreaterThan(0);
  expect(references).toContain("[Google Cloud service terms](https://cloud.google.com/terms/service-terms) (Vertex AI)");
  expect(release).not.toContain("ai.google.dev");
  expect(release).not.toContain("Gemini API terms");
});

plain("WEB-2107: docs/LEGAL_RELEASE.md keeps the 6 November version's online-dictation sentence in its opening paragraph", () => {
  const release = releaseDoc();
  const opening = release.split("\n").find((line) => line.startsWith("The current Privacy Policy"));
  expect(opening, "the opening paragraph").toBeDefined();
  expect(opening).toContain(
    "The 6 November version says that dictation sends the recording to be turned into text online by default, and only the words where the person chose on-device speech in the app's voice settings (owner, 2026-11-06).",
  );
  expect(release.split("The 6 November version says that dictation sends").length - 1, "the sentence, once").toBe(1);
});
