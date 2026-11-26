import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildConnector, connectorUser } from "@/lib/connector";

// Remote MCP server (Streamable HTTP) for Claude: /api/mcp/<private token>.
// Stateless: every request is answered on its own, which suits serverless.
async function handle(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const email = connectorUser((await params).token);
  if (!email) return Response.json({ error: "This connector address isn't valid." }, { status: 401 });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  const server = buildConnector(email, new URL(req.url).origin);
  await server.connect(transport);
  return transport.handleRequest(req);
}

export { handle as GET, handle as POST, handle as DELETE };
