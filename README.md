# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f81e8386-6742-42c8-9ee6-9c08b6b6b9a5

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f81e8386-6742-42c8-9ee6-9c08b6b6b9a5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f81e8386-6742-42c8-9ee6-9c08b6b6b9a5) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Portfolio sign-in and Supabase setup

Copy `.env.example` to `.env.local` and set the project URL and a browser-safe
publishable key. Supply the same two Vite variables to the GitHub Pages build.
Keep privileged keys in the relevant server-side configuration.

Signed-out visitors see a read-only demo of the illustrative DealStack
portfolio. It is bundled separately from private records and makes no
portfolio requests. Signing in opens the signed-in owner's portfolio, and
signing out returns to the demo.

Private portfolio access requires a Supabase session. Allow the deployed app's
`auth/callback` URL under Supabase Authentication → URL Configuration, including
the GitHub Pages project path. For local sign-in, also allow
`http://localhost:8000/auth/callback`.

The portfolio ownership migration is the repository source of truth for the
row-level policies on portfolio tables, including the bootstrap views and
the existing unit-count helper when present. Apply and verify it before
publishing the client. Existing property ownership is preserved. Records
without an attributable owner stay hidden until an administrator resolves
ownership using the original record. Check grants and policies on the live
schema and test anonymous and distinct signed-in sessions before cutover.

### Regenerate preview database types

Apply the checked-in migrations to a fresh local Supabase database, then
generate the `public` schema contract with the Supabase CLI:

```sh
supabase gen types typescript --local --schema public > /tmp/dealstack-schema.ts
cp /tmp/dealstack-schema.ts src/integrations/supabase/types.ts
npm run typecheck
```

Review the generated diff before committing. The preview contract comes from
the checked-in migrations. A schema-only inspection of the live project is
needed separately before approving a production rollout.

### Verify changes

Use Node 24 and run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, and
`npm run build:gh`. The DealStack app checks workflow runs the same commands on
pull requests. The tests use the built-in Node runner and need no production
credentials.

The following files under `src/components/ui` are reusable shadcn templates
available for the design work. They have no current route or product entry
point: accordion, alert, aspect ratio, breadcrumb, calendar, carousel, chart,
checkbox, collapsible, context menu, drawer, dropdown menu, hover card, input
OTP, menubar, pagination, progress, radio group, resizable, scroll area,
select, separator, sheet, skeleton, slider, switch, tabs, textarea, and the toast
compatibility re-export. `src/vite-env.d.ts` declares build-time types for Vite.
