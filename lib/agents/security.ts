export function isAgentAuthorized(request: Request, envName: string) {
  const secret = process.env[envName];
  if (!secret) return true;

  const requestUrl = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  const token = request.headers.get("x-agent-secret") ?? requestUrl.searchParams.get("secret") ?? bearerToken;
  const isVercelCron = request.headers.get("x-vercel-cron") === "1" || request.headers.get("user-agent")?.toLowerCase().includes("vercel-cron");
  if (isVercelCron) return true;
  return token === secret;
}

export function unauthorizedAgentResponse() {
  return Response.json({ error: "Yetkisiz agent isteği." }, { status: 401 });
}
