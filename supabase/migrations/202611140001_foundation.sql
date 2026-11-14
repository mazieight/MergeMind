create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 100),
 avatar_url text, github_user_id bigint unique, github_login text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.events (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 2 and 100),
 slug text unique not null check(length(slug) between 3 and 64 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 description text check(length(description)<=2000), starts_at timestamptz, ends_at timestamptz,
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at>=starts_at)
);
create table public.event_members (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 role text not null check(role in ('organizer','viewer')), created_at timestamptz not null default now(), unique(event_id,user_id)
);
create table public.teams (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
 name text not null check(length(trim(name)) between 2 and 100), description text check(length(description)<=2000),
 project_summary text, project_goals jsonb not null default '[]' check(jsonb_typeof(project_goals)='array'),
 status text not null default 'active' check(status in ('active','paused','completed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(event_id,name)
);
create table public.team_members (
 id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade, role text not null check(role in ('lead','developer','mentor')),
 responsibilities text[] not null default '{}', created_at timestamptz not null default now(), unique(team_id,user_id)
);
create index on public.event_members(user_id,event_id);
create index on public.team_members(user_id,team_id);
create index on public.teams(event_id);
-- Private audit trail; no browser reads or writes are granted.
create table public.permission_audit (
 id uuid primary key default gen_random_uuid(), actor_user_id uuid references public.profiles(id) on delete set null,
 action text not null, entity_id uuid not null, created_at timestamptz not null default now()
);
alter table public.permission_audit enable row level security;
revoke all on public.permission_audit from anon,authenticated;
create function public.initialize_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Developer'),100));
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.initialize_profile();
create function public.is_organizer(p_event_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.event_members where event_id=p_event_id and user_id=auth.uid() and role='organizer');
$$;
create function public.is_team_lead(p_team_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.team_members where team_id=p_team_id and user_id=auth.uid() and role='lead');
$$;
create function public.can_read_event(p_event_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.event_members where event_id=p_event_id and user_id=auth.uid())
 or exists(select 1 from public.team_members m join public.teams t on t.id=m.team_id where t.event_id=p_event_id and m.user_id=auth.uid());
$$;
create function public.can_read_team(p_team_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.team_members where team_id=p_team_id and user_id=auth.uid())
 or exists(select 1 from public.teams t join public.event_members m on m.event_id=t.event_id where t.id=p_team_id and m.user_id=auth.uid());
$$;
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
create policy own_profile on public.profiles for select to authenticated using(id=auth.uid());
create policy visible_events on public.events for select to authenticated using(public.can_read_event(id));
create policy visible_event_members on public.event_members for select to authenticated using(public.can_read_event(event_id));
create policy visible_teams on public.teams for select to authenticated using(public.can_read_team(id));
create policy visible_team_members on public.team_members for select to authenticated using(public.can_read_team(team_id));
-- No direct client writes. Narrow RPCs perform authorized mutations atomically.
revoke all on public.profiles,public.events,public.event_members,public.teams,public.team_members from anon,authenticated;
grant select on public.profiles,public.events,public.event_members,public.teams,public.team_members to authenticated;
create function public.create_event(p_name text,p_slug text,p_description text default '') returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 insert into public.events(name,slug,description,created_by) values(trim(p_name),p_slug,p_description,auth.uid()) returning id into v_id;
 insert into public.event_members(event_id,user_id,role) values(v_id,auth.uid(),'organizer');
 insert into public.permission_audit(actor_user_id,action,entity_id) values(auth.uid(),'event.created',v_id);
 return v_id;
end; $$;
create function public.create_team(p_event_id uuid,p_name text,p_description text default '') returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.is_organizer(p_event_id) then raise exception 'Organizer required' using errcode='42501'; end if;
 insert into public.teams(event_id,name,description) values(p_event_id,trim(p_name),p_description) returning id into v_id;
 insert into public.permission_audit(actor_user_id,action,entity_id) values(auth.uid(),'team.created',v_id);
 return v_id;
end; $$;
create function public.add_team_member(p_team_id uuid,p_user_id uuid,p_role text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not(public.is_team_lead(p_team_id) or exists(select 1 from public.teams where id=p_team_id and public.is_organizer(event_id))) then
 raise exception 'Team manager required' using errcode='42501'; end if;
 insert into public.team_members(team_id,user_id,role) values(p_team_id,p_user_id,p_role) returning id into v_id;
 insert into public.permission_audit(actor_user_id,action,entity_id) values(auth.uid(),'team_member.added',v_id);
 return v_id;
end; $$;
revoke all on function public.initialize_profile() from public;
revoke all on function public.is_organizer(uuid),public.is_team_lead(uuid),public.can_read_event(uuid),public.can_read_team(uuid),public.create_event(text,text,text),public.create_team(uuid,text,text),public.add_team_member(uuid,uuid,text) from public;
grant execute on function public.is_organizer(uuid),public.is_team_lead(uuid),public.can_read_event(uuid),public.can_read_team(uuid),public.create_event(text,text,text),public.create_team(uuid,text,text),public.add_team_member(uuid,uuid,text) to authenticated;
