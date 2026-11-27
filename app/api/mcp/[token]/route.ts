import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildConnector, connectorUser } from "@/lib/connector";

// Remote MCP server (Streamable HTTP) for Claude: /api/mcp/<private token>.
// Stateless: every request is answered on its own, which suits serverless.
// Saving waits until the store lists the new version, which can take a few seconds.
export const maxDuration = 60;
async function handle(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const email = connectorUser((await params).token);
  // Someone opened the address in a web browser: explain it in plain words.
  if (req.method === "GET" && !req.headers.get("accept")?.includes("text/event-stream")) return browserPage(Boolean(email));
  if (!email) return Response.json({ error: "This connector address isn't valid." }, { status: 401 });
  // Stateless: no standing event stream (GET) and no sessions to end (DELETE). Without
  // this, Claude's listening stream stayed open until the 300 s function limit.
  // The MCP spec allows 405 here; clients then carry on with POST only.
  if (req.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  const server = buildConnector(email, new URL(req.url).origin);
  await server.connect(transport);
  return transport.handleRequest(req);
}

function browserPage(valid: boolean) {
  const body = valid
    ? `<h1>This address works ✓</h1>
       <p>It's your private connector for editing the Selona website from Claude. It isn't a web page, so there's nothing more to see here.</p>
       <p><strong>To use it:</strong> in claude.ai open <em>Settings → Connectors → Add custom connector</em>, name it “Selona website”, paste this whole address, and press Add. Then, in a chat, switch it on from the tools menu.</p>
       <p>Keep this address private, like a password: anyone who has it can change and publish the website. If it ever leaks, ask Pranamya to switch it off and make a new one.</p>`
    : `<h1>This address isn't recognised</h1>
       <p>Please check you copied the whole connector address, with nothing missing at the end. If it still doesn't work, ask Pranamya for a new one.</p>`;
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Selona connector</title>
     <style>body{font:17px/1.6 system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1.25rem;color:#0f172a}h1{font-size:1.6rem}em{font-style:normal;background:#f1f5f9;padding:0 .25rem;border-radius:4px}</style></head>
     <body>${body}</body></html>`,
    { status: valid ? 200 : 401, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export { handle as GET, handle as POST, handle as DELETE };
