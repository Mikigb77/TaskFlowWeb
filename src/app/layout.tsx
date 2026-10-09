import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ThemeProvider } from "../components/ThemeProvider";
import "../styles/global.css";

const site = process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined;
const title = "TaskFlow — Make room for a clearer day";
const description =
  "A little focus. A little flow. Meet the calm task planner that brings your calendar, priorities, and voice-to-task capture together.";
export const metadata: Metadata = {
  title,
  description,
  robots:
    site && process.env.SITE_INDEXABLE === "true"
      ? { index: true, follow: true }
      : { index: false, follow: false },
  metadataBase: site || new URL("http://localhost:3000"),
  alternates: site ? { canonical: "/" } : undefined,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: "TaskFlow",
    title,
    description,
    ...(site ? { url: site } : {}),
  },
  twitter: { card: "summary_large_image", title, description },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f8f2",
  colorScheme: "light dark",
};
const themeInit = `(function(){var t;try{t=localStorage.getItem('taskflow-theme')}catch(e){}var dark=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/Manrope.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <ThemeProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
