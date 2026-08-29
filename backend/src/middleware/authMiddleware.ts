import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured.");
}

const jwtSecret: string = JWT_SECRET;

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });

      return;
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      res.status(401).json({
        success: false,
        message: "Invalid authorization header.",
      });

      return;
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.userId !== "number"
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });

      return;
    }

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    console.error("Authentication failed:", error);

    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
}