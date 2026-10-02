import { WhopClient } from "@whop/sdk";

let clientPromise: Promise<WhopClient> | null = null;

async function initWhopClient(): Promise<WhopClient> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? `repl ${process.env.REPL_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
      ? `depl ${process.env.WEB_REPL_RENEWAL}`
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      "Missing Replit connector environment. Ensure Whop is connected in Integrations.",
    );
  }

  const response = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=whop`,
    {
      headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch Whop credentials: ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();
  const settings = (data as { items?: Array<{ settings?: { api_key?: unknown } }> }).items?.[0]?.settings;
  if (typeof settings?.api_key !== "string" || !settings.api_key) {
    throw new Error("Whop integration is not connected or is missing API credentials.");
  }

  return new WhopClient({ token: settings.api_key });
}

export function getWhopClient(): Promise<WhopClient> {
  if (!clientPromise) {
    clientPromise = initWhopClient().catch((error: unknown) => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}

export function getWhopCompanyId(): string | null {
  const companyId = process.env.WHOP_COMPANY_ID?.trim();
  return companyId || null;
}