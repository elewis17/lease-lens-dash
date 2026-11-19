# DealStack

DealStack is a rental portfolio decision tool. Briefing explains what changed, Capital compares opportunities, Underwrite models one acquisition, and Holdings contains the property records. Decision Log preserves decisions and their memos.

The app uses Vite, React, TypeScript, and Supabase. The signed-out demo uses illustrative data. Private portfolio records require sign-in and stay scoped to the owner.

## Development

Use Node.js 24 and npm. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key. Run `npm ci` and `npm run dev`. Vite listens on `127.0.0.1:8000` by default.

Run `npm run lint`, `npm run typecheck`, and `npm test` to check changes. `npm run build:gh` builds for the GitHub Pages base path and prepares the route fallback. Database changes are maintained in `supabase/migrations`.

GitHub's label-triggered worker workflow is documented in [the worker operations guide](docs/alfred-worker-operations.md).
