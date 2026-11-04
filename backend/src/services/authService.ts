import bcrypt from "bcrypt";
import crypto from "crypto";
import QRCode from "qrcode";
import pool from "../config/database.js";
import { sendPasswordResetEmail } from "./emailService.js";
import {
  generateTotpSecret,
  generateOtpauthUrl,
  verifyTotpCode,
} from "../utils/totp.js";

export async function findUserByEmail(email: string) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        email,
        password_hash,
        is_two_factor_enabled,
        password_changed_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function createUser(
  name: string,
  email: string,
  password: string,
) {
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `
      INSERT INTO users (
        name,
        email,
        password_hash
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        email,
        created_at;
    `,
    [name, email, passwordHash],
  );

  return result.rows[0];
}

export async function findOrCreateGoogleUser(
  email: string,
  name: string,
) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return existingUser;
  }

  // Create user with a secure random password hash
  const randomPass = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(randomPass, 12);

  const result = await pool.query(
    `
      INSERT INTO users (
        name,
        email,
        password_hash
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        email,
        created_at;
    `,
    [name, email, passwordHash],
  );

  return result.rows[0];
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
) {
  return bcrypt.compare(password, passwordHash);
}

export async function updateUserProfile(userId: number, name: string) {
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    throw new Error("Name must be at least 2 characters long.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        UPDATE users
        SET name = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, name, email, created_at;
      `,
      [trimmedName, userId],
    );

    if (result.rows.length === 0) {
      throw new Error("User not found.");
    }

    // Also sync the family_member row if linked
    await client.query(
      `
        UPDATE family_members
        SET name = $1, updated_at = NOW()
        WHERE user_id = $2;
      `,
      [trimmedName, userId],
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function changeUserPassword(
  userId: number,
  currentPass: string,
  newPass: string,
) {
  if (!newPass || newPass.length < 8) {
    throw new Error("New password must be at least 8 characters long.");
  }

  const userRes = await pool.query(
    "SELECT id, password_hash, password_changed_at FROM users WHERE id = $1 LIMIT 1",
    [userId],
  );

  const user = userRes.rows[0];
  if (!user) {
    throw new Error("User not found.");
  }

  // Security time gap check: prevent rapid password churning
  const COOLDOWN_MINUTES = parseInt(process.env.PASSWORD_CHANGE_COOLDOWN_MINUTES || "60", 10);
  if (user.password_changed_at) {
    const lastChanged = new Date(user.password_changed_at).getTime();
    const elapsedMs = Date.now() - lastChanged;
    const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
    if (elapsedMs < cooldownMs) {
      const remainingMinutes = Math.ceil((cooldownMs - elapsedMs) / (60 * 1000));
      const cooldownLabel = COOLDOWN_MINUTES >= 60 ? `${Math.round(COOLDOWN_MINUTES / 60)} hour(s)` : `${COOLDOWN_MINUTES} minutes`;
      throw new Error(
        `Security cooldown active: Passwords can only be changed once every ${cooldownLabel}. Please wait ${remainingMinutes} more minute(s) before updating again.`
      );
    }
  }

  const isCurrentValid = await verifyPassword(currentPass, user.password_hash);
  if (!isCurrentValid) {
    throw new Error("Current password is incorrect.");
  }

  const newHash = await bcrypt.hash(newPass, 12);
  const updateResult = await pool.query(
    `
      UPDATE users
      SET password_hash = $1, password_changed_at = NOW(), updated_at = NOW()
      WHERE id = $2
      RETURNING password_changed_at;
    `,
    [newHash, userId],
  );

  return { success: true, passwordChangedAt: updateResult.rows[0]?.password_changed_at };
}

/**
 * Verify account password and return unlocked plain email
 */
export async function verifyAccountPassword(userId: number, password: string): Promise<string> {
  const userRes = await pool.query(
    "SELECT id, email, password_hash FROM users WHERE id = $1 LIMIT 1",
    [userId],
  );
  const user = userRes.rows[0];
  if (!user) {
    throw new Error("User not found.");
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error("Incorrect account password.");
  }

  return user.email;
}

/**
 * Retrieve current user security and 2FA status
 */
export async function getTwoFactorStatus(userId: number) {
  const userRes = await pool.query(
    "SELECT is_two_factor_enabled, password_changed_at FROM users WHERE id = $1 LIMIT 1",
    [userId],
  );
  const user = userRes.rows[0];
  if (!user) {
    throw new Error("User not found.");
  }

  return {
    isTwoFactorEnabled: Boolean(user.is_two_factor_enabled),
    passwordChangedAt: user.password_changed_at ?? null,
  };
}

/**
 * Begin 2FA setup: generate secret and standard otpauth URL
 */
export async function setupTwoFactor(userId: number) {
  const userRes = await pool.query(
    "SELECT email FROM users WHERE id = $1 LIMIT 1",
    [userId],
  );
  const user = userRes.rows[0];
  if (!user) {
    throw new Error("User not found.");
  }

  const secret = generateTotpSecret();
  const otpauthUrl = generateOtpauthUrl(user.email, secret);
  const qrCode = await QRCode.toDataURL(otpauthUrl, {
    width: 240,
    margin: 2,
    color: {
      dark: "#2A234F",
      light: "#FFFFFF",
    },
  });

  return {
    secret,
    otpauthUrl,
    qrCode,
  };
}

/**
 * Enable 2FA after user verifies with 6-digit TOTP code
 */
export async function enableTwoFactor(userId: number, secret: string, code: string) {
  if (!secret || !code) {
    throw new Error("Secret and verification code are required.");
  }

  const isValid = verifyTotpCode(secret, code);
  if (!isValid) {
    throw new Error("Invalid 6-digit code. Please verify the code in your authenticator app and try again.");
  }

  await pool.query(
    `
      UPDATE users
      SET two_factor_secret = $1, is_two_factor_enabled = TRUE, updated_at = NOW()
      WHERE id = $2;
    `,
    [secret, userId],
  );

  return { success: true, message: "Two-factor authentication successfully enabled." };
}

/**
 * Disable 2FA by verifying user's account password
 */
export async function disableTwoFactor(userId: number, password: string) {
  if (!password) {
    throw new Error("Account password is required to disable 2FA.");
  }

  const userRes = await pool.query(
    "SELECT password_hash FROM users WHERE id = $1 LIMIT 1",
    [userId],
  );
  const user = userRes.rows[0];
  if (!user) {
    throw new Error("User not found.");
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error("Incorrect account password.");
  }

  await pool.query(
    `
      UPDATE users
      SET two_factor_secret = NULL, is_two_factor_enabled = FALSE, updated_at = NOW()
      WHERE id = $1;
    `,
    [userId],
  );

  return { success: true, message: "Two-factor authentication disabled." };
}

/**
 * Verify 2FA code during login
 */
export async function verifyTwoFactorLoginUser(userId: number, code: string) {
  const userRes = await pool.query(
    "SELECT id, name, email, two_factor_secret, is_two_factor_enabled FROM users WHERE id = $1 LIMIT 1",
    [userId],
  );
  const user = userRes.rows[0];
  if (!user) {
    throw new Error("User not found.");
  }

  if (!user.is_two_factor_enabled || !user.two_factor_secret) {
    throw new Error("2FA is not enabled for this account.");
  }

  const isValid = verifyTotpCode(user.two_factor_secret, code);
  if (!isValid) {
    throw new Error("Invalid or expired 6-digit code. Please check your authenticator app.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

/**
 * Create a secure expiring password reset token for a user
 */
export async function requestPasswordReset(email: string, clientOrigin?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  // Return generic confirmation to protect against user enumeration
  if (!user) {
    return {
      success: true,
      message: "If an account exists with this email, password reset instructions have been dispatched.",
    };
  }

  // Generate 32 bytes cryptographically secure random token (64 hex characters)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Token valid for 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Invalidate any existing unused tokens for this user
  await pool.query(
    "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE",
    [user.id],
  );

  // Save hashed token
  await pool.query(
    `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [user.id, tokenHash, expiresAt],
  );

  // Determine origin for the reset link
  const origin = clientOrigin || process.env.CORS_ORIGIN || "http://localhost:3000";
  const resetUrl = `${origin.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

  // Log prominently for development / home server debugging
  console.log("\n=======================================================");
  console.log("🔑 PASSWORD RESET REQUEST DISPATCHED");
  console.log(`Account:    ${user.email}`);
  console.log(`Reset URL:  ${resetUrl}`);
  console.log(`Expires:    ${expiresAt.toISOString()} (60 mins)`);
  console.log("=======================================================\n");

  let emailDispatched = false;

  // Dispatch real transactional email if Resend is configured
  if (process.env.RESEND_API_KEY) {
    const emailResult = await sendPasswordResetEmail(user.email, resetUrl, user.name);
    if (emailResult.success) {
      emailDispatched = true;
    } else {
      console.warn(`[Email Dispatcher] Could not deliver email to ${user.email}: ${emailResult.error}`);
    }
  }

  return {
    success: true,
    message: "If an account exists with this email, password reset instructions have been dispatched.",
    // If real email was successfully delivered, omit previewUrl.
    // If delivery failed (or Resend is not set up), fall back to previewUrl so the user is never blocked.
    previewUrl: !emailDispatched ? resetUrl : undefined,
  };
}

/**
 * Verify if a password reset token is valid, unused, and not expired
 */
export async function verifyPasswordResetToken(rawToken: string) {
  if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length !== 64) {
    return {
      valid: false,
      message: "Invalid or malformed reset link.",
    };
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");

  const result = await pool.query(
    `
      SELECT
        prt.id,
        prt.user_id,
        prt.expires_at,
        prt.used,
        u.email,
        u.name,
        u.is_two_factor_enabled
      FROM password_reset_tokens prt
      JOIN users u ON u.id = prt.user_id
      WHERE prt.token_hash = $1
      ORDER BY prt.created_at DESC
      LIMIT 1;
    `,
    [tokenHash],
  );

  const row = result.rows[0];
  if (!row) {
    return {
      valid: false,
      message: "This password reset link was not found or has expired.",
    };
  }

  if (row.used) {
    return {
      valid: false,
      message: "This password reset link has already been used. Please request a new one.",
    };
  }

  if (new Date(row.expires_at) < new Date()) {
    return {
      valid: false,
      message: "This password reset link has expired. Please request a new one.",
    };
  }

  return {
    valid: true,
    email: row.email,
    name: row.name,
    requires2FA: Boolean(row.is_two_factor_enabled),
  };
}

/**
 * Reset user password using verified one-time token
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
  twoFactorCode?: string,
) {
  if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length !== 64) {
    throw new Error("Invalid or malformed reset link.");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        SELECT
          prt.id,
          prt.user_id,
          prt.expires_at,
          prt.used,
          u.email,
          u.two_factor_secret,
          u.is_two_factor_enabled
        FROM password_reset_tokens prt
        JOIN users u ON u.id = prt.user_id
        WHERE prt.token_hash = $1
        FOR UPDATE OF prt
      `,
      [tokenHash],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error("Invalid or nonexistent password reset link.");
    }

    if (row.used) {
      throw new Error("This password reset link has already been used. Please request a new one.");
    }

    if (new Date(row.expires_at) < new Date()) {
      throw new Error("This password reset link has expired. Please request a new one.");
    }

    // If account has 2FA enabled, require the 6-digit TOTP code
    if (row.is_two_factor_enabled) {
      if (!twoFactorCode) {
        throw new Error("Two-factor authentication code is required to reset password.");
      }
      const is2FAValid = verifyTotpCode(row.two_factor_secret, twoFactorCode);
      if (!is2FAValid) {
        throw new Error("Invalid two-factor authentication code. Please check your authenticator app.");
      }
    }

    // Hash the new password with bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password, record password_changed_at, and mark token as used
    await client.query(
      `
        UPDATE users
        SET
          password_hash = $1,
          password_changed_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
      `,
      [passwordHash, row.user_id],
    );

    await client.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE id = $1",
      [row.id],
    );

    await client.query("COMMIT");

    return {
      success: true,
      message: "Your password has been successfully reset. You can now log in with your new password.",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
