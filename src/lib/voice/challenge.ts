import { DemoError } from "./policy";
import { required } from "./security";

export async function verifyChallenge(request: Request) {
  const token = request.headers.get("x-turnstile-token");
  if (!token || token.length > 2048)
    throw new DemoError(
      403,
      "verification",
      "Complete the security check before creating a draft.",
    );
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        secret: required("TURNSTILE_SECRET_KEY"),
        response: token,
        remoteip: request.headers.get("x-tf-client-ip"),
      }),
    },
  );
  const result = await response.json();
  if (
    !response.ok ||
    result.success !== true ||
    result.action !== "voice_demo" ||
    result.hostname !== new URL(required("VOICE_PUBLIC_ORIGIN")).hostname
  )
    throw new DemoError(
      403,
      "verification",
      "The security check expired. Please verify again.",
    );
}
