import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../prisma.js";

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

export async function redirectToGithub(req: Request, res: Response) {
    const params = new URLSearchParams({
        client_id: env.github.clientId,
        redirect_uri: env.github.callbackUrl,
        scope: 'read:user user:email'
    });
    res.redirect(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`);
}

export async function githubCallback(req: Request, res: Response) {
    const code = req.query.code as string | undefined;
    if (!code) {
        return res.status(400).json({ error: "Parâmetro code ausente" });
    }
    // passo 1 - troca o code por access_token
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: env.github.clientId,
            client_secret: env.github.clientSecret,
            code,
            redirect_uri: env.github.callbackUrl
        }),
    });
    const tokenData = ( await tokenResponse.json()) as { access_token: string };
    if (!tokenData.access_token) {
        return res.status(401).json({ error: "Falha ao obter access_token" });
    }
    // passo 2 - buscar os dados do usuario no github
    const userResponse = await fetch(GITHUB_USER_URL, {headers: {'Authorization': `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "sinutre-back"}});
    const githubUser = await userResponse.json() as { 
        id: number;
        login: string; 
        name: string | null
        avatar_url: string | null;
    }

    // passo 3 - criar o usuario ou atualizar se ele ja existe

    const user = await prisma.user.upsert({
        where: { githubId: String (githubUser.id) },
        update: {
            githubLogin: githubUser.login,
            name: githubUser.name ?? githubUser.login,
            avatarUrl: githubUser.avatar_url ?? undefined
        },
        create: {
            githubId: String(githubUser.id),
            githubLogin: githubUser.login,
            name: githubUser.name ?? githubUser.login,
            avatarUrl: githubUser.avatar_url ?? undefined
        }
});


// passo 4 - gerar o token JWT
    const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d' });
    res.redirect(`${env.frontendurl}?token=${token}`);


}