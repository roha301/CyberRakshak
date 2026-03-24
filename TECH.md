# CyberRakshak - Technical Architecture and Stack Rationale

## 1. Technical Overview
CyberRakshak is a full-stack TypeScript web application designed around a practical requirement: deliver a fast, interactive cybersecurity awareness experience while keeping backend logic simple, secure, and extensible.

The project follows a three-layer model:
- `client/` for SPA UI and interaction logic,
- `server/` for API routes and provider integrations,
- `shared/` for type contracts used by both sides.

This structure keeps concerns separated and minimizes frontend/backend drift.

---

## 2. Core Tech Stack

### 2.1 Language and Runtime

#### TypeScript
- Used across client, server, and shared code.
- Why used:
  - Improves refactor safety in a rapidly changing product.
  - Reduces runtime bugs from shape mismatches.
  - Enables shared API interfaces (`shared/api.ts`) so frontend and backend agree on payload structure.

#### Node.js (ES Modules)
- Server runtime and build tooling runtime.
- Why used:
  - Mature ecosystem for web APIs and tooling.
  - Native `fetch` and modern language support.
  - Works cleanly with Vite and modern ESM workflows.

---

### 2.2 Frontend Stack

#### React 18
- SPA UI framework.
- Why used:
  - Component model is ideal for dashboard-style, highly interactive UIs.
  - Good performance and ecosystem support.
  - Suits reusable UI primitives and incremental feature additions.

#### React Router 6
- Client-side routing.
- Why used:
  - Clear route declarations and predictable nested route behavior.
  - Supports product growth as pages increase.

#### Vite
- Dev server + frontend bundler.
- Why used:
  - Very fast startup and HMR, important for rapid UI iteration.
  - Modern ESBuild/Rollup pipeline with low config overhead.
  - Easy integration with Express in development via plugin middleware.

#### Tailwind CSS 3
- Utility-first styling.
- Why used:
  - Accelerates UI development while keeping consistency.
  - Easy responsive design without large custom CSS files.
  - Works well with design-token style theming.

#### Framer Motion
- Animation layer.
- Why used:
  - Declarative, low-friction animation API.
  - Enables subtle UX improvements (entry transitions, loading cues, scan effects).

#### Lucide React
- Icon library.
- Why used:
  - Lightweight, consistent icon system.
  - Easy to style with Tailwind classes.

#### Radix UI-based Component Set
- Accessible primitive components in `client/components/ui`.
- Why used:
  - Accessibility-first behavior without rebuilding common primitives.
  - Speeds up building robust forms, popovers, dialogs, and controls.

#### TanStack Query (Provider Setup)
- Query client/provider is configured in app shell.
- Why used:
  - Establishes scalable server-state handling foundation.
  - Useful for future caching/retry/stale-time tuning.

---

### 2.3 Backend Stack

#### Express 5
- API server framework.
- Why used:
  - Minimal, stable API routing model.
  - Easy middleware composition (`cors`, JSON body parsing).
  - Good fit for data shaping, mock data, and external provider bridging.

#### CORS + JSON middleware
- Cross-origin compatibility and JSON payload handling.
- Why used:
  - Necessary for browser API interactions in various deploy contexts.
  - Standard API ergonomics.

#### dotenv
- Environment variable loading.
- Why used:
  - Separates secret/config from source code.
  - Supports local development and deployment parity.

---

### 2.4 AI Integration Layer

#### OpenAI Chat Completions API (primary in server route)
- Used by AI Assistant backend route.
- Why used:
  - Strong instruction following and practical Q&A responses.
  - Server-side call keeps API key private.

#### Google Gemini API (`gemini-2.5-pro`) (fallback)
- Secondary provider in AI route.
- Why used:
  - Provider redundancy and continuity if one provider fails.
  - Large-context and reasoning capability for security Q&A.

#### Browser Speech APIs
- `SpeechRecognition` / `webkitSpeechRecognition` and `SpeechSynthesisUtterance`.
- Why used:
  - Native voice input/output without external speech SDK dependency.
  - Lower integration cost for project demo and MVP behavior.

---

## 3. Build and Packaging

### Client Build
- Command: `pnpm build:client`
- Output: `dist/spa`
- Why this split:
  - Keeps static frontend assets isolated for serving/CDN use.

### Server Build
- Command: `pnpm build:server`
- Config: `vite.config.server.ts`
- Output: `dist/server`
- Why this approach:
  - Unified toolchain (Vite) for both client and server.
  - Controlled externalization of Node built-ins and runtime dependencies.

### Production Start
- Command: `pnpm start`
- Entry: `dist/server/node-build.mjs`

---

## 4. Development Experience Decisions

### Single-Port Dev Architecture
- Vite serves frontend and mounts Express middleware in dev.
- Why used:
  - Simple local run experience (`pnpm dev`).
  - Avoids CORS complexity during daily development.

### Path Aliases
- `@/*` -> client
- `@shared/*` -> shared
- Why used:
  - Cleaner imports.
  - Easier large-scale refactors.

### Shared Type Contracts
- Centralized in `shared/api.ts`.
- Why used:
  - Avoids duplicated DTO definitions.
  - Prevents API contract mismatch issues.

---

## 5. UI System and Design Tokens

### Tailwind Tokenized Theme
- Uses CSS variable-backed colors and Tailwind extension.
- Why used:
  - Quick theming and visual consistency.
  - Makes branding adjustments easier.

### Animation Strategy
- Custom keyframes (`pulse-glow`, `float`, `scan-line`) and Framer Motion transitions.
- Why used:
  - Adds cyber-themed feel without heavy rendering overhead.
  - Improves perceived responsiveness and polish.

---

## 6. API and Data Pattern

### Route Organization
- Route handlers grouped by domain (`live-alerts`, `quiz`, `scam-report`, etc.).
- Why used:
  - Better maintainability as feature count grows.
  - Clear ownership per module.

### Current Data Model
- Primarily mock/in-memory for demo functionality.
- Why used:
  - Fast feature prototyping without immediate DB overhead.
  - Suitable for UI/flow validation before persistence layer investment.

---

## 7. Security-Oriented Technical Decisions

### Secret Handling on Server
- AI keys consumed in backend routes, not in client bundles.
- Why used:
  - Prevents exposing provider keys in browser code.
  - Allows future key rotation/provider switching without frontend changes.

### Defensive AI Route Behavior
- Provider fallback path and local answer fallback in AI route.
- Why used:
  - Keeps UX functional even if external AI service is down.
  - Avoids blank/error-only assistant responses.

---

## 8. Testing and Quality Tooling

### Vitest
- Unit testing framework.
- Why used:
  - Fast test runs aligned with Vite ecosystem.

### Type Checking (`tsc`)
- Static correctness gate.
- Why used:
  - Catches type-level integration issues early.

### Prettier
- Formatting consistency.
- Why used:
  - Reduces style churn and review friction.

---

## 9. Tradeoffs and Constraints

### Benefits of Current Stack
- Fast iteration speed.
- Good frontend UX flexibility.
- Simple but powerful API layer.
- Scalable path to stronger architecture.

### Current Tradeoffs
- In-memory data is non-persistent.
- No full auth/RBAC currently active.
- AI response quality still depends on provider availability and prompt tuning.

---

## 10. Recommended Next Technical Upgrades

1. Add persistent DB (PostgreSQL/MongoDB) for reports, alerts, audit trail.
2. Add auth + role-based admin controls.
3. Add route-level schema validation with Zod on all endpoints.
4. Add observability (request IDs, structured logs, provider latency/error tracking).
5. Add E2E tests for critical workflows (AI assistant, report flow, quiz).
6. Add AI prompt/version management and response evaluation metrics.

---

## 11. Summary
CyberRakshak uses a pragmatic modern stack: React + Vite + Tailwind on the frontend, Express on the backend, and shared TypeScript contracts across layers. The stack was chosen to maximize development velocity, maintainability, and user-facing quality while keeping room for production-hardening upgrades (auth, persistence, observability) as the project matures.
