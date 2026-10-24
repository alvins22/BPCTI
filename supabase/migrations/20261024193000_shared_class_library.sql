-- =====================================================================
--  Recordings and materials belong to the CLASS (course, e.g. English A)
--  and are shared by every SESSION of it. A session (table: classes) has
--  its own start date, teachers, and students.
--
--  Access:
--   - Read: admins, teachers of any session of the class, and students
--     enrolled (active/completed) in any session of the class.
--   - Manage: admins and teachers of any session of the class.
--  Both tables were empty when this ran, so they are recreated.
-- =====================================================================

drop policy if exists "class-materials: class can read" on storage.objects;
drop policy if exists "class-materials: teacher upload" on storage.objects;
drop policy if exists "class-materials: teacher update" on storage.objects;
drop policy if exists "class-materials: teacher delete" on storage.objects;

drop table public.recordings;
drop table public.materials;
drop function if exists private.class_from_path(text);

comment on table public.classes is 'A session: one class (course) taught to one group of students, with its own start date, schedule, and teachers.';

-- ---------- Access helpers ----------
create function private.teaches_course(p_course text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.class_teachers t
    join public.classes s on s.id = t.class_id
    where s.course_id = p_course and t.teacher_id = (select auth.uid())
  );
$$;

create function private.enrolled_in_course(p_course text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e
    join public.classes s on s.id = e.class_id
    where s.course_id = p_course
      and e.student_id = (select auth.uid())
      and e.status in ('active', 'completed')
  );
$$;

create function private.can_view_course(p_course text)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin() or private.teaches_course(p_course) or private.enrolled_in_course(p_course);
$$;

create function private.can_manage_course(p_course text)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin() or private.teaches_course(p_course);
$$;

revoke all on function private.teaches_course(text), private.enrolled_in_course(text),
  private.can_view_course(text), private.can_manage_course(text) from public;
grant execute on function private.teaches_course(text), private.enrolled_in_course(text),
  private.can_view_course(text), private.can_manage_course(text) to authenticated;

-- ---------- Tables ----------
create table public.recordings (
  id           uuid primary key default gen_random_uuid(),
  course_id    text not null references public.courses (id) on delete cascade,
  week         smallint not null check (week between 1 and 12),
  title        text,
  zoom_url     text not null check (zoom_url ~* '^https://([a-z0-9-]+\.)*zoom\.(us|com)/'),
  passcode     text,
  recorded_on  date,
  created_by   uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.recordings is 'Zoom recording links for a class week, shared by every session of that class.';

create table public.materials (
  id            uuid primary key default gen_random_uuid(),
  course_id     text not null references public.courses (id) on delete cascade,
  week          smallint check (week between 1 and 12),   -- null = whole-class material
  title         text not null,
  storage_path  text,                                     -- '<course_id>/<file>' in the class-materials bucket
  external_url  text,
  created_by    uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now(),
  check (num_nonnulls(storage_path, external_url) = 1),
  check (storage_path is null or split_part(storage_path, '/', 1) = course_id)
);
comment on table public.materials is 'Handouts for a class week (or the whole class), shared by every session of that class.';

create index on public.recordings (course_id, week);
create index on public.recordings (created_by);
create index on public.materials (course_id, week);
create index on public.materials (created_by);

create trigger recordings_touch
  before update on public.recordings
  for each row execute function private.touch_updated_at();

alter table public.recordings enable row level security;
alter table public.materials  enable row level security;

create policy "recordings: class can read" on public.recordings for select to authenticated using (private.can_view_course(course_id));
create policy "recordings: teacher insert" on public.recordings for insert to authenticated with check (private.can_manage_course(course_id));
create policy "recordings: teacher update" on public.recordings for update to authenticated using (private.can_manage_course(course_id)) with check (private.can_manage_course(course_id));
create policy "recordings: teacher delete" on public.recordings for delete to authenticated using (private.can_manage_course(course_id));

create policy "materials: class can read" on public.materials for select to authenticated using (private.can_view_course(course_id));
create policy "materials: teacher insert" on public.materials for insert to authenticated with check (private.can_manage_course(course_id));
create policy "materials: teacher update" on public.materials for update to authenticated using (private.can_manage_course(course_id)) with check (private.can_manage_course(course_id));
create policy "materials: teacher delete" on public.materials for delete to authenticated using (private.can_manage_course(course_id));

revoke all on public.recordings, public.materials from anon;

-- ---------- Storage: files live under '<course_id>/' ----------
create policy "class-materials: class can read" on storage.objects for select to authenticated
  using (bucket_id = 'class-materials' and private.can_view_course(split_part(name, '/', 1)));
create policy "class-materials: teacher upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'class-materials' and private.can_manage_course(split_part(name, '/', 1)));
create policy "class-materials: teacher update" on storage.objects for update to authenticated
  using (bucket_id = 'class-materials' and private.can_manage_course(split_part(name, '/', 1)))
  with check (bucket_id = 'class-materials' and private.can_manage_course(split_part(name, '/', 1)));
create policy "class-materials: teacher delete" on storage.objects for delete to authenticated
  using (bucket_id = 'class-materials' and private.can_manage_course(split_part(name, '/', 1)));
