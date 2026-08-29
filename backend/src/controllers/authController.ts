import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import {
  findUserByEmail,
  verifyPassword,
} from "../services/authService.js";

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

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
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