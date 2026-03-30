import type { VercelRequest, VercelResponse } from "@vercel/node";

let app: any;

async function loadApp() {
  if (!app) {
    const module = await import("../backend/dist/index.js") as any;
    app = module.default;
  }
  return app;
}
// ...existing code...

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = await loadApp();
  return expressApp(req, res);
}
