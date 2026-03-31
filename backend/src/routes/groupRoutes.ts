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
} from "../controllers/groupController";

import { verifyClerkTokenLocal } from "../middleware/auth";
const router = Router();

// Public
router.get("/", listGroups);
router.get("/:groupId", getGroupDetails);

// Protected
// POST with multipart form-data (for optional bill image)
// Frontend should use this when attaching a bill image
router.post("/", verifyClerkTokenLocal, createGroupWithBill);

router.post("/:groupId/members", verifyClerkTokenLocal, addGroupMember);
router.patch("/:groupId/members/:memberId", verifyClerkTokenLocal, updateMemberPreferences);
router.delete("/:groupId/members/:memberId", verifyClerkTokenLocal, removeGroupMember);

export default router;