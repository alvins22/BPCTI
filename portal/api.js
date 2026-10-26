// =====================================================================
//  BPCTI Portal — data layer (Supabase). Every screen goes through
//  window.API, so the demo build can swap in demo-api.js.
//  All access control is enforced in the database (row-level security);
//  this file never decides who may see what.
// =====================================================================
(function () {
  const C = window.PORTAL_CONFIG;
  // Capture what kind of auth link brought the user here before the
  // client consumes the URL hash.
  const h = location.hash || "";
  const linkType = /type=(invite|recovery|signup|magiclink)/.exec(h)?.[1] || null;
  const linkError = /error_description=([^&]+)/.exec(h)?.[1] || null;

  const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" },
  });

  async function unwrap(p) {
    const { data, error } = await p;
    if (error) throw new Error(error.message || "Something went wrong. Please try again.");
    return data;
  }
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
  const safeName = (n) => n.normalize("NFKD").replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-").slice(-80) || "file";

  const API = {
    demo: false,
    linkType: () => linkType,
    linkError: () => (linkError ? decodeURIComponent(linkError.replace(/\+/g, " ")) : null),

    // ---------- auth ----------
    async session() { return (await sb.auth.getSession()).data.session; },
    onAuth(cb) { sb.auth.onAuthStateChange((event, session) => cb(event, session)); },
    async signIn(email, password) { await unwrap(sb.auth.signInWithPassword({ email, password })); },
    async signOut() { await sb.auth.signOut(); },
    async sendReset(email) {
      await unwrap(sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }));
    },
    async setPassword(password) { await unwrap(sb.auth.updateUser({ password })); },

    // ---------- me ----------
    async me() {
      const s = await this.session();
      if (!s) return null;
      return unwrap(sb.from("profiles").select("id, email, full_name, role, is_active").eq("id", s.user.id).single());
    },
    async updateMyName(id, full_name) { await unwrap(sb.from("profiles").update({ full_name }).eq("id", id)); },

    // ---------- recording notice ----------
    async hasAcceptedNotice(userId, version) {
      const rows = await unwrap(sb.from("consents").select("version").eq("user_id", userId).eq("kind", "recording_notice").eq("version", version));
      return rows.length > 0;
    },
    acceptNotice(userId, version) { return unwrap(sb.from("consents").insert({ user_id: userId, kind: "recording_notice", version })); },
    async noticeStatus(userIds, version) {
      if (!userIds.length) return {};
      const rows = await unwrap(sb.from("consents").select("user_id, accepted_at").eq("kind", "recording_notice").eq("version", version).in("user_id", userIds));
      return Object.fromEntries(rows.map((r) => [r.user_id, r.accepted_at]));
    },

    // ---------- courses ----------
    courses() { return unwrap(sb.from("courses").select("*").order("program").order("specialization")); },
    weeks(courseId) { return unwrap(sb.from("course_weeks").select("*").eq("course_id", courseId).order("week")); },
    updateWeek(courseId, week, patch) {
      return unwrap(sb.from("course_weeks").update({ ...patch, updated_at: new Date().toISOString() }).eq("course_id", courseId).eq("week", week).select().single());
    },

    // ---------- sessions (table: classes) ----------
    sessions() {
      return unwrap(sb.from("classes").select("*, course:courses(id, program, specialization, title)").order("start_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }));
    },
    getSession(id) {
      return unwrap(sb.from("classes").select("*, course:courses(id, program, specialization, title, tagline)").eq("id", id).maybeSingle());
    },
    async teachers(sessionId) {
      const rows = await unwrap(sb.from("class_teachers").select("teacher:profiles(id, full_name, email)").eq("class_id", sessionId));
      return rows.map((r) => r.teacher).filter(Boolean);
    },
    async roster(sessionId) {
      const rows = await unwrap(sb.from("enrollments").select("status, enrolled_at, student:profiles(id, full_name, email, is_active)").eq("class_id", sessionId).order("enrolled_at"));
      return rows.filter((r) => r.student).map((r) => ({ ...r.student, status: r.status, enrolled_at: r.enrolled_at }));
    },

    // ---------- class library (shared by every session of a class) ----------
    recordings(courseId) { return unwrap(sb.from("recordings").select("*").eq("course_id", courseId).order("week").order("created_at")); },
    addRecording(rec) { return unwrap(sb.from("recordings").insert(rec).select().single()); },
    updateRecording(id, patch) { return unwrap(sb.from("recordings").update(patch).eq("id", id).select().single()); },
    deleteRecording(id) { return unwrap(sb.from("recordings").delete().eq("id", id)); },

    // category: "student" | "resource" | "instructor" (instructor = staff only)
    materials(courseId) { return unwrap(sb.from("materials").select("*").eq("course_id", courseId).order("week", { nullsFirst: true }).order("created_at")); },
    async addMaterialFile(courseId, week, category, title, file) {
      const path = `${courseId}/${category}/${uuid()}-${safeName(file.name)}`;
      await unwrap(sb.storage.from("class-materials").upload(path, file, { upsert: false, contentType: file.type || undefined }));
      try {
        return await unwrap(sb.from("materials").insert({ course_id: courseId, week, category, title, storage_path: path }).select().single());
      } catch (e) {
        await sb.storage.from("class-materials").remove([path]);
        throw e;
      }
    },
    addMaterialLink(courseId, week, category, title, url) {
      return unwrap(sb.from("materials").insert({ course_id: courseId, week, category, title, external_url: url }).select().single());
    },
    async replaceMaterialFile(m, file) {
      const path = `${m.course_id}/${m.category}/${uuid()}-${safeName(file.name)}`;
      await unwrap(sb.storage.from("class-materials").upload(path, file, { upsert: false, contentType: file.type || undefined }));
      try {
        await unwrap(sb.from("materials").update({ storage_path: path, external_url: null }).eq("id", m.id));
      } catch (e) {
        await sb.storage.from("class-materials").remove([path]);
        throw e;
      }
      if (m.storage_path) await sb.storage.from("class-materials").remove([m.storage_path]);
    },
    updateMaterial(id, patch) { return unwrap(sb.from("materials").update(patch).eq("id", id)); },
    async deleteMaterial(m) {
      if (m.storage_path) await sb.storage.from("class-materials").remove([m.storage_path]);
      await unwrap(sb.from("materials").delete().eq("id", m.id));
    },
    async materialUrl(m) {
      if (m.external_url) return m.external_url;
      const d = await unwrap(sb.storage.from("class-materials").createSignedUrl(m.storage_path, 120, { download: m.storage_path.split("/").pop().replace(/^[0-9a-f-]{36}-/, "") }));
      return d.signedUrl;
    },

    // ---------- individual recordings & feedback ----------
    studentRecords(sessionId, studentId) {
      let q = sb.from("student_records").select("*").eq("session_id", sessionId);
      if (studentId) q = q.eq("student_id", studentId);
      return unwrap(q.order("week", { nullsFirst: true }).order("created_at"));
    },
    addStudentRecord(r) { return unwrap(sb.from("student_records").insert(r).select().single()); },
    updateStudentRecord(id, patch) { return unwrap(sb.from("student_records").update(patch).eq("id", id).select().single()); },
    deleteStudentRecord(id) { return unwrap(sb.from("student_records").delete().eq("id", id)); },

    // Does the signed-in user teach any session of this class?
    async teachesCourse(courseId, userId) {
      const rows = await unwrap(sb.from("class_teachers").select("class_id, session:classes!inner(course_id)").eq("teacher_id", userId).eq("session.course_id", courseId).limit(1));
      return rows.length > 0;
    },

    // ---------- admin ----------
    people() { return unwrap(sb.from("profiles").select("id, email, full_name, role, is_active, created_at").order("role").order("full_name")); },
    setRole(id, role) { return unwrap(sb.from("profiles").update({ role }).eq("id", id)); },
    setActive(id, is_active) { return unwrap(sb.from("profiles").update({ is_active }).eq("id", id)); },
    createSession(c) { return unwrap(sb.from("classes").insert(c).select().single()); },
    updateSession(id, patch) { return unwrap(sb.from("classes").update(patch).eq("id", id).select().single()); },
    deleteSession(id) { return unwrap(sb.from("classes").delete().eq("id", id)); },
    addTeacher(classId, teacherId) { return unwrap(sb.from("class_teachers").upsert({ class_id: classId, teacher_id: teacherId })); },
    removeTeacher(classId, teacherId) { return unwrap(sb.from("class_teachers").delete().eq("class_id", classId).eq("teacher_id", teacherId)); },
    enroll(classId, studentId) { return unwrap(sb.from("enrollments").upsert({ class_id: classId, student_id: studentId, status: "active" })); },
    setEnrollment(classId, studentId, status) { return unwrap(sb.from("enrollments").update({ status }).eq("class_id", classId).eq("student_id", studentId)); },
    async invite(payload) {
      const { data, error } = await sb.functions.invoke("invite-user", { body: payload });
      if (error) {
        let msg = error.message;
        try { msg = (await error.context.json()).error || msg; } catch (_) {}
        throw new Error(msg);
      }
      return data;
    },
  };

  window.API = API;
})();
