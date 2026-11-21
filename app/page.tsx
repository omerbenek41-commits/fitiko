"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Auth from "@/components/Auth";
import Dashboard from "@/components/Dashboard";
import Weights from "@/components/Weights";
import Profile from "@/components/Profile";
export default function Home() {
  const [user, setUser] = useState<any>(null), [ready, setReady] = useState(false), [tab, setTab] = useState("home"), [profile, setProfile] = useState<any>(null), [pl, setPl] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => l.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!user) { setProfile(null); setPl(false); return; }
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => { setProfile(data); setPl(true); if (!data) setTab("profile"); });
  }, [user]);
  if (!ready || (user && !pl)) return <p className="p-6 text-neutral-400">Yükleniyor…</p>;
  if (!user) return <Auth />;
  const nav = [["home", "🏠", "Özet"], ["weight", "⚖️", "Kilo"], ["profile", "👤", "Profil"]];
  return (
    <div className="pb-24">
      {tab === "home" && profile && <Dashboard profile={profile} />}
      {tab === "weight" && <Weights target={profile?.target_weight ?? 0} />}
      {tab === "profile" && <Profile user={user} profile={profile} onSaved={(p) => { setProfile(p); setTab("home"); }} />}
      <nav className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-2xl justify-around border-t border-neutral-800 bg-neutral-950/95 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur">
        {nav.map(([id, ic, l]) => (<button key={id} onClick={() => profile && setTab(id)} className={`flex flex-col items-center px-6 py-1 text-xs ${tab === id ? "text-g" : "text-neutral-400"}`}><span className="text-xl">{ic}</span>{l}</button>))}
      </nav>
    </div>
  );
}
