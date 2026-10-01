const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
const token = process.env.REPL_IDENTITY
  ? `repl ${process.env.REPL_IDENTITY}`
  : process.env.WEB_REPL_RENEWAL
    ? `depl ${process.env.WEB_REPL_RENEWAL}`
    : null;

async function mcpCall(method, params = {}) {
  if (!hostname || !token) {
    throw new Error("Missing Replit connector environment for Whop.");
  }

  const response = await fetch(`https://${hostname}/api/v2/proxy/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "X-Replit-Token": token,
      "Connector-Name": "whop",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(15_000),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Whop MCP request failed: ${response.status} ${response.statusText}`);
  }

  const dataLine = text.split("\n").filter((line) => line.startsWith("data:")).at(-1);
  if (!dataLine) throw new Error("Whop MCP returned no result.");
  const envelope = JSON.parse(dataLine.replace(/^data:\s*/, ""));
  if (envelope.error) throw new Error(envelope.error.message ?? "Whop MCP request failed.");

  const result = envelope.result;
  const textContent = result?.content?.[0]?.text;
  return textContent ? JSON.parse(textContent) : result;
}

const [command, argsJson] = process.argv.slice(2);
if (command === "--list-tools") {
  const { tools } = await mcpCall("tools/list");
  tools.forEach((tool) => console.log(`${tool.name} — ${tool.description}`));
} else if (command === "--schema") {
  if (!argsJson) throw new Error("Usage: node whop-mcp.mjs --schema <tool>");
  const { tools } = await mcpCall("tools/list");
  const tool = tools.find((candidate) => candidate.name === argsJson);
  console.log(tool ? JSON.stringify(tool.inputSchema, null, 2) : `Tool "${argsJson}" not found`);
} else if (command) {
  const result = await mcpCall("tools/call", {
    name: command,
    arguments: JSON.parse(argsJson || "{}"),
  });
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log("Usage: node whop-mcp.mjs --list-tools | --schema <tool> | <tool> '{...}'");
}