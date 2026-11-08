import { createRemoteJWKSet, jwtVerify } from "jose";

const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export interface AccessEnvironment {
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  ADMIN_EMAILS?: string;
}

export type AccessResult = { ok: true; email: string } | { ok: false; response: Response };

export async function requireAdmin(request: Request, env: AccessEnvironment): Promise<AccessResult> {
  const domain = (env.CF_ACCESS_TEAM_DOMAIN || "").trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const audiences = (env.CF_ACCESS_AUD || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (!domain || audiences.length === 0 || !/^[a-z0-9.-]+$/i.test(domain)) {
    return { ok: false, response: Response.json({ error: "Cloudflare Access is not configured for the admin API." }, { status: 503, headers: { "Cache-Control": "no-store" } }) };
  }

  const token = request.headers.get("CF-Access-JWT-Assertion");
  if (!token) {
    return { ok: false, response: Response.json({ error: "Cloudflare Access authentication is required." }, { status: 401, headers: { "Cache-Control": "no-store" } }) };
  }

  const issuer = `https://${domain}`;
  let jwks = jwksByIssuer.get(issuer);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    jwksByIssuer.set(issuer, jwks);
  }

  try {
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: audiences });
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const allowedEmails = (env.ADMIN_EMAILS || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
    if (!email || allowedEmails.length === 0 || !allowedEmails.includes(email)) {
      return { ok: false, response: Response.json({ error: "This Cloudflare Access identity is not on the admin allowlist." }, { status: 403, headers: { "Cache-Control": "no-store" } }) };
    }
    return { ok: true, email };
  } catch {
    return { ok: false, response: Response.json({ error: "The Cloudflare Access token could not be verified." }, { status: 401, headers: { "Cache-Control": "no-store" } }) };
  }
}
