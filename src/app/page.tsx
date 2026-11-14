import Link from "next/link";
import { getSupabaseConfig } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { CreateForm } from "@/components/create-form";

export default async function Home() {
  const configured = !!getSupabaseConfig();
  const client = configured ? await supabase() : null;
  const user = client ? (await client.auth.getUser()).data.user : null;
  const result =
    user && client
      ? await client
          .from("events")
          .select("id,name,description,slug")
          .order("created_at", { ascending: false })
      : null;
  return (
    <>
      <div className="eyebrow">YOUR WORKSPACE / OVERVIEW</div>
      <section className="hero">
        <div>
          <p className="kicker">BUILD TOGETHER. MOVE WITH CLARITY.</p>
          <h1>
            Great teams.
            <br />
            <span>In sync.</span>
          </h1>
          <p className="intro">
            Bring your hackathon teams into one place.
            <br />
            Give every project a clear starting point.
          </p>
          <Link className="button demo-entry" href="/demo">
            Play the 90-second demo <span>→</span>
          </Link>
        </div>
        <div className="orbit" aria-hidden>
          <div className="orbit-ring" />
          <span className="orbit-node n1">01</span>
          <span className="orbit-node n2">02</span>
          <span className="orbit-node n3">03</span>
          <div className="orbit-core">
            mm<span>CONNECTED BY PURPOSE</span>
          </div>
        </div>
      </section>
      <div className="section-heading">
        <h2>{user ? "Your events" : "Your next build starts here"}</h2>
        <span className="badge">FOUNDATION</span>
      </div>
      <div className="columns">
        <section className="panel">
          {!configured ? (
            <>
              <div className="icon-tile">⌘</div>
              <h3>Connect your workspace</h3>
              <p className="muted">
                Configure authentication and apply the foundation migration to
                start creating real events.
              </p>
              <ol className="steps">
                <li>
                  Copy <code>.env.example</code> to <code>.env.local</code>.
                </li>
                <li>Add your Supabase URL and publishable key.</li>
                <li>Apply the migration, then restart the app.</li>
              </ol>
              <span className="status-dot" />{" "}
              <span className="small muted">Awaiting configuration</span>
            </>
          ) : !user ? (
            <>
              <h3>A shared place to start.</h3>
              <p className="muted">
                Sign in to create an event or find the teams you belong to.
              </p>
              <Link className="button" href="/login">
                Sign in <span>↗</span>
              </Link>
            </>
          ) : (
            <>
              {result?.error ? (
                <p role="alert">
                  Unable to load events. Check the database connection and
                  migration.
                </p>
              ) : result?.data?.length ? (
                <div className="stack">
                  {result.data.map((event) => (
                    <Link
                      className="event-card"
                      key={event.id}
                      href={`/events/${event.id}`}
                    >
                      <span className="icon-tile">↗</span>
                      <div>
                        <h3>{event.name}</h3>
                        <p className="muted small">
                          {event.description || event.slug}
                        </p>
                      </div>
                      <span className="arrow">→</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <>
                  <h3>A blank canvas. A big possibility.</h3>
                  <p className="muted">
                    No events yet. Create your first event, then bring your
                    teams together.
                  </p>
                </>
              )}
              <div className="account-id">
                <p className="small muted">
                  Your account ID · share with your team manager
                </p>
                <code>{user.id}</code>
              </div>
            </>
          )}
        </section>
        <section className="panel secondary">
          {user ? (
            <>
              <h3>Create an event</h3>
              <p className="muted small">You’ll be its organizer.</p>
              <CreateForm kind="event" />
            </>
          ) : (
            <>
              <p className="kicker">A CLEARER WAY TO BUILD</p>
              <div className="principle">
                <span>01</span>
                <div>
                  <h3>One event, many teams</h3>
                  <p>Give each team a home and the right access.</p>
                </div>
              </div>
              <div className="principle">
                <span>02</span>
                <div>
                  <h3>Progress with context</h3>
                  <p>
                    Task-based progress and repository activity are planned
                    next.
                  </p>
                </div>
              </div>
              <div className="principle">
                <span>03</span>
                <div>
                  <h3>People make the call</h3>
                  <p>Future AI proposals will always need human approval.</p>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
