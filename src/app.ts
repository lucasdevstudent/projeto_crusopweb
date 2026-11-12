import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { api } from "./routes/api.routes.js";

export const app = express();

app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());
app.use("/auth", authRouter);
app.use("/api", api);
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
