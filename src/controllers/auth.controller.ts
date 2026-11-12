import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../prisma.js";

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const USER_URL = "https://api.github.com/user";

export function redirectToGithub(_req: Request, res: Response) {
  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: env.github.callbackUrl,
    scope: "read:user",
  });
  res.redirect(`${AUTHORIZE_URL}?${params.toString()}`);
}

export async function githubCallback(req: Request, res: Response) {
  const code = req.query.code as string | undefined;
  if (!code) return res.status(400).json({ error: "Parâmetro code ausente" });

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.github.clientId,
        client_secret: env.github.clientSecret,
        code,
        redirect_uri: env.github.callbackUrl,
      }),
    });
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      return res.status(401).json({ error: "Falha ao obter access_token" });
    }

    const userRes = await fetch(USER_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "sinutre-back",
      },
    });
    if (!userRes.ok) return res.status(502).json({ error: "Falha ao buscar usuário no GitHub" });
    const gh = (await userRes.json()) as {
      id: number;
      login: string;
      name: string | null;
      avatar_url: string | null;
    };

    const data = {
      githubLogin: gh.login,
      name: gh.name ?? gh.login,
      avatarUrl: gh.avatar_url ?? undefined,
    };
    const user = await prisma.user.upsert({
      where: { githubId: String(gh.id) },
      update: data,
      create: { githubId: String(gh.id), ...data },
    });

    const token = jwt.sign({ sub: String(user.id) }, env.jwtSecret, { expiresIn: "7d" });
    res.redirect(`${env.frontendUrl}?token=${token}`);
  } catch (error) {
    console.error("Erro no callback do GitHub:", error);
    res.status(500).json({ error: "Erro interno no login com GitHub" });
  }
}
