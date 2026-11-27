"use client";
import { useMemo, useState } from "react";
import { Data, Entry, update, uid } from "@/lib/store";
import { FOODS, Food, MEALS, MEAL_ICONS } from "@/lib/foods";
import { calc } from "@/lib/calc";
import { Sheet } from "./ui";

const UNITS = ["g", "ml", "adet", "porsiyon"];
const r0 = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Katalogda bulunmayan bir kaydı düzenlenebilir Food nesnesine çevirir */
function entryToFood(e: Entry): Food {
  const per = e.unit === "g" || e.unit === "ml" ? 100 / e.amount : 1 / e.amount;
  return { n: e.name, k: e.kcal * per, p: e.protein * per, c: e.carb * per, f: e.fat * per, a: 100, s: 100 };
}

type Pick = { food: Food; amt: number; unit: string };

export default function AddFood({ data, day, meal: initialMeal, edit, onClose }: { data: Data; day: string; meal: string; edit?: Entry; onClose: () => void }) {
  const catalog = useMemo(() => [...data.foods, ...FOODS], [data.foods]);
  const byName = useMemo(() => new Map(catalog.map((f) => [f.n, f])), [catalog]);

  const [meal, setMeal] = useState(edit?.meal ?? initialMeal);
  const [tab, setTab] = useState<"recent" | "fav" | "quick" | "new">("recent");
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Pick | null>(edit ? { food: byName.get(edit.name) ?? entryToFood(edit), amt: edit.amount, unit: edit.unit } : null);
  const [err, setErr] = useState("");

  // Son kullanılan yiyecekler, en son miktarlarıyla birlikte
  const recent = useMemo(() => {
    const seen = new Map<string, Pick>();
    for (const e of [...data.entries].sort((a, b) => b.ts - a.ts)) {
      if (seen.has(e.name)) continue;
      seen.set(e.name, { food: byName.get(e.name) ?? entryToFood(e), amt: e.amount, unit: e.unit });
      if (seen.size >= 30) break;
    }
    return [...seen.values()];
  }, [data.entries, byName]);

  const results = useMemo(() => {
    const s = q.trim().toLocaleLowerCase("tr");
    if (!s) return [];
    return catalog.filter((x) => x.n.toLocaleLowerCase("tr").includes(s)).slice(0, 40);
  }, [q, catalog]);

  const favs = catalog.filter((f) => data.favorites.includes(f.n));
  const isFav = (n: string) => data.favorites.includes(n);
  const toggleFav = (n: string) => update((d) => ({ favorites: d.favorites.includes(n) ? d.favorites.filter((x) => x !== n) : [...d.favorites, n] }));

  function save(p: Pick) {
    if (!(p.amt > 0)) return setErr("Geçerli bir miktar gir");
    const c = calc(p.food, p.amt, p.unit);
    const entry: Entry = { id: edit?.id ?? uid(), day, meal, name: p.food.n, amount: p.amt, unit: p.unit, kcal: r1(c.k), protein: r1(c.p), carb: r1(c.c), fat: r1(c.f), ts: edit?.ts ?? Date.now() };
    update((d) => ({ entries: edit ? d.entries.map((e) => (e.id === edit.id ? entry : e)) : [...d.entries, entry] }));
    onClose();
  }

  const choose = (f: Food, amt?: number, unit?: string) => {
    setErr("");
    setPick({ food: f, amt: amt ?? (f.s && f.s !== 100 ? 1 : 100), unit: unit ?? (f.s && f.s !== 100 ? "porsiyon" : "g") });
  };

  const Row = ({ f, sub, onClick }: { f: Food; sub?: string; onClick: () => void }) => (
    <div className="flex items-center gap-2 border-t border-neutral-800 py-2.5">
      <button className="min-w-0 flex-1 text-left" onClick={onClick}>
        <div className="truncate">{f.n}</div>
        <div className="text-xs text-neutral-500">{sub ?? `100 g · ${r0(f.k)} kcal · P ${r1(f.p)} K ${r1(f.c)} Y ${r1(f.f)}`}</div>
      </button>
      <button className={`px-1 text-lg ${isFav(f.n) ? "text-yellow-400" : "text-neutral-600"}`} onClick={() => toggleFav(f.n)} aria-label="Favori">
        ★
      </button>
      <button className="grid h-8 w-8 place-items-center rounded-full bg-g/15 text-lg text-g" onClick={onClick} aria-label="Ekle">
        +
      </button>
    </div>
  );

  // ---- Miktar seçimi ----
  if (pick) {
    const c = calc(pick.food, pick.amt || 0, pick.unit);
    const quick = pick.unit === "g" || pick.unit === "ml" ? [50, 100, 150, 200, 250] : [0.5, 1, 1.5, 2, 3];
    return (
      <Sheet title={edit ? "Kaydı düzenle" : "Miktar"} onClose={onClose}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <div className="text-lg font-bold">{pick.food.n}</div>
            <div className="text-xs text-neutral-500">
              1 adet ≈ {pick.food.a} g · 1 porsiyon ≈ {pick.food.s} g
            </div>
          </div>
          {!edit && (
            <button className="text-sm text-neutral-400" onClick={() => setPick(null)}>
              ‹ Geri
            </button>
          )}
        </div>
        <div className="card text-center">
          <div className="text-4xl font-extrabold text-g">{r0(c.k)}</div>
          <div className="text-xs text-neutral-400">kcal</div>
          <div className="mt-3 grid grid-cols-3 text-sm">
            <div>
              <b>{r1(c.p)} g</b>
              <div className="text-xs text-neutral-400">Protein</div>
            </div>
            <div>
              <b>{r1(c.c)} g</b>
              <div className="text-xs text-neutral-400">Karb.</div>
            </div>
            <div>
              <b>{r1(c.f)} g</b>
              <div className="text-xs text-neutral-400">Yağ</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="inp text-lg" type="number" inputMode="decimal" min="0" step="any" value={pick.amt || ""} onChange={(e) => setPick({ ...pick, amt: +e.target.value })} autoFocus />
          <select className="inp" value={pick.unit} onChange={(e) => setPick({ ...pick, unit: e.target.value, amt: e.target.value === "g" || e.target.value === "ml" ? 100 : 1 })}>
            {UNITS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex gap-2">
          {quick.map((v) => (
            <button key={v} className={`chip flex-1 ${pick.amt === v ? "chip-on" : ""}`} onClick={() => setPick({ ...pick, amt: v })}>
              {v}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {MEALS.map((m) => (
            <button key={m} className={`chip whitespace-nowrap ${meal === m ? "chip-on" : ""}`} onClick={() => setMeal(m)}>
              {MEAL_ICONS[m]} {m}
            </button>
          ))}
        </div>
        {err && <p className="mt-2 text-sm text-o">{err}</p>}
        <button className="pri mt-4 w-full py-3" onClick={() => save(pick)}>
          {edit ? "Güncelle" : `${meal} öğününe ekle`}
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet title={`${MEAL_ICONS[meal] ?? ""} ${meal}`} onClose={onClose}>
      <input className="inp mb-3" placeholder="🔍 Yiyecek ara (ör. yumurta, pilav)" value={q} onChange={(e) => setQ(e.target.value)} />
      {q ? (
        <>
          {results.map((f) => (
            <Row key={f.n} f={f} onClick={() => choose(f)} />
          ))}
          {results.length === 0 && (
            <div className="py-4 text-center text-sm text-neutral-500">
              Sonuç yok.{" "}
              <button className="text-g underline" onClick={() => setTab("new")}>
                “{q}” yiyeceğini oluştur
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-2 grid grid-cols-4 gap-1 rounded-xl bg-neutral-800 p-1 text-sm">
            {(
              [
                ["recent", "Son"],
                ["fav", "Favori"],
                ["quick", "Hızlı"],
                ["new", "Yeni"],
              ] as const
            ).map(([id, l]) => (
              <button key={id} className={`rounded-lg py-1.5 ${tab === id ? "bg-neutral-950 text-g" : "text-neutral-400"}`} onClick={() => setTab(id)}>
                {l}
              </button>
            ))}
          </div>
          {tab === "recent" &&
            (recent.length ? (
              recent.map((p) => <Row key={p.food.n} f={p.food} sub={`${p.amt} ${p.unit} · ${r0(calc(p.food, p.amt, p.unit).k)} kcal`} onClick={() => choose(p.food, p.amt, p.unit)} />)
            ) : (
              <>
                <p className="py-2 text-xs text-neutral-500">Popüler yiyecekler</p>
                {FOODS.slice(0, 15).map((f) => (
                  <Row key={f.n} f={f} onClick={() => choose(f)} />
                ))}
              </>
            ))}
          {tab === "fav" &&
            (favs.length ? favs.map((f) => <Row key={f.n} f={f} onClick={() => choose(f)} />) : <p className="py-6 text-center text-sm text-neutral-500">Yiyeceklerin yanındaki ★ ile favori ekle</p>)}
          {tab === "quick" && <QuickAdd onAdd={(f) => save({ food: f, amt: 1, unit: "porsiyon" })} />}
          {tab === "new" && (
            <NewFood
              initial={q}
              onCreate={(f) => {
                update((d) => ({ foods: [f, ...d.foods.filter((x) => x.n !== f.n)] }));
                choose(f, 100, "g");
              }}
            />
          )}
        </>
      )}
      {err && <p className="mt-2 text-sm text-o">{err}</p>}
    </Sheet>
  );
}

/** Sadece kalori (ve isteğe bağlı makro) girerek hızlı ekleme */
function QuickAdd({ onAdd }: { onAdd: (f: Food) => void }) {
  const [v, setV] = useState({ n: "", k: "", p: "", c: "", f: "" }), [err, setErr] = useState("");
  const num = (s: string) => parseFloat(s.replace(",", ".")) || 0;
  return (
    <div className="pt-2">
      <p className="mb-3 text-xs text-neutral-500">Etiketten veya restorandan bildiğin değerleri doğrudan gir.</p>
      <input className="inp mb-2" placeholder="Açıklama (ör. Kantin yemeği)" value={v.n} onChange={(e) => setV({ ...v, n: e.target.value })} />
      <input className="inp mb-2 text-lg" inputMode="decimal" placeholder="Kalori (kcal)" value={v.k} onChange={(e) => setV({ ...v, k: e.target.value })} />
      <div className="grid grid-cols-3 gap-2">
        {(["p", "c", "f"] as const).map((k) => (
          <input key={k} className="inp" inputMode="decimal" placeholder={{ p: "Protein g", c: "Karb. g", f: "Yağ g" }[k]} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
        ))}
      </div>
      {err && <p className="mt-2 text-sm text-o">{err}</p>}
      <button
        className="pri mt-3 w-full py-3"
        onClick={() => {
          if (!(num(v.k) > 0)) return setErr("Kalori gir");
          onAdd({ n: v.n.trim() || "Hızlı ekleme", k: num(v.k), p: num(v.p), c: num(v.c), f: num(v.f), a: 100, s: 100 });
        }}
      >
        Ekle
      </button>
    </div>
  );
}

/** Kullanıcının kendi yiyeceğini kataloğa kaydetmesi */
function NewFood({ initial, onCreate }: { initial: string; onCreate: (f: Food) => void }) {
  const [v, setV] = useState({ n: initial, k: "", p: "", c: "", f: "", s: "100" }), [err, setErr] = useState("");
  const num = (s: string) => parseFloat(s.replace(",", "."));
  const field = (k: keyof typeof v, l: string) => (
    <label className="text-xs text-neutral-400">
      {l}
      <input className="inp mt-1" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
    </label>
  );
  return (
    <div className="pt-2">
      <p className="mb-3 text-xs text-neutral-500">Değerleri 100 g için gir (ambalaj etiketinde yazar). Yiyecek kataloğuna kaydedilir.</p>
      <label className="mb-2 block text-xs text-neutral-400">
        Ad
        <input className="inp mt-1" value={v.n} onChange={(e) => setV({ ...v, n: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        {field("k", "Kalori (kcal)")}
        {field("p", "Protein (g)")}
        {field("c", "Karbonhidrat (g)")}
        {field("f", "Yağ (g)")}
        {field("s", "1 porsiyon (g)")}
      </div>
      {err && <p className="mt-2 text-sm text-o">{err}</p>}
      <button
        className="pri mt-3 w-full py-3"
        onClick={() => {
          const vals = [v.k, v.p, v.c, v.f].map((x) => num(x || "0"));
          if (!v.n.trim()) return setErr("Ad gir");
          if (vals.some((x) => !(x >= 0)) || !(vals[0] > 0)) return setErr("Geçerli değerler gir");
          const s = num(v.s) > 0 ? num(v.s) : 100;
          onCreate({ n: v.n.trim(), k: vals[0], p: vals[1], c: vals[2], f: vals[3], a: s, s });
        }}
      >
        Kaydet ve seç
      </button>
    </div>
  );
}
