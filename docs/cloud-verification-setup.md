# Cloud Verification Setup

This guide moves RecordShield verification into GitHub Codespaces so the local Mac can stay out of the npm/APFS disk bottleneck.

## Launch A Codespace

1. Push the current branch to GitHub.
2. Open the repository on GitHub.
3. Select **Code** -> **Codespaces** -> **Create codespace on current branch**.
4. Wait for the devcontainer to finish. The container prints `node -v` and `npm -v` after setup.

The Codespace uses Node 22 LTS on Debian Bookworm. Install optional Linux helper packages manually after the container starts so package-manager issues do not force Codespaces into recovery mode.

## Optional System Packages

Run this inside the Codespace after it opens:

```bash
sudo apt-get update
sudo apt-get install -y --no-install-recommends ca-certificates curl git jq openssl postgresql-client
sudo rm -rf /var/lib/apt/lists/*
```

These packages support shell diagnostics, webhook checks, OpenSSL secret generation, and Postgres command-line access. Prisma, Next.js, and Vitest should still install through `npm ci` from `package-lock.json`.

## Environment Variables

Add Codespaces secrets or export values in the Codespace terminal. Do not commit real secrets.

Required for full verification:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
APP_BASE_URL="https://YOUR-CODESPACE-PORT-3000.app.github.dev"
NEXT_PUBLIC_APP_URL="https://YOUR-CODESPACE-PORT-3000.app.github.dev"
NEXTAUTH_SECRET="32-plus-random-chars"
```

Required for Checkr staging readiness:

```bash
CHECKR_API_KEY="..."
CHECKR_WEBHOOK_SECRET="..."
CHECKR_BASE_URL="https://api.checkr-staging.com/v1"
CHECKR_PACKAGE_SLUG="..."
CHECKR_WORK_LOCATION_COUNTRY="US"
CHECKR_WORK_LOCATION_STATE="NY"
CHECKR_WORK_LOCATION_CITY="New York"
CHECKR_NODE_CUSTOM_ID=""
```

Required for Stripe readiness checks:

```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_RECORDSHIELD_PRIVATE_REVIEW="price_..."
```

Optional service variables:

```bash
OPENAI_API_KEY="sk-proj_..."
OPENAI_MODEL="gpt-4o-mini"
OPENAI_REPORT_SUMMARY_MODEL="gpt-5.2"
AI_SUMMARY_ENABLED="true"
RATE_LIMIT_REDIS_REST_URL="https://..."
RATE_LIMIT_REDIS_REST_TOKEN="..."
RATE_LIMIT_ALLOW_MEMORY_FALLBACK="true"
```

For strict staging readiness, set real Redis credentials and use:

```bash
RATE_LIMIT_ALLOW_MEMORY_FALLBACK="false"
SMOKE_STRICT="true"
```

## Install Dependencies

Run this inside the Codespace:

```bash
npm ci
```

Expected result: dependencies install from `package-lock.json` without local macOS filesystem hangs.

## Prisma Commands

Run:

```bash
npx prisma generate
npx prisma validate
```

Expected result:

- Prisma Client is generated.
- `prisma/schema.prisma` validates.
- `DATABASE_URL` is read from the Codespace environment and is not printed.

Do not run destructive Prisma commands. Use `migrate deploy` only against the intended hosted database.

## Webhook Testing Setup

Use Checkr staging only.

1. Set the Checkr webhook endpoint to the forwarded Codespaces URL:

```text
https://YOUR-CODESPACE-PORT-3000.app.github.dev/api/checkr/webhooks
```

2. Confirm the app is running:

```bash
npm run dev
```

3. In another terminal, check integration health:

```bash
curl -s http://localhost:3000/api/checkr/integration-health
```

4. Trigger Checkr staging events with Checkr-approved staging data only.

Expected behavior:

- Webhook signatures are verified before processing.
- Duplicate webhook events are stored as duplicate audit entries without reprocessing lifecycle state.
- Stored webhook data is redacted/minimal.
- Report statuses are neutralized before display.

## Verification Commands

Run these in order:

```bash
npm ci
npx prisma generate
npx prisma validate
npm run lint
npm run typecheck
npm test
git status --short --branch
```

Expected outputs:

- `npm ci`: exits 0.
- `npx prisma generate`: exits 0 and generates Prisma Client.
- `npx prisma validate`: exits 0.
- `npm run lint`: exits 0 or reports only reviewed warnings.
- `npm run typecheck`: exits 0.
- `npm test`: exits 0.
- `git status --short --branch`: shows the expected branch and only intentional docs/devcontainer changes.

## Recording Results

After the commands pass in Codespaces, update:

```text
docs/checkr-guided-api-review-readiness.md
```

Add a `## Verification Results` section with:

- date
- Codespaces machine type if visible
- Node version
- npm version
- OS
- each command
- result
- notes

Do not add verification results until the commands have actually run successfully in the cloud environment.

## Local Mac Role

The local Mac should only be used as a source/archive machine until disk space is healthy. Do not retry local `npm ci`, Prisma, lint, typecheck, or test runs while internal free space is below 15Gi.
