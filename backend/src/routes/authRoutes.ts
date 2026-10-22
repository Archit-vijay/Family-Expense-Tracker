import { Router } from "express";

import {
  loginController,
  signupController,
  googleAuthController,
  updateProfileController,
  changePasswordController,
  verify2FALoginController,
  verifyPasswordForEmailController,
  getTwoFactorStatusController,
  setupTwoFactorController,
  enableTwoFactorController,
  disableTwoFactorController,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", loginController);
router.post("/login/2fa", verify2FALoginController);
router.post("/signup", signupController);
router.post("/google", googleAuthController);

// Profile and security
router.patch("/profile", authMiddleware, updateProfileController);
router.post("/change-password", authMiddleware, changePasswordController);
router.post("/verify-password", authMiddleware, verifyPasswordForEmailController);

// Two-Factor Authentication (TOTP)
router.get("/2fa/status", authMiddleware, getTwoFactorStatusController);
router.post("/2fa/setup", authMiddleware, setupTwoFactorController);
router.post("/2fa/enable", authMiddleware, enableTwoFactorController);
router.post("/2fa/disable", authMiddleware, disableTwoFactorController);

export default router;
