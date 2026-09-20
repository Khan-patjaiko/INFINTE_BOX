# Supabase backend — source of truth

This directory is the version-controlled copy of everything that runs inside the hosted
Supabase project **`ptwfidmlnuggxvqhimhe`** (ap-southeast-1). Before 2026-09-19 these lived
only in the hosted project (deployed via the Supabase MCP tools); they were exported here so
the backend can be reviewed in PRs and rebuilt from git.

```
supabase/
├── config.toml            project id + per-function verify_jwt settings
├── migrations/            9 SQL migrations, same version stamps as supabase_migrations.schema_migrations
└── functions/
    ├── submit-quote/              v2  custom-quote form + private file upload
    ├── create-checkout-session/   v5  server-side pricing (shipping fee from store_settings) → pending order → Stripe Checkout
    ├── stripe-webhook/            v4  signature-verified; pending→paid / expired→cancelled
    └── get-order/                 v1  single order by session_id (guest) or id (owner/admin)
```

## Rules

- **Edit here first, then deploy.** Never edit a function or run DDL in the dashboard without
  mirroring it in this directory in the same commit.
- **New schema change = new migration file** `YYYYMMDDHHMMSS_<name>.sql`. Never edit an
  applied migration.
- **Secrets never live here.** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` are set in
  Supabase → Edge Functions → Secrets. `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## Deploying

Either of these works; keep the file here identical to what is deployed.

**Supabase MCP (what previous sessions used):**
`deploy_edge_function` with the contents of `functions/<name>/index.ts`;
`apply_migration` with the contents of a new `migrations/*.sql` file.

**Supabase CLI:**
```bash
npx supabase login
npx supabase link --project-ref ptwfidmlnuggxvqhimhe
npx supabase functions deploy <name> --no-verify-jwt
npx supabase db push
```

## Verifying the copy matches production

`list_edge_functions` reports an `ezbr_sha256` per function; redeploying an unchanged file
leaves that hash unchanged. `list_migrations` should list exactly the 9 versions in
`migrations/`.
