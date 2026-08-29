import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

import {
  getTransactionsController,
  createTransactionController,
} from "../controllers/transactionController.js";

const router = Router();

router.get("/", authMiddleware, getTransactionsController);

router.post("/", authMiddleware, createTransactionController);

export default router;