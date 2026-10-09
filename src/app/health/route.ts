export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok", commit: process.env.APP_COMMIT_SHA || "development" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
