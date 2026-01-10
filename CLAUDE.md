# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal content platform and portfolio site built as a Cloudflare Workers application using HonoX (Hono with Islands architecture). It serves various types of content including text posts, images, and audio, all delivered from the edge.

## Development Principles

**Lightweight & Edge-Optimized**

- Keep dependencies minimal and the application lean
- Simple doesn't mean easy - it means avoiding unnecessary complexity
- All code must be optimized for Cloudflare Workers edge runtime

**Performance-First**

- Performance is critical for a content platform
- Base implementation on SSR for optimal delivery
- Islands architecture enables selective client-side hydration for dynamic interactions

**Cap'n Web for APIs**

- This project is a testing ground for Cap'n Web RPC
- All APIs must be implemented using Cap'n Web
- Cap'n Web is new technology - always consult official documentation for correct implementation

## Development Commands

```bash
# Install dependencies
npm install

# Start local development server (includes CSS build)
npm run dev

# Build for production (client build + server build)
npm run build

# Preview production build locally
npm run preview

# Deploy to Cloudflare Workers
npm run deploy

# TypeScript type checking (run before committing)
npm run typecheck

# Generate TypeScript types from Worker configuration
npm run cf-typegen

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
npm run format:fix
```

## Architecture

### Tech Stack

- **Runtime**: Cloudflare Workers (edge computing platform)
- **Framework**: HonoX v0.1 - Meta-framework built on Hono with file-based routing and Islands architecture
- **Base Framework**: Hono v4 - lightweight web framework optimized for edge environments
- **UI**: Hono JSX - server-side JSX rendering without React
- **Styling**: Tailwind CSS v4 - utility-first CSS with build-time generation
- **Build Tool**: Vite - modern build tool with HMR
- **Linter**: oxlint - fast JavaScript/TypeScript linter
- **Formatter**: oxfmt - fast code formatter
- **Language**: TypeScript with strict mode enabled
- **Storage**: Cloudflare D1 (SQLite), R2 (object storage), KV (key-value store)

### Project Structure

```
app/
  ├── server.ts           - Main application entry point (HonoX app)
  ├── client.ts           - Client-side entry point for Islands hydration
  ├── routes/             - File-based routing (HonoX convention)
  │   ├── index.tsx       - Home page
  │   ├── posts/[slug].tsx - Individual post pages
  │   ├── admin/          - Admin interface routes
  │   ├── api/            - API endpoints
  │   │   ├── index.ts    - Public blog API (Cap'n Web RPC)
  │   │   └── admin.ts    - Admin API (Cap'n Web RPC + file upload)
  │   └── _middleware.ts  - Global middleware (caching)
  ├── islands/            - Client-side interactive components (Islands architecture)
  ├── components/         - Server-side JSX components
  ├── lib/                - Utility libraries
  │   ├── db/             - D1 database operations (content, attachment)
  │   ├── admin-client.ts - Cap'n Web RPC client for admin API
  │   ├── markdown.ts     - Markdown parsing
  │   ├── frontmatter.ts  - Frontmatter extraction
  │   └── cache.ts        - Caching utilities
  ├── middleware/         - Middleware implementations
  └── types/              - TypeScript type definitions
migrations/               - D1 database migrations
wrangler.jsonc           - Cloudflare Workers configuration
vite.config.ts           - Vite configuration with HonoX plugins
```

### Key Patterns

**HonoX with Islands Architecture**:
The application uses HonoX, which provides:
- File-based routing in `app/routes/`
- Islands architecture for selective client-side hydration
- Components in `app/islands/` are automatically hydrated on the client
- All other components are server-side rendered only

**Hono App Instantiation**:
The main app is created using HonoX's `createApp()`:
```ts
// app/server.ts
import { createApp } from "honox/server";
const app = createApp();
```

For standalone Hono instances (like API routes), use the `CloudflareBindings` type:
```ts
const app = new Hono<{ Bindings: CloudflareBindings }>();
```

Run `npm run cf-typegen` to generate/update the `CloudflareBindings` type definition based on your Worker configuration.

**Cap'n Web RPC Pattern**:
The project uses Cap'n Web for type-safe RPC communication:

Server-side (app/routes/api/admin.ts):
```ts
class AdminApiServer extends RpcTarget {
  constructor(private env: Env) { super(); }
  async createContent(data: CreateContentInput): Promise<ContentRecord> { ... }
}

// Handle RPC requests
api.all("/*", async (c) => {
  const server = new AdminApiServer(c.env);
  return await newHttpBatchRpcResponse(c.req.raw, server);
});
```

Client-side (app/lib/admin-client.ts):
```ts
interface AdminApi {
  createContent(data: CreateContentInput): Promise<ContentRecord>;
}

export function getAdminApi() {
  return newHttpBatchRpcSession<AdminApi>("/api/admin");
}
```

**Data Storage Strategy**:
- **D1 Database**: Stores content metadata and attachment records (text content stored in attachment.body)
- **R2 Buckets**: Stores media files (images, audio)
- **KV Namespace**: Caches parsed post metadata for performance

**JSX Configuration**:
The project is configured to use Hono's JSX runtime (`jsxImportSource: "hono/jsx"`), allowing you to use JSX syntax for templating without React.

**Module System**:
The project uses ES modules (`"type": "module"` in package.json) with ESNext module resolution in bundler mode.

**Vite Build Configuration**:
The build process uses two steps:
1. `vite build --mode client` - Builds client-side Islands code
2. `vite build` - Builds server-side code for Workers

This is configured in `vite.config.ts` with HonoX plugins and Cloudflare Workers adapter.

**Database Migrations**:
Database schema changes are managed through SQL migration files in the `migrations/` directory. Each migration is numbered sequentially (e.g., `0001_content.sql`, `0002_create_attachment_table.sql`).
