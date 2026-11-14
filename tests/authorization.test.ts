import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

const organizer = "00000000-0000-4000-8000-000000000001";
const developer = "00000000-0000-4000-8000-000000000002";
const outsider = "00000000-0000-4000-8000-000000000003";
const lead = "00000000-0000-4000-8000-000000000004";
const mentor = "00000000-0000-4000-8000-000000000005";
const viewer = "00000000-0000-4000-8000-000000000006";
let db: PGlite;
let eventId: string;
let teamId: string;
let otherTeamId: string;
async function asUser(id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
async function rpc(sql: string, args: string[]) {
  const result = await db.query<{ id: string }>(sql, args);
  return result.rows[0].id;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to authenticated,anon;
    grant execute on function auth.uid() to authenticated,anon;`);
  await db.exec(
    readFileSync("supabase/migrations/202611140001_foundation.sql", "utf8"),
  );
  for (const id of [organizer, developer, outsider, lead, mentor, viewer])
    await db.query("insert into auth.users(id) values($1)", [id]);
  await asUser(organizer);
  eventId = await rpc(
    "select public.create_event('Build Weekend','build-weekend','') as id",
    [],
  );
  teamId = await rpc("select public.create_team($1,'Orbit','') as id", [
    eventId,
  ]);
  otherTeamId = await rpc("select public.create_team($1,'Nova','') as id", [
    eventId,
  ]);
  for (const [id, role] of [
    [developer, "developer"],
    [lead, "lead"],
    [mentor, "mentor"],
  ]) {
    await rpc("select public.add_team_member($1,$2,$3) as id", [
      teamId,
      id,
      role,
    ]);
  }
  await db.exec("reset role");
  await db.query(
    "insert into public.event_members(event_id,user_id,role) values($1,$2,'viewer')",
    [eventId, viewer],
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});

describe("foundation database authorization", () => {
  it("atomically creates organizer membership and allows event setup", async () => {
    await asUser(organizer);
    expect((await db.query("select * from public.events")).rows).toHaveLength(
      1,
    );
    expect((await db.query("select * from public.teams")).rows).toHaveLength(2);
    expect(
      (
        await db.query<{ role: string }>(
          "select role from public.event_members where user_id=auth.uid()",
        )
      ).rows[0].role,
    ).toBe("organizer");
  });
  it("hides all event/team data from an unrelated account", async () => {
    await asUser(outsider);
    for (const table of ["events", "teams", "event_members", "team_members"])
      expect(
        (await db.query(`select * from public.${table}`)).rows,
      ).toHaveLength(0);
    await expect(
      rpc("select public.create_team($1,'Intrusion','') as id", [eventId]),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("lets developers read only their team and prevents escalation", async () => {
    await asUser(developer);
    expect((await db.query("select * from public.events")).rows).toHaveLength(
      1,
    );
    expect((await db.query("select * from public.teams")).rows).toHaveLength(1);
    await expect(
      rpc("select public.add_team_member($1,$2,'lead') as id", [
        otherTeamId,
        developer,
      ]),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      db.exec(
        "update public.team_members set role='lead' where user_id=auth.uid()",
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("permits a lead to add members only to their own team", async () => {
    await asUser(lead);
    await expect(
      rpc("select public.add_team_member($1,$2,'developer') as id", [
        teamId,
        outsider,
      ]),
    ).resolves.toBeTypeOf("string");
    await expect(
      rpc("select public.add_team_member($1,$2,'developer') as id", [
        otherTeamId,
        outsider,
      ]),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("keeps mentors and event viewers read-only", async () => {
    for (const id of [mentor, viewer]) {
      await asUser(id);
      await expect(
        rpc("select public.add_team_member($1,$2,'lead') as id", [
          teamId,
          viewer,
        ]),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        rpc("select public.create_team($1,'Forbidden','') as id", [eventId]),
      ).rejects.toMatchObject({ code: "42501" });
    }
  });
  it("rejects duplicate memberships and duplicate event slugs", async () => {
    await asUser(organizer);
    await expect(
      rpc("select public.add_team_member($1,$2,'lead') as id", [teamId, lead]),
    ).rejects.toMatchObject({ code: "23505" });
    await expect(
      rpc(
        "select public.create_event('Duplicate','build-weekend','') as id",
        [],
      ),
    ).rejects.toMatchObject({ code: "23505" });
    expect((await db.query("select * from public.events")).rows).toHaveLength(
      1,
    );
  });
  it("rejects anonymous RPC calls", async () => {
    await db.exec("reset role; set role anon");
    await expect(
      rpc("select public.create_event('Anonymous','anonymous','') as id", []),
    ).rejects.toMatchObject({ code: "42501" });
  });
});
