import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import {
  findUserByEmail,
  createUser,
  findOrCreateGoogleUser,
  verifyPassword,
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
    const { email, name, credential } = req.body;

    let userEmail = email?.trim().toLowerCase();
    let userName = name?.trim();

    // If a Google ID token credential was provided, decode its payload
    if (credential && typeof credential === "string") {
      try {
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf8")
          );
          if (payload.email) {
            userEmail = payload.email.toLowerCase();
          }
          if (payload.name) {
            userName = payload.name;
          }
        }
      } catch (err) {
        console.warn("Failed to decode Google credential payload:", err);
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
