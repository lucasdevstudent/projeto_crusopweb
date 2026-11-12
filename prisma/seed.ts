import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: process.env.DATABASE_URL! }) });

// nome, kcal, proteína, carboidrato, gordura (por 100 g)
const foods: [string, number, number, number, number][] = [
  ["Arroz branco cozido", 128, 2.5, 28.1, 0.2],
  ["Arroz integral cozido", 124, 2.6, 25.8, 1],
  ["Feijão carioca cozido", 76, 4.8, 13.6, 0.5],
  ["Peito de frango grelhado", 159, 32, 0, 2.5],
  ["Carne bovina patinho grelhado", 219, 35.9, 0, 7.3],
  ["Ovo de galinha cozido", 146, 13.3, 0.6, 9.5],
  ["Tilápia grelhada", 128, 26, 0, 2.7],
  ["Batata-doce cozida", 77, 0.6, 18.4, 0.1],
  ["Macarrão cozido", 102, 3.4, 19.9, 0.5],
  ["Pão francês", 300, 8, 58.6, 3.1],
  ["Banana prata", 98, 1.3, 26, 0.1],
  ["Maçã", 56, 0.3, 15.2, 0],
  ["Leite integral", 61, 3.2, 4.6, 3.3],
  ["Queijo mussarela", 330, 22.6, 3, 25.2],
  ["Aveia em flocos", 394, 13.9, 66.6, 8.5],
  ["Azeite de oliva", 884, 0, 0, 100],
  ["Brócolis cozido", 25, 2.1, 4.4, 0.5],
  ["Alface", 11, 1.4, 1.7, 0.2],
  ["Tapioca (goma hidratada)", 240, 0, 59.5, 0],
  ["Cuscuz de milho cozido", 113, 2.2, 25.3, 0.7],
];

for (const [name, kcal, protein, carbs, fat] of foods) {
  await prisma.food.upsert({
    where: { name },
    update: { kcal, protein, carbs, fat },
    create: { name, kcal, protein, carbs, fat },
  });
}
console.log(`${foods.length} alimentos cadastrados`);
await prisma.$disconnect();
