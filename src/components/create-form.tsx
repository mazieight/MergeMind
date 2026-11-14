"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CreateForm({
  kind,
  parentId,
}: {
  kind: "event" | "team" | "member";
  parentId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setMessage("");
    const endpoint =
      kind === "event"
        ? "/api/v1/events"
        : kind === "team"
          ? `/api/v1/events/${parentId}/teams`
          : `/api/v1/teams/${parentId}/members`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json();
      if (!response.ok)
        setMessage(
          result.error?.message ?? "Could not save. Please try again.",
        );
      else {
        form.reset();
        setMessage("Saved successfully.");
        router.refresh();
        if (kind === "event") router.push(`/events/${result.data}`);
      }
    } catch {
      setMessage("Connection failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="stack">
      {kind === "member" ? (
        <>
          <label>
            Account ID
            <input
              name="user_id"
              required
              placeholder="Member’s MergeMind account UUID"
            />
          </label>
          <label>
            Team role
            <select name="role">
              <option value="developer">Developer</option>
              <option value="lead">Team lead</option>
              <option value="mentor">Mentor · read only</option>
            </select>
          </label>
          <p className="muted small">
            Add an existing account. Members can find their account ID on their
            workspace home.
          </p>
        </>
      ) : (
        <>
          <label>
            Name
            <input
              name="name"
              required
              minLength={2}
              maxLength={100}
              placeholder={
                kind === "event" ? "e.g. Build Weekend 2026" : "e.g. Team Orbit"
              }
            />
          </label>
          {kind === "event" && (
            <label>
              Event slug
              <input
                name="slug"
                required
                minLength={3}
                maxLength={64}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="build-weekend-2026"
              />
            </label>
          )}
          <label>
            Description
            <textarea
              name="description"
              maxLength={2000}
              rows={3}
              placeholder="What are you building together?"
            />
          </label>
        </>
      )}
      <button className="button" disabled={busy}>
        {busy ? "Saving…" : kind === "member" ? "Add member" : `Create ${kind}`}{" "}
        <span aria-hidden>↗</span>
      </button>
      <p role="status" className="small">
        {message}
      </p>
    </form>
  );
}
