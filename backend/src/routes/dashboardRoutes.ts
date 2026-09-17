import { Router } from "express";
import { getDashboardController } from "../controllers/dashboardController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/", authMiddleware, getDashboardController);
export default router;
