"use client";
import { ReactNode, useEffect } from "react";

export function Ring({ v, max, color, label, size = 84, stroke = 10, children }: { v: number; max: number; color: string; label?: string; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2,
    C = 2 * Math.PI * r,
    p = max > 0 ? Math.min(Math.max(v / max, 0), 1) : 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#232826" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${C * p} ${C}`} style={{ transition: "stroke-dasharray .4s" }} />
      </svg>
      <div className="absolute text-center leading-tight">
        {children ?? (
          <>
            <div className="font-bold">{Math.round(v)}</div>
            {label && <div className="text-[10px] text-neutral-400">{label}</div>}
          </>
        )}
      </div>
    </div>
  );
}

export function Bar({ v, max, color = "#34d27b" }: { v: number; max: number; color?: string }) {
  const p = max > 0 ? Math.min(v / max, 1) * 100 : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
      <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: color }} />
    </div>
  );
}

/** Alttan açılan panel */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-3xl border-t border-neutral-800 bg-neutral-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <b className="text-lg">{title}</b>
          <button className="grid h-8 w-8 place-items-center rounded-full bg-neutral-800 text-neutral-300" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="text-center">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="text-lg font-bold">{value}</div>
      {sub && <div className="text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

export function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="py-6 text-center text-sm text-neutral-500">
      <div className="mb-1 text-3xl">{icon}</div>
      {text}
    </div>
  );
}

/** Basit çizgi grafik; target verilirse kesikli hedef çizgisi çizer */
export function LineChart({ points, target, color = "#34d27b", unit = "", avg }: { points: { x: string; y: number }[]; target?: number; color?: string; unit?: string; avg?: number[] }) {
  if (points.length < 2) return <Empty icon="📈" text="Grafik için en az 2 kayıt gerekli" />;
  const W = 320, H = 150, P = 24;
  const ys = points.map((p) => p.y).concat(target && target > 0 ? [target] : []);
  const mn = Math.min(...ys) - 1, mx = Math.max(...ys) + 1;
  const X = (i: number) => P + ((W - P - 8) * i) / (points.length - 1);
  const Y = (v: number) => 8 + (H - 30) * (1 - (v - mn) / (mx - mn));
  const line = points.map((p, i) => `${X(i)},${Y(p.y)}`).join(" ");
  const area = `${X(0)},${H - 22} ${line} ${X(points.length - 1)},${H - 22}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
      <defs>
        <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[mn + 1, (mn + mx) / 2, mx - 1].map((v, i) => (
        <g key={i}>
          <line x1={P} x2={W - 8} y1={Y(v)} y2={Y(v)} stroke="#232826" />
          <text x={0} y={Y(v) + 3} fontSize="9" fill="#737373">
            {v.toFixed(mx - mn < 8 ? 1 : 0)}
          </text>
        </g>
      ))}
      {target && target > 0 ? (
        <>
          <line x1={P} x2={W - 8} y1={Y(target)} y2={Y(target)} stroke="#ff8a3d" strokeDasharray="4 4" />
          <text x={W - 10} y={Y(target) - 4} fontSize="9" fill="#ff8a3d" textAnchor="end">
            hedef {target}
            {unit}
          </text>
        </>
      ) : null}
      <polygon points={area} fill="url(#lg)" />
      {avg && avg.length === points.length && <polyline fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeDasharray="3 3" points={avg.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} />}
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" points={line} />
      {points.map((p, i) => (
        <circle key={i} cx={X(i)} cy={Y(p.y)} r={points.length > 30 ? 0 : 3} fill={color} />
      ))}
      <text x={P} y={H - 6} fontSize="9" fill="#737373">
        {points[0].x}
      </text>
      <text x={W - 8} y={H - 6} fontSize="9" fill="#737373" textAnchor="end">
        {points[points.length - 1].x}
      </text>
    </svg>
  );
}

/** Sütun grafik; target üstündeki sütunlar turuncu */
export function BarChart({ bars, target, color = "#34d27b" }: { bars: { x: string; y: number }[]; target?: number; color?: string }) {
  const W = 320, H = 140, P = 4;
  const mx = Math.max(1, target ?? 0, ...bars.map((b) => b.y)) * 1.1;
  const bw = (W - P * 2) / bars.length;
  const Y = (v: number) => H - 18 - (H - 26) * (v / mx);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={P + i * bw + bw * 0.18} y={Y(b.y)} width={bw * 0.64} height={Math.max(H - 18 - Y(b.y), 0)} rx="4" fill={target && b.y > target * 1.05 ? "#ff8a3d" : color} opacity={b.y ? 1 : 0.25} />
          <text x={P + i * bw + bw / 2} y={H - 4} fontSize="9" fill="#737373" textAnchor="middle">
            {b.x}
          </text>
        </g>
      ))}
      {target ? <line x1={0} x2={W} y1={Y(target)} y2={Y(target)} stroke="#a3a3a3" strokeDasharray="4 4" /> : null}
    </svg>
  );
}
