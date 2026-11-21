import type { Food } from "./foods";
export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export const calc = (f: Food, amt: number, u: string) => { const g = u === "adet" ? amt * f.a : u === "porsiyon" ? amt * f.s : amt; const r = g / 100; return { k: f.k * r, p: f.p * r, c: f.c * r, f: f.f * r }; };
// Mifflin-St Jeor BMR -> TDEE -> hedefe göre kalori ve makrolar
export function targets(x: { age: number; height: number; weight: number; sex: string; activity: number; goal: string }) {
  const bmr = 10 * x.weight + 6.25 * x.height - 5 * x.age + (x.sex === "e" ? 5 : -161), tdee = bmr * x.activity;
  const kcal = x.goal === "ver" ? tdee - 500 : x.goal === "kas" ? tdee + 300 : tdee;
  const protein = x.weight * (x.goal === "koru" ? 1.6 : 2), fat = (kcal * 0.25) / 9, carb = Math.max((kcal - protein * 4 - fat * 9) / 4, 0);
  return { bmr, tdee, kcal, protein, carb, fat };
}
