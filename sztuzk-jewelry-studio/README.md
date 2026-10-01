# TuzakAI by Sztuzk

TuzakAI by Sztuzk has a storefront at the site root, five connected legacy Studio tools on their existing paths, and a separate jewelry designer at `/tuzakai/`. This revision is a workspace preview; it has not been published or used to change DNS.

## Root Studio tools

The five browser-based legacy tools are the jewelry idea generator, design concept generator, pricing calculator, business roadmap, and Etsy listing draft generator. They remain connected in a workflow from business planning through ideas, design, pricing, and an editable Etsy listing draft.

The generators are rule-based. Estimates are planning aids and depend on information entered by the user; they are not supplier quotes or professional advice. The five tools save projects and in-progress form data in browser local storage. Root-site sign-in is provided through Clerk, but the legacy tools do not sync their local projects with a Clerk account. Export important work before clearing browser data or changing browsers.

The website/contact configuration can be edited at `/admin/settings` by an authorized owner. To grant access, first sign in and find the Clerk Account ID on `/account`, then set that ID in the server-side `TUZAKAI_ADMIN_USER_IDS` secret (comma-separated for multiple administrators) and restart the API service. No account is promoted automatically; without an authorized ID, the settings page shows restricted access. Public emails and social links stay unset until real values are entered.

The database-backed catalog includes ten initial draft product records, not purchasable offers. Only published products appear to customers. Whop is connected but no prices or verified Clerk-to-Whop purchase binding are configured, so checkout and paid access remain unavailable. The contact form stores support tickets in the database, but no email is sent; custom-request briefs remain browser-local drafts.

## Separate designer

`artifacts/tuzakai-jewelry-designer` is a separate product mounted at `/tuzakai/`. It provides component-based jewelry design previews, material and cost planning, and saved designs. The designer uses its API to save and retrieve designs. A signed browser cookie identifies the private designer workspace; saved designs are not linked to the root site's Clerk account and do not sync across accounts or devices. Clearing or losing the cookie may make saved designs inaccessible.

The designer API and database are distinct from the root Studio's browser-local legacy tool data. Material catalog prices may be missing; users can enter their own component prices. Pricing and assistant output should be checked and are not professional advice.

## Project locations

- `src/pages/tools.tsx` — five connected legacy Studio tools and saved-project dashboard
- `src/pages/legal.tsx` — Privacy Policy, Terms of Use, and Disclaimer
- `src/lib/studio.ts` — deterministic generators, local-storage persistence, and export helpers
- `src/lib/pricing.ts` — estimate calculation
- `src/components/site.tsx` — root-site navigation and shared interface components
- `artifacts/tuzakai-jewelry-designer/src/App.tsx` — separate designer interface

## Development commands

- `pnpm --filter @workspace/sztuzk-jewelry-studio run dev` — run the root Studio web app
- `pnpm --filter @workspace/sztuzk-jewelry-studio run typecheck` — typecheck the root Studio
- `pnpm --filter @workspace/sztuzk-jewelry-studio run build` — build the root Studio
- `pnpm --filter @workspace/tuzakai-jewelry-designer run dev` — run the separate designer
- `pnpm --filter @workspace/api-server run dev` — run the shared API server

## Release status

No publishing or DNS modification was performed for this storefront revision. An existing deployment may still serve earlier code; verify its status before claiming this revision is live. Production database schema changes may be needed before publishing. Do not invent product availability, contact details, prices, sales, or business promises.