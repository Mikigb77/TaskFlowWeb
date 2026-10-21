// Lab performance for the UX web audit (tests/ux-renders.spec.ts): cold page loads on a
// phone profile, throttled like Lighthouse's mobile preset through the Chrome DevTools
// Protocol.
//
// Lab data, not field data: one machine, one Chromium, one local production server, no
// CDN and no real phone. It can't predict interaction timing (INP); TBT stands in for it.
import { devices, type Browser } from "@playwright/test";

export const THROTTLING = {
  label:
    "Lighthouse's mobile preset (slow 4G and a 4× slower CPU), applied with DevTools throttling",
  // The preset's network is 150 ms RTT and 1.6 Mbps down, 750 Kbps up. Applied per request
  // through DevTools, Lighthouse adjusts it: latency × 3.75, throughput × 0.9.
  latencyMs: 150 * 3.75,
  downloadKbps: 1.6 * 1024 * 0.9,
  uploadKbps: 750 * 0.9,
  cpu: 4,
  device: "Playwright's iPhone 13 profile in Chromium (390 × 664 at 3×)",
  motion: "no reduced-motion preference, as most visitors have",
};

type Bytes = { count: number; transfer: number; decoded: number };

export type PerfRun = {
  lcp: number | null;
  lcpElement: string | null;
  lcpUrl: string | null;
  cls: number;
  clsSources: string[];
  fcp: number | null;
  ttfb: number | null;
  load: number | null;
  tbt: number;
  longTasks: number;
  bytes: Record<"js" | "css" | "font" | "image" | "document" | "other" | "total", Bytes>;
  scripts: { url: string; transfer: number; decoded: number }[];
  fonts: {
    files: { url: string; transfer: number }[];
    faces: string[];
    arrivedAfterFcp: number | null;
  };
  images: { url: string; transfer: number }[];
  failed: string[];
};

type Observed = {
  lcp: { time: number; size: number; url: string; element: string | null }[];
  shifts: { time: number; value: number; sources: string[] }[];
  long: { time: number; duration: number }[];
};

function sessionCls(shifts: Observed["shifts"]) {
  // Core Web Vitals' definition: the largest burst of shifts less than 1 s apart, within 5 s.
  let max = 0,
    current = 0,
    start = -Infinity,
    last = -Infinity;
  for (const shift of [...shifts].sort((a, b) => a.time - b.time)) {
    if (shift.time - last > 1000 || shift.time - start > 5000) {
      current = 0;
      start = shift.time;
    }
    current += shift.value;
    last = shift.time;
    max = Math.max(max, current);
  }
  return Math.round(max * 10000) / 10000;
}

export async function measurePerformance(
  browser: Browser,
  baseURL: string,
  url: string,
): Promise<PerfRun> {
  const { defaultBrowserType: _browser, ...phone } = devices["iPhone 13"];
  const context = await browser.newContext({
    ...phone,
    baseURL,
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  try {
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: THROTTLING.latencyMs,
      downloadThroughput: (THROTTLING.downloadKbps * 1024) / 8,
      uploadThroughput: (THROTTLING.uploadKbps * 1024) / 8,
      connectionType: "cellular4g",
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLING.cpu });
    type Request = {
      url: string;
      type: string;
      transfer: number;
      decoded: number;
      done: boolean;
      failed: boolean;
    };
    const requests = new Map<string, Request>();
    cdp.on("Network.requestWillBeSent", (event) => {
      if (event.request.url.startsWith("data:")) return;
      requests.set(event.requestId, {
        url: event.request.url,
        type: event.type ?? "Other",
        transfer: 0,
        decoded: 0,
        done: false,
        failed: false,
      });
    });
    cdp.on("Network.responseReceived", (event) => {
      const request = requests.get(event.requestId);
      if (request) request.type = event.type ?? request.type;
    });
    cdp.on("Network.dataReceived", (event) => {
      const request = requests.get(event.requestId);
      if (request) request.decoded += event.dataLength;
    });
    cdp.on("Network.loadingFinished", (event) => {
      const request = requests.get(event.requestId);
      if (request) {
        request.transfer = event.encodedDataLength;
        request.done = true;
      }
    });
    cdp.on("Network.loadingFailed", (event) => {
      const request = requests.get(event.requestId);
      if (request) {
        request.failed = true;
        request.done = true;
      }
    });
    await page.addInitScript(() => {
      type Shift = PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
        sources?: { node?: Node | null }[];
      };
      const describe = (node: Node | null | undefined) => {
        if (!node || node.nodeType !== 1) return null;
        const element = node as Element;
        const classes = Array.from(element.classList)
          .slice(0, 2)
          .map((name) => "." + name)
          .join("");
        const text = (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
        const src =
          (element as HTMLImageElement).currentSrc || element.getAttribute("src") || "";
        return `${element.tagName.toLowerCase()}${element.id ? "#" + element.id : ""}${classes}${text ? ` “${text}”` : ""}${src ? ` ${src}` : ""}`;
      };
      const observed: {
        lcp: { time: number; size: number; url: string; element: string | null }[];
        shifts: { time: number; value: number; sources: string[] }[];
        long: { time: number; duration: number }[];
      } = { lcp: [], shifts: [], long: [] };
      (window as unknown as { __uxPerf: typeof observed }).__uxPerf = observed;
      const watch = (type: string, take: (entry: PerformanceEntry) => void) => {
        try {
          new PerformanceObserver((list) => list.getEntries().forEach(take)).observe({
            type,
            buffered: true,
          });
        } catch {
          /* This entry type isn't supported here. */
        }
      };
      watch("largest-contentful-paint", (entry) => {
        const lcp = entry as LargestContentfulPaint;
        observed.lcp.push({
          time: lcp.startTime,
          size: lcp.size,
          url: lcp.url,
          element: describe(lcp.element),
        });
      });
      watch("layout-shift", (entry) => {
        const shift = entry as Shift;
        if (!shift.hadRecentInput)
          observed.shifts.push({
            time: shift.startTime,
            value: shift.value,
            sources: (shift.sources || [])
              .map((source) => describe(source.node))
              .filter((value): value is string => !!value),
          });
      });
      watch("longtask", (entry) =>
        observed.long.push({ time: entry.startTime, duration: entry.duration }),
      );
    });
    await page.goto(url, { waitUntil: "load", timeout: 90_000 });
    // Settle: the network quiet and no new paint candidate or shift for 2 s, 20 s at most.
    const deadline = Date.now() + 20_000;
    let count = -1,
      since = Date.now();
    while (Date.now() < deadline) {
      await page.waitForTimeout(250);
      const now = await page.evaluate(() => {
        const observed = (window as unknown as { __uxPerf: Observed }).__uxPerf;
        return observed.lcp.length + observed.shifts.length;
      });
      const busy = [...requests.values()].some((request) => !request.done);
      if (now !== count || busy) {
        count = now;
        since = Date.now();
      } else if (Date.now() - since >= 2000) break;
    }
    const data = await page.evaluate(() => {
      const observed = (window as unknown as { __uxPerf: Observed }).__uxPerf;
      const navigation = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null;
      const fontEnds = performance
        .getEntriesByType("resource")
        .filter((entry) => /\.(woff2?|ttf|otf)(\?|$)/i.test(entry.name))
        .map((entry) => (entry as PerformanceResourceTiming).responseEnd);
      return {
        observed,
        fcp,
        ttfb: navigation?.responseStart ?? null,
        load: navigation?.loadEventEnd ?? null,
        faces: Array.from(document.fonts)
          .filter((face) => face.status === "loaded")
          .map((face) => `${face.family} ${face.weight} ${face.style}`),
        fontEnd: fontEnds.length ? Math.max(...fontEnds) : null,
      };
    });
    const list = [...requests.values()];
    const bytes = (filter: (request: Request) => boolean): Bytes => {
      const chosen = list.filter(filter);
      return {
        count: chosen.length,
        transfer: chosen.reduce((sum, request) => sum + request.transfer, 0),
        decoded: chosen.reduce((sum, request) => sum + request.decoded, 0),
      };
    };
    const known = ["Script", "Stylesheet", "Font", "Image", "Document"];
    const last = data.observed.lcp.at(-1) ?? null;
    const fcp = data.fcp;
    const short = (value: string) => value.replace(/^https?:\/\/[^/]+/, "");
    return {
      lcp: last ? Math.round(last.time) : null,
      lcpElement: last?.element ?? null,
      lcpUrl: last?.url ? short(last.url) : null,
      cls: sessionCls(data.observed.shifts),
      clsSources: [...data.observed.shifts]
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map((shift) => `${shift.value.toFixed(4)} at ${Math.round(shift.time)} ms: ${shift.sources.join(", ") || "unknown"}`),
      fcp: fcp === null ? null : Math.round(fcp),
      ttfb: data.ttfb === null ? null : Math.round(data.ttfb),
      load: data.load === null ? null : Math.round(data.load),
      tbt: Math.round(
        data.observed.long
          .filter((task) => fcp === null || task.time >= fcp)
          .reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0),
      ),
      longTasks: data.observed.long.length,
      bytes: {
        js: bytes((request) => request.type === "Script"),
        css: bytes((request) => request.type === "Stylesheet"),
        font: bytes((request) => request.type === "Font"),
        image: bytes((request) => request.type === "Image"),
        document: bytes((request) => request.type === "Document"),
        other: bytes((request) => !known.includes(request.type)),
        total: bytes(() => true),
      },
      scripts: list
        .filter((request) => request.type === "Script")
        .map((request) => ({
          url: short(request.url),
          transfer: request.transfer,
          decoded: request.decoded,
        })),
      fonts: {
        files: list
          .filter((request) => request.type === "Font")
          .map((request) => ({ url: short(request.url), transfer: request.transfer })),
        faces: data.faces,
        arrivedAfterFcp:
          data.fontEnd !== null && fcp !== null ? Math.round(data.fontEnd - fcp) : null,
      },
      images: list
        .filter((request) => request.type === "Image")
        .map((request) => ({ url: short(request.url), transfer: request.transfer })),
      failed: list.filter((request) => request.failed).map((request) => short(request.url)),
    };
  } finally {
    await context.close();
  }
}
