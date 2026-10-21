import { Router } from "express";

import {
  loginController,
  signupController,
  googleAuthController,
} from "../controllers/authController.js";

const router = Router();

router.post("/login", loginController);
router.post("/signup", signupController);
router.post("/google", googleAuthController);

export default router;
