import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Motion from "../components/Motion";
import SkipLink from "../components/SkipLink";
import { ThemeProvider } from "../components/ThemeProvider";
import { copy } from "../content/site";
import "../styles/global.css";
import "../styles/voice.css";
import "../styles/legal.css";
import "../styles/nova.css";
import "../styles/family.css";

// Manrope (public/fonts, SIL OFL 1.1) cut to Latin and Latin-1 plus the site's
// punctuation, keeping its weight axis. next/font names the family after this
// constant. Family names ignore case, so a constant called `manrope` would join
// global.css's @font-face "Manrope" and fetch its TTF as well.
const manropeSubset = localFont({
  src: "./fonts/Manrope-latin.woff2",
  weight: "200 800",
  display: "swap",
});

const site = process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined;
// The English home's; every page sets its own.
const { title, description } = copy.en.meta;
export const metadata: Metadata = {
  title,
  description,
  robots:
    site && process.env.SITE_INDEXABLE === "true"
      ? { index: true, follow: true }
      : { index: false, follow: false },
  metadataBase: site || new URL("http://localhost:3000"),
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: "TaskFlow",
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#021a1f" },
  ],
  colorScheme: "light dark",
};
// Before first paint: the theme, and the page's language from its path.
const themeInit = `(function(){var t;try{t=localStorage.getItem('taskflow-theme')}catch(e){}var dark=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';var l=location.pathname.split('/')[1];document.documentElement.lang=l==='es'||l==='ca'?l:'en';})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-variant="nova"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={manropeSubset.className}>
        <ThemeProvider>
          <SkipLink />
          <Motion />
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
