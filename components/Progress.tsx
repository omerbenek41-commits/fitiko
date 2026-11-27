"use client";
import { useMemo, useState } from "react";
import { Data, Profile, upsertWeight, update } from "@/lib/store";
import { addDays, bmi, bmiLabel, shortDay, streak, today, weekday } from "@/lib/calc";
import { oneRM, volume } from "@/lib/exercises";
import { BarChart, LineChart, Stat } from "./ui";

const r0 = Math.round;

export default function Progress({ data, profile }: { data: Data; profile: Profile }) {
  const [kg, setKg] = useState(""), [day, setDay] = useState(today()), [err, setErr] = useState(""), [range, setRange] = useState(30);

  const weights = data.weights;
  const first = weights[0], last = weights[weights.length - 1];
  const shown = range ? weights.filter((w) => w.day >= addDays(today(), -range)) : weights;
  // 7 kayıtlık hareketli ortalama (günlük dalgalanmayı yumuşatır)
  const avg = shown.map((_, i) => {
    const s = shown.slice(Math.max(0, i - 6), i + 1);
    return s.reduce((a, b) => a + b.kg, 0) / s.length;
  });

  const add = () => {
    const v = parseFloat(kg.replace(",", "."));
    if (!(v > 20 && v < 400)) return setErr("Geçerli bir kilo gir");
    upsertWeight(day, v);
    setKg("");
    setErr("");
  };

  // Son 7 günün kalorileri
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today(), i - 6));
  const kcalByDay = useMemo(() => {
    const m: Record<string, number> = {};
    data.entries.forEach((e) => (m[e.day] = (m[e.day] ?? 0) + e.kcal));
    return m;
  }, [data.entries]);
  const loggedLast7 = last7.filter((d) => kcalByDay[d]);
  const avgKcal = loggedLast7.length ? loggedLast7.reduce((s, d) => s + kcalByDay[d], 0) / loggedLast7.length : 0;

  // Haftalık antrenman sayısı (son 8 hafta)
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = addDays(today(), -7 * (7 - i));
    const startDay = addDays(end, -6);
    const n = data.workouts.filter((w) => w.day >= startDay && w.day <= end).length;
    return { x: i === 7 ? "Bu h." : `${+startDay.slice(8)}/${+startDay.slice(5, 7)}`, y: n };
  });

  const days = useMemo(() => new Set([...data.entries.map((e) => e.day), ...data.workouts.map((w) => w.day)]), [data.entries, data.workouts]);
  const st = streak(days);

  // Kişisel rekorlar
  const prs = useMemo(() => {
    const m = new Map<string, { kg: number; reps: number; rm: number; day: string; vol: number }>();
    for (const w of data.workouts)
      for (const e of w.exercises) {
        if (e.kind !== "strength") continue;
        for (const s of e.sets) {
          const rm = oneRM(s.kg, s.reps);
          const cur = m.get(e.name);
          if (rm > 0 && (!cur || rm > cur.rm)) m.set(e.name, { kg: s.kg, reps: s.reps, rm, day: w.day, vol: cur?.vol ?? 0 });
        }
        const cur = m.get(e.name);
        if (cur) cur.vol = Math.max(cur.vol, volume(e.sets));
      }
    return [...m.entries()].sort((a, b) => b[1].rm - a[1].rm);
  }, [data.workouts]);

  const [exName, setExName] = useState("");
  const selEx = exName || prs[0]?.[0] || "";
  const exSeries = useMemo(() => {
    if (!selEx) return [];
    return [...data.workouts]
      .sort((a, b) => a.day.localeCompare(b.day))
      .flatMap((w) => {
        const e = w.exercises.find((x) => x.name === selEx);
        if (!e) return [];
        const best = Math.max(0, ...e.sets.map((s) => oneRM(s.kg, s.reps)));
        return best ? [{ x: shortDay(w.day), y: Math.round(best * 10) / 10 }] : [];
      });
  }, [data.workouts, selEx]);

  const b = bmi(last?.kg ?? profile.weight, profile.height);
  const startKg = first?.kg ?? profile.weight, curKg = last?.kg ?? profile.weight;
  const goalDelta = startKg - profile.targetWeight;
  const goalPct = goalDelta ? Math.min(Math.max((startKg - curKg) / goalDelta, 0), 1) : 1;

  return (
    <div className="p-4">
      <h1 className="mb-3 text-2xl font-extrabold">Gelişim</h1>

      <div className="card grid grid-cols-3 gap-2">
        <Stat label="🔥 Seri" value={`${st} gün`} sub="ardışık kayıt" />
        <Stat label="VKİ" value={b.toFixed(1)} sub={bmiLabel(b)} />
        <Stat label="Ort. kalori (7g)" value={avgKcal ? r0(avgKcal) : "—"} sub={`hedef ${profile.kcal}`} />
      </div>

      {/* Kilo */}
      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <b>⚖️ Kilo</b>
          <div className="flex gap-1 text-xs">
            {[
              [30, "30g"],
              [90, "90g"],
              [0, "Tümü"],
            ].map(([v, l]) => (
              <button key={v} className={`chip py-0.5 ${range === v ? "chip-on" : ""}`} onClick={() => setRange(v as number)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-3 grid grid-cols-3 text-center">
          <Stat label="Başlangıç" value={startKg} />
          <Stat label="Güncel" value={curKg} sub={first && last && first !== last ? `${curKg - startKg > 0 ? "+" : ""}${(curKg - startKg).toFixed(1)} kg` : undefined} />
          <Stat label="Hedef" value={profile.targetWeight} sub={Math.abs(goalDelta) >= 0.5 ? `${Math.abs(curKg - profile.targetWeight).toFixed(1)} kg kaldı` : "Profilden belirle"} />
        </div>
        {Math.abs(goalDelta) >= 0.5 && (
          <div className="mb-3">
            <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
              <div className="h-full rounded-full bg-g" style={{ width: `${goalPct * 100}%` }} />
            </div>
            <div className="mt-1 text-right text-xs text-neutral-500">Hedefin %{r0(goalPct * 100)}’i tamamlandı</div>
          </div>
        )}
        <LineChart points={shown.map((w) => ({ x: shortDay(w.day), y: w.kg }))} avg={shown.length > 6 ? avg : undefined} target={profile.targetWeight} unit=" kg" />
        <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
          <input className="inp" inputMode="decimal" placeholder="Kilo (kg)" value={kg} onChange={(e) => setKg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <input className="inp" type="date" value={day} max={today()} onChange={(e) => setDay(e.target.value || today())} />
          <button className="pri" onClick={add}>
            Kaydet
          </button>
        </div>
        {err && <p className="mt-2 text-sm text-o">{err}</p>}
        {weights.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-neutral-400">Tüm kayıtlar ({weights.length})</summary>
            {[...weights].reverse().map((w, i, arr) => {
              const prev = arr[i + 1];
              const d = prev ? w.kg - prev.kg : 0;
              return (
                <div key={w.day} className="flex justify-between border-b border-neutral-800 py-2">
                  <span>{shortDay(w.day)} {w.day.slice(0, 4)}</span>
                  <span>
                    {prev && <span className={`mr-2 text-xs ${d > 0 ? "text-o" : d < 0 ? "text-g" : "text-neutral-500"}`}>{d > 0 ? "▲" : d < 0 ? "▼" : "="} {Math.abs(d).toFixed(1)}</span>}
                    <b>{w.kg} kg</b>
                    <button className="ml-3 text-neutral-500" onClick={() => update((x) => ({ weights: x.weights.filter((y) => y.day !== w.day) }))} aria-label="Sil">
                      ✕
                    </button>
                  </span>
                </div>
              );
            })}
          </details>
        )}
      </div>

      {/* Kalori geçmişi */}
      <div className="card">
        <b>🍽️ Son 7 gün kalori</b>
        <BarChart bars={last7.map((d) => ({ x: weekday(d), y: r0(kcalByDay[d] ?? 0) }))} target={profile.kcal} />
        <p className="text-xs text-neutral-500">Kesikli çizgi günlük hedefin; turuncu sütunlar hedefi aşan günler.</p>
      </div>

      {/* Antrenman sıklığı */}
      <div className="card">
        <b>🏋️ Haftalık antrenman</b>
        <BarChart bars={weeks} color="#38bdf8" />
      </div>

      {/* Kuvvet gelişimi */}
      <div className="card">
        <div className="mb-2 flex items-center justify-between gap-2">
          <b>💪 Kuvvet gelişimi</b>
          {prs.length > 0 && (
            <select className="inp w-auto py-1 text-sm" value={selEx} onChange={(e) => setExName(e.target.value)}>
              {prs.map(([n]) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          )}
        </div>
        {prs.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-500">Ağırlıklı antrenman kaydettikçe tahmini 1RM gelişimin burada görünür.</p>
        ) : (
          <>
            <LineChart points={exSeries} color="#e8c547" />
            <div className="mt-3 text-xs text-neutral-400">🏆 Kişisel rekorlar</div>
            {prs.slice(0, 8).map(([n, p]) => (
              <div key={n} className="flex justify-between border-b border-neutral-800 py-2 text-sm">
                <span>{n}</span>
                <span>
                  <b>
                    {p.kg} kg × {p.reps}
                  </b>{" "}
                  <span className="text-xs text-neutral-500">≈1RM {r0(p.rm)}</span>
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
