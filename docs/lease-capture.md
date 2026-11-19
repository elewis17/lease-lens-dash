# Lease capture

Open Data Room and select **Upload lease**. Photos in JPEG, PNG, or WebP and PDFs up to 8 MB are supported. DealStack sends the original binary file to the extraction service using the signed-in user's Supabase access token. The Edge Function validates the token through Supabase Auth and rejects anonymous sessions. The deployment config disables the legacy gateway JWT verifier because the function uses the project's current Auth service to verify the token.

The review shows the extracted values and available field-level confidence. Unknown optional terms stay empty. Confirming stores the original file under the owner's private storage prefix. An owner-scoped database function then writes the lease, tenant, unit association, raw extracted fields, and extraction confidence together. It recalculates the property's unit count in the same transaction. The request ID makes a repeat confirmation safe. If a file upload succeeded but the database save failed, retry confirmation with the same capture to reuse the private object. A capture abandoned after a failed save can leave a private, unlinked object.

The server uses Gemini's native binary input for PDFs and photos. Only its server-side key is needed. The application warns about sending the chosen document to the extraction provider before upload.

## Preview and staging

The private review site runs the same upload and review interface with a downloadable synthetic PDF and a local simulated extractor and save. Review and confirmation can be tested there using the sample file. The mock result and confirmed sample row disappear on reload. Use fictional documents for staging validation.

In an authorized staging Supabase project, apply the committed migrations and configure the server-only `GEMINI_API_KEY`. Deploy the `parse-lease` function with the checked-in configuration. The function entrypoint is `supabase/functions/parse-lease/index.ts`. For example, with the staging project explicitly linked, use `supabase db push` followed by `supabase functions deploy parse-lease`. The expected web origins are the company domain, GitHub Pages origin, and the explicitly allowed local origins on ports 8000 and 5173. A separate staging hostname requires an explicit allowlist entry. Configure that environment's normal Supabase Auth redirect URLs and client settings before testing.

Verify authenticated extraction, confirmation and the presence of the stored lease, tenant, and private document. Verify that another account cannot access the document or write to this property. Repeat live-provider checks during the separately authorized production release.

Run `node --test supabase/functions/parse-lease/index.test.mjs tests/lease-capture.test.mjs` to check the binary request and review contracts locally.

## Sign-in callbacks

The client derives its redirect URL from the browser origin and the Vite base. Add the full callback URL for each authorized deployment to the Supabase Auth redirect allowlist. For local Vite on port 8000, use `http://localhost:8000/auth/callback` (or the loopback origin you open). For the GitHub Pages build of this repository, use `https://elewis17.github.io/lease-lens-dash/auth/callback`. For a subsequent custom deployment, use the callback path for that deployment's configured base URL.

A failed callback offers a fresh sign-in attempt. The app shows a general error while keeping provider details out of the error message.
