"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FOODS, Food } from "@/lib/foods";
import { calc, today } from "@/lib/calc";
const MEALS = ["Kahvaltı", "Öğle yemeği", "Akşam yemeği", "Ara öğün"];
function Ring({ v, max, color, label, big }: { v: number; max: number; color: string; label: string; big?: boolean }) {
  const s = big ? 150 : 84, r = (s - 12) / 2, C = 2 * Math.PI * r, p = max ? Math.min(v / max, 1) : 0;
  return (<div className="relative grid place-items-center"><svg width={s} height={s} className="-rotate-90"><circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke="#262b29" strokeWidth={12} /><circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${C * p} ${C}`} /></svg><div className="absolute text-center leading-tight"><div className={big ? "text-3xl font-bold" : "font-bold"}>{Math.round(v)}</div><div className="text-xs text-neutral-400">{label}</div></div></div>);
}
function AddFood({ meal, day, onDone }: { meal: string; day: string; onDone: () => void }) {
  const [q, setQ] = useState(""), [mine, setMine] = useState<Food[]>([]), [f, setF] = useState<Food | null>(null), [amt, setAmt] = useState(100), [unit, setUnit] = useState("g"), [err, setErr] = useState("");
  useEffect(() => { supabase.from("foods").select("*").then(({ data }) => setMine((data ?? []).map((x: any) => ({ n: x.name, k: x.kcal, p: x.protein, c: x.carb, f: x.fat, a: x.unit_g, s: x.serving_g })))); }, []);
  const list = [...mine, ...FOODS].filter((x) => x.n.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr"))).slice(0, 25);
  const c = f ? calc(f, amt, unit) : null;
  async function save() {
    if (!f || !(amt > 0)) return setErr("Yiyecek seç ve geçerli miktar gir");
    const { error } = await supabase.from("entries").insert({ day, meal, name: f.n, amount: amt, unit, kcal: c!.k, protein: c!.p, carb: c!.c, fat: c!.f });
    if (error) setErr(error.message); else onDone();
  }
  async function saveCustom() {
    const name = prompt("Yiyecek adı"), v = ["Kalori", "Protein", "Karbonhidrat", "Yağ"].map((l) => parseFloat(prompt(l + " (100 g için)") || ""));
    if (!name || v.some((x) => !(x >= 0))) return setErr("Geçersiz değerler");
    const { error } = await supabase.from("foods").insert({ name, kcal: v[0], protein: v[1], carb: v[2], fat: v[3] });
    if (error) return setErr(error.message);
    setF({ n: name, k: v[0], p: v[1], c: v[2], f: v[3], a: 100, s: 100 });
  }
  return (
    <div className="fixed inset-0 z-20 flex items-end bg-black/70" onClick={onDone}>
      <div className="max-h-[90%] w-full overflow-auto rounded-t-3xl bg-neutral-900 p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 font-bold">{meal} · yiyecek ekle</div>
        <input className="inp mb-2" placeholder="Ara (örn. yumurta)" value={q} onChange={(e) => setQ(e.target.value)} />
        {list.map((x) => (<div key={x.n} onClick={() => { setF(x); setUnit("g"); setAmt(100); }} className="flex justify-between border-t border-neutral-800 py-2"><span>{x.n}</span><b>{x.k}</b></div>))}
        <button className="btn mt-2 w-full" onClick={saveCustom}>+ Kendi yiyeceğimi oluştur</button>
        {f && c && (<div className="card mt-3"><b>{f.n}</b>
          <div className="my-2 grid grid-cols-2 gap-2"><input className="inp" type="number" min="0" value={amt} onChange={(e) => setAmt(+e.target.value)} /><select className="inp" value={unit} onChange={(e) => setUnit(e.target.value)}>{["g", "ml", "adet", "porsiyon"].map((u) => <option key={u}>{u}</option>)}</select></div>
          <div className="text-center text-sm text-neutral-300">{Math.round(c.k)} kcal · P {Math.round(c.p)} · K {Math.round(c.c)} · Y {Math.round(c.f)}</div>
          <button className="pri mt-3 w-full" onClick={save}>Ekle</button></div>)}
        {err && <p className="mt-2 text-sm text-o">{err}</p>}
      </div>
    </div>
  );
}
export default function Dashboard({ profile }: { profile: any }) {
  const [day, setDay] = useState(today()), [rows, setRows] = useState<any[]>([]), [daily, setDaily] = useState<any>({}), [meal, setMeal] = useState<string | null>(null), [err, setErr] = useState(""), [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const [e, d] = await Promise.all([supabase.from("entries").select("*").eq("day", day).order("created_at"), supabase.from("daily").select("*").eq("day", day).maybeSingle()]);
    setErr(e.error?.message ?? ""); setRows(e.data ?? []); setDaily(d.data ?? {}); setLoading(false);
  }, [day]);
  useEffect(() => { load(); }, [load]);
  const t = rows.reduce((a, r) => ({ k: a.k + r.kcal, p: a.p + r.protein, c: a.c + r.carb, f: a.f + r.fat }), { k: 0, p: 0, c: 0, f: 0 });
  const upd = async (patch: any) => { const { error } = await supabase.from("daily").upsert({ day, ...daily, ...patch }, { onConflict: "user_id,day" }); if (error) setErr(error.message); else load(); };
  const shift = (n: number) => setDay(new Date(new Date(day + "T12:00").getTime() + n * 864e5).toISOString().slice(0, 10));
  if (loading) return <p className="p-6 text-neutral-400">Yükleniyor…</p>;
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between"><button className="btn" onClick={() => shift(-1)}>‹</button><b>{day === today() ? "Bugün" : day}</b><button className="btn" onClick={() => shift(1)}>›</button></div>
      {err && <p className="mb-2 text-sm text-o">{err}</p>}
      <div className="card flex items-center justify-between">
        <Ring big v={Math.max(profile.kcal - t.k + (daily.exercise_kcal ?? 0), 0)} max={profile.kcal} color={t.k > profile.kcal ? "#ff8a3d" : "#34d27b"} label="kalan kcal" />
        <div className="text-sm"><div className="text-neutral-400">Hedef</div><b>{Math.round(profile.kcal)} kcal</b><div className="mt-2 text-neutral-400">Alınan</div><b className="text-g">{Math.round(t.k)} kcal</b></div>
      </div>
      <div className="card grid grid-cols-3 gap-2 text-center text-xs text-neutral-400">
        <div><Ring v={t.p} max={profile.protein} color="#34d27b" label={`/${Math.round(profile.protein)} g`} />Protein</div>
        <div><Ring v={t.c} max={profile.carb} color="#ff8a3d" label={`/${Math.round(profile.carb)} g`} />Karbonhidrat</div>
        <div><Ring v={t.f} max={profile.fat} color="#e8c547" label={`/${Math.round(profile.fat)} g`} />Yağ</div>
      </div>
      {MEALS.map((m) => { const es = rows.filter((r) => r.meal === m); return (
        <div className="card" key={m}><div className="flex items-center justify-between"><b>{m} <span className="text-sm font-normal text-neutral-400">· {Math.round(es.reduce((s, r) => s + r.kcal, 0))} kcal</span></b><button className="pri" onClick={() => setMeal(m)}>+</button></div>
          {es.length === 0 && <p className="pt-2 text-sm text-neutral-500">Henüz yiyecek eklenmedi</p>}
          {es.map((r) => (<div key={r.id} className="mt-2 flex justify-between border-t border-neutral-800 pt-2"><div>{r.name}<div className="text-xs text-neutral-400">{r.amount} {r.unit} · P {Math.round(r.protein)}</div></div><div className="text-right"><b>{Math.round(r.kcal)}</b><button className="ml-3 text-neutral-500" onClick={async () => { await supabase.from("entries").delete().eq("id", r.id); load(); }}>✕</button></div></div>))}
        </div>); })}
      <div className="card flex items-center justify-between"><div>💧 <b>{daily.water_ml ?? 0}</b> / 2500 ml</div><div className="flex gap-2"><button className="btn" onClick={() => upd({ water_ml: Math.max((daily.water_ml ?? 0) - 250, 0) })}>−</button><button className="pri" onClick={() => upd({ water_ml: (daily.water_ml ?? 0) + 250 })}>+250</button></div></div>
      <div className="card grid grid-cols-2 gap-2">
        <label className="text-xs text-neutral-400">👟 Adım<input className="inp" type="number" min="0" defaultValue={daily.steps ?? ""} key={day + "s"} onBlur={(e) => upd({ steps: +e.target.value || 0 })} /></label>
        <label className="text-xs text-neutral-400">🏃 Egzersiz (kcal)<input className="inp" type="number" min="0" defaultValue={daily.exercise_kcal ?? ""} key={day + "e"} onBlur={(e) => upd({ exercise_kcal: +e.target.value || 0 })} /></label>
      </div>
      {meal && <AddFood meal={meal} day={day} onDone={() => { setMeal(null); load(); }} />}
    </div>
  );
}
