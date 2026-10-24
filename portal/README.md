# BPCTI Student Portal

Served at **https://bpcti.org/portal/** by GitHub Pages (plain static files, no build step). The backend is the Supabase project described in `../supabase/README.md`.

## Files

| File | What it does |
|---|---|
| `index.html` | The real portal. |
| `demo.html` | Same screens with sample data and a "View as" switch (student / teacher / admin). Nothing is saved. Use it to show the portal without real logins. |
| `app.js` | All screens: sign-in, set password, classes, class library, sessions, week pages, people, account. |
| `api.js` | Talks to Supabase. Every screen goes through it. |
| `demo-api.js`, `demo-data.js` | Sample-data stand-in for `api.js`, used by `demo.html`. |
| `config.js` | Supabase URL and publishable key (safe to be public; the database enforces all access rules). |
| `vendor/supabase-2.117.3.js` | Supabase JS client, bundled so the portal has no CDN dependency. |

## Classes and sessions

- A **class** is one of the 8 specializations (e.g. English A). It has one shared **library**: recordings and materials for each of its 12 weeks.
- A **session** is one run of a class with its own start date, schedule, teacher, and students. Every session of a class sees the same library; week dates come from the session's start date.

## Who sees what

- **Students:** their session, the 12 weeks with this week highlighted, the class's Zoom recordings with passcodes, materials, and the live-class link.
- **Teachers:** their sessions and students; they can add/edit/delete the shared recordings and materials of classes they teach.
- **Admins:** everything, plus creating sessions, assigning teachers, inviting people, changing enrollment status, and roles.

## How people get in

1. Abby invites someone (People → Invite someone, or from a session page).
2. They get an email, click the link, and choose a password on the portal.
3. Next time they sign in at bpcti.org/portal with their email and password. "Forgot your password?" sends a reset link.

For invite and reset links to land here, the Supabase dashboard must list `https://bpcti.org/portal/` under Authentication → URL Configuration (see `../supabase/README.md`).

## Local testing

```sh
python3 -m http.server 8000   # from the repo root, then open http://localhost:8000/portal/demo.html
```
