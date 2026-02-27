# CyberRakshak - Complete Website Documentation

## 1. What This Website Is
CyberRakshak is a full-stack cybersecurity awareness and safety platform.

It is designed to help users:
- learn common cybercrime patterns,
- monitor live scam alerts,
- follow practical safety checklists,
- test their knowledge through quizzes,
- report scams,
- use security tools, and
- access an AI assistant for quick guidance.

It also provides an Admin Dashboard to monitor threat/report data and trends.

## 2. Why This Website Was Created
The project addresses a practical gap: most users are exposed to cyber threats but do not have one place that combines awareness, prevention, practice, and reporting.

### Core goals
- **Awareness**: explain cybercrime types in simple terms.
- **Actionability**: provide checklist steps and recommendations, not just theory.
- **Engagement**: quizzes and interactive tools increase retention.
- **Community safety**: scam reporting helps identify patterns.
- **Operational visibility**: admin dashboard provides summary insights for monitoring.

## 3. Product Scope
### User-facing modules
- Home dashboard (`/`)
- Cybercrime Types (`/cybercrime-types`)
- Live Alerts (`/live-alerts`)
- Safety Checklist (`/safety-checklist`)
- Quiz (`/quiz`)
- Report Scam (`/report-scam`)
- AI Assistant (`/ai-assistant`)
- Security Tools (`/security-tools`)

### Admin module
- Admin Dashboard (`/admin`)

## 4. Tech Stack (and Why)

### Package manager
- **PNPM**
- Why: faster installs, better disk efficiency via content-addressable store, predictable lockfile behavior.

### Frontend
- **React 18**
  - Why: component-driven UI, robust ecosystem, ideal for interactive dashboards.
- **React Router 6**
  - Why: clear route-based page architecture for SPA experience.
- **TypeScript**
  - Why: shared types across client/server reduce API mismatch risks.
- **Vite**
  - Why: fast dev server, modern build pipeline, smooth DX.
- **TailwindCSS 3**
  - Why: rapid, consistent utility-first styling.
- **Framer Motion**
  - Why: simple, production-ready motion for page transitions/interactions.
- **Lucide React**
  - Why: lightweight consistent icon set.
- **Radix UI + shadcn-style components**
  - Why: accessible primitives and reusable UI building blocks.
- **TanStack Query (present in app wrapper)**
  - Why: scalable async state/caching model (foundation ready for larger data usage).

### Backend
- **Express 5**
  - Why: minimal, flexible HTTP server for REST endpoints.
- **CORS + JSON middleware**
  - Why: API interoperability and body parsing.

### Shared layer
- **`shared/api.ts` interfaces**
  - Why: frontend/backend contract alignment from one source.

### Build + tooling
- **Vite client build -> `dist/spa`**
- **Vite server build -> `dist/server`**
- **Vitest** for tests
- **Prettier** for formatting

## 5. Architecture Overview

### High-level pattern
- SPA frontend in `client/`
- Express backend in `server/`
- Shared TypeScript interfaces in `shared/`

### Development runtime
- Vite dev server runs on port `8080`.
- Express app is injected as Vite middleware via custom plugin in `vite.config.ts`.
- Frontend and backend are served together in development.

### Production runtime
- Client static build: `dist/spa`
- Server bundle: `dist/server`
- Start command: `node dist/server/node-build.mjs`

## 6. Repository Structure
- `client/` - React SPA pages/components/styles
- `server/` - Express app + API routes
- `shared/` - shared API interfaces and types
- `public/` - static files (`logo.ico`, `robots.txt`, etc.)
- `vite.config.ts` - client/dev config + express plugin
- `vite.config.server.ts` - server bundling config
- `tailwind.config.ts` - design tokens/animations
- `tsconfig.json` - TypeScript config and path aliases

## 7. Routing Map
Defined in `client/App.tsx`:
- `/` -> Home
- `/cybercrime-types` -> Cybercrime Types
- `/live-alerts` -> Live Alerts
- `/safety-checklist` -> Safety Checklist
- `/quiz` -> Quiz
- `/report-scam` -> Report Scam
- `/ai-assistant` -> AI Assistant
- `/security-tools` -> Security Tools
- `/admin` -> Admin Dashboard
- `*` -> NotFound

## 8. API Endpoints
Configured in `server/index.ts`:

### General
- `GET /api/ping`
- `GET /api/demo`

### Cybercrime
- `GET /api/cybercrime-types`
- `GET /api/cybercrime-types/:id`

### Live alerts
- `GET /api/live-alerts`
- `GET /api/live-alerts/:id`
- `GET /api/live-alerts/type/:type`

### Safety checklist
- `GET /api/safety-checklist`
- `GET /api/safety-checklist/:id`
- `GET /api/safety-checklist-categories`

### Quiz
- `GET /api/quiz/questions`
- `GET /api/quiz/questions/:id`
- `POST /api/quiz/submit`
- `GET /api/quiz-categories`

### Scam report
- `POST /api/scam-report`
- `GET /api/scam-report/:reportId`
- `GET /api/scam-report-stats`
- `GET /api/scam-recommendations`
- `GET /api/recent-reports`

## 9. Shared Data Contract
`shared/api.ts` centralizes interfaces, including:
- `CrimeType`, `CrimeTypesResponse`
- `ScamAlert`, `LiveAlertsResponse`
- `QuizQuestion`, `QuizResponse`, `QuizResultResponse`
- `ScamReportInput`, `ScamReportResponse`
- `ChecklistItem`, `ChecklistResponse`
- generic `ApiResponse<T>`

This enforces consistency between client and server behavior.

## 10. Key Page Behavior

### Home
- Hero section + branding (`CyberRakshak`)
- Custom background image support (`/home-bg.jpg`)
- Stats strip and feature cards

### Quiz
- Interactive quiz flow with mode selection
- Category/difficulty filtering
- Per-question feedback and final scoring

### Report Scam
- Full incident form with validation
- Report submission and tracking ID
- Recommendations and contact numbers
- Status lookup and trend summary

### AI Assistant
- English-only voice input/output
- Quick prompt chips
- Chat + repeat last reply + clear chat

### Admin Dashboard
- Aggregates alert + report metrics from API
- Severity filter for alert queue
- Trend/summary cards and refresh controls
- Background image support (`/admin-dashboard-bg.jpg`)

## 11. UI / Design System
- Global styling via Tailwind + `client/global.css`
- Reusable UI primitives in `client/components/ui/`
- Utility class merge via `cn()` (`clsx` + `tailwind-merge` pattern)
- Animation theme includes custom keyframes (`pulse-glow`, `float`, `scan`)

## 12. Branding and Static Assets
- Browser title: `CyberRakshak`
- Favicon path: `/logo.ico` (configured in `index.html`)
- Public assets live in `public/` and are served at root paths

## 13. Security and Privacy Posture (Current)
Current implementation is primarily educational/demo and uses in-memory stores for some server data.

### Good practices already present
- Environment variables loaded via `dotenv`
- Explicit API route separation
- Shared typing for request/response shape consistency

### Limitations
- In-memory data is non-persistent and not production-grade
- No authentication/authorization on admin route yet
- No rate limiting or abuse controls on report endpoints
- No database-backed auditing trail

## 14. Development Commands
- `pnpm dev` - start frontend + backend dev environment
- `pnpm build` - build client + server
- `pnpm start` - run production bundle
- `pnpm typecheck` - TypeScript validation
- `pnpm test` - run Vitest tests

## 15. Build/Deploy Notes
- Client output: `dist/spa`
- Server output: `dist/server`
- Single-port dev architecture simplifies local iteration
- Netlify/Vercel deployment options are scaffold-ready

## 16. Design and Engineering Decisions Summary
- Keep backend lightweight and focused on business logic/data shaping.
- Use React SPA for fast interactions and rich animations.
- Use shared TypeScript contracts to reduce client/server drift.
- Prefer route-based page modules for scalability.
- Build admin insights from the same API surface to avoid duplicate logic.

## 17. Suggested Next Upgrades
- Add authentication and role-based access for `/admin`
- Move mock/in-memory data to persistent database
- Add structured logging and request tracing
- Add API validation with Zod schemas at route boundaries
- Add e2e tests for major user flows (quiz/report/admin)
- Add i18n layer for professional multilingual responses

---

If you need, this file can be split next into:
1. `docs/ARCHITECTURE.md`
2. `docs/API_REFERENCE.md`
3. `docs/PRODUCT_OVERVIEW.md`
4. `docs/DEPLOYMENT.md`
for cleaner long-term maintenance.
