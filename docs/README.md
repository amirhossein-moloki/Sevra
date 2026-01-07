# Sevra Documentation Map

This folder contains documentation generated directly from the current Sevra codebase. Each document includes a **Source of Truth** section that points to the exact files used.

## Contents

- [Architecture](architecture.md)
- [Database](database.md)
- [API](api.md)
- [Authentication](auth.md)
- [CMS + SEO](cms-seo.md)
- [Payments, Commission, Webhooks](payments-commission-webhooks.md)
- [Onboarding](onboarding.md)

## Notes

- The API is mounted under `/api/v1` in `src/app.ts`.
- Routes are composed in `src/routes/index.ts` and module-specific `*.routes.ts` files.
- If a section of documentation is listed as a **Known Gap / TODO**, it means the code does not fully implement or expose that behavior yet.

## Source of Truth

- `src/app.ts`
- `src/routes/index.ts`
