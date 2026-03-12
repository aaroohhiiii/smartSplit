import { Router } from "express";
import { verifyClerkToken, requireAuth } from "../middleware/auth.ts";
import {
  createGroup,
  listGroups,
  getGroupDetails,
  addGroupMember,
  updateMemberPreferences,
  removeGroupMember,
} from "../controllers/groupController.ts";

const router = Router();


router.get("/", listGroups);
router.get("/:groupId", getGroupDetails);

// ─── Protected (auth required) ────────────────────────────────────────────
router.post("/", verifyClerkToken, createGroup);
router.post("/:groupId/members", verifyClerkToken,  addGroupMember);
router.patch("/:groupId/members/:memberId", verifyClerkToken, updateMemberPreferences);
router.delete("/:groupId/members/:memberId", verifyClerkToken,  removeGroupMember);

export default router;