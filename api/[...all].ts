import serverless from "serverless-http";
import app from "../backend/src/index";

// Catch-all API handler so all /api/* paths use the same Express app as local dev.
export default serverless(app);
