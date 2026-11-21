"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { today } from "@/lib/calc";
export default function Weights({ target }: { target: number }) {
  const [w, setW] = useState<any[]>([]), [kg, setKg] = useState(""), [day, setDay] = useState(today()), [err, setErr] = useState("");
  const load = async () => { const { data, error } = await supabase.from("weights").select("*").order("day"); setErr(error?.message ?? ""); setW(data ?? []); };
  useEffect(() => { load(); }, []);
  async function add() { const v = parseFloat(kg); if (!(v > 20 && v < 400)) return setErr("Geçerli bir kilo gir"); const { error } = await supabase.from("weights").upsert({ day, kg: v }, { onConflict: "user_id,day" }); setErr(error?.message ?? ""); setKg(""); load(); }
  const first = w[0], last = w[w.length - 1], vs = w.map((x) => +x.kg), mn = Math.min(...vs) - 1, mx = Math.max(...vs) + 1;
  const pts = w.length > 1 ? w.map((x, i) => `${10 + (300 * i) / (w.length - 1)},${10 + 110 * (1 - (x.kg - mn) / (mx - mn))}`).join(" ") : "";
  return (
    <div className="p-4">
      <div className="card grid grid-cols-2 gap-2"><input className="inp" type="number" step="0.1" placeholder="Kilo (kg)" value={kg} onChange={(e) => setKg(e.target.value)} /><input className="inp" type="date" value={day} onChange={(e) => setDay(e.target.value)} /><button className="pri col-span-2" onClick={add}>Kaydet</button>{err && <p className="col-span-2 text-sm text-o">{err}</p>}</div>
      <div className="card grid grid-cols-3 text-center"><div><div className="text-xs text-neutral-400">Başlangıç</div><b>{first?.kg ?? "—"}</b></div><div><div className="text-xs text-neutral-400">Güncel</div><b>{last?.kg ?? "—"}</b></div><div><div className="text-xs text-neutral-400">Hedefe kalan</div><b>{last ? (last.kg - target).toFixed(1) : "—"}</b></div></div>
      <div className="card">{pts ? <svg viewBox="0 0 320 130" width="100%"><polyline fill="none" stroke="#34d27b" strokeWidth="2.5" points={pts} /></svg> : <p className="text-center text-sm text-neutral-500">Grafik için en az 2 kayıt gerekli</p>}</div>
      <div className="card">{[...w].reverse().slice(0, 10).map((x) => (<div key={x.day} className="flex justify-between border-b border-neutral-800 py-2"><span>{x.day}</span><b>{x.kg} kg <button className="ml-2 text-neutral-500" onClick={async () => { await supabase.from("weights").delete().eq("day", x.day); load(); }}>✕</button></b></div>))}{w.length === 0 && <p className="text-sm text-neutral-500">Henüz kayıt yok</p>}</div>
    </div>
  );
}
