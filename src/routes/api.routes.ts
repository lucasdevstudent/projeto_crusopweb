import { Router, type Response } from "express";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";

export const api = Router();
api.use(auth);

const uid = (res: Response) => res.locals.userId as number;
const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
};
const dayRange = (d?: unknown) => {
  const start = new Date(`${typeof d === "string" && d ? d : todayStr()}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { gte: start, lt: end };
};
const r1 = (n: number) => Math.round(n * 10) / 10;

api.get("/me", async (_req, res) => {
  res.json(await prisma.user.findUnique({ where: { id: uid(res) }, include: { profile: true } }));
});

api.put("/profile", async (req, res) => {
  const heightCm = Number(req.body.heightCm);
  const birthYear = Number(req.body.birthYear);
  const activity = Number(req.body.activity);
  const sex = req.body.sex;
  const ok =
    heightCm >= 80 && heightCm <= 250 &&
    birthYear >= 1900 && birthYear <= new Date().getFullYear() &&
    (sex === "M" || sex === "F") &&
    activity >= 1.2 && activity <= 2;
  if (!ok) return res.status(400).json({ error: "Confira altura, ano de nascimento, sexo e atividade" });
  const data = { heightCm, birthYear, sex, activity };
  res.json(
    await prisma.profile.upsert({
      where: { userId: uid(res) },
      update: data,
      create: { userId: uid(res), ...data },
    }),
  );
});

api.get("/foods", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  res.json(
    await prisma.food.findMany({
      where: q ? { name: { contains: q } } : {},
      orderBy: { name: "asc" },
      take: 30,
    }),
  );
});

api.get("/meals", async (req, res) => {
  res.json(
    await prisma.meal.findMany({
      where: { userId: uid(res), date: dayRange(req.query.date) },
      include: { items: { include: { food: true }, orderBy: { id: "asc" } } },
      orderBy: { date: "asc" },
    }),
  );
});

api.post("/meals", async (req, res) => {
  const name = String(req.body.name ?? "").trim().slice(0, 60) || "Refeição";
  const date = req.body.date ? new Date(`${req.body.date}T12:00:00`) : new Date();
  res.status(201).json(await prisma.meal.create({ data: { userId: uid(res), name, date } }));
});

api.delete("/meals/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.mealItem.deleteMany({ where: { mealId: id, meal: { userId: uid(res) } } });
  await prisma.meal.deleteMany({ where: { id, userId: uid(res) } });
  res.status(204).end();
});

api.post("/meals/:id/items", async (req, res) => {
  const meal = await prisma.meal.findFirst({ where: { id: Number(req.params.id), userId: uid(res) } });
  const grams = Number(req.body.grams);
  const foodId = Number(req.body.foodId);
  if (!meal || !(grams > 0) || !foodId) return res.status(400).json({ error: "Informe o alimento e a quantidade em gramas" });
  res.status(201).json(await prisma.mealItem.create({ data: { mealId: meal.id, foodId, grams }, include: { food: true } }));
});

api.delete("/meals/:id/items/:itemId", async (req, res) => {
  await prisma.mealItem.deleteMany({
    where: { id: Number(req.params.itemId), mealId: Number(req.params.id), meal: { userId: uid(res) } },
  });
  res.status(204).end();
});

api.get("/weights", async (_req, res) => {
  res.json(await prisma.weightLog.findMany({ where: { userId: uid(res) }, orderBy: { date: "asc" } }));
});

api.post("/weights", async (req, res) => {
  const kg = Number(req.body.kg);
  if (!(kg >= 20 && kg <= 400)) return res.status(400).json({ error: "Peso inválido" });
  const date = req.body.date ? new Date(`${req.body.date}T12:00:00`) : new Date();
  res.status(201).json(await prisma.weightLog.create({ data: { userId: uid(res), kg, date } }));
});

api.delete("/weights/:id", async (req, res) => {
  await prisma.weightLog.deleteMany({ where: { id: Number(req.params.id), userId: uid(res) } });
  res.status(204).end();
});

api.get("/summary", async (req, res) => {
  const userId = uid(res);
  const [items, profile, last] = await Promise.all([
    prisma.mealItem.findMany({
      where: { meal: { userId, date: dayRange(req.query.date) } },
      include: { food: true },
    }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.weightLog.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
  ]);
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const i of items) {
    const f = i.grams / 100;
    t.kcal += i.food.kcal * f;
    t.protein += i.food.protein * f;
    t.carbs += i.food.carbs * f;
    t.fat += i.food.fat * f;
  }
  const kg = last?.kg ?? null;
  let goalKcal: number | null = null;
  let bmi: number | null = null;
  if (profile && kg) {
    const age = new Date().getFullYear() - profile.birthYear;
    const bmr = 10 * kg + 6.25 * profile.heightCm - 5 * age + (profile.sex === "M" ? 5 : -161);
    goalKcal = Math.round(bmr * profile.activity);
    bmi = r1(kg / (profile.heightCm / 100) ** 2);
  }
  res.json({
    totals: { kcal: Math.round(t.kcal), protein: r1(t.protein), carbs: r1(t.carbs), fat: r1(t.fat) },
    goalKcal,
    bmi,
    weightKg: kg,
  });
});
