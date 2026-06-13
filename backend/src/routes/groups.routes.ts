import { Router } from "express";
import {
  addMember,
  createGroup,
  listMembersAtDate,
  removeMember
} from "../controllers/groups.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

groupsRouter.post("/", createGroup);
groupsRouter.get("/:id/members", listMembersAtDate);
groupsRouter.post("/:id/members", addMember);
groupsRouter.patch("/:id/members/:userId", removeMember);

