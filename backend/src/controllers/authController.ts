import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

import {
  findUserByEmail,
  createUser,
  findOrCreateGoogleUser,
  verifyPassword,
  updateUserProfile,
  changeUserPassword,
  verifyAccountPassword,
  getTwoFactorStatus,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorLoginUser,
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPasswordWithToken,
} from "../services/authService.js";
import { getFamilyForUser } from "../services/familyService.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured.");
}

const jwtSecret: string = JWT_SECRET;

export async function loginController(
  req: Request,
  res: Response,
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });

      return;
    }

    const user = await findUserByEmail(email);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });

      return;
    }

    const passwordValid = await verifyPassword(
      password,
      user.password_hash,
    );

    if (!passwordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });

      return;
    }

    // Check if 2FA is enabled for this user
    if (user.is_two_factor_enabled) {
      const tempToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          purpose: "2fa_pending",
        },
        jwtSecret,
        {
          expiresIn: "5m",
        },
      );

      res.json({
        success: true,
        requires2FA: true,
        tempToken,
        message: "Two-factor authentication required.",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      },
    );

    const family = await getFamilyForUser(user.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        hasFamily: Boolean(family),
      },
    });
  } catch (error) {
    console.error("Login failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to log in.",
    });
  }
}

export async function signupController(
  req: Request,
  res: Response,
) {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });

      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if account already exists
    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) {
      res.status(409).json({
        success: false,
        code: "EMAIL_ALREADY_EXISTS",
        message: "An account already exists with this email.",
      });

      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });

      return;
    }

    const user = await createUser(
      name.trim(),
      cleanEmail,
      password,
    );

    const token = jwt.sign(
      {
        userId: user.id,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      },
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        hasFamily: false,
      },
    });
  } catch (error) {
    console.error("Signup failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create account.",
    });
  }
}

export async function googleAuthController(
  req: Request,
  res: Response,
) {
  try {
    const { email, name, credential, accessToken } = req.body;

    let userEmail = email?.trim().toLowerCase();
    let userName = name?.trim();

    // 1. Verify Google OAuth2 access token if provided
    if (accessToken && typeof accessToken === "string") {
      try {
        const tokenInfoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
        );

        if (!tokenInfoRes.ok) {
          const errData = (await tokenInfoRes.json().catch(() => ({}))) as any;
          console.error("Google access token verification failed:", errData);
          res.status(401).json({
            success: false,
            message: "Google authentication failed: invalid access token or expired session.",
          });
          return;
        }

        const tokenInfo = (await tokenInfoRes.json()) as any;
        const expectedClientId = process.env.GOOGLE_CLIENT_ID;
        const tokenAudience =
          tokenInfo.aud ||
          tokenInfo.azp ||
          tokenInfo.audience ||
          tokenInfo.issued_to;

        // Verify that the token was minted specifically for our OAuth Client ID
        if (
          expectedClientId &&
          tokenAudience !== expectedClientId
        ) {
          console.error(
            "Google access token audience mismatch. Expected:",
            expectedClientId,
            "Received:",
            tokenAudience
          );
          res.status(401).json({
            success: false,
            message: "Google token audience mismatch.",
          });
          return;
        }

        // Fetch verified user profile from Google's UserInfo endpoint
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!userInfoRes.ok) {
          res.status(401).json({
            success: false,
            message: "Unable to retrieve user profile from Google.",
          });
          return;
        }

        const userInfo = (await userInfoRes.json()) as any;
        if (!userInfo.email) {
          res.status(400).json({
            success: false,
            message: "Google account did not provide an email address.",
          });
          return;
        }

        userEmail = userInfo.email.toLowerCase();
        userName = userInfo.name || userInfo.given_name || userEmail.split("@")[0];
      } catch (err) {
        console.error("Error contacting Google token verification service:", err);
        res.status(500).json({
          success: false,
          message: "Unable to verify Google credential with Google's authentication servers.",
        });
        return;
      }
    }

    // 2. Verify Google ID token credential if provided
    if (credential && typeof credential === "string") {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );

        if (!verifyRes.ok) {
          const errData = (await verifyRes.json().catch(() => ({}))) as any;
          console.error("Google token verification failed:", errData);
          res.status(401).json({
            success: false,
            message: "Google authentication failed: invalid token signature or expired session.",
          });
          return;
        }

        const payload = (await verifyRes.json()) as any;

        // Verify that the token was minted specifically for our OAuth Client ID
        const expectedClientId = process.env.GOOGLE_CLIENT_ID;
        const tokenAudience = payload.aud || payload.azp || payload.audience;
        if (expectedClientId && tokenAudience !== expectedClientId) {
          console.error("Google token audience mismatch. Expected:", expectedClientId, "Received:", tokenAudience);
          res.status(401).json({
            success: false,
            message: "Google token audience mismatch.",
          });
          return;
        }

        if (!payload.email) {
          res.status(400).json({
            success: false,
            message: "Google token did not provide an email address.",
          });
          return;
        }

        userEmail = payload.email.toLowerCase();
        userName = payload.name || payload.given_name || userEmail.split("@")[0];
      } catch (err) {
        console.error("Error contacting Google token verification service:", err);
        res.status(500).json({
          success: false,
          message: "Unable to verify Google credential with Google's authentication servers.",
        });
        return;
      }
    }

    if (!userEmail) {
      res.status(400).json({
        success: false,
        message: "A valid email is required for Google sign-in.",
      });

      return;
    }

    const user = await findOrCreateGoogleUser(
      userEmail,
      userName || userEmail.split("@")[0] || "Family Member",
    );

    const token = jwt.sign(
      {
        userId: user.id,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      },
    );

    const family = await getFamilyForUser(user.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        hasFamily: Boolean(family),
      },
    });
  } catch (error) {
    console.error("Google auth failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to authenticate with Google.",
    });
  }
}

export async function updateProfileController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const { name } = req.body;
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: "A valid name with at least 2 characters is required.",
      });
      return;
    }

    const updatedUser = await updateUserProfile(userId, name.trim());
    res.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully.",
    });
  } catch (error: any) {
    console.error("Profile update failed:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
}

export async function changePasswordController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
      return;
    }

    const result = await changeUserPassword(userId, currentPassword, newPassword);
    res.json({
      success: true,
      message: "Password changed successfully.",
      data: {
        passwordChangedAt: result.passwordChangedAt,
      },
    });
  } catch (error: any) {
    console.error("Password change failed:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to change password.",
    });
  }
}

/**
 * Verify 2FA code during login with tempToken
 */
export async function verify2FALoginController(req: Request, res: Response) {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      res.status(400).json({
        success: false,
        message: "Verification token and 6-digit code are required.",
      });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, jwtSecret);
    } catch {
      res.status(401).json({
        success: false,
        message: "2FA session has expired. Please sign in again.",
      });
      return;
    }

    if (decoded?.purpose !== "2fa_pending" || !decoded?.userId) {
      res.status(401).json({
        success: false,
        message: "Invalid 2FA session.",
      });
      return;
    }

    const verifiedUser = await verifyTwoFactorLoginUser(decoded.userId, String(code));
    const token = jwt.sign(
      {
        userId: verifiedUser.id,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      },
    );

    const family = await getFamilyForUser(verifiedUser.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: verifiedUser.id,
          name: verifiedUser.name,
          email: verifiedUser.email,
        },
        hasFamily: Boolean(family),
      },
    });
  } catch (error: any) {
    console.error("2FA login verification failed:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Invalid two-factor code.",
    });
  }
}

/**
 * Verify account password to reveal masked email
 */
export async function verifyPasswordForEmailController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const { password } = req.body;
    if (!password) {
      res.status(400).json({ success: false, message: "Password is required." });
      return;
    }

    const email = await verifyAccountPassword(userId, password);
    res.json({
      success: true,
      data: {
        email,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Incorrect password.",
    });
  }
}

/**
 * Get 2FA and security status
 */
export async function getTwoFactorStatusController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const status = await getTwoFactorStatus(userId);
    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve security status.",
    });
  }
}

/**
 * Initiate 2FA setup (generate secret and otpauth URL)
 */
export async function setupTwoFactorController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const setupData = await setupTwoFactor(userId);
    res.json({
      success: true,
      data: setupData,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to initiate 2FA setup.",
    });
  }
}

/**
 * Confirm and enable 2FA
 */
export async function enableTwoFactorController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const { secret, code } = req.body;
    if (!secret || !code) {
      res.status(400).json({
        success: false,
        message: "Secret and 6-digit verification code are required.",
      });
      return;
    }

    const result = await enableTwoFactor(userId, secret, String(code));
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to enable two-factor authentication.",
    });
  }
}

/**
 * Disable 2FA
 */
export async function disableTwoFactorController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const { password } = req.body;
    if (!password) {
      res.status(400).json({
        success: false,
        message: "Current password is required to disable 2FA.",
      });
      return;
    }

    const result = await disableTwoFactor(userId, password);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to disable two-factor authentication.",
    });
  }
}

/**
 * Request a password reset link
 */
export async function forgotPasswordController(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.trim()) {
      res.status(400).json({
        success: false,
        message: "A valid email address is required.",
      });
      return;
    }

    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
    const result = await requestPasswordReset(email, origin);

    res.json({
      success: true,
      message: result.message,
      previewUrl: result.previewUrl,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process password reset request.",
    });
  }
}

/**
 * Verify validity of a password reset token
 */
export async function verifyResetTokenController(req: Request, res: Response) {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({
        success: false,
        valid: false,
        message: "Password reset token is required.",
      });
      return;
    }

    const verification = await verifyPasswordResetToken(token);
    if (!verification.valid) {
      res.status(400).json({
        success: false,
        valid: false,
        message: verification.message,
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      email: verification.email,
      name: verification.name,
      requires2FA: verification.requires2FA,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      valid: false,
      message: error.message || "Failed to verify reset token.",
    });
  }
}

/**
 * Complete password reset using verified token
 */
export async function resetPasswordController(req: Request, res: Response) {
  try {
    const { token, newPassword, twoFactorCode } = req.body;
    if (!token) {
      res.status(400).json({
        success: false,
        message: "Reset token is required.",
      });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
      return;
    }

    const result = await resetPasswordWithToken(token, newPassword, twoFactorCode);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reset password.",
    });
  }
}
