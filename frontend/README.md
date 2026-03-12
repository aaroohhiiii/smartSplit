Vite + React frontend for SmartSplit

Quick start

1. Install dependencies

```bash
cd frontend-vite
npm install
```

2. Run dev server

```bash
npm run dev
```

3. Open the URL shown by Vite (default http://localhost:5173)

Notes
- The dev server proxies `/api` to `http://localhost:3000` (see `vite.config.ts`). Backend exposes API under `/api/v1` so calls use `/api/v1/...`.
- Paste a Clerk JWT token into the token box to authenticate requests.
- Example: Create Group will POST to `/api/v1/groups` and use the token for `createdBy`.
