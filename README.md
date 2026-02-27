# CyberRakshak

CyberRakshak is a full-stack cybersecurity awareness platform built to help people understand online threats, improve digital safety habits, and report scams through a practical, modern web experience.

It combines education, real-time alert visibility, interactive learning, and reporting workflows in one product.

## Why This Project Exists
Most users face phishing, fraud, social engineering, and account compromise risks, but information is often fragmented or too technical. CyberRakshak was created to make cybersecurity guidance:

- practical,
- easy to understand,
- interactive,
- and immediately actionable.

## Core Features

### Public User Features
- **Home Dashboard**: cyber awareness overview and feature navigation.
- **Cybercrime Types**: explains common scam categories, warning signs, and prevention tips.
- **Live Alerts**: displays active scam alerts and prevention guidance.
- **Safety Checklist**: step-by-step defensive actions users can follow.
- **Quiz**: interactive cyber awareness quiz (modes, filtering, scoring, insights).
- **Report a Scam**: complete report submission flow with recommendations and status tracking.
- **AI Assistant**: English voice/text cybersecurity assistant with quick prompts.
- **Security Tools**: utility page for practical security checks.

### Monitoring View
- **Admin Dashboard page implementation exists in codebase** for threat/report insight visualization.
- Public route exposure has been removed from navigation/router per current requirement.

## Tech Stack (Detailed)

### Frontend
- **React 18**: component-based interactive UI.
- **React Router 6 (SPA)**: client-side routing for page modules.
- **TypeScript**: better maintainability and safer refactoring.
- **Vite**: fast dev server + efficient production bundling.
- **TailwindCSS 3**: utility-first styling and consistent design system.
- **Framer Motion**: animation and UI transitions.
- **Lucide React**: clean icon library.
- **Radix UI primitives + reusable UI components**: accessible, composable UI foundation.
- **TanStack Query (provider included)**: ready for scalable server-state patterns.

### Backend
- **Express 5**: REST APIs for platform content and report workflows.
- **CORS + JSON middleware**: API interoperability and payload parsing.
- **dotenv**: environment variable support.

### Shared Contract
- **`shared/api.ts`** defines shared interfaces used by both client and server to keep API contracts consistent.

### Tooling
- **PNPM** (preferred package manager)
- **Vitest** for tests
- **Prettier** for formatting

## Architecture

```text
client/   -> React SPA
server/   -> Express API
shared/   -> Shared TypeScript interfaces
public/   -> Static assets (favicon, images, robots)
```

### Development Flow
- Single-port development via Vite (`:8080`) with Express mounted through Vite middleware.
- Frontend and backend run together for a smooth DX.

### Production Build
- Client output: `dist/spa`
- Server output: `dist/server`
- Start: `node dist/server/node-build.mjs`

## Available Routes

### Frontend Routes
- `/`
- `/cybercrime-types`
- `/live-alerts`
- `/safety-checklist`
- `/quiz`
- `/report-scam`
- `/ai-assistant`
- `/security-tools`

### API Routes (`/api/*`)
- `GET /api/ping`
- `GET /api/demo`
- `GET /api/cybercrime-types`
- `GET /api/cybercrime-types/:id`
- `GET /api/live-alerts`
- `GET /api/live-alerts/:id`
- `GET /api/live-alerts/type/:type`
- `GET /api/safety-checklist`
- `GET /api/safety-checklist/:id`
- `GET /api/safety-checklist-categories`
- `GET /api/quiz/questions`
- `GET /api/quiz/questions/:id`
- `POST /api/quiz/submit`
- `GET /api/quiz-categories`
- `POST /api/scam-report`
- `GET /api/scam-report/:reportId`
- `GET /api/scam-report-stats`
- `GET /api/scam-recommendations`
- `GET /api/recent-reports`

## Setup and Run

### Prerequisites
- Node.js 22+ recommended
- PNPM (via Corepack)

### Install
```bash
corepack enable
corepack pnpm install
```

### Development
```bash
corepack pnpm dev
```

### Build
```bash
corepack pnpm build
```

### Start Production Build
```bash
corepack pnpm start
```

### Type Check
```bash
corepack pnpm typecheck
```

### Test
```bash
corepack pnpm test
```

## Branding and Assets
- App name: **CyberRakshak**
- Favicon: `public/logo.ico` (wired in `index.html`)
- Home background can be set via `public/home-bg.jpg`

## Current Limitations
- Some data is mock/in-memory (non-persistent).
- No authentication/authorization layer for admin workflows yet.
- Production-grade rate limiting/auditing not fully implemented.

## Future Improvements
- Add auth + role-based access control.
- Move report/alert data to persistent DB.
- Add schema validation middleware with Zod for all request boundaries.
- Expand test coverage (unit + integration + E2E).
- Add full i18n strategy.

## Project Notes
A longer internal documentation file is available at:
- `PROJECT_DETAILS.md`

---
CyberRakshak focuses on practical cyber defense awareness with approachable UX and full-stack extensibility.
