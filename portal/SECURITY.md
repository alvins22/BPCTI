# BPCTI Portal — privacy & recording checklist

What the portal enforces (in the database, not just the screens), and what BPCTI still has to do by process.

## Enforced by the portal

| Requirement | How |
|---|---|
| Individual accounts, no shared logins | Invite-only accounts tied to one email; public sign-up turned off in Supabase. |
| Students see only enrolled classes | Row-level security on every table; withdrawn students lose access immediately. |
| No instructor materials for students | Materials marked **Instructor only** are filtered by the database, and their files sit in a separate storage folder students can't read. |
| Teachers limited to assigned classes | Teachers see only their sessions' students and records; they manage the library only for classes they teach. |
| Individual recordings and feedback private | `student_records` readable only by that student, the session's teachers, and admins. |
| Class discussion recordings stay in their session | Recordings default to "only this session" when added from a session; "all sessions" is for lectures. |
| Recording notice before access | Students must accept the current notice before any recording or private record is shown; acceptance is stored with date and version. |
| Revoke access | Admins can withdraw a student from a session, or deactivate an account entirely (People page). |
| Recording links never public | Links and passcodes exist only in the database behind sign-in; nothing is published on bpcti.org. |
| Retention | Each recording and private record can have an "available until" date, after which students no longer see it. |
| Secure password reset | Supabase email reset links; passwords are never visible to BPCTI. |

## BPCTI process (the portal can't do these alone)

1. **Approve the recording notice text.** The current text in `portal/app.js` (`NOTICE`) is a draft. Washington generally requires consent from everyone being recorded in a private conversation; have the wording reviewed before enrolling students. If the text changes, bump the version in both `app.js` and `private.recording_notice_version()` so everyone re-accepts.
2. **Announce recording at the start of each class** and let students turn off camera or opt out of being recorded where possible.
3. **Zoom settings on every shared recording:** passcode on, "Viewers can download" off, expiration date set, "Only authenticated users can view" off unless every student has a Zoom account.
4. **Delete old recordings** from Zoom on a schedule (e.g. 90 days after a session ends). Removing the Zoom recording is what actually ends access; the portal date only hides the link.
5. **Upgrade Supabase to Pro before real student data** (daily backups, no auto-pausing, leaked-password protection), and set up a bpcti.org email sender for invites.

## Known limits

- A student who can watch a recording can still screen-record it. No web system can fully prevent that.
- Downloaded PDFs can be forwarded. Use watermarks or "for enrolled students only" footers if that matters.
