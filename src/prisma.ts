import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "./generated/prisma/client.js";
import { env } from "./config/env.js";

const adapter = new PrismaLibSql({url: env.databaseUrl});

export const prisma = new PrismaClient({adapter});
