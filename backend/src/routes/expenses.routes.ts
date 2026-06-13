import { Router } from "express";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense
} from "../controllers/expenses.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const expensesRouter = Router();

expensesRouter.use(requireAuth);

expensesRouter.get("/groups/:groupId/expenses", listExpenses);
expensesRouter.post("/groups/:groupId/expenses", createExpense);
expensesRouter.patch("/expenses/:id", updateExpense);
expensesRouter.delete("/expenses/:id", deleteExpense);

