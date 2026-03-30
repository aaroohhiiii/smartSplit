import express from "express";
import serverless from "serverless-http";

// import your existing routes
import expenseRoutes from "../backend/src/routes/expenseRoutes";
import groupRoutes from "../backend/src/routes/groupRoutes";
import settlementRoutes from "../backend/src/routes/settlementRoutes";

const app = express();

app.use(express.json());

// mount routes
app.use("/api/expenses", expenseRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/settlements", settlementRoutes);

// health check (optional but useful)
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// export for Vercel
export default serverless(app);