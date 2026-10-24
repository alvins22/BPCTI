# BPCTI Student Portal — backend

Supabase project: **bpcti-portal** (`kknaakkfbqqdsabajmaf`, region us-west-1, free plan).

## Data model

| Table | What it holds |
|---|---|
| `profiles` | One row per user: email, name, role (`student`, `teacher`, `admin`). Created automatically when someone accepts an invite. |
| `courses`, `course_weeks` | The 8 specializations and their 12 weeks, seeded from the public site's `src/content/courses.js`. |
| `classes` | A **session**: one run of a class with its own start date, schedule, teachers, and students. |
| `class_teachers` | Which teachers teach which sessions. |
| `enrollments` | Which students are in which sessions (`active`, `completed`, `withdrawn`). |
| `recordings` | Zoom share link + passcode for a week of a **class** (course), shared by every session of that class. Must be a zoom.us / zoom.com link. |
| `materials` | Handouts for a week (or the whole class), shared by every session: a file in the private `class-materials` bucket (`<course_id>/<file>`) or a link. |

## Who can see what (enforced by row-level security)

- **Students** see only sessions they're enrolled in (`active` or `completed`) and their teachers, plus the shared recordings and materials of that class. Withdrawn students lose access.
- **Teachers** see only their assigned sessions and those students. They can add/edit/delete recordings and materials for any class they teach a session of; changes are shared with every session of that class.
- **Admins** see and manage everything, including creating sessions and enrollments.
- Signed-out visitors see nothing.
- Nobody but an admin (or the server) can change a role or email.

## Inviting people

`invite-user` edge function (admin only):

```http
POST /functions/v1/invite-user
Authorization: Bearer <admin's session token>
{ "email": "student@example.com", "full_name": "Jane Kim", "role": "student", "class_id": "<session uuid>" }
```

It emails an invite (or reuses an existing account), sets the role, and adds the person to the session.

## One-time setup in the Supabase dashboard

1. **Turn off public sign-ups:** Authentication → Sign In / Providers → disable "Allow new users to sign up". People join only by invite.
2. **Redirect URL:** Authentication → URL Configuration → set Site URL to `https://bpcti.org/portal/` and add it to Redirect URLs.
3. **First admin:** invite Abby (and yourself) from Authentication → Users → Invite user, then run:
   ```sql
   update public.profiles set role = 'admin' where email in ('abigail@bpcti.org');
   ```
   After that, admins invite everyone else through the portal.
4. **Email sender (before real launch):** Supabase's built-in email is rate-limited and meant for testing. Add custom SMTP (Authentication → Emails → SMTP) so invites come from a bpcti.org address.

## Files

- `migrations/20261024150000_portal_schema.sql` — tables, access rules, triggers, storage bucket
- `migrations/20261024150100_seed_courses.sql` — courses and weeks
- `migrations/20261024193000_shared_class_library.sql` — recordings and materials moved from sessions to classes
- `functions/invite-user/index.ts` — admin invite function
