import {
  checkRequest,
  failure,
  getIdentity,
  json,
  required,
} from "../../../../lib/voice/security";
import { usage } from "../../../../lib/voice/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    checkRequest(request);
    const identity = getIdentity(request, true);
    const access = await usage(identity.id);
    return json(
      {
        ...access,
        developerCode: identity.id,
        siteKey: required("TURNSTILE_SITE_KEY"),
        maxSeconds: 60,
      },
      200,
      identity.cookie,
    );
  } catch (error) {
    return failure(error);
  }
}
