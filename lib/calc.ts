import type { Food } from "./foods";

/** Yerel saat dilimine göre YYYY-AA-GG */
export const toDay = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export const today = () => toDay(new Date());
export const addDays = (day: string, n: number) => toDay(new Date(new Date(day + "T12:00").getTime() + n * 864e5));

const DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
export const weekday = (day: string) => DAYS[new Date(day + "T12:00").getDay()];
export function prettyDay(day: string) {
  const t = today();
  if (day === t) return "Bugün";
  if (day === addDays(t, -1)) return "Dün";
  if (day === addDays(t, 1)) return "Yarın";
  const d = new Date(day + "T12:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${weekday(day)}`;
}
export const shortDay = (day: string) => {
  const d = new Date(day + "T12:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const calc = (f: Food, amt: number, u: string) => {
  const g = u === "adet" ? amt * f.a : u === "porsiyon" ? amt * f.s : amt;
  const r = g / 100;
  return { k: f.k * r, p: f.p * r, c: f.c * r, f: f.f * r };
};

export const bmi = (kg: number, cm: number) => (cm > 0 ? kg / (cm / 100) ** 2 : 0);
export const bmiLabel = (b: number) => (b < 18.5 ? "Zayıf" : b < 25 ? "Normal" : b < 30 ? "Fazla kilolu" : "Obez");

// Mifflin-St Jeor BMR -> TDEE -> hedefe göre kalori ve makrolar
export function targets(x: { age: number; height: number; weight: number; sex: string; activity: number; goal: string }) {
  const bmr = 10 * x.weight + 6.25 * x.height - 5 * x.age + (x.sex === "e" ? 5 : -161),
    tdee = bmr * x.activity;
  const kcal = x.goal === "ver" ? tdee - 500 : x.goal === "kas" ? tdee + 300 : tdee;
  const protein = x.weight * (x.goal === "koru" ? 1.6 : 2),
    fat = (kcal * 0.25) / 9,
    carb = Math.max((kcal - protein * 4 - fat * 9) / 4, 0);
  return { bmr, tdee, kcal: Math.round(kcal), protein: Math.round(protein), carb: Math.round(carb), fat: Math.round(fat) };
}

/** Ardışık kayıt günü sayısı (bugün veya dünden geriye doğru) */
export function streak(days: Set<string>) {
  let d = today();
  if (!days.has(d)) d = addDays(d, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
