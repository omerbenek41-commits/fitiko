"use client";
import { useRef, useState } from "react";
import { Data, Profile as P, exportJSON, importJSON, resetAll, update, upsertWeight } from "@/lib/store";
import { bmi, bmiLabel, targets, today } from "@/lib/calc";

export default function Profile({ data, profile }: { data: Data; profile: P }) {
  const [p, setP] = useState<any>({ ...profile });
  const [msg, setMsg] = useState(""), [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: any) => {
    setP({ ...p, [k]: v });
    setMsg("");
  };
  const num = (k: string, l: string, step = "any") => (
    <label className="text-xs text-neutral-400">
      {l}
      <input className="inp mt-1" type="number" inputMode="decimal" step={step} value={p[k]} onChange={(e) => set(k, e.target.value === "" ? "" : +e.target.value)} />
    </label>
  );
  const t = targets(p);

  function save() {
    setErr("");
    if (!String(p.name ?? "").trim()) return setErr("Ad boş olamaz");
    if (["age", "height", "weight", "targetWeight", "kcal", "protein", "carb", "fat", "waterGoal", "stepGoal"].some((k) => !(+p[k] > 0))) return setErr("Tüm sayısal alanlar 0'dan büyük olmalı");
    const next: P = { ...profile, ...p, name: p.name.trim() };
    update(() => ({ profile: next }));
    if (+p.weight !== profile.weight) upsertWeight(today(), +p.weight);
    setMsg("✓ Kaydedildi");
  }

  const size = typeof window !== "undefined" ? new Blob([localStorage.getItem("fittakip:v1") ?? ""]).size : 0;
  const b = bmi(+p.weight, +p.height);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-g text-2xl font-extrabold text-black">{(profile.name[0] ?? "?").toLocaleUpperCase("tr")}</div>
        <div>
          <h1 className="text-2xl font-extrabold">{profile.name}</h1>
          <div className="text-xs text-neutral-400">
            {profile.createdAt} tarihinden beri · VKİ {b.toFixed(1)} ({bmiLabel(b)})
          </div>
        </div>
      </div>

      <div className="card grid grid-cols-2 gap-2">
        <label className="col-span-2 text-xs text-neutral-400">
          Ad
          <input className="inp mt-1" value={p.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        {num("height", "Boy (cm)")}
        {num("weight", "Güncel kilo (kg)")}
        {num("age", "Yaş", "1")}
        {num("targetWeight", "Hedef kilo (kg)")}
        <label className="text-xs text-neutral-400">
          Cinsiyet
          <select className="inp mt-1" value={p.sex} onChange={(e) => set("sex", e.target.value)}>
            <option value="e">Erkek</option>
            <option value="k">Kadın</option>
          </select>
        </label>
        <label className="text-xs text-neutral-400">
          Aktivite
          <select className="inp mt-1" value={p.activity} onChange={(e) => set("activity", +e.target.value)}>
            <option value={1.2}>Hareketsiz</option>
            <option value={1.375}>Hafif aktif</option>
            <option value={1.55}>Orta aktif</option>
            <option value={1.725}>Çok aktif</option>
          </select>
        </label>
        <div className="col-span-2 grid grid-cols-3 gap-1 rounded-xl bg-neutral-800 p-1 text-sm">
          {[
            ["ver", "Kilo ver"],
            ["koru", "Koru"],
            ["kas", "Kas kazan"],
          ].map(([v, l]) => (
            <button key={v} className={`rounded-lg py-1.5 ${p.goal === v ? "bg-neutral-950 text-g" : "text-neutral-400"}`} onClick={() => set("goal", v)}>
              {l}
            </button>
          ))}
        </div>
        <div className="col-span-2 rounded-xl bg-neutral-950 p-3 text-xs text-neutral-400">
          Bazal metabolizma <b className="text-white">{Math.round(t.bmr)}</b> kcal · Günlük harcama <b className="text-white">{Math.round(t.tdee)}</b> kcal
          <br />
          Önerilen: <b className="text-g">{t.kcal} kcal</b> · P {t.protein} g · K {t.carb} g · Y {t.fat} g
        </div>
        <button className="col-span-2 rounded-xl bg-o p-2 font-bold text-black" onClick={() => setP({ ...p, kcal: t.kcal, protein: t.protein, carb: t.carb, fat: t.fat })}>
          Önerilen hedefleri uygula
        </button>
      </div>

      <div className="card grid grid-cols-2 gap-2">
        <div className="col-span-2 text-sm font-bold">Günlük hedefler</div>
        {num("kcal", "Kalori (kcal)", "1")}
        {num("protein", "Protein (g)", "1")}
        {num("carb", "Karbonhidrat (g)", "1")}
        {num("fat", "Yağ (g)", "1")}
        {num("waterGoal", "Su (ml)", "250")}
        {num("stepGoal", "Adım", "500")}
      </div>
      {err && <p className="mb-2 text-sm text-o">{err}</p>}
      {msg && <p className="mb-2 text-sm text-g">{msg}</p>}
      <button className="pri mb-6 w-full py-3" onClick={save}>
        Kaydet
      </button>

      <div className="card">
        <b>💾 Verilerim</b>
        <p className="mb-3 mt-1 text-xs text-neutral-400">
          Tüm verilerin yalnızca bu tarayıcıda saklanır ({(size / 1024).toFixed(1)} KB · {data.entries.length} öğün kaydı · {data.workouts.length} antrenman). Tarayıcı verilerini temizlersen kaybolur; düzenli yedek almanı öneririz.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn" onClick={exportJSON}>
            ⬇️ Yedeği indir
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            ⬆️ Yedekten yükle
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (!confirm("Mevcut verilerin yedekteki verilerle değiştirilecek. Devam edilsin mi?")) return;
            try {
              await importJSON(f);
              alert("Yedek yüklendi");
              location.reload();
            } catch (x: any) {
              alert(x?.message ?? "Yedek okunamadı");
            }
          }}
        />
        <button
          className="btn mt-2 w-full text-o"
          onClick={() => {
            if (confirm("TÜM verilerin kalıcı olarak silinecek. Emin misin?") && confirm("Son onay: geri alınamaz.")) resetAll();
          }}
        >
          🗑️ Tüm verileri sil
        </button>
      </div>
      <p className="pb-4 text-center text-xs text-neutral-600">FitTakip · çevrimdışı çalışır · sunucu yok</p>
    </div>
  );
}
