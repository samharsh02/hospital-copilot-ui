# Hospital Copilot — Frontend

React-based UI for the Hospital Copilot clinical management platform. Provides login, patient dashboard, and a foundation for workflow and real-time notification views.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build tool | Vite 8 |
| Language | TypeScript 6 |
| Auth | JWT (stored in `localStorage`, reactive store) |
| API client | Native `fetch` with base URL from env |
| Linting | ESLint + `typescript-eslint` |
| Container | Multi-stage Docker: Node 20 build → nginx:alpine serve |

## Project Structure

```
src/
├── api/
│   ├── client.ts       # fetch wrapper (attaches Authorization header)
│   └── auth.ts         # register / login / logout / me API calls
├── store/
│   └── auth.ts         # reactive auth store (token + user, localStorage-backed)
├── hooks/
│   └── useAuth.ts      # React hook wrapping the auth store
├── pages/
│   ├── LoginPage.tsx   # login form
│   └── DashboardPage.tsx # post-login landing page
├── types/              # TypeScript interfaces
├── components/         # shared UI components
├── App.tsx
└── main.tsx
```

## Getting Started

### Prerequisites
- Node.js 20+
- Backend API running at `http://localhost:8000` (or set `VITE_API_BASE_URL`)

### Install and run

```bash
git clone https://github.com/samharsh02/hospital-copilot-ui.git
cd hospital-copilot-ui

npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Environment variables

Create a `.env` file (or copy `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

In production (Docker), the build arg `VITE_API_BASE_URL` defaults to `/api/v1` (relative path, proxied by nginx).

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run lint` | Run ESLint |
| `npm run preview` | Serve the production build locally |

## Docker

The frontend ships as a static bundle served by nginx. The Dockerfile uses a multi-stage build:

1. **Stage 1** — Node 20: install deps, run `tsc -b && vite build`, output to `dist/`
2. **Stage 2** — nginx:alpine: copy `dist/` and `nginx.conf`, serve on port 80

Build and run standalone:

```bash
docker build --build-arg VITE_API_BASE_URL=/api/v1 -t hospital-copilot-ui .
docker run -p 3000:80 hospital-copilot-ui
```

In production, this container sits behind the nginx reverse proxy defined in the backend repo — you don't need to expose it directly.

## Auth Flow

1. User submits credentials on `LoginPage`
2. `api/auth.ts` calls `POST /api/v1/auth/login/` → receives `{access, refresh}`
3. Tokens are stored in `localStorage` via `store/auth.ts`
4. `api/client.ts` reads the access token and attaches `Authorization: Bearer <token>` on every request
5. Logout calls `POST /api/v1/auth/logout/` to blacklist the refresh token, then clears local state

## Related

- **Backend API**: [hospital-copilot](https://github.com/samharsh02/hospital-copilot)
