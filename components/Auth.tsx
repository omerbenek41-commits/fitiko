"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
export default function Auth() {
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [up, setUp] = useState(false), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg("Geçerli bir e-posta gir");
    if (pw.length < 6) return setMsg("Şifre en az 6 karakter olmalı");
    setBusy(true);
    const { error } = up ? await supabase.auth.signUp({ email, password: pw }) : await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) setMsg(error.message); else if (up) setMsg("Kayıt oluşturuldu. E-posta onayı açıksa onay bağlantısına tıkla, sonra giriş yap.");
  }
  return (
    <form onSubmit={go} className="p-6 pt-24">
      <h1 className="mb-1 text-3xl font-extrabold text-g">FitTakip</h1><p className="mb-6 text-neutral-400">Beslenme ve kalori takibi</p>
      <input className="inp mb-3" type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="inp mb-3" type="password" placeholder="Şifre" value={pw} onChange={(e) => setPw(e.target.value)} />
      {msg && <p className="mb-3 text-sm text-o">{msg}</p>}
      <button className="pri w-full" disabled={busy}>{busy ? "Bekle…" : up ? "Kayıt ol" : "Giriş yap"}</button>
      <button type="button" className="mt-3 w-full text-sm text-neutral-400" onClick={() => setUp(!up)}>{up ? "Hesabın var mı? Giriş yap" : "Hesabın yok mu? Kayıt ol"}</button>
    </form>
  );
  <p className="mb-4 text-xs text-neutral-500">{(process.env.NEXT_PUBLIC_SUPABASE_URL || "URL YOK").slice(0, 45)} · {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "anahtar var" : "anahtar YOK"}</p>
}

