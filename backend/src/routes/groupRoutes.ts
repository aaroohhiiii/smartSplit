import { Router } from "express";
import { requireAuth } from "@clerk/express";
import {
  createGroup,
  createGroupWithBill,
  listGroups,
  getGroupDetails,
  addGroupMember,
  updateMemberPreferences,
  removeGroupMember,
} from "../controllers/groupController.ts";

import { verifyClerkToken } from "../middleware/auth.ts";
const router = Router();

// Public
router.get("/", listGroups);
router.get("/:groupId", getGroupDetails);

// Protected
// POST with multipart form-data (for optional bill image)
// Frontend should use this when attaching a bill image
router.post("/", verifyClerkToken, createGroupWithBill);

router.post("/:groupId/members", verifyClerkToken, addGroupMember);
router.patch("/:groupId/members/:memberId", verifyClerkToken, updateMemberPreferences);
router.delete("/:groupId/members/:memberId", verifyClerkToken, removeGroupMember);

export default router;