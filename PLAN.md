Goal
Add a secure NextAuth/Auth.js v5 authentication system using the connected Neon Postgres database, with email/password credentials plus GitHub and Google OAuth, and require authentication before entering the A2A workspace.
Implementation
Install and configure Auth.js
Add next-auth, @auth/pg-adapter, @neondatabase/serverless, and required TypeScript packages using the project package manager.
Create auth.ts with Auth.js v5 NextAuth() exports, Neon Postgres adapter, AUTH_SECRET, credentials provider, GitHub provider, and Google provider.
Validate required secrets at runtime without exposing them to client code.
Use lazy Neon pool initialization compatible with Vercel/Next.js server execution.
Database schema and adapter setup
Retry the connected Neon schema operation; if the MCP remains unavailable, document the exact required Auth.js adapter tables and avoid pretending migrations succeeded.
Use the Auth.js Postgres adapter schema for users, accounts, sessions, and verification tokens.
Confirm the schema supports credentials users and OAuth account linking without weakening session security.
Auth routes and session plumbing
Add app/api/auth/[...nextauth]/route.ts using the Auth.js handlers.
Add server-side session helpers and middleware/proxy protection for the workspace route.
Keep /login and OAuth callback routes public while redirecting unauthenticated workspace requests to login.
Preserve v0/Vercel preview compatibility through correct secure cookie and callback URL behavior.
Login UI and account controls
Build a polished /login page with email/password form, GitHub and Google buttons, loading/error states, accessible labels, and retry feedback.
Add sign-up support for credentials users if the chosen Auth.js flow requires a registration route; hash passwords with a maintained password-hashing library and never store plaintext passwords.
Add authenticated user/session status and sign-out control to the existing application shell without disrupting the dense blueprint UI.
Protect and verify the workspace
Gate app/page.tsx and the client workspace behind the server session check.
Ensure unauthenticated users cannot invoke AI or workspace actions through direct route access.
Verify OAuth error handling, invalid credentials, expired sessions, sign-out, refresh persistence, and protected navigation.
Validation
Run type-check, lint, production build, and browser checks for login, failed login, authenticated workspace access, sign-out, and responsive UI.
Verify no auth secret or provider secret appears in the client bundle.
Report any remaining provider setup requirements, specifically AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_GOOGLE_ID, and AUTH_GOOGLE_SECRET, without inventing credentials.
Key files
auth.ts
app/api/auth/[...nextauth]/route.ts
app/login/page.tsx
components/auth/*
app/page.tsx
middleware.ts or the current Next.js proxy convention
package.json and lockfile
Neon Auth.js adapter schema/migration through the connected Neon integration
Constraints
Honor the user’s explicit request for NextAuth/Auth.js instead of Better Auth.
Use the connected Neon integration; do not add another database.
Do not expose AUTH_SECRET, OAuth secrets, or database credentials to the browser.
Do not claim OAuth works until provider credentials are configured.
If Neon schema tooling continues to fail, stop before writing database-dependent runtime code and report the blocker clearly.
Research note
The Neon integration is connected, but schema lookup failed twice. Retry it before implementation; the user confirmed AUTH_SECRET is already configured.
