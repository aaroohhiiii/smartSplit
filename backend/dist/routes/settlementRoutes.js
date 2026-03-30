import { Router } from "express";
import { getSettlementSummary, recalculateSettlements, } from "../controllers/settlementController";
const router = Router();
// Settlement routes
router.get("/:groupId/settlements", getSettlementSummary);
router.post("/:groupId/settlements/recalculate", recalculateSettlements);
export default router;
//# sourceMappingURL=settlementRoutes.js.map