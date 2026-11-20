# DealStack

DealStack is a rental portfolio decision tool. Briefing explains what changed, Capital compares opportunities, Underwrite models one acquisition, and Holdings contains the property records. Decision Log preserves decisions and their memos.

The app uses Vite, React, TypeScript, and Supabase. The signed-out demo uses illustrative data. Private portfolio records require sign-in and stay scoped to the owner.

## Development

Use Node.js 24 and npm. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key. Run `npm ci` and `npm run dev`. Vite listens on `127.0.0.1:8000` by default.

Run `npm run lint`, `npm run typecheck`, and `npm test` to check changes. `npm run build:gh` builds for the GitHub Pages base path and prepares the route fallback. Database changes are maintained in `supabase/migrations`.

GitHub's label-triggered worker workflow is documented in [the worker operations guide](docs/alfred-worker-operations.md).

## Release readiness

The production candidate and the connected review use the same Briefing, Capital, Underwrite and Holdings routes. The review build reads the signed-in owner’s existing Lease Lens records through their property relationships and uses a read-only browser client. Underwrite starts with empty inputs for signed-in users. It models the entered deal without inserting it into the pipeline. The company build targets `/dealstack/` and uses the DealStack schema.

- [ ] Publish the production candidate to the approved owner-only review URL. Confirm the Google return reaches the full workspace and the property filter remains consistent across routes.
- [ ] Validate the connected history against the owner’s records, including existing document availability and absence of cross-property records.
- [ ] Verify real lease and statement extraction, explicit confirmation, saved documents and decision persistence using an authorized Supabase environment with Gemini.
- [ ] Complete the design-deck acceptance review at 390px and 1440px, both themes. The rent waterfall and renewal ranking are implemented. Other Holdings evidence gaps still need a reliable dollar basis.
- [ ] Complete Capital optimization and personalized insights after the core gate passes.
- [ ] Validate the production callback and direct links at `/dealstack/`, then verify the legacy `/lease-lens/` redirect at cutover.

Run `npm run build:review` for the connected read-only candidate and `npm run build:company` for the company path. The review uses the already registered `/preview/live-portfolio` callback on the approved preview host. Both builds need the public Supabase configuration described above.
