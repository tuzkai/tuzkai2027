# TuzakAI by Sztuzk

TuzakAI by Sztuzk has a storefront homepage, five connected legacy Studio tools on their existing paths, and a separate jewelry designer mounted at `/tuzakai/`. The storefront catalog, categories, and support tickets use the API database; the legacy tools remain browser-based, while the designer has its own API-backed saved-design workspace.

## Root Studio tools

- `artifacts/sztuzk-jewelry-studio/src/pages/tools.tsx` — five connected tools and local saved-project dashboard
- `artifacts/sztuzk-jewelry-studio/src/lib/studio.ts` — deterministic generators, browser-local persistence, and exports
- `artifacts/sztuzk-jewelry-studio/src/lib/pricing.ts` — pricing estimate calculation
- `artifacts/sztuzk-jewelry-studio/src/pages/legal.tsx` — privacy, terms, and disclaimer
- `artifacts/sztuzk-jewelry-studio/src/components/site.tsx` — shared navigation and layout

The five legacy tools cover jewelry ideas, design concepts, pricing, a business roadmap, and Etsy listing drafts. Their project and form data stays in browser local storage and is not synced with a Clerk account. Root-site sign-in uses Clerk, but signing in does not transfer or sync legacy-tool saves. Users can use the legacy tools without signing in and should export important work before clearing browser data or changing browsers.

The site configuration is stored server-side. Public website, support/business email, and social links are exposed only when configured; unset emails/social accounts are not invented. `/admin/settings` requires a signed-in Clerk account whose user ID is explicitly listed in the `TUZAKAI_ADMIN_USER_IDS` server secret (comma-separated if needed). No account is automatically made an administrator. The owner can sign in, copy the ID shown at `/account`, then authorize that ID through the workspace secrets flow and restart the API service. Until then, settings are readable publicly but cannot be edited by anyone.

The generators are rule-based and results are illustrative planning aids. The new catalog has ten initial draft records and shows only explicitly published products; there are no invented prices, ratings, orders, or sales. The Whop connection is present, but checkout and paid access remain unavailable until product pricing, a verified customer-to-payment identity bridge, secure delivery, and administrator authorization are configured. The contact form stores support tickets in the database; it does not send email. The custom-request form still creates a browser-local draft only.

## Separate jewelry designer

- `artifacts/tuzakai-jewelry-designer` — separate customer-facing designer mounted at `/tuzakai/`
- `artifacts/api-server` — shared API server, including designer endpoints under `/api/tuzakai`

The designer offers selection-based previews, materials and cost planning, and saved designs. Saved designs are sent to its API and associated with a signed browser cookie identifying the private workspace. They are not associated with the root site's Clerk account or synced across accounts/devices. Clearing or losing the cookie may make saved designs inaccessible. Designer API/database data is separate from browser-local root Studio data.

The designer's catalog may have unconfigured material prices; users can enter their own component prices. Cost estimates and assistant output are planning aids, not professional advice.

## Development commands

- `pnpm --filter @workspace/sztuzk-jewelry-studio run dev` — run the root Studio
- `pnpm --filter @workspace/sztuzk-jewelry-studio run typecheck` — typecheck the root Studio
- `pnpm --filter @workspace/sztuzk-jewelry-studio run build` — build the root Studio
- `pnpm --filter @workspace/tuzakai-jewelry-designer run dev` — run the designer
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — typecheck the workspace
- `pnpm run build` — build the workspace

## Release and product boundaries

This storefront revision has not been published and no DNS changes were made here. An existing deployment may still serve an earlier version; check the current deployment before claiming the corrected code is live. Do not invent product availability, contacts, sales, prices, or business promises. The production database may require schema changes before this revision can be published.

## Stack

- pnpm workspaces, Node.js, TypeScript
- API: Express
- DB: PostgreSQL with Drizzle ORM
- Validation: Zod
- Front end: React, Vite