import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
export const app = express();

app.use(cors({ origin: env.frontendurl, credentials: true }));

app.use(express.json());
app.use("/auth", authRouter);
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});