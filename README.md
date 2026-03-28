## Development

```bash
pnpm dev
```

Apply D1 migrations (first time only):

```bash
pnpm wrangler d1 migrations apply mmhamigaki-db --local
```

## Cloudflare Types

Run after changing `wrangler.jsonc`:

```bash
pnpm run cf-typegen
```

## Quality

```bash
pnpm run typecheck
pnpm run fmt
```

## Deploy

Apply migrations if any:

```bash
pnpm wrangler d1 migrations apply mmhamigaki-db --remote
```

```bash
pnpm run deploy
```

## Cloudflare Access

`/admin` is protected by Cloudflare Access. In local development, it is accessible without authentication.
