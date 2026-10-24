// =====================================================================
//  invite-user — admin-only. Invites a student or teacher by email and,
//  optionally, adds them to a class group in the same step.
//
//  POST { email, full_name?, role: "student" | "teacher" | "admin", class_id? }
//  Auth: the caller's Supabase session (Authorization: Bearer <jwt>).
//
//  If the person already has an account, no email is sent; they are just
//  added to the class (and their role is updated if it differs).
// =====================================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const ROLES = ["student", "teacher", "admin"] as const;
type Role = (typeof ROLES)[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 1. Who is calling, and are they an admin?
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: caller, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller?.user) return json({ error: "Sign in first." }, 401);
  const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", caller.user.id).single();
  if (callerProfile?.role !== "admin") return json({ error: "Only an admin can invite people." }, 403);

  // 2. Validate input
  let body: { email?: string; full_name?: string; role?: string; class_id?: string };
  try { body = await req.json(); } catch { return json({ error: "Send a JSON body." }, 400); }
  const email = (body.email ?? "").trim().toLowerCase();
  const role = (body.role ?? "student") as Role;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  if (!ROLES.includes(role)) return json({ error: "Role must be student, teacher, or admin." }, 400);
  if (body.class_id) {
    const { data: cls } = await admin.from("classes").select("id").eq("id", body.class_id).maybeSingle();
    if (!cls) return json({ error: "That class group doesn't exist." }, 400);
  }

  // 3. Existing account, or send an invite?
  let userId: string;
  let invited = false;
  const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing) {
    userId = existing.id;
  } else {
    const redirectTo = Deno.env.get("PORTAL_URL") ?? "https://bpcti.org/portal/";
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: body.full_name ?? null },
      redirectTo,
    });
    if (error || !data.user) return json({ error: `Couldn't send the invite: ${error?.message ?? "unknown error"}` }, 400);
    userId = data.user.id;
    invited = true;
  }

  // 4. Set role (server-side, so the profile guard allows it) and name
  const update: Record<string, unknown> = { role };
  if (body.full_name) update.full_name = body.full_name;
  const { error: roleErr } = await admin.from("profiles").update(update).eq("id", userId);
  if (roleErr) return json({ error: `Invited, but couldn't set the role: ${roleErr.message}` }, 500);

  // 5. Add to the class group
  if (body.class_id) {
    const { error: linkErr } = role === "teacher"
      ? await admin.from("class_teachers").upsert({ class_id: body.class_id, teacher_id: userId })
      : role === "student"
      ? await admin.from("enrollments").upsert({ class_id: body.class_id, student_id: userId, status: "active" })
      : { error: null };
    if (linkErr) return json({ error: `Added the person, but couldn't add them to the class: ${linkErr.message}` }, 500);
  }

  return json({ ok: true, user_id: userId, invited, role, class_id: body.class_id ?? null });
});
