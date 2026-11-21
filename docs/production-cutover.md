# DealStack production cutover

Production address: `https://divergentcapitalllc.com/dealstack/`. Alfred's **Real Estate Portfolio** entry opens this path. The application serves illustrative data when signed out and uses the existing Lease Lens Supabase project for signed-in records.

1. Create a private `elewis17/dealstack` repository and grant the GitHub integration write access to it. Import the current release source as a fresh initial commit to keep the original repository's credential history out of the new project.
2. In the existing Supabase project, add the exact redirect URL `https://divergentcapitalllc.com/dealstack/auth/callback/` under Authentication → URL Configuration → Redirect URLs. Preserve the existing site URL and callbacks while both apps are in use.
3. Build with `npm ci` and `npm run build:company`, using the existing project's public Supabase URL and publishable key. Copy the output to `dealstack/` on the `gh-pages` branch of `elewis17/divergent-capital-showcase`. Retain the company's `CNAME` and all other published paths.
4. Check the demo and direct links on the company domain. Complete the production Google sign-in and confirm that it returns to DealStack and loads the owner's own records.
5. Publish Alfred's **Real Estate Portfolio** link. Verify the Atlas and Index links then rename the original repository to `OLD-lease-lens-dash`. The original source and PRs remain together in that archive.

The site release uses the same legacy database reads and writes as the connected preview. Workspace history and capture still require their corresponding backend tables and functions. Browser-only preferences are scoped to the site origin.
