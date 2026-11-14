import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseConfig } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { signOut } from "./actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "MergeMind — Build together",
  description:
    "A shared workspace for hackathon teams, project goals, and meaningful progress.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = getSupabaseConfig()
    ? (await (await supabase()).auth.getUser()).data.user
    : null;
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brand-mark">↗</span>mergemind
            <span className="brand-period">.</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/" className="nav-active">
              Workspace
            </Link>
            <Link href="/demo" className="demo-nav">
              Interactive demo
            </Link>
          </nav>
          <div className="header-end">
            {user ? (
              <form action={signOut}>
                <button className="text-button">Sign out ↗</button>
              </form>
            ) : (
              <span className="workspace-label">A LITTLE MORE IN SYNC</span>
            )}
          </div>
        </header>
        <main>{children}</main>
        <footer>
          <span>mergemind · Built for the way teams build.</span>
          <span>Clarity → Coordination → Progress</span>
        </footer>
      </body>
    </html>
  );
}
