-- =====================================================================
--  BPCTI Student Portal — core schema and access rules
--
--  Roles: student, teacher, admin (Abby).
--  - Students see only class groups they are enrolled in (active/completed).
--  - Teachers see and manage only class groups assigned to them.
--  - Admins see and manage everything.
--  Recordings are Zoom share links + passcodes, visible only to the class.
-- =====================================================================

-- ---------- Types ----------
create type public.user_role as enum ('student', 'teacher', 'admin');
create type public.class_status as enum ('planned', 'active', 'completed', 'cancelled');
create type public.enrollment_status as enum ('active', 'completed', 'withdrawn');

-- ---------- Tables ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        public.user_role not null default 'student',
  created_at  timestamptz not null default now()
);
comment on table public.profiles is 'One row per portal user. Role can only be changed by an admin.';

create table public.courses (
  id              text primary key,                       -- e.g. 'english-a'
  program         text not null check (program in ('english', 'korean')),
  specialization  char(1) not null check (specialization in ('A', 'B', 'C', 'D')),
  slug            text not null,
  title           text not null,
  tagline         text,
  unique (program, specialization)
);
comment on table public.courses is 'The eight specializations. Mirrors src/content/courses.js on the public site.';

create table public.course_weeks (
  course_id           text not null references public.courses (id) on delete cascade,
  week                smallint not null check (week between 1 and 12),
  title               text not null,
  description         text not null,
  practical_training  text not null,
  primary key (course_id, week)
);

create table public.classes (
  id                uuid primary key default gen_random_uuid(),
  course_id         text not null references public.courses (id),
  name              text not null,                        -- e.g. 'English B · Winter 2027 · Mornings'
  start_date        date,
  schedule          text,                                 -- e.g. 'Tue & Thu, 9:00–11:00 AM'
  live_meeting_url  text,                                 -- recurring Zoom link for live classes
  status            public.class_status not null default 'planned',
  created_at        timestamptz not null default now()
);
comment on table public.classes is 'A class group: one specialization taught to one group of students on one schedule.';

create table public.class_teachers (
  class_id    uuid not null references public.classes (id) on delete cascade,
  teacher_id  uuid not null references public.profiles (id) on delete cascade,
  primary key (class_id, teacher_id)
);

create table public.enrollments (
  class_id     uuid not null references public.classes (id) on delete cascade,
  student_id   uuid not null references public.profiles (id) on delete cascade,
  status       public.enrollment_status not null default 'active',
  enrolled_at  timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table public.recordings (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null references public.classes (id) on delete cascade,
  week         smallint not null check (week between 1 and 12),
  title        text,
  zoom_url     text not null check (zoom_url ~* '^https://([a-z0-9-]+\.)*zoom\.(us|com)/'),
  passcode     text,
  recorded_on  date,
  created_by   uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.recordings is 'Zoom cloud-recording share links. Only enrolled students, the class teachers, and admins can read them.';

create table public.materials (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes (id) on delete cascade,
  week          smallint check (week between 1 and 12),   -- null = whole-course material
  title         text not null,
  storage_path  text,                                     -- object in the class-materials bucket: '<class_id>/<file>'
  external_url  text,
  created_by    uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now(),
  check (num_nonnulls(storage_path, external_url) = 1),
  check (storage_path is null or split_part(storage_path, '/', 1) = class_id::text)
);

-- Foreign-key indexes
create index on public.classes (course_id);
create index on public.class_teachers (teacher_id);
create index on public.enrollments (student_id);
create index on public.recordings (class_id, week);
create index on public.recordings (created_by);
create index on public.materials (class_id, week);
create index on public.materials (created_by);

-- ---------- Access helpers (private schema: not exposed through the API) ----------
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create function private.teaches(p_class uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.class_teachers
    where class_id = p_class and teacher_id = (select auth.uid())
  );
$$;

create function private.enrolled_in(p_class uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments
    where class_id = p_class
      and student_id = (select auth.uid())
      and status in ('active', 'completed')
  );
$$;

create function private.can_view_class(p_class uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin() or private.teaches(p_class) or private.enrolled_in(p_class);
$$;

create function private.can_manage_class(p_class uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin() or private.teaches(p_class);
$$;

-- Can the current user see this other person's profile?
-- Teachers see students enrolled in their classes; students see their own teachers.
create function private.shares_class_with(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.class_teachers t
    join public.enrollments e on e.class_id = t.class_id
    where (t.teacher_id = (select auth.uid()) and e.student_id = p_user)
       or (e.student_id = (select auth.uid()) and e.status in ('active', 'completed') and t.teacher_id = p_user)
  );
$$;

-- Class id from a storage path '<class_id>/...', or null if it isn't one.
create function private.class_from_path(p_name text)
returns uuid language sql immutable set search_path = '' as $$
  select case
    when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_name, '/', 1)::uuid
  end;
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

-- ---------- Triggers ----------
-- Create a profile for every new auth user. Role comes from app_metadata
-- (server-controlled), never from user_metadata (user-editable).
create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Only admins (or the server) may change role, email, or id.
create function private.guard_profile_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not private.is_admin() then
    if new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.id is distinct from old.id then
      raise exception 'Only an admin can change role or email';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profile_update
  before update on public.profiles
  for each row execute function private.guard_profile_update();

create function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger recordings_touch
  before update on public.recordings
  for each row execute function private.touch_updated_at();

-- ---------- Row level security ----------
alter table public.profiles       enable row level security;
alter table public.courses        enable row level security;
alter table public.course_weeks   enable row level security;
alter table public.classes        enable row level security;
alter table public.class_teachers enable row level security;
alter table public.enrollments    enable row level security;
alter table public.recordings     enable row level security;
alter table public.materials      enable row level security;

-- profiles
create policy "profiles: read self, class contacts, or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.is_admin() or private.shares_class_with(id));
create policy "profiles: update self or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());
create policy "profiles: admin delete" on public.profiles
  for delete to authenticated using (private.is_admin());

-- courses & weeks: readable by any signed-in user, editable by admin
create policy "courses: read" on public.courses for select to authenticated using (true);
create policy "courses: admin insert" on public.courses for insert to authenticated with check (private.is_admin());
create policy "courses: admin update" on public.courses for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "courses: admin delete" on public.courses for delete to authenticated using (private.is_admin());

create policy "weeks: read" on public.course_weeks for select to authenticated using (true);
create policy "weeks: admin insert" on public.course_weeks for insert to authenticated with check (private.is_admin());
create policy "weeks: admin update" on public.course_weeks for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "weeks: admin delete" on public.course_weeks for delete to authenticated using (private.is_admin());

-- classes
create policy "classes: read own" on public.classes for select to authenticated using (private.can_view_class(id));
create policy "classes: admin insert" on public.classes for insert to authenticated with check (private.is_admin());
create policy "classes: admin update" on public.classes for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "classes: admin delete" on public.classes for delete to authenticated using (private.is_admin());

-- class_teachers
create policy "class_teachers: read" on public.class_teachers for select to authenticated
  using (private.is_admin() or teacher_id = (select auth.uid()) or private.enrolled_in(class_id));
create policy "class_teachers: admin insert" on public.class_teachers for insert to authenticated with check (private.is_admin());
create policy "class_teachers: admin delete" on public.class_teachers for delete to authenticated using (private.is_admin());

-- enrollments
create policy "enrollments: read" on public.enrollments for select to authenticated
  using (private.is_admin() or student_id = (select auth.uid()) or private.teaches(class_id));
create policy "enrollments: admin insert" on public.enrollments for insert to authenticated with check (private.is_admin());
create policy "enrollments: admin update" on public.enrollments for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "enrollments: admin delete" on public.enrollments for delete to authenticated using (private.is_admin());

-- recordings: the class can read; the class's teachers and admins can manage
create policy "recordings: class can read" on public.recordings for select to authenticated using (private.can_view_class(class_id));
create policy "recordings: teacher insert" on public.recordings for insert to authenticated with check (private.can_manage_class(class_id));
create policy "recordings: teacher update" on public.recordings for update to authenticated using (private.can_manage_class(class_id)) with check (private.can_manage_class(class_id));
create policy "recordings: teacher delete" on public.recordings for delete to authenticated using (private.can_manage_class(class_id));

-- materials
create policy "materials: class can read" on public.materials for select to authenticated using (private.can_view_class(class_id));
create policy "materials: teacher insert" on public.materials for insert to authenticated with check (private.can_manage_class(class_id));
create policy "materials: teacher update" on public.materials for update to authenticated using (private.can_manage_class(class_id)) with check (private.can_manage_class(class_id));
create policy "materials: teacher delete" on public.materials for delete to authenticated using (private.can_manage_class(class_id));

-- ---------- Storage: private bucket for class materials ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('class-materials', 'class-materials', false, 52428800)  -- 50 MB (free-plan max)
on conflict (id) do nothing;

create policy "class-materials: class can read" on storage.objects for select to authenticated
  using (bucket_id = 'class-materials' and private.can_view_class(private.class_from_path(name)));
create policy "class-materials: teacher upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'class-materials' and private.can_manage_class(private.class_from_path(name)));
create policy "class-materials: teacher update" on storage.objects for update to authenticated
  using (bucket_id = 'class-materials' and private.can_manage_class(private.class_from_path(name)))
  with check (bucket_id = 'class-materials' and private.can_manage_class(private.class_from_path(name)));
create policy "class-materials: teacher delete" on storage.objects for delete to authenticated
  using (bucket_id = 'class-materials' and private.can_manage_class(private.class_from_path(name)));

-- Nothing in the portal is public: anonymous visitors get no table access.
revoke all on all tables in schema public from anon;
