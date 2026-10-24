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
      return unwrap(sb.from("profiles").select("id, email, full_name, role").eq("id", s.user.id).single());
    },
    async updateMyName(id, full_name) { await unwrap(sb.from("profiles").update({ full_name }).eq("id", id)); },

    // ---------- courses ----------
    courses() { return unwrap(sb.from("courses").select("*").order("program").order("specialization")); },
    weeks(courseId) { return unwrap(sb.from("course_weeks").select("*").eq("course_id", courseId).order("week")); },

    // ---------- classes ----------
    classes() {
      return unwrap(sb.from("classes").select("*, course:courses(id, program, specialization, title)").order("start_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }));
    },
    getClass(id) {
      return unwrap(sb.from("classes").select("*, course:courses(id, program, specialization, title, tagline)").eq("id", id).maybeSingle());
    },
    async teachers(classId) {
      const rows = await unwrap(sb.from("class_teachers").select("teacher:profiles(id, full_name, email)").eq("class_id", classId));
      return rows.map((r) => r.teacher).filter(Boolean);
    },
    async roster(classId) {
      const rows = await unwrap(sb.from("enrollments").select("status, enrolled_at, student:profiles(id, full_name, email)").eq("class_id", classId).order("enrolled_at"));
      return rows.filter((r) => r.student).map((r) => ({ ...r.student, status: r.status, enrolled_at: r.enrolled_at }));
    },
    async myEnrollment(classId, userId) {
      return unwrap(sb.from("enrollments").select("status").eq("class_id", classId).eq("student_id", userId).maybeSingle());
    },

    // ---------- recordings ----------
    recordings(classId) { return unwrap(sb.from("recordings").select("*").eq("class_id", classId).order("week").order("created_at")); },
    addRecording(rec) { return unwrap(sb.from("recordings").insert(rec).select().single()); },
    updateRecording(id, patch) { return unwrap(sb.from("recordings").update(patch).eq("id", id).select().single()); },
    deleteRecording(id) { return unwrap(sb.from("recordings").delete().eq("id", id)); },

    // ---------- materials ----------
    materials(classId) { return unwrap(sb.from("materials").select("*").eq("class_id", classId).order("week", { nullsFirst: true }).order("created_at")); },
    async addMaterialFile(classId, week, title, file) {
      const path = `${classId}/${uuid()}-${safeName(file.name)}`;
      await unwrap(sb.storage.from("class-materials").upload(path, file, { upsert: false, contentType: file.type || undefined }));
      try {
        return await unwrap(sb.from("materials").insert({ class_id: classId, week, title, storage_path: path }).select().single());
      } catch (e) {
        await sb.storage.from("class-materials").remove([path]);
        throw e;
      }
    },
    addMaterialLink(classId, week, title, url) {
      return unwrap(sb.from("materials").insert({ class_id: classId, week, title, external_url: url }).select().single());
    },
    async deleteMaterial(m) {
      if (m.storage_path) await sb.storage.from("class-materials").remove([m.storage_path]);
      await unwrap(sb.from("materials").delete().eq("id", m.id));
    },
    async materialUrl(m) {
      if (m.external_url) return m.external_url;
      const d = await unwrap(sb.storage.from("class-materials").createSignedUrl(m.storage_path, 120, { download: m.storage_path.split("/").pop().replace(/^[0-9a-f-]{36}-/, "") }));
      return d.signedUrl;
    },

    // ---------- admin ----------
    people() { return unwrap(sb.from("profiles").select("id, email, full_name, role, created_at").order("role").order("full_name")); },
    setRole(id, role) { return unwrap(sb.from("profiles").update({ role }).eq("id", id)); },
    createClass(c) { return unwrap(sb.from("classes").insert(c).select().single()); },
    updateClass(id, patch) { return unwrap(sb.from("classes").update(patch).eq("id", id).select().single()); },
    deleteClass(id) { return unwrap(sb.from("classes").delete().eq("id", id)); },
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
