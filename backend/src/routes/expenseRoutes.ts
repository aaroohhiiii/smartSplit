import { Router } from "express";
import {
    createExpense,
    listExpense,
    updateExpense
    ,deleteExpense,getExpenseDetails
   
} from "../controllers/expenseController.ts";

const router = Router();

// Routes for expenses within a group
router.post("/:groupId/expenses", createExpense);

router.get("/:groupId/expenses", listExpense);
router.get("/:groupId/expenses/:expenseId", getExpenseDetails);
router.patch("/:groupId/expenses/:expenseId", updateExpense);
router.delete("/:groupId/expenses/:expenseId", deleteExpense);
;

export default router;
