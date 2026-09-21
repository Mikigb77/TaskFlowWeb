import { ImageResponse } from "next/og";

export const alt = "TaskFlow — Make room for a clearer day";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#f7f8f2",
        color: "#24382e",
        padding: "70px 80px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              width: 46,
              height: 46,
              borderRadius: 15,
              background: "#176e59",
              alignItems: "center",
              justifyContent: "center",
              color: "#f7f8f2",
              fontSize: 30,
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f7f8f2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 12 5 5L19 6m-6 8 3 3 7-8" />
            </svg>
          </div>
          <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -2 }}>
            taskflow.
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 90,
            fontWeight: 700,
            letterSpacing: -5,
            lineHeight: 1.1,
          }}
        >
          <span>Make room</span>
          <span style={{ color: "#176e59" }}>for a clearer day.</span>
        </div>
        <div
          style={{
            display: "flex",
            color: "#667269",
            fontSize: 20,
            letterSpacing: 2,
          }}
        >
          A LITTLE FOCUS. A LITTLE FLOW.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          width: 350,
          height: 350,
          borderRadius: 175,
          border: "1px solid #dce5d5",
          right: -110,
          top: -120,
        }}
      />
    </div>,
    size,
  );
}
