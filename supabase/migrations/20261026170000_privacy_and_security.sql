-- =====================================================================
--  Portal privacy & security (Abby's plan, Oct 25 2026, Part IV–V)
--
--  1. Account deactivation: profiles.is_active. A deactivated user can
--     still sign in but every access helper returns false, so they see
--     nothing but their own profile. Only admins can change it.
--  2. Materials have a category: 'student' (student materials, PDFs),
--     'resource' (additional resources), 'instructor' (teacher-only,
--     e.g. Word lesson plans, answer keys, rubrics). Students never see
--     'instructor' rows or files.
--  3. Recordings can be shared with every session of a class
--     (session_id null) or limited to one session. Optional
--     available_until hides a recording from students after that date.
--  4. student_records: individual interview recordings and personal
--     feedback, visible only to that student, the session's teachers,
--     and admins.
--  5. consents: students accept the recording notice before they can
--     see any recording.
--  6. Week content (objectives, overview, assignment) can be filled in
--     by admins and the class's teachers. Title, description and
--     practical training stay in sync with the public website.
-- =====================================================================

-- ---------- 1. Account deactivation ----------
alter table public.profiles add column is_active boolean not null default true;

create function private.is_active()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select is_active from public.profiles where id = (select auth.uid())), false);
$$;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and is_active
  );
$$;

create or replace function private.teaches(p_class uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active() and exists (
    select 1 from public.class_teachers
    where class_id = p_class and teacher_id = (select auth.uid())
  );
$$;

create or replace function private.enrolled_in(p_class uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active() and exists (
    select 1 from public.enrollments
    where class_id = p_class and student_id = (select auth.uid()) and status in ('active', 'completed')
  );
$$;

create or replace function private.teaches_course(p_course text)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active() and exists (
    select 1 from public.class_teachers t
    join public.classes s on s.id = t.class_id
    where s.course_id = p_course and t.teacher_id = (select auth.uid())
  );
$$;

create or replace function private.enrolled_in_course(p_course text)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active() and exists (
    select 1 from public.enrollments e
    join public.classes s on s.id = e.class_id
    where s.course_id = p_course and e.student_id = (select auth.uid()) and e.status in ('active', 'completed')
  );
$$;

create or replace function private.shares_class_with(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_active() and exists (
    select 1
    from public.class_teachers t
    join public.enrollments e on e.class_id = t.class_id
    where (t.teacher_id = (select auth.uid()) and e.student_id = p_user)
       or (e.student_id = (select auth.uid()) and e.status in ('active', 'completed') and t.teacher_id = p_user)
  );
$$;

-- Only admins (or the server) may change role, email, id, or active status.
create or replace function private.guard_profile_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not private.is_admin() then
    if new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.id is distinct from old.id
       or new.is_active is distinct from old.is_active then
      raise exception 'Only an admin can change role, email, or account status';
    end if;
  end if;
  if (select auth.uid()) = old.id and new.is_active = false then
    raise exception 'You cannot deactivate your own account';
  end if;
  return new;
end;
$$;

-- ---------- 5. Recording consent ----------
create table public.consents (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  kind         text not null check (kind in ('recording_notice')),
  version      text not null,
  accepted_at  timestamptz not null default now(),
  primary key (user_id, kind, version)
);
comment on table public.consents is 'Notices a user has accepted, e.g. the recording notice (by version).';
alter table public.consents enable row level security;
create policy "consents: read own, class staff, admin" on public.consents for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin() or private.shares_class_with(user_id));
create policy "consents: accept own" on public.consents for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_active());
create policy "consents: admin delete" on public.consents for delete to authenticated using (private.is_admin());

-- Current recording notice version. Bump it (new migration) when the notice text changes.
create function private.recording_notice_version()
returns text language sql immutable set search_path = '' as $$ select '2026-10'; $$;

create function private.accepted_recording_notice()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.consents
    where user_id = (select auth.uid()) and kind = 'recording_notice' and version = private.recording_notice_version()
  );
$$;

-- ---------- 3. Recordings: shared or one session; availability ----------
alter table public.recordings
  add column session_id uuid references public.classes (id) on delete cascade,
  add column available_until date;
create index on public.recordings (session_id);
comment on column public.recordings.session_id is 'Null = shared with every session of the class. Set = only this session.';
comment on column public.recordings.available_until is 'Students stop seeing the recording after this date. Staff always see it.';

create function private.check_recording_session()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.session_id is not null and not exists (
    select 1 from public.classes where id = new.session_id and course_id = new.course_id
  ) then
    raise exception 'That session does not belong to this class';
  end if;
  return new;
end;
$$;
create trigger recordings_session_check before insert or update on public.recordings
  for each row execute function private.check_recording_session();

drop policy "recordings: class can read" on public.recordings;
drop policy "recordings: teacher insert" on public.recordings;
drop policy "recordings: teacher update" on public.recordings;
drop policy "recordings: teacher delete" on public.recordings;

create function private.can_manage_recording(p_course text, p_session uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case when p_session is null then private.can_manage_course(p_course)
              else private.is_admin() or private.teaches(p_session) end;
$$;

create policy "recordings: read" on public.recordings for select to authenticated using (
  private.can_manage_recording(course_id, session_id)
  or (
    private.accepted_recording_notice()
    and (available_until is null or available_until >= current_date)
    and case when session_id is null then private.enrolled_in_course(course_id)
             else private.enrolled_in(session_id) end
  )
);
create policy "recordings: insert" on public.recordings for insert to authenticated with check (private.can_manage_recording(course_id, session_id));
create policy "recordings: update" on public.recordings for update to authenticated
  using (private.can_manage_recording(course_id, session_id)) with check (private.can_manage_recording(course_id, session_id));
create policy "recordings: delete" on public.recordings for delete to authenticated using (private.can_manage_recording(course_id, session_id));

-- ---------- 2. Materials: student / resource / instructor ----------
alter table public.materials
  add column category text not null default 'student' check (category in ('student', 'resource', 'instructor')),
  add column updated_at timestamptz not null default now();
alter table public.materials drop constraint if exists materials_check1;
alter table public.materials add constraint materials_path_matches
  check (storage_path is null or (split_part(storage_path, '/', 1) = course_id and split_part(storage_path, '/', 2) = category));
comment on column public.materials.category is 'student = student materials (PDF); resource = additional resources; instructor = teachers and admins only.';
create trigger materials_touch before update on public.materials for each row execute function private.touch_updated_at();

drop policy "materials: class can read" on public.materials;
create policy "materials: read" on public.materials for select to authenticated using (
  private.can_manage_course(course_id)
  or (category <> 'instructor' and private.can_view_course(course_id))
);

-- Storage paths are now '<course_id>/<category>/<file>'
drop policy "class-materials: class can read" on storage.objects;
create policy "class-materials: read" on storage.objects for select to authenticated using (
  bucket_id = 'class-materials' and (
    private.can_manage_course(split_part(name, '/', 1))
    or (split_part(name, '/', 2) in ('student', 'resource') and private.can_view_course(split_part(name, '/', 1)))
  )
);

-- ---------- 4. Individual recordings & personal feedback ----------
create table public.student_records (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.classes (id) on delete cascade,
  student_id       uuid not null references public.profiles (id) on delete cascade,
  week             smallint check (week between 1 and 12),
  title            text not null,
  zoom_url         text check (zoom_url ~* '^https://([a-z0-9-]+\.)*zoom\.(us|com)/'),
  passcode         text,
  feedback         text,
  available_until  date,
  created_by       uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (num_nonnulls(zoom_url, feedback) >= 1)
);
comment on table public.student_records is 'Individual interview recordings and personal feedback. Visible only to the student, the session''s teachers, and admins.';
create index on public.student_records (session_id, student_id);
create index on public.student_records (student_id);
create index on public.student_records (created_by);
create trigger student_records_touch before update on public.student_records for each row execute function private.touch_updated_at();

create function private.check_student_record()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.enrollments where class_id = new.session_id and student_id = new.student_id) then
    raise exception 'That student is not in this session';
  end if;
  return new;
end;
$$;
create trigger student_records_check before insert or update on public.student_records
  for each row execute function private.check_student_record();

alter table public.student_records enable row level security;
create policy "student_records: read" on public.student_records for select to authenticated using (
  private.is_admin()
  or private.teaches(session_id)
  or (
    student_id = (select auth.uid())
    and private.enrolled_in(session_id)
    and private.accepted_recording_notice()
    and (available_until is null or available_until >= current_date)
  )
);
create policy "student_records: insert" on public.student_records for insert to authenticated with check (private.is_admin() or private.teaches(session_id));
create policy "student_records: update" on public.student_records for update to authenticated
  using (private.is_admin() or private.teaches(session_id)) with check (private.is_admin() or private.teaches(session_id));
create policy "student_records: delete" on public.student_records for delete to authenticated using (private.is_admin() or private.teaches(session_id));

-- ---------- 6. Week content ----------
alter table public.course_weeks
  add column learning_objectives text,
  add column lesson_overview text,
  add column assignment text,
  add column updated_at timestamptz;
comment on column public.course_weeks.learning_objectives is 'One objective per line. Filled in by admins or the class''s teachers.';

drop policy "weeks: admin update" on public.course_weeks;
create policy "weeks: admin or class teacher update" on public.course_weeks for update to authenticated
  using (private.is_admin() or private.teaches_course(course_id))
  with check (private.is_admin() or private.teaches_course(course_id));
-- Teachers (and the app) may only edit the portal-only fields; title,
-- description and practical training stay in sync with the website.
revoke update on public.course_weeks from authenticated;
grant update (learning_objectives, lesson_overview, assignment, updated_at) on public.course_weeks to authenticated;

-- ---------- Grants ----------
revoke all on function private.is_active(), private.accepted_recording_notice(), private.recording_notice_version(),
  private.can_manage_recording(text, uuid) from public;
grant execute on function private.is_active(), private.accepted_recording_notice(), private.recording_notice_version(),
  private.can_manage_recording(text, uuid) to authenticated;
revoke all on public.consents, public.student_records from anon;
