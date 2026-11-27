"use client";
import { FormEvent, useState } from "react";
import { setData, Profile, Data } from "@/lib/store";
import { targets, today } from "@/lib/calc";

/** Varsayılan değerlerle profil oluşturur; yaş/cinsiyet/hedef sonradan Profil sekmesinden değiştirilebilir. */
export function makeProfile(name: string, height: number, weight: number): Profile {
  const base = { age: 30, sex: "e" as const, activity: 1.375, goal: "koru" as const };
  const t = targets({ ...base, height, weight });
  return {
    name, height, weight, ...base,
    targetWeight: weight,
    kcal: t.kcal, protein: t.protein, carb: t.carb, fat: t.fat,
    waterGoal: Math.round((weight * 35) / 250) * 250,
    stepGoal: 8000,
    createdAt: today(),
  };
}

export default function Onboarding() {
  const [name, setName] = useState(""), [h, setH] = useState(""), [w, setW] = useState(""), [err, setErr] = useState("");
  function go(e: FormEvent) {
    e.preventDefault();
    const height = parseFloat(h.replace(",", ".")), weight = parseFloat(w.replace(",", "."));
    if (!name.trim()) return setErr("Adını yaz");
    if (!(height >= 100 && height <= 250)) return setErr("Boy 100–250 cm arasında olmalı");
    if (!(weight >= 25 && weight <= 350)) return setErr("Kilo 25–350 kg arasında olmalı");
    const profile = makeProfile(name.trim(), height, weight);
    setData((d: Data) => ({ ...d, profile, weights: d.weights.length ? d.weights : [{ day: today(), kg: weight }] }));
  }
  return (
    <form onSubmit={go} className="flex min-h-dvh flex-col justify-center p-6">
      <div className="mb-8">
        <div className="mb-3 text-5xl">💪</div>
        <h1 className="text-3xl font-extrabold text-g">FitTakip</h1>
        <p className="mt-1 text-neutral-400">Beslenme, antrenman ve gelişim takibi. Hesap yok, internet gerekmez — verilerin yalnızca bu cihazda saklanır.</p>
      </div>
      <label className="mb-3 block text-sm text-neutral-400">
        Adın
        <input className="inp mt-1" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="ör. Ömer" autoComplete="given-name" />
      </label>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <label className="text-sm text-neutral-400">
          Boy (cm)
          <input className="inp mt-1" inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} placeholder="175" />
        </label>
        <label className="text-sm text-neutral-400">
          Kilo (kg)
          <input className="inp mt-1" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} placeholder="75" />
        </label>
      </div>
      {err && <p className="mb-3 text-sm text-o">{err}</p>}
      <button className="pri mt-2 w-full py-3 text-lg">Başla</button>
      <p className="mt-4 text-center text-xs text-neutral-500">Yaş, cinsiyet ve hedefini daha sonra Profil sekmesinden ekleyerek kalori hedefini kişiselleştirebilirsin.</p>
    </form>
  );
}
