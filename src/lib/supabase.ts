import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./env";

export async function supabase() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase environment is not configured.");
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // Server components cannot write cookies; proxy refreshes the session.
        }
      },
    },
  });
}
