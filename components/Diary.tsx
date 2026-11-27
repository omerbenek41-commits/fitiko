"use client";
import { useMemo, useState } from "react";
import { Data, Entry, Profile, setDaily, update, uid } from "@/lib/store";
import { MEALS, MEAL_ICONS, guessMeal } from "@/lib/foods";
import { addDays, prettyDay, today, weekday } from "@/lib/calc";
import { Bar, Ring } from "./ui";
import AddFood from "./AddFood";

const r0 = Math.round;

export default function Diary({ data, profile, day, setDay, goWorkout }: { data: Data; profile: Profile; day: string; setDay: (d: string) => void; goWorkout: () => void }) {
  const [sheet, setSheet] = useState<{ meal: string; edit?: Entry } | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => data.entries.filter((e) => e.day === day).sort((a, b) => a.ts - b.ts), [data.entries, day]);
  const workouts = data.workouts.filter((w) => w.day === day);
  const burned = workouts.reduce((s, w) => s + (w.kcal || 0), 0);
  const daily = data.daily[day] ?? {};
  const t = rows.reduce((a, r) => ({ k: a.k + r.kcal, p: a.p + r.protein, c: a.c + r.carb, f: a.f + r.fat }), { k: 0, p: 0, c: 0, f: 0 });
  const remaining = profile.kcal - t.k + burned;
  const loggedDays = useMemo(() => new Set([...data.entries.map((e) => e.day), ...data.workouts.map((w) => w.day)]), [data.entries, data.workouts]);

  // Hafta şeridi: seçili günü içeren 7 gün (Pazartesi başlangıçlı)
  const dow = (new Date(day + "T12:00").getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => addDays(day, i - dow));

  const remove = (id: string) => update((d) => ({ entries: d.entries.filter((e) => e.id !== id) }));
  const copyMeal = (meal: string, from: string) => {
    const src = data.entries.filter((e) => e.day === from && e.meal === meal);
    const now = Date.now();
    update((d) => ({ entries: [...d.entries, ...src.map((e, i) => ({ ...e, id: uid(), day, ts: now + i }))] }));
  };
  const water = daily.water ?? 0;

  return (
    <div className="p-4">
      {/* Tarih gezintisi */}
      <div className="mb-3 flex items-center justify-between">
        <button className="btn" onClick={() => setDay(addDays(day, -1))} aria-label="Önceki gün">
          ‹
        </button>
        <button className="font-bold" onClick={() => setDay(today())}>
          {prettyDay(day)}
        </button>
        <button className="btn" onClick={() => setDay(addDays(day, 1))} aria-label="Sonraki gün">
          ›
        </button>
      </div>
      <div className="mb-3 grid grid-cols-7 gap-1">
        {week.map((d) => (
          <button key={d} onClick={() => setDay(d)} className={`rounded-xl py-1.5 text-center text-xs ${d === day ? "bg-g font-bold text-black" : d === today() ? "border border-g/50 text-neutral-200" : "text-neutral-400"}`}>
            {weekday(d)}
            <div className="text-sm">{+d.slice(8)}</div>
            <div className={`mx-auto mt-0.5 h-1 w-1 rounded-full ${loggedDays.has(d) ? (d === day ? "bg-black" : "bg-g") : "bg-transparent"}`} />
          </button>
        ))}
      </div>

      {/* Kalori özeti */}
      <div className="card">
        <div className="flex items-center gap-4">
          <Ring v={remaining} max={profile.kcal} size={140} stroke={12} color={remaining < 0 ? "#ff8a3d" : "#34d27b"}>
            <div className={`text-3xl font-extrabold ${remaining < 0 ? "text-o" : ""}`}>{r0(Math.abs(remaining))}</div>
            <div className="text-xs text-neutral-400">{remaining < 0 ? "kcal fazla" : "kcal kaldı"}</div>
          </Ring>
          <div className="flex-1 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">🎯 Hedef</span>
              <b>{r0(profile.kcal)}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">🍽️ Yenen</span>
              <b>−{r0(t.k)}</b>
            </div>
            <button className="flex w-full justify-between" onClick={goWorkout}>
              <span className="text-neutral-400">🔥 Egzersiz</span>
              <b className="text-g">+{r0(burned)}</b>
            </button>
            <div className="flex justify-between border-t border-neutral-800 pt-2">
              <span className="text-neutral-400">Kalan</span>
              <b className={remaining < 0 ? "text-o" : "text-g"}>{r0(remaining)}</b>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          {(
            [
              ["Protein", t.p, profile.protein, "#34d27b"],
              ["Karbonhidrat", t.c, profile.carb, "#ff8a3d"],
              ["Yağ", t.f, profile.fat, "#e8c547"],
            ] as const
          ).map(([l, v, m, c]) => (
            <div key={l}>
              <div className="mb-1 flex justify-between text-neutral-400">
                <span>{l}</span>
              </div>
              <Bar v={v} max={m} color={c} />
              <div className="mt-1 text-neutral-300">
                <b>{r0(v)}</b>/{r0(m)} g
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Öğünler */}
      {MEALS.map((m) => {
        const es = rows.filter((r) => r.meal === m);
        const kcal = es.reduce((s, r) => s + r.kcal, 0);
        const yesterday = addDays(day, -1);
        const canCopy = es.length === 0 && data.entries.some((e) => e.day === yesterday && e.meal === m);
        const collapsed = es.length > 4 && !open[m];
        return (
          <div className="card" key={m}>
            <div className="flex items-center justify-between">
              <div>
                <b>
                  {MEAL_ICONS[m]} {m}
                </b>
                <div className="text-xs text-neutral-400">{es.length ? `${r0(kcal)} kcal · P ${r0(es.reduce((s, r) => s + r.protein, 0))} g` : "Henüz eklenmedi"}</div>
              </div>
              <button className="pri grid h-9 w-9 place-items-center p-0 text-xl" onClick={() => setSheet({ meal: m })} aria-label={`${m} ekle`}>
                +
              </button>
            </div>
            {(collapsed ? es.slice(0, 3) : es).map((r) => (
              <div key={r.id} className="mt-2 flex items-center justify-between border-t border-neutral-800 pt-2">
                <button className="min-w-0 flex-1 text-left" onClick={() => setSheet({ meal: m, edit: r })}>
                  <div className="truncate">{r.name}</div>
                  <div className="text-xs text-neutral-500">
                    {r.amount} {r.unit} · P {r0(r.protein)} K {r0(r.carb)} Y {r0(r.fat)}
                  </div>
                </button>
                <b className="ml-2">{r0(r.kcal)}</b>
                <button className="ml-3 px-1 text-neutral-500" onClick={() => remove(r.id)} aria-label="Sil">
                  ✕
                </button>
              </div>
            ))}
            {collapsed && (
              <button className="mt-2 w-full text-xs text-neutral-400" onClick={() => setOpen({ ...open, [m]: true })}>
                +{es.length - 3} öğe daha göster
              </button>
            )}
            {canCopy && (
              <button className="mt-2 w-full rounded-xl border border-dashed border-neutral-700 py-2 text-xs text-neutral-400" onClick={() => copyMeal(m, yesterday)}>
                ↻ Dünkü {m.toLocaleLowerCase("tr")} öğününü kopyala
              </button>
            )}
          </div>
        );
      })}

      {/* Antrenman özeti */}
      <div className="card">
        <div className="flex items-center justify-between">
          <b>🏋️ Antrenman</b>
          <button className="text-sm text-g" onClick={goWorkout}>
            {workouts.length ? "Görüntüle ›" : "+ Kaydet"}
          </button>
        </div>
        {workouts.length === 0 ? (
          <p className="pt-1 text-xs text-neutral-500">Bu gün için antrenman yok</p>
        ) : (
          workouts.map((w) => (
            <div key={w.id} className="mt-2 flex justify-between border-t border-neutral-800 pt-2 text-sm">
              <span>
                {w.name} <span className="text-neutral-500">· {w.exercises.length} hareket · {w.minutes} dk</span>
              </span>
              <b className="text-g">{r0(w.kcal)} kcal</b>
            </div>
          ))
        )}
      </div>

      {/* Su */}
      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <b>💧 Su</b>
          <span className="text-sm text-neutral-400">
            <b className="text-white">{(water / 1000).toLocaleString("tr", { maximumFractionDigits: 2 })}</b> / {(profile.waterGoal / 1000).toLocaleString("tr")} L
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: Math.max(Math.ceil(profile.waterGoal / 250), Math.ceil(water / 250)) }, (_, i) => (
            <button key={i} onClick={() => setDaily(day, { water: (i + 1) * 250 === water ? i * 250 : (i + 1) * 250 })} className={`h-10 w-8 rounded-b-lg rounded-t-sm border-2 text-xs transition ${i < water / 250 ? "border-sky-400 bg-sky-400/70" : "border-neutral-700"}`} aria-label={`${(i + 1) * 250} ml`} />
          ))}
          <button className="btn ml-auto" onClick={() => setDaily(day, { water: water + 250 })}>
            +250
          </button>
        </div>
      </div>

      {/* Adım ve not */}
      <div className="card">
        <label className="block text-xs text-neutral-400">
          👟 Adım{" "}
          <span className="float-right">
            {(daily.steps ?? 0).toLocaleString("tr")} / {profile.stepGoal.toLocaleString("tr")}
          </span>
          <input className="inp mt-1" type="number" inputMode="numeric" min="0" placeholder="0" value={daily.steps || ""} onChange={(e) => setDaily(day, { steps: Math.max(0, +e.target.value || 0) })} />
        </label>
        <div className="mt-2">
          <Bar v={daily.steps ?? 0} max={profile.stepGoal} color="#38bdf8" />
        </div>
        <label className="mt-3 block text-xs text-neutral-400">
          📝 Günün notu
          <textarea className="inp mt-1 min-h-[60px]" placeholder="Enerji, uyku, ruh hali…" value={daily.note ?? ""} onChange={(e) => setDaily(day, { note: e.target.value })} />
        </label>
      </div>

      {/* Hızlı ekleme düğmesi */}
      <button className="fixed bottom-24 right-[max(1rem,calc(50%-20rem))] z-10 grid h-14 w-14 place-items-center rounded-full bg-g text-3xl text-black shadow-lg shadow-black/50" onClick={() => setSheet({ meal: guessMeal() })} aria-label="Yiyecek ekle">
        +
      </button>

      {sheet && <AddFood data={data} day={day} meal={sheet.meal} edit={sheet.edit} onClose={() => setSheet(null)} />}
    </div>
  );
}
