# KAIRO

KAIRO is a full-stack Next.js investment dashboard with Prisma schema support, NextAuth-powered Google and email authentication, verified email signup, live-style stock APIs, news, AI signals, Stripe subscriptions, and email marketing tools.

## Business model direction

KAIRO is being shaped into an AI-powered trading research subscription business with:

- public product exploration before signup
- free-to-paid conversion through saved watchlists, AI signals, portfolio tools, and daily briefs
- trust-first positioning with clearer disclaimers and transparent signal reasoning
- founder-facing routes for business execution at `/trust` and `/launch-plan`

## Folder structure

```text
components/
  auth/
  dashboard/
  layout/
  ui/
data/
lib/
pages/
  api/
  dashboard/
prisma/
styles/
types/
```

## Included

- Next.js `pages/` routing
- Reusable UI and dashboard components
- Prisma schema for users, watchlists, saved signals, simulated trades, subscriptions, audience members, campaigns, and email events
- Google login and verified email/password login
- Audience tracking, update subscriptions, campaign sending, and email event logging
- API routes for:
  - `/api/dashboard`
  - `/api/stocks`
  - `/api/news`
  - `/api/signals`
  - `/api/auth/login`
  - `/api/auth/signup`
  - `/api/auth/verify`
  - `/api/auth/[...nextauth]`
  - `/api/marketing/subscribe`
  - `/api/marketing/preferences`
  - `/api/marketing/campaigns`
  - `/api/stripe/checkout`
  - `/api/stripe/portal`
  - `/api/stripe/webhook`
- A working dashboard page at `/dashboard`
- Premium audience page at `/audience`
- Subscription management page at `/subscription`
- Local fallback market/news/signal data when API keys are not set
- Live stock quotes from Finnhub or Alpha Vantage when those API keys are configured
- Live company news from Finnhub or NewsAPI with headline-level sentiment tags
- Persistent KAIRO study groups and collaboration messages backed by Prisma

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env
```

3. Add your auth, database, and billing configuration to `.env`:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_DB_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres:YOUR_DB_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
APP_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PREMIUM_PRICE_ID="price_..."
```

4. Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

5. Start the app:

```bash
npm run dev
```

6. Open:

```text
http://localhost:3000
```

## Notes

- The app is fully runnable without external API keys because stock quotes, news, and AI signals fall back to realistic local mock data.
- Email/password signup sends a verification link before credentials login is allowed.
- Google login is available when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured.
- Configure `SMTP_*` values in `.env` to send real verification and campaign emails. Without SMTP, the app still works locally and returns verification links in the UI for development.
- Users can opt into product updates and marketing emails at signup, and premium users can send campaigns from `/audience`.
- Premium access is controlled by Stripe subscription status. The checkout route creates a Stripe Checkout session and the webhook updates `User.premium` plus the local `Subscription` record after Stripe events arrive.
- For local Stripe webhook testing, run the Stripe CLI and forward events to `/api/stripe/webhook`.
- To enable live stock pricing, add `FINNHUB_API_KEY` or `ALPHA_VANTAGE_API_KEY` to `.env`. KAIRO falls back to mock prices when neither provider is configured.
- To enable live market news, add `FINNHUB_API_KEY` or `NEWS_API_KEY` to `.env`. KAIRO tags each headline as positive, neutral, or negative using a lightweight sentiment pass.
- For Supabase on Vercel, use the pooled connection string for `DATABASE_URL` and the direct database connection for `DIRECT_URL`.
- The pooled runtime URL should usually use port `6543` with `pgbouncer=true`, while the direct URL should use port `5432` with `sslmode=require`.
- If signup says it cannot reach `db....supabase.co:5432`, your runtime app is likely using the direct URL in `DATABASE_URL` instead of the pooled URL.
