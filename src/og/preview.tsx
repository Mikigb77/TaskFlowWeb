import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { copy, type SiteLanguage } from "../content/site";

// The link preview (WD4): the title line on the left, and on the right the top of the
// hero's calendar, down to both tasks, inside a phone. Drawn at build time.
export const previewSize = { width: 1200, height: 630 };

// Manrope-Bold.ttf is Manrope (public/fonts, SIL OFL 1.1) instanced at weight 700 and
// cut to Latin: the image renderer draws a variable font at its default weight, 200.
const font = path.join(process.cwd(), "src/og/Manrope-Bold.ttf");
const screen = (language: SiteLanguage) =>
  path.join(process.cwd(), `public/images/hero-calendar-${language}-light.png`);

// The hero images are 780 × 1688; drawn at 0.6, the phone shows the first ~1000 px.
const SCREEN_WIDTH = 468;
const SCREEN_HEIGHT = Math.round((1688 * SCREEN_WIDTH) / 780);
const BEZEL = 14;

export async function linkPreview(language: SiteLanguage) {
  const [fontData, image] = await Promise.all([
    readFile(font),
    readFile(screen(language)),
  ]);
  const [name, line] = copy[language].meta.title.split(" — ");
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#f3f8f4",
        color: "#062a31",
        fontFamily: "Manrope",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: 560,
          height: "100%",
          paddingLeft: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 68,
              height: 68,
              borderRadius: 18,
              background: "#0a7a63",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f3f8f4"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 12 5 5L19 6m-6 8 3 3 7-8" />
            </svg>
          </div>
          <span style={{ fontSize: 66, color: "#0a7a63", letterSpacing: -2 }}>
            {name}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 66,
            lineHeight: 1.1,
            letterSpacing: -2,
          }}
        >
          {line}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 34,
          right: 72,
          width: SCREEN_WIDTH + BEZEL * 2,
          height: SCREEN_HEIGHT,
          border: `${BEZEL}px solid #062a31`,
          borderRadius: 60,
          background: "#f3f8f4",
          overflow: "hidden",
        }}
      >
        <img
          alt=""
          src={`data:image/png;base64,${image.toString("base64")}`}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          style={{ marginTop: -18 }}
        />
      </div>
    </div>,
    {
      ...previewSize,
      fonts: [
        { name: "Manrope", data: fontData, weight: 700, style: "normal" },
      ],
    },
  );
}
