"use client";
// Tüm uygulama verisi tarayıcının localStorage'ında tek bir JSON belgesi olarak tutulur.
// Sunucu, hesap veya ağ bağlantısı gerekmez.
import { useSyncExternalStore } from "react";
import type { Food } from "./foods";

export type Sex = "e" | "k";
export type Goal = "ver" | "koru" | "kas";

export type Profile = {
  name: string;
  height: number; // cm
  weight: number; // kg (başlangıç / son girilen)
  age: number;
  sex: Sex;
  activity: number;
  goal: Goal;
  targetWeight: number;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  waterGoal: number; // ml
  stepGoal: number;
  createdAt: string;
};

export type Entry = {
  id: string;
  day: string;
  meal: string;
  name: string;
  amount: number;
  unit: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  ts: number;
};

export type Weight = { day: string; kg: number };
export type Daily = { water?: number; steps?: number; note?: string };

export type WSet = { reps: number; kg: number; done?: boolean };
export type WExercise = {
  id: string;
  name: string;
  kind: "strength" | "cardio";
  sets: WSet[]; // kuvvet
  minutes?: number; // kardiyo
  distance?: number; // km
  kcal?: number; // kardiyo için hesaplanan
};
export type Workout = {
  id: string;
  day: string;
  name: string;
  minutes: number;
  exercises: WExercise[];
  note?: string;
  kcal: number;
  ts: number;
};

export type Data = {
  v: 1;
  profile: Profile | null;
  entries: Entry[];
  foods: Food[]; // kullanıcının oluşturduğu yiyecekler
  favorites: string[]; // yiyecek adları
  weights: Weight[];
  daily: Record<string, Daily>;
  workouts: Workout[];
  customExercises: { name: string; group: string; kind: "strength" | "cardio"; met?: number }[];
  draft?: Workout | null; // yarım kalan antrenman (sayfa yenilense de kaybolmaz)
};

const KEY = "fittakip:v1";
const EMPTY: Data = { v: 1, profile: null, entries: [], foods: [], favorites: [], weights: [], daily: {}, workouts: [], customExercises: [] };

let cache: Data | null = null;
const listeners = new Set<() => void>();

function normalize(raw: any): Data {
  const d = { ...EMPTY, ...(raw && typeof raw === "object" ? raw : {}) };
  for (const k of ["entries", "foods", "favorites", "weights", "workouts", "customExercises"] as const) if (!Array.isArray(d[k])) (d as any)[k] = [];
  if (!d.daily || typeof d.daily !== "object") d.daily = {};
  d.v = 1;
  return d as Data;
}

function read(): Data {
  if (cache) return cache;
  try {
    const s = localStorage.getItem(KEY);
    cache = normalize(s ? JSON.parse(s) : null);
  } catch {
    cache = { ...EMPTY };
  }
  return cache;
}

let lastError = "";
export const storageError = () => lastError;

export function setData(next: Data | ((d: Data) => Data)) {
  const value = typeof next === "function" ? next(read()) : next;
  cache = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
    lastError = "";
  } catch (e) {
    lastError = "Veri kaydedilemedi: tarayıcı depolama alanı dolu ya da kapalı olabilir.";
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // Diğer sekmelerde yapılan değişiklikleri yakala
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Sunucuda (statik derleme sırasında) null döner; istemcide güncel veri. */
export function useData(): Data | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ---- Yardımcı güncelleyiciler ----
export const update = (fn: (d: Data) => Partial<Data>) => setData((d) => ({ ...d, ...fn(d) }));

export function setDaily(day: string, patch: Daily) {
  update((d) => ({ daily: { ...d.daily, [day]: { ...d.daily[day], ...patch } } }));
}

export function upsertWeight(day: string, kg: number) {
  update((d) => {
    const weights = [...d.weights.filter((w) => w.day !== day), { day, kg }].sort((a, b) => a.day.localeCompare(b.day));
    const latest = weights[weights.length - 1];
    return { weights, profile: d.profile && latest ? { ...d.profile, weight: latest.kg } : d.profile };
  });
}

// ---- Yedekleme ----
export function exportJSON() {
  const blob = new Blob([JSON.stringify(read(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `fittakip-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function importJSON(file: File) {
  const parsed = JSON.parse(await file.text());
  if (!parsed || typeof parsed !== "object" || !("entries" in parsed || "profile" in parsed)) throw new Error("Geçersiz yedek dosyası");
  setData(normalize(parsed));
}

export function resetAll() {
  setData({ ...EMPTY });
}
