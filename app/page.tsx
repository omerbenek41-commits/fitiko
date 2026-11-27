"use client";
import { useEffect, useState } from "react";
import { storageError, useData } from "@/lib/store";
import { today } from "@/lib/calc";
import Onboarding from "@/components/Onboarding";
import Diary from "@/components/Diary";
import Workouts from "@/components/Workouts";
import Progress from "@/components/Progress";
import Profile from "@/components/Profile";

const NAV = [
  ["diary", "📒", "Günlük"],
  ["workout", "🏋️", "Antrenman"],
  ["progress", "📈", "Gelişim"],
  ["profile", "👤", "Profil"],
] as const;
type Tab = (typeof NAV)[number][0];

export default function Home() {
  const data = useData();
  const [tab, setTab] = useState<Tab>("diary");
  const [day, setDay] = useState(today());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  // Statik derleme / ilk yükleme: localStorage henüz okunmadı
  if (!data) return <div className="grid min-h-dvh place-items-center text-neutral-500">Yükleniyor…</div>;
  if (!data.profile) return <Onboarding />;
  const profile = data.profile;
  const err = storageError();

  return (
    <div className="pb-24">
      {err && <div className="m-4 rounded-xl bg-o/20 p-3 text-sm text-o">{err}</div>}
      {tab === "diary" && <Diary data={data} profile={profile} day={day} setDay={setDay} goWorkout={() => setTab("workout")} />}
      {tab === "workout" && <Workouts data={data} profile={profile} day={day} />}
      {tab === "progress" && <Progress data={data} profile={profile} />}
      {tab === "profile" && <Profile data={data} profile={profile} />}
      <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto grid max-w-2xl grid-cols-4 border-t border-neutral-800 bg-neutral-950/95 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur">
        {NAV.map(([id, ic, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`relative flex flex-col items-center py-1 text-[11px] ${tab === id ? "text-g" : "text-neutral-400"}`}>
            <span className={`text-xl transition ${tab === id ? "scale-110" : "opacity-70 grayscale"}`}>{ic}</span>
            {l}
            {id === "workout" && data.draft && <span className="absolute right-[30%] top-1 h-2 w-2 rounded-full bg-o" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
