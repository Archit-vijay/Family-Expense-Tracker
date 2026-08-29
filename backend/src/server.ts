import "dotenv/config";
import cors from "cors";
import express from "express";
import pool from "./config/database";
import transactionRoutes from "./routes/transactionRoutes";
import familyMemberRoutes from "./routes/familyMemberRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import authRoutes from "./routes/authRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
    cors({
        origin: "http://localhost:5173",
    }),
);

app.use(express.json());

app.use("/api/transactions", transactionRoutes);

app.use("/api/family-members", familyMemberRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/family", familyRoutes);

app.get("/api/health", (_req, res) => {
    res.json({
        success: true,
        message: "Family Expense Tracker API is running",
    });
});

app.get("/api/health/db", async (_req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
        success: true,
        message: "Database connection successful",
        time: result.rows[0].now,
        });
    } catch (error) {
        console.error("Database connection failed:", error);

        res.status(500).json({
        success: false,
        message: "Database connection failed",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});