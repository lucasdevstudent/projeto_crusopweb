import { Router } from "express";
import { githubCallback, redirectToGithub } from "../controllers/auth.controller.js";

export const authRouter = Router();
authRouter.get("/github", redirectToGithub);
authRouter.get("/github/callback", githubCallback);
