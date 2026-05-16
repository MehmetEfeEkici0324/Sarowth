export function isAgentAuthorized(request: Request, envName: string) {
  const secret = process.env[envName];
  if (!secret) return true;

  const requestUrl = new URL(request.url);
  const token = request.headers.get("x-agent-secret") ?? requestUrl.searchParams.get("secret");
  return token === secret;
}

export function unauthorizedAgentResponse() {
  return Response.json({ error: "Yetkisiz agent isteği." }, { status: 401 });
}
