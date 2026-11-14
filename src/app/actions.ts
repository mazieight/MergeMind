"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

export async function signIn(form: FormData) {
  const input = z
    .object({ email: z.email(), password: z.string().min(1).max(256) })
    .safeParse(Object.fromEntries(form));
  if (!input.success) redirect("/login?error=invalid");
  const client = await supabase();
  const { error } = await client.auth.signInWithPassword(input.data);
  if (error) redirect("/login?error=credentials");
  redirect("/");
}
export async function signOut() {
  const client = await supabase();
  await client.auth.signOut();
  redirect("/login");
}
