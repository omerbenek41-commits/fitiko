import { createClient, SupabaseClient } from "@supabase/supabase-js";

const clean = (v?: string) => (v || "").replace(/["'\s]/g, "");

function cleanUrl() {
  let u = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (u && !/^https?:\/\//.test(u)) u = "https://" + u.replace(/^\/+/, "");
  return u;
}

let client: SupabaseClient | null = null;
function get() {
  if (!client) client = createClient(cleanUrl(), clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get: (_t, prop) => (get() as any)[prop],
});
