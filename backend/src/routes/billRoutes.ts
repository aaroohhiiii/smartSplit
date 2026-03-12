import { Router } from "express";
import {
    uploadBill,
    getBillStatus,
    confirmBillItems,
} from "../controllers/billController.ts";

const router = Router();

// Bill upload and processing routes
router.post("/:groupId/bills", uploadBill);
router.get("/:billId", getBillStatus);
router.post("/:billId/confirm", confirmBillItems);

export default router;