# Anonify

Anonify is a Next.js 16 (App Router) application that lets creators accept anonymous messages via shareable profile links. Users verify their accounts over email, manage message intake from a dashboard, respond to AI-suggested prompts, and stay in control of what gets delivered to their inbox. The production build is live at [anonify-app.netlify.app](https://anonify-app.netlify.app).

## Features

- **Anonymous inboxes** – every verified user gets a public `u/{username}` page to collect messages without revealing their identity.
- **Email-gated onboarding** – sign-up uses Zod validation, MongoDB via Mongoose, hashed passwords, and Resend-powered OTP delivery before accounts go live.
- **Credential auth + session guardrails** – NextAuth.js with JWT sessions backs the dashboard, while middleware keeps `/dashboard` locked down and redirects verified users away from auth screens.
- **Inbox management** – users can copy their link, toggle whether they accept new messages, refresh their queue, and delete individual notes.
- **AI question prompts** – Gemini 2.5 Flash streams three open-ended suggestions that visitors can tap to auto-fill the message composer.
- **Responsive UI toolkit** – React Server Components + client islands, Tailwind CSS 4, shadcn/ui primitives, Radix dialogs, Sonner toasts, and Embla-powered carousels for the landing page.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Radix UI, Embla Carousel.
- **Auth & state**: NextAuth.js (credentials provider + JWT strategy), custom `SessionProvider`.
- **Backend**: Next.js Route Handlers, MongoDB + Mongoose, Zod validation, bcryptjs password hashing.
- **Messaging & email**: Resend + `react-email` templates for verification, Sonner notifications, Google Gemini (via `@google/genai`) for streaming suggestions.
- **Tooling**: ESLint 9, TypeScript 5, PostCSS, npm scripts (`dev`, `build`, `start`, `lint`).

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Landing + authenticated pages (navbar, dashboard)
│   ├── (auth)/          # Sign-up, sign-in, verification flows
│   ├── api/             # Route handlers (auth, messaging, AI, utilities)
│   ├── u/[username]/    # Public profile for incoming anonymous messages
│   └── globals.css      # Tailwind + app-wide styles
├── components/          # Navbar, MessageCard, shadcn/ui exports
├── context/             # NextAuth SessionProvider wrapper
├── helpers/             # Email helpers (Resend)
├── lib/                 # DB connection, Resend client, utility helpers
├── messages.json        # Landing-page carousel seed data
├── model/               # Mongoose User + embedded Message schemas
├── schemas/             # Zod schemas for forms and API payloads
└── types/               # Shared TypeScript types + NextAuth augmentation
```

## Environment Variables

Create a `.env.local` file with the values below before running the app.

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | Connection string for the primary MongoDB cluster. |
| `NEXTAUTH_SECRET` | Secret used by NextAuth to sign JWT tokens. |
| `NEXTAUTH_URL` | The base URL of the deployed site (required in production). |
| `RESEND_API_KEY` | Resend API key for sending verification emails. |
| `GOOGLE_API_KEY` | Google Generative AI key for Gemini 2.5 Flash suggestions. |

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Populate `.env.local`** using the table above.
3. **Run the development server**
   ```bash
   npm run dev
   ```
   The site runs at `http://localhost:3000`.
4. **Lint or build when ready**
   ```bash
   npm run lint
   npm run build && npm run start
   ```

## Core Flows

- **Sign up** (`src/app/(auth)/sign-up`) – Zod + `react-hook-form` validate username, email, and password, debounced uniqueness checks hit `/api/check-username-unique`, and `/api/sign-up` persists the user with a hashed password plus OTP.
- **Verify account** (`src/app/(auth)/verify/[username]`) – users input the 6-digit code delivered by `sendVerificationEmail`, which `/api/verify-code` checks for validity and expiry.
- **Sign in** (`src/app/(auth)/sign-in`) – credentials provider uses bcrypt comparison via `/api/auth/[...nextauth]`, and middleware (`src/proxy.ts`) routes authenticated users straight to `/dashboard`.
- **Dashboard** (`src/app/(app)/dashboard`) – fetches `/api/get-messages`, exposes `/api/accept-messages` toggle, copies the `u/{username}` link, and deletes messages through `/api/delete-message/[messageId]`.
- **Public messaging** (`src/app/u/[username]`) – visitors compose content validated by `messageSchema`, submit to `/api/send-message`, or tap Gemini-generated prompts from `/api/suggest-messages`.

## API Surface

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/sign-up` | POST | Register user, hash credentials, issue OTP, send email. |
| `/api/verify-code` | POST | Validate OTP and flip `isVerified`. |
| `/api/auth/[...nextauth]` | POST/GET | NextAuth credential sign-in + session issuance. |
| `/api/check-username-unique` | GET | Debounced username availability checks. |
| `/api/accept-messages` | GET/POST | Read or toggle the `isAcceptingMessage` flag. |
| `/api/get-messages` | GET | Aggregates and returns latest messages for the session user. |
| `/api/send-message` | POST | Append a new anonymous message to a user’s inbox (if accepting). |
| `/api/delete-message/[messageId]` | DELETE | Remove a specific message. |
| `/api/suggest-messages` | POST | Stream Gemini-generated prompt suggestions. |
| `/api/test-db` | GET | Quick health check to ensure MongoDB connectivity. |

## Data Model

`User` documents store account metadata plus an embedded array of `Message` subdocuments:

- `username`, `email` (unique, verified users only)
- `password` (bcrypt hash), `verifyCode`, `verifyCodeExpiry`
- `isVerified`, `isAcceptingMessage`
- `messages[]` – `{ content: string; createdAt: Date }`

Aggregation pipelines in `/api/get-messages` flatten and sort these embedded messages so the dashboard always sees the latest entries first.

## Operational Notes

- **Email delivery** – `sendVerificationEmail` composes a React-based template (`emails/VerificationEmail.tsx`) and sends it via Resend’s API. Update the sender address before going live.
- **AI prompts** – Gemini responses stream via the standard Web Streams API, so client components can update UI incrementally without waiting for the full payload.
- **Auth middleware** – `src/proxy.ts` exports NextAuth middleware to keep users out of restricted areas (e.g., redirect signed-in users away from `/sign-in`).
- **Database reuse** – `dbConnect` memoizes the active connection to prevent redundant handshakes during hot reloads or Route Handler invocations.

## Deployment

The app is optimized for static hosting + serverless functions (e.g., Netlify/Vercel). Ensure all environment variables are set in the hosting dashboard, whitelist your MongoDB IP ranges, and configure NextAuth’s `NEXTAUTH_URL` to match the deployed origin.
