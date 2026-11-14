import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSupabaseConfig } from "@/lib/env";
import { idInput } from "@/lib/contracts";
import { CreateForm } from "@/components/create-form";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  if (!getSupabaseConfig()) redirect("/");
  const parsed = idInput.safeParse((await params).teamId);
  if (!parsed.success) notFound();
  const client = await supabase();
  if (!(await client.auth.getUser()).data.user) redirect("/login");
  const { data: team, error } = await client
    .from("teams")
    .select("id,event_id,name,description")
    .eq("id", parsed.data)
    .maybeSingle();
  if (error) throw new Error("Unable to load team.");
  if (!team) notFound();
  const [
    { data: members, error: membersError },
    { data: organizer },
    { data: lead },
  ] = await Promise.all([
    client
      .from("team_members")
      .select("id,user_id,role")
      .eq("team_id", team.id),
    client.rpc("is_organizer", { p_event_id: team.event_id }),
    client.rpc("is_team_lead", { p_team_id: team.id }),
  ]);
  return (
    <>
      <Link className="eyebrow" href={`/events/${team.event_id}`}>
        ← EVENT / TEAM
      </Link>
      <div className="page-heading">
        <h1>{team.name}</h1>
        <p className="intro">
          {team.description || "A new team. A fresh start."}
        </p>
      </div>
      <div className="columns">
        <section className="panel">
          <h2>Team members</h2>
          {membersError ? (
            <p role="alert">Unable to load members.</p>
          ) : members?.length ? (
            members.map((member) => (
              <div className="event-card" key={member.id}>
                <code className="member-id">{member.user_id}</code>
                <span className="badge">{member.role}</span>
              </div>
            ))
          ) : (
            <p className="muted">Add a team lead to get started.</p>
          )}
        </section>
        {(organizer || lead) && (
          <section className="panel secondary">
            <h3>Add a member</h3>
            <CreateForm kind="member" parentId={team.id} />
          </section>
        )}
      </div>
    </>
  );
}
