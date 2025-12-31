# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal content platform and portfolio site built as a Cloudflare Workers application using Hono. It serves various types of content including text posts, images, and audio, all delivered from the edge.

## Development Principles

**Lightweight & Edge-Optimized**

- Keep dependencies minimal and the application lean
- Simple doesn't mean easy - it means avoiding unnecessary complexity
- All code must be optimized for Cloudflare Workers edge runtime

**Performance-First**

- Performance is critical for a content platform
- Base implementation on SSR for optimal delivery
- Support dynamic interactions where needed

**Cap'n Web for APIs**

- This project is a testing ground for Cap'n Web RPC
- All APIs must be implemented using Cap'n Web
- Cap'n Web is new technology - always consult official documentation for correct implementation

## Development Commands

```bash
# Install dependencies
npm install

# Start local development server with Wrangler (includes CSS build)
npm run dev

# TypeScript type checking (run before committing)
npm run typecheck

# Build Tailwind CSS
npm run css:build

# Deploy to Cloudflare Workers
npm run deploy

# Generate TypeScript types from Worker configuration
npm run cf-typegen
```

## Architecture

### Tech Stack

- **Runtime**: Cloudflare Workers (edge computing platform)
- **Framework**: Hono v4 - lightweight web framework optimized for edge environments
- **UI**: Hono JSX - server-side JSX rendering without React
- **Styling**: Tailwind CSS v4 - utility-first CSS with build-time generation
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
