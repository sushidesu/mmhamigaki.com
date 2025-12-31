# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers application built with Hono, a lightweight web framework. The application is deployed to Cloudflare's edge network and uses Wrangler for development and deployment.

## Development Commands

```bash
# Install dependencies
npm install

# Start local development server with Wrangler
npm run dev

# Deploy to Cloudflare Workers
npm run deploy

# Generate TypeScript types from Worker configuration
npm run cf-typegen
```

## Architecture

### Tech Stack
- **Runtime**: Cloudflare Workers (edge computing platform)
- **Framework**: Hono v4 - lightweight web framework optimized for edge environments
- **Build Tool**: Wrangler - Cloudflare's CLI for Workers development
- **Language**: TypeScript with strict mode enabled

### Project Structure
- `src/index.ts` - Main application entry point, exports the Hono app instance
- `package.json` - Defines npm scripts and dependencies
- `tsconfig.json` - TypeScript configuration with ESNext target and Hono JSX support

### Key Patterns

**Hono App Instantiation with Cloudflare Bindings**:
When creating the Hono app instance, pass `CloudflareBindings` as a generic type to get proper TypeScript support for environment variables, KV namespaces, D1 databases, and other Cloudflare bindings:

```ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

Run `npm run cf-typegen` to generate/update the `CloudflareBindings` type definition based on your Worker configuration.

**JSX Configuration**:
The project is configured to use Hono's JSX runtime (`jsxImportSource: "hono/jsx"`), allowing you to use JSX syntax for templating without React.

**Module System**:
The project uses ES modules (`"type": "module"` in package.json) with ESNext module resolution in bundler mode.
