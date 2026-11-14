import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSupabaseConfig } from "@/lib/env";
import { idInput } from "@/lib/contracts";
import { CreateForm } from "@/components/create-form";

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  if (!getSupabaseConfig()) redirect("/");
  const parsed = idInput.safeParse((await params).eventId);
  if (!parsed.success) notFound();
  const client = await supabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data: event, error } = await client
    .from("events")
    .select("id,name,description")
    .eq("id", parsed.data)
    .maybeSingle();
  if (error) throw new Error("Unable to load event.");
  if (!event) notFound();
  const [{ data: teams, error: teamError }, { data: organizer }] =
    await Promise.all([
      client
        .from("teams")
        .select("id,name,description,status")
        .eq("event_id", event.id)
        .order("created_at"),
      client.rpc("is_organizer", { p_event_id: event.id }),
    ]);
  return (
    <>
      <Link className="eyebrow" href="/">
        ← WORKSPACE / EVENT
      </Link>
      <div className="page-heading">
        <h1>{event.name}</h1>
        <p className="intro">
          {event.description || "A shared space for your next big idea."}
        </p>
        <span className="badge">{organizer ? "ORGANIZER" : "MEMBER"}</span>
      </div>
      <div className="columns">
        <section className="panel">
          <h2>Teams</h2>
          {teamError ? (
            <p role="alert">Unable to load teams.</p>
          ) : teams?.length ? (
            teams.map((team) => (
              <Link
                className="event-card"
                href={`/teams/${team.id}`}
                key={team.id}
              >
                <div>
                  <h3>{team.name}</h3>
                  <p className="muted small">
                    {team.description || "Project context coming soon"}
                  </p>
                </div>
                <span className="badge">{team.status}</span>
              </Link>
            ))
          ) : (
            <p className="muted">No teams to show yet.</p>
          )}
        </section>
        {organizer && (
          <section className="panel secondary">
            <h3>Create a team</h3>
            <CreateForm kind="team" parentId={event.id} />
          </section>
        )}
      </div>
    </>
  );
}
