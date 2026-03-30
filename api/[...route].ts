import type { VercelRequest, VercelResponse } from "@vercel/node";

// Import the compiled backend from dist
const app = require("../backend/dist/index").default;

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
