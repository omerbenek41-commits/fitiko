import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
function get() {
  if (!client) {
    client = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim(),
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()
    );
  }
  return client;
}

// İstemci yalnızca ilk kullanıldığında (tarayıcıda) oluşturulur; build sırasında oluşturulmaz.
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_t, prop) => (get() as any)[prop],
});
