const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
const token = process.env.REPL_IDENTITY
  ? `repl ${process.env.REPL_IDENTITY}`
  : process.env.WEB_REPL_RENEWAL
    ? `depl ${process.env.WEB_REPL_RENEWAL}`
    : null;

const [method, path, bodyJson] = process.argv.slice(2);
if (!method || !path) {
  console.log("Usage: node whop-api.mjs <METHOD> <path> ['{...}']");
  console.log("Example: node whop-api.mjs GET '/api/v1/payments?company_id=biz_xxx'");
  process.exit(0);
}

if (!hostname || !token) {
  throw new Error("Missing Replit connector environment for Whop.");
}

if (!/^\/api\/v1(?:\/|$)/.test(path)) {
  throw new Error("Whop REST path must be under /api/v1.");
}

const response = await fetch(`https://${hostname}/api/v2/proxy/${path}`, {
  method: method.toUpperCase(),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Replit-Token": token,
    "Connector-Name": "whop",
  },
  ...(bodyJson ? { body: bodyJson } : {}),
  signal: AbortSignal.timeout(15_000),
});

const text = await response.text();
if (!response.ok) {
  throw new Error(`Whop REST request failed: ${response.status} ${response.statusText} ${text}`);
}
console.log(JSON.stringify(JSON.parse(text), null, 2));