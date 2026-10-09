interface Env {
  ORIGIN: string;
  PUBLIC_HOST: string;
  VOICE_EDGE_SECRET: string;
  API_LIMIT: { limit(input: { key: string }): Promise<{ success: boolean }> };
  SUBMIT_LIMIT: {
    limit(input: { key: string }): Promise<{ success: boolean }>;
  };
}

function reject(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(status === 429 ? { "Retry-After": "60" } : {}),
      },
    },
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname !== env.PUBLIC_HOST)
      return reject("Use taskflow.garbar.tech.", 403);
    if (url.protocol !== "https:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 308);
    }
    const api = url.pathname.startsWith("/api/");
    if (!["GET", "HEAD", ...(api ? ["POST"] : [])].includes(request.method))
      return reject("Method not allowed.", 405);
    const headers = new Headers(request.headers);
    for (const key of [...headers.keys()])
      if (key.startsWith("x-tf-")) headers.delete(key);
    headers.delete("authorization");
    const ip = request.headers.get("cf-connecting-ip");
    if (api) {
      if (!ip || !env.VOICE_EDGE_SECRET)
        return reject("The live demo is temporarily unavailable.", 503);
      if (!(await env.API_LIMIT.limit({ key: ip })).success)
        return reject("Please wait a minute before trying again.", 429);
      if (request.method === "POST") {
        if (request.headers.get("origin") !== `https://${env.PUBLIC_HOST}`)
          return reject("Submit from the TaskFlow website.", 403);
        if (!(await env.SUBMIT_LIMIT.limit({ key: ip })).success)
          return reject("Please wait a minute before trying again.", 429);
        const length = request.headers.get("content-length");
        if (!length || !/^\d+$/.test(length))
          return reject("A bounded request body is required.", 411);
        if (Number(length) > 2_600_000)
          return reject("Keep recordings under 60 seconds.", 413);
        if (!request.headers.get("x-turnstile-token"))
          return reject("Complete the security check first.", 403);
      }
      headers.set("x-tf-edge-secret", env.VOICE_EDGE_SECRET);
      headers.set("x-tf-client-ip", ip);
    }
    const origin = new URL(env.ORIGIN);
    url.hostname = origin.hostname;
    url.port = "";
    headers.set("Host", origin.hostname);
    // Fixed origin; never use a client-supplied upstream URL or forwarded IP.
    const response = await fetch(
      new Request(url.toString(), {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method)
          ? undefined
          : request.body,
        redirect: "manual",
      }),
    );
    const output = new Headers(response.headers);
    const location = output.get("location");
    if (location?.startsWith(env.ORIGIN))
      output.set(
        "location",
        location.replace(env.ORIGIN, `https://${env.PUBLIC_HOST}`),
      );
    output.set("Strict-Transport-Security", "max-age=31536000");
    output.set("X-Frame-Options", "DENY");
    if (api) output.set("Cache-Control", "no-store");
    return new Response(response.body, {
      status: response.status,
      headers: output,
    });
  },
};
