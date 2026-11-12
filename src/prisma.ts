import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "./generated/prisma/client.js";
import { env } from "./config/env.js";

export const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: env.databaseUrl }),
});
