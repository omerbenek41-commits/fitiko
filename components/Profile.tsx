"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { targets } from "@/lib/calc";
export default function Profile({ user, profile, onSaved }: { user: any; profile: any; onSaved: (p: any) => void }) {
  const [p, setP] = useState<any>(profile ?? { age: 30, height: 175, weight: 75, target_weight: 70, sex: "e", activity: 1.375, goal: "ver", kcal: 2200, protein: 150, carb: 220, fat: 70 });
  const [err, setErr] = useState(""), set = (k: string, v: any) => setP({ ...p, [k]: v }), num = (k: string, l: string) => (<label className="text-xs text-neutral-400">{l}<input className="inp" type="number" step="any" value={p[k]} onChange={(e) => set(k, e.target.value === "" ? "" : +e.target.value)} /></label>);
  const hesapla = () => { const t = targets(p); setP({ ...p, kcal: Math.round(t.kcal), protein: Math.round(t.protein), carb: Math.round(t.carb), fat: Math.round(t.fat) }); };
  async function save() {
    if (["age", "height", "weight", "target_weight", "kcal", "protein", "carb", "fat"].some((k) => !(+p[k] > 0))) return setErr("Tüm sayısal alanlar 0'dan büyük olmalı");
    const { error } = await supabase.from("profiles").upsert({ ...p, id: user.id }); if (error) return setErr(error.message);
    await supabase.from("weights").upsert({ day: new Date().toISOString().slice(0, 10), kg: p.weight }, { onConflict: "user_id,day", ignoreDuplicates: true });
    onSaved(p);
  }
  return (
    <div className="p-4">
      {!profile && <div className="card border-g">Hoş geldin! Bilgilerini gir, hedefleri hesapla ve kaydet.</div>}
      <div className="card grid grid-cols-2 gap-2">{num("age", "Yaş")}{num("height", "Boy (cm)")}{num("weight", "Kilo (kg)")}{num("target_weight", "Hedef kilo (kg)")}
        <label className="text-xs text-neutral-400">Cinsiyet<select className="inp" value={p.sex} onChange={(e) => set("sex", e.target.value)}><option value="e">Erkek</option><option value="k">Kadın</option></select></label>
        <label className="text-xs text-neutral-400">Aktivite<select className="inp" value={p.activity} onChange={(e) => set("activity", +e.target.value)}><option value={1.2}>Hareketsiz</option><option value={1.375}>Hafif aktif</option><option value={1.55}>Orta aktif</option><option value={1.725}>Çok aktif</option></select></label>
        <label className="col-span-2 text-xs text-neutral-400">Hedef<select className="inp" value={p.goal} onChange={(e) => set("goal", e.target.value)}><option value="ver">Kilo verme</option><option value="koru">Kilo koruma</option><option value="kas">Kas kazanma</option></select></label>
        <button className="col-span-2 rounded-xl bg-o p-2 font-bold text-black" onClick={hesapla}>Hedefleri otomatik hesapla</button></div>
      <div className="card grid grid-cols-2 gap-2">{num("kcal", "Kalori (kcal)")}{num("protein", "Protein (g)")}{num("carb", "Karbonhidrat (g)")}{num("fat", "Yağ (g)")}</div>
      {err && <p className="mb-2 text-sm text-o">{err}</p>}
      <button className="pri w-full" onClick={save}>Kaydet</button>
      <button className="btn mt-3 w-full" onClick={() => supabase.auth.signOut()}>Çıkış yap</button>
    </div>
  );
}
