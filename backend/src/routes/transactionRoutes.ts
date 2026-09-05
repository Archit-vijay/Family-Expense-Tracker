import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

import {
  getTransactionsController,
  createTransactionController,
  updateTransactionController,
  deactivateTransactionController,
} from "../controllers/transactionController.js";

const router = Router();

router.get("/", authMiddleware, getTransactionsController);

router.post("/", authMiddleware, createTransactionController);

router.put("/:id", authMiddleware, updateTransactionController);  

router.delete("/:id", authMiddleware, deactivateTransactionController);

export default router;