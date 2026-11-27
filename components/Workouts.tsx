"use client";
import { useEffect, useMemo, useState } from "react";
import { Data, Profile, WExercise, Workout, update, uid } from "@/lib/store";
import { EXERCISES, ExerciseDef, GROUPS, STRENGTH_MET, metKcal, oneRM, volume } from "@/lib/exercises";
import { addDays, prettyDay, today } from "@/lib/calc";
import { Empty, Sheet } from "./ui";

const r0 = Math.round;

/** Bir hareketin geçmişteki en iyi tahmini 1RM değeri (verilen antrenman hariç) */
function bestBefore(workouts: Workout[], name: string, excludeId?: string, beforeDay?: string) {
  let best = 0;
  for (const w of workouts) {
    if (w.id === excludeId || (beforeDay && w.day > beforeDay)) continue;
    for (const e of w.exercises) if (e.name === name) for (const s of e.sets) best = Math.max(best, oneRM(s.kg, s.reps));
  }
  return best;
}

/** Bir hareketin en son yapıldığı antrenmandaki setleri */
function lastSets(workouts: Workout[], name: string, excludeId?: string) {
  const sorted = [...workouts].filter((w) => w.id !== excludeId).sort((a, b) => b.day.localeCompare(a.day) || b.ts - a.ts);
  for (const w of sorted) {
    const e = w.exercises.find((x) => x.name === name);
    if (e) return e;
  }
  return null;
}

function computeKcal(w: Workout, kg: number) {
  const cardio = w.exercises.filter((e) => e.kind === "cardio");
  const cardioMin = cardio.reduce((s, e) => s + (e.minutes || 0), 0);
  const cardioKcal = cardio.reduce((s, e) => s + (e.kcal || 0), 0);
  const hasStrength = w.exercises.some((e) => e.kind === "strength" && e.sets.some((s) => s.reps > 0));
  return r0(cardioKcal + (hasStrength ? metKcal(STRENGTH_MET, kg, Math.max(w.minutes - cardioMin, 0)) : 0));
}

export default function Workouts({ data, profile, day }: { data: Data; profile: Profile; day: string }) {
  const [editing, setEditing] = useState<Workout | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const draft = data.draft;

  const sorted = useMemo(() => [...data.workouts].sort((a, b) => b.day.localeCompare(a.day) || b.ts - a.ts), [data.workouts]);
  // Şablonlar: farklı isimli son antrenmanlar
  const templates = useMemo(() => {
    const m = new Map<string, Workout>();
    for (const w of sorted) if (!m.has(w.name)) m.set(w.name, w);
    return [...m.values()].slice(0, 6);
  }, [sorted]);

  const thisWeek = data.workouts.filter((w) => w.day > addDays(today(), -7) && w.day <= today());

  const start = (from?: Workout) => {
    const w: Workout = {
      id: uid(),
      day,
      name: from?.name ?? "Antrenman",
      minutes: from?.minutes ?? 45,
      exercises: (from?.exercises ?? []).map((e) => ({ ...e, id: uid(), sets: e.sets.map((s) => ({ ...s, done: false })) })),
      kcal: 0,
      ts: Date.now(),
    };
    update(() => ({ draft: w }));
    setEditing(w);
  };

  const remove = (id: string) => {
    if (confirm("Bu antrenman silinsin mi?")) update((d) => ({ workouts: d.workouts.filter((w) => w.id !== id) }));
  };

  return (
    <div className="p-4">
      <h1 className="mb-3 text-2xl font-extrabold">Antrenman</h1>

      {draft && !editing && (
        <button className="card mb-3 flex w-full items-center justify-between border-g/60 text-left" onClick={() => setEditing(draft)}>
          <div>
            <b>⏳ Devam eden antrenman</b>
            <div className="text-xs text-neutral-400">
              {draft.name} · {draft.exercises.length} hareket
            </div>
          </div>
          <span className="text-g">Devam ›</span>
        </button>
      )}

      <div className="card grid grid-cols-3 text-center">
        <div>
          <div className="text-xs text-neutral-400">Son 7 gün</div>
          <b className="text-lg">{thisWeek.length}</b>
          <div className="text-xs text-neutral-500">antrenman</div>
        </div>
        <div>
          <div className="text-xs text-neutral-400">Süre</div>
          <b className="text-lg">{thisWeek.reduce((s, w) => s + w.minutes, 0)}</b>
          <div className="text-xs text-neutral-500">dakika</div>
        </div>
        <div>
          <div className="text-xs text-neutral-400">Yakılan</div>
          <b className="text-lg">{r0(thisWeek.reduce((s, w) => s + w.kcal, 0))}</b>
          <div className="text-xs text-neutral-500">kcal</div>
        </div>
      </div>

      <button className="pri mb-3 w-full py-3 text-lg" onClick={() => (draft ? setEditing(draft) : start())}>
        {draft ? "Devam eden antrenmanı aç" : `+ Yeni antrenman (${prettyDay(day)})`}
      </button>

      {templates.length > 0 && !draft && (
        <div className="mb-3">
          <div className="mb-2 text-xs text-neutral-400">Tekrarla</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {templates.map((t) => (
              <button key={t.id} className="card mb-0 min-w-[140px] text-left" onClick={() => start(t)}>
                <b className="block truncate">{t.name}</b>
                <span className="text-xs text-neutral-400">{t.exercises.length} hareket</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-2 text-xs text-neutral-400">Geçmiş</div>
      {sorted.length === 0 && <Empty icon="🏋️" text="Henüz antrenman kaydı yok. İlk antrenmanını başlat!" />}
      {sorted.map((w) => {
        const earlier = data.workouts.filter((x) => x.day < w.day || (x.day === w.day && x.ts < w.ts));
        const prs = w.exercises.filter((e) => {
          if (e.kind !== "strength") return false;
          const prev = bestBefore(earlier, e.name);
          return prev > 0 && Math.max(0, ...e.sets.map((s) => oneRM(s.kg, s.reps))) > prev;
        });
        const vol = w.exercises.reduce((s, e) => s + volume(e.sets), 0);
        return (
          <div key={w.id} className="card">
            <button className="flex w-full items-start justify-between text-left" onClick={() => setOpenId(openId === w.id ? null : w.id)}>
              <div>
                <b>{w.name}</b>
                <div className="text-xs text-neutral-400">
                  {prettyDay(w.day)} · {w.minutes} dk · {w.exercises.length} hareket{vol ? ` · ${r0(vol).toLocaleString("tr")} kg hacim` : ""}
                </div>
                {prs.length > 0 && <div className="mt-1 text-xs text-yellow-400">🏆 {prs.length} kişisel rekor</div>}
              </div>
              <b className="text-g">{r0(w.kcal)} kcal</b>
            </button>
            {openId === w.id && (
              <div className="mt-2 border-t border-neutral-800 pt-2 text-sm">
                {w.exercises.map((e) => (
                  <div key={e.id} className="py-1">
                    <span className="font-semibold">{e.name}</span>{" "}
                    <span className="text-neutral-400">
                      {e.kind === "cardio"
                        ? `${e.minutes || 0} dk${e.distance ? ` · ${e.distance} km` : ""} · ${e.kcal || 0} kcal`
                        : e.sets
                            .filter((s) => s.reps > 0)
                            .map((s) => (s.kg ? `${s.kg}×${s.reps}` : `${s.reps}`))
                            .join(", ")}
                    </span>
                    {prs.includes(e) && <span className="ml-1">🏆</span>}
                  </div>
                ))}
                {w.note && <p className="mt-1 text-neutral-400">📝 {w.note}</p>}
                <div className="mt-2 flex gap-2">
                  <button className="btn flex-1" onClick={() => setEditing(w)}>
                    Düzenle
                  </button>
                  <button className="btn flex-1" onClick={() => start(w)} disabled={!!draft}>
                    Tekrarla
                  </button>
                  <button className="btn text-o" onClick={() => remove(w.id)}>
                    Sil
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {editing && <Editor data={data} profile={profile} initial={editing} isDraft={draft?.id === editing.id} onClose={() => setEditing(null)} />}
    </div>
  );
}

function Editor({ data, profile, initial, isDraft, onClose }: { data: Data; profile: Profile; initial: Workout; isDraft: boolean; onClose: () => void }) {
  const [w, setW] = useState<Workout>(initial);
  const [picker, setPicker] = useState(false);
  const [rest, setRest] = useState<number | null>(null); // dinlenme bitiş zamanı
  const [now, setNow] = useState(Date.now());

  // Taslağı her değişiklikte sakla
  useEffect(() => {
    if (isDraft) update(() => ({ draft: w }));
  }, [w, isDraft]);

  useEffect(() => {
    if (rest == null) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [rest]);
  const restLeft = rest ? Math.max(0, Math.ceil((rest - now) / 1000)) : 0;
  useEffect(() => {
    if (rest && restLeft === 0) {
      setRest(null);
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {}
    }
  }, [restLeft, rest]);

  const setEx = (id: string, fn: (e: WExercise) => WExercise) => setW((x) => ({ ...x, exercises: x.exercises.map((e) => (e.id === id ? fn(e) : e)) }));

  const addExercise = (def: ExerciseDef) => {
    const prev = lastSets(data.workouts, def.name, w.id);
    const ex: WExercise =
      def.kind === "cardio"
        ? { id: uid(), name: def.name, kind: "cardio", sets: [], minutes: prev?.minutes ?? 20, distance: prev?.distance, kcal: metKcal(def.met ?? 6, profile.weight, prev?.minutes ?? 20) }
        : { id: uid(), name: def.name, kind: "strength", sets: prev?.sets.length ? prev.sets.map((s) => ({ reps: s.reps, kg: s.kg, done: false })) : [{ reps: 10, kg: 0 }, { reps: 10, kg: 0 }, { reps: 10, kg: 0 }] };
    setW((x) => ({ ...x, exercises: [...x.exercises, ex] }));
    setPicker(false);
  };

  const metOf = (name: string) => [...EXERCISES, ...data.customExercises].find((e) => e.name === name)?.met ?? 6;

  const save = () => {
    const clean: Workout = {
      ...w,
      name: w.name.trim() || "Antrenman",
      minutes: Math.max(1, w.minutes || 0),
      exercises: w.exercises.map((e) => (e.kind === "strength" ? { ...e, sets: e.sets.filter((s) => s.reps > 0) } : e)).filter((e) => e.kind === "cardio" || e.sets.length > 0),
    };
    if (clean.exercises.length === 0) return alert("En az bir hareket ve set ekle");
    clean.kcal = computeKcal(clean, profile.weight);
    update((d) => ({
      workouts: d.workouts.some((x) => x.id === clean.id) ? d.workouts.map((x) => (x.id === clean.id ? clean : x)) : [...d.workouts, clean],
      draft: isDraft ? null : d.draft,
    }));
    onClose();
  };

  const discard = () => {
    if (isDraft && !confirm("Antrenman kaydedilmeden silinsin mi?")) return;
    if (isDraft) update(() => ({ draft: null }));
    onClose();
  };

  return (
    <Sheet title={isDraft ? "Antrenman" : "Antrenmanı düzenle"} onClose={onClose}>
      {rest != null && (
        <div className="sticky top-0 z-10 mb-2 flex items-center justify-between rounded-xl bg-sky-500/20 px-3 py-2 text-sky-300">
          <span>
            ⏱ Dinlenme: <b className="text-lg">{Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, "0")}</b>
          </span>
          <span className="flex gap-2">
            <button className="btn py-1" onClick={() => setRest((r) => (r ?? Date.now()) + 15000)}>
              +15
            </button>
            <button className="btn py-1" onClick={() => setRest(null)}>
              Atla
            </button>
          </span>
        </div>
      )}
      <div className="mb-3 grid grid-cols-[1fr_auto_auto] gap-2">
        <input className="inp" value={w.name} onChange={(e) => setW({ ...w, name: e.target.value })} placeholder="Ad (ör. İtme günü)" />
        <input className="inp w-36" type="date" value={w.day} max={today()} onChange={(e) => setW({ ...w, day: e.target.value || w.day })} />
        <label className="flex items-center gap-1 text-xs text-neutral-400">
          <input className="inp w-16" type="number" inputMode="numeric" min="1" value={w.minutes || ""} onChange={(e) => setW({ ...w, minutes: +e.target.value })} />
          dk
        </label>
      </div>

      {w.exercises.length === 0 && <Empty icon="➕" text="Hareket ekleyerek başla" />}

      {w.exercises.map((e) => {
        const prev = lastSets(data.workouts, e.name, w.id);
        const best = bestBefore(data.workouts, e.name, w.id);
        return (
          <div key={e.id} className="card">
            <div className="mb-2 flex items-center justify-between">
              <b>{e.name}</b>
              <button className="text-sm text-neutral-500" onClick={() => setW({ ...w, exercises: w.exercises.filter((x) => x.id !== e.id) })}>
                Kaldır
              </button>
            </div>
            {e.kind === "cardio" ? (
              <div className="grid grid-cols-3 gap-2 text-xs text-neutral-400">
                <label>
                  Süre (dk)
                  <input className="inp mt-1" type="number" inputMode="numeric" min="0" value={e.minutes || ""} onChange={(ev) => setEx(e.id, (x) => ({ ...x, minutes: +ev.target.value, kcal: metKcal(metOf(x.name), profile.weight, +ev.target.value) }))} />
                </label>
                <label>
                  Mesafe (km)
                  <input className="inp mt-1" type="number" inputMode="decimal" min="0" step="any" value={e.distance || ""} onChange={(ev) => setEx(e.id, (x) => ({ ...x, distance: +ev.target.value }))} />
                </label>
                <label>
                  Kalori
                  <input className="inp mt-1" type="number" inputMode="numeric" min="0" value={e.kcal || ""} onChange={(ev) => setEx(e.id, (x) => ({ ...x, kcal: +ev.target.value }))} />
                </label>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] items-center gap-2 text-center text-xs text-neutral-500">
                  <span>Set</span>
                  <span>Önceki</span>
                  <span>kg</span>
                  <span>Tekrar</span>
                  <span>✓</span>
                </div>
                {e.sets.map((s, i) => {
                  const p = prev?.sets[i];
                  const isPR = s.done && best > 0 && oneRM(s.kg, s.reps) > best;
                  return (
                    <div key={i} className={`mt-1 grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] items-center gap-2 rounded-lg text-center ${s.done ? "bg-g/10" : ""}`}>
                      <button className="text-sm text-neutral-400" onClick={() => setEx(e.id, (x) => ({ ...x, sets: x.sets.filter((_, j) => j !== i) }))} title="Seti sil">
                        {isPR ? "🏆" : i + 1}
                      </button>
                      <span className="text-xs text-neutral-500">{p ? `${p.kg}×${p.reps}` : "—"}</span>
                      <input className="inp p-1.5 text-center" type="number" inputMode="decimal" min="0" step="any" value={s.kg || ""} placeholder="0" onChange={(ev) => setEx(e.id, (x) => ({ ...x, sets: x.sets.map((y, j) => (j === i ? { ...y, kg: +ev.target.value } : y)) }))} />
                      <input className="inp p-1.5 text-center" type="number" inputMode="numeric" min="0" value={s.reps || ""} placeholder="0" onChange={(ev) => setEx(e.id, (x) => ({ ...x, sets: x.sets.map((y, j) => (j === i ? { ...y, reps: +ev.target.value } : y)) }))} />
                      <button
                        className={`mx-auto grid h-8 w-8 place-items-center rounded-lg ${s.done ? "bg-g text-black" : "bg-neutral-800 text-neutral-500"}`}
                        onClick={() => {
                          setEx(e.id, (x) => ({ ...x, sets: x.sets.map((y, j) => (j === i ? { ...y, done: !y.done } : y)) }));
                          if (!s.done) setRest(Date.now() + 90000);
                        }}
                        aria-label="Seti tamamla"
                      >
                        ✓
                      </button>
                    </div>
                  );
                })}
                <button className="btn mt-2 w-full text-sm" onClick={() => setEx(e.id, (x) => ({ ...x, sets: [...x.sets, { ...(x.sets[x.sets.length - 1] ?? { reps: 10, kg: 0 }), done: false }] }))}>
                  + Set ekle
                </button>
                {best > 0 && <div className="mt-1 text-right text-[11px] text-neutral-500">En iyi tahmini 1RM: {r0(best)} kg</div>}
              </>
            )}
          </div>
        );
      })}

      <button className="btn mb-3 w-full border-dashed py-3" onClick={() => setPicker(true)}>
        + Hareket ekle
      </button>
      <textarea className="inp mb-3 min-h-[50px]" placeholder="Not (isteğe bağlı)" value={w.note ?? ""} onChange={(e) => setW({ ...w, note: e.target.value })} />
      <div className="flex gap-2">
        <button className="btn flex-1 text-o" onClick={discard}>
          {isDraft ? "Vazgeç" : "Kapat"}
        </button>
        <button className="pri flex-[2] py-3" onClick={save}>
          {isDraft ? "Antrenmanı bitir" : "Kaydet"}
        </button>
      </div>

      {picker && <ExercisePicker data={data} onPick={addExercise} onClose={() => setPicker(false)} />}
    </Sheet>
  );
}

function ExercisePicker({ data, onPick, onClose }: { data: Data; onPick: (e: ExerciseDef) => void; onClose: () => void }) {
  const [q, setQ] = useState(""), [g, setG] = useState<string>("");
  const all = [...data.customExercises, ...EXERCISES];
  const usage = useMemo(() => {
    const m = new Map<string, number>();
    data.workouts.forEach((w) => w.exercises.forEach((e) => m.set(e.name, (m.get(e.name) ?? 0) + 1)));
    return m;
  }, [data.workouts]);
  const s = q.trim().toLocaleLowerCase("tr");
  const list = all.filter((e) => (!g || e.group === g) && (!s || e.name.toLocaleLowerCase("tr").includes(s))).sort((a, b) => (usage.get(b.name) ?? 0) - (usage.get(a.name) ?? 0));
  const createCustom = () => {
    const name = q.trim();
    if (!name) return;
    const def: ExerciseDef = g === "Kardiyo" ? { name, group: g, kind: "cardio", met: 6 } : { name, group: g || "Diğer", kind: "strength" };
    update((d) => ({ customExercises: [def, ...d.customExercises] }));
    onPick(def);
  };
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-neutral-950 p-4">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden">
        <div className="mb-3 flex items-center gap-2">
          <button className="btn" onClick={onClose}>
            ‹
          </button>
          <input className="inp" autoFocus placeholder="🔍 Hareket ara" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {["", ...GROUPS].map((x) => (
            <button key={x} className={`chip whitespace-nowrap ${g === x ? "chip-on" : ""}`} onClick={() => setG(x)}>
              {x || "Tümü"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {list.map((e) => (
            <button key={e.name} className="flex w-full items-center justify-between border-t border-neutral-800 py-3 text-left" onClick={() => onPick(e)}>
              <span>{e.name}</span>
              <span className="text-xs text-neutral-500">
                {e.group}
                {usage.get(e.name) ? ` · ${usage.get(e.name)}×` : ""}
              </span>
            </button>
          ))}
          {q.trim() && !all.some((e) => e.name.toLocaleLowerCase("tr") === s) && (
            <button className="btn mt-3 w-full" onClick={createCustom}>
              + “{q.trim()}” hareketini oluştur{g ? ` (${g})` : ""}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
