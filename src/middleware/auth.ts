import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as { sub: string };
    res.locals.userId = Number(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
