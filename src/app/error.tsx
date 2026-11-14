"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel login">
      <h2>We couldn’t load this workspace.</h2>
      <p className="muted">
        Please try again. If this continues, check your Supabase connection and
        migrations.
      </p>
      <button className="button" onClick={reset}>
        Try again ↗
      </button>
    </section>
  );
}
