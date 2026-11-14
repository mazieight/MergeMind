import { redirect } from "next/navigation";
import { signIn } from "@/app/actions";
import { getSupabaseConfig } from "@/lib/env";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!getSupabaseConfig()) redirect("/");
  const { error } = await searchParams;
  return (
    <div className="login panel">
      <p className="kicker">WELCOME TO MERGEMIND</p>
      <h1>Back in sync.</h1>
      <p className="muted">Sign in with your workspace account.</p>
      <form action={signIn} className="stack">
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            maxLength={256}
          />
        </label>
        {error && (
          <p role="alert">Sign-in failed. Check your email and password.</p>
        )}
        <button className="button">
          Sign in <span>↗</span>
        </button>
      </form>
      <p className="small muted">
        Accounts are provisioned in Supabase during this foundation phase.
        Self-service invitations are coming next.
      </p>
    </div>
  );
}
