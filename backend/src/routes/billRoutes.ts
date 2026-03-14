import { Router } from "express";
import {
    uploadBill,
    getBillStatus,
    confirmBillItems,
    billUpload,
} from "../controllers/billController.ts";

const router = Router({ mergeParams: true });

// Bill upload and processing routes
router.post("/upload-bill", billUpload.single("bill"), uploadBill);
router.get("/:billId/status", getBillStatus);
router.post("/:billId/confirm", confirmBillItems);

export default router;