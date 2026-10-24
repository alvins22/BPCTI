// =====================================================================
//  BPCTI Portal — DEMO data layer. Same interface as api.js, backed by
//  sample data in memory, with the database's access rules mirrored so
//  each persona sees what they would see for real. Nothing is saved.
// =====================================================================
(function () {
  const iso = (d) => d.toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
  const id = () => Math.random().toString(16).slice(2, 10) + "-demo";
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const wait = (v) => new Promise((r) => setTimeout(() => r(clone(v)), 60));

  const people = [
    { id: "u-abby", email: "abbyruthsung@gmail.com", full_name: "Abigail Ruth Sung", role: "admin", created_at: iso(daysAgo(30)) },
    { id: "u-sarah", email: "sarah.lee@example.com", full_name: "Sarah Lee", role: "teacher", created_at: iso(daysAgo(25)) },
    { id: "u-minjun", email: "minjun.park@example.com", full_name: "Min-jun Park", role: "teacher", created_at: iso(daysAgo(25)) },
    { id: "u-daniel", email: "daniel.kim@example.com", full_name: "Daniel Kim", role: "student", created_at: iso(daysAgo(20)) },
    { id: "u-grace", email: "grace.cho@example.com", full_name: "Grace Cho", role: "student", created_at: iso(daysAgo(20)) },
    { id: "u-maria", email: "maria.lopez@example.com", full_name: "Maria Lopez", role: "student", created_at: iso(daysAgo(19)) },
    { id: "u-james", email: "james.ito@example.com", full_name: "James Ito", role: "student", created_at: iso(daysAgo(10)) },
  ];
  const classes = [
    { id: "c-eng-a", course_id: "english-a", name: "English A · Fall 2026 · Mornings", start_date: iso(daysAgo(16)), schedule: "Tue & Thu, 9:00–11:00 AM", live_meeting_url: "https://us06web.zoom.us/j/0000000000", status: "active", created_at: iso(daysAgo(21)) },
    { id: "c-kor-b", course_id: "korean-b", name: "Korean B · Winter 2027 · Evenings", start_date: iso(daysAgo(-24)), schedule: "Mon & Wed, 6:30–8:30 PM", live_meeting_url: null, status: "planned", created_at: iso(daysAgo(5)) },
  ];
  const class_teachers = [{ class_id: "c-eng-a", teacher_id: "u-sarah" }, { class_id: "c-kor-b", teacher_id: "u-minjun" }];
  const enrollments = [
    { class_id: "c-eng-a", student_id: "u-daniel", status: "active", enrolled_at: iso(daysAgo(18)) },
    { class_id: "c-eng-a", student_id: "u-grace", status: "active", enrolled_at: iso(daysAgo(18)) },
    { class_id: "c-eng-a", student_id: "u-maria", status: "withdrawn", enrolled_at: iso(daysAgo(17)) },
    { class_id: "c-kor-b", student_id: "u-james", status: "active", enrolled_at: iso(daysAgo(4)) },
  ];
  const recordings = [
    { id: "r1", class_id: "c-eng-a", week: 1, title: null, zoom_url: "https://us06web.zoom.us/rec/share/demo-week-1", passcode: "Wk1#7xQ2", recorded_on: iso(daysAgo(14)), created_at: iso(daysAgo(14)) },
    { id: "r2", class_id: "c-eng-a", week: 2, title: null, zoom_url: "https://us06web.zoom.us/rec/share/demo-week-2", passcode: "Wk2!m4Ra", recorded_on: iso(daysAgo(7)), created_at: iso(daysAgo(7)) },
  ];
  const materials = [
    { id: "m1", class_id: "c-eng-a", week: null, title: "Course syllabus and completion requirements", external_url: "https://bpcti.org/", storage_path: null, created_at: iso(daysAgo(16)) },
    { id: "m2", class_id: "c-eng-a", week: 2, title: "Personal value proposition worksheet", external_url: "https://bpcti.org/", storage_path: null, created_at: iso(daysAgo(8)) },
    { id: "m3", class_id: "c-eng-a", week: 3, title: "Achievement story template", external_url: "https://bpcti.org/", storage_path: null, created_at: iso(daysAgo(2)) },
  ];

  const PERSONAS = [
    { key: "student", label: "Student (Daniel)", uid: "u-daniel" },
    { key: "teacher", label: "Teacher (Sarah)", uid: "u-sarah" },
    { key: "admin", label: "Admin (Abby)", uid: "u-abby" },
  ];
  let persona = "student";
  try { persona = sessionStorage.getItem("bpcti-demo-persona") || "student"; } catch (_) {}
  let signedIn = true;
  const uid = () => PERSONAS.find((p) => p.key === persona).uid;
  const me = () => people.find((p) => p.id === uid());

  // Access rules mirrored from the database
  const isAdmin = () => me().role === "admin";
  const teaches = (c) => class_teachers.some((t) => t.class_id === c && t.teacher_id === uid());
  const enrolled = (c) => enrollments.some((e) => e.class_id === c && e.student_id === uid() && e.status !== "withdrawn");
  const canView = (c) => isAdmin() || teaches(c) || enrolled(c);
  const canManage = (c) => isAdmin() || teaches(c);
  const deny = () => Promise.reject(new Error("You don't have permission to do that."));
  const withCourse = (c) => ({ ...c, course: window.DEMO_COURSES.find((k) => k.id === c.course_id) });

  window.API = {
    demo: true,
    personas: () => PERSONAS,
    currentPersona: () => persona,
    setPersona(k) { persona = k; signedIn = true; try { sessionStorage.setItem("bpcti-demo-persona", k); } catch (_) {} },
    linkType: () => null,
    linkError: () => null,

    async session() { return signedIn ? { user: { id: uid() } } : null; },
    onAuth() {},
    async signIn() { signedIn = true; },
    async signOut() { signedIn = false; },
    async sendReset() {},
    async setPassword() {},

    me: async () => (signedIn ? clone(me()) : null),
    async updateMyName(_, full_name) { me().full_name = full_name; },

    courses: () => wait(window.DEMO_COURSES),
    weeks: (c) => wait(window.DEMO_WEEKS.filter((w) => w.course_id === c)),

    classes: () => wait(classes.filter((c) => canView(c.id)).map(withCourse)),
    getClass: (cid) => { const c = classes.find((x) => x.id === cid && canView(x.id)); return wait(c ? withCourse(c) : null); },
    teachers: (cid) => wait(canView(cid) ? class_teachers.filter((t) => t.class_id === cid).map((t) => people.find((p) => p.id === t.teacher_id)) : []),
    roster: (cid) => wait(canManage(cid) ? enrollments.filter((e) => e.class_id === cid).map((e) => ({ ...people.find((p) => p.id === e.student_id), status: e.status, enrolled_at: e.enrolled_at })) : []),

    recordings: (cid) => wait(canView(cid) ? recordings.filter((r) => r.class_id === cid) : []),
    addRecording(r) { if (!canManage(r.class_id)) return deny(); const row = { id: id(), created_at: iso(new Date()), ...r }; recordings.push(row); return wait(row); },
    updateRecording(rid, patch) { const r = recordings.find((x) => x.id === rid); if (!r || !canManage(r.class_id)) return deny(); Object.assign(r, patch); return wait(r); },
    deleteRecording(rid) { const i = recordings.findIndex((x) => x.id === rid); if (i < 0 || !canManage(recordings[i].class_id)) return deny(); recordings.splice(i, 1); return wait(null); },

    materials: (cid) => wait(canView(cid) ? materials.filter((m) => m.class_id === cid) : []),
    addMaterialFile(cid, week, title, file) { if (!canManage(cid)) return deny(); const row = { id: id(), class_id: cid, week, title, storage_path: `${cid}/${file.name}`, external_url: null, created_at: iso(new Date()), _blob: URL.createObjectURL(file) }; materials.push(row); return wait({ ...row }); },
    addMaterialLink(cid, week, title, url) { if (!canManage(cid)) return deny(); const row = { id: id(), class_id: cid, week, title, external_url: url, storage_path: null, created_at: iso(new Date()) }; materials.push(row); return wait(row); },
    deleteMaterial(m) { const i = materials.findIndex((x) => x.id === m.id); if (i < 0 || !canManage(materials[i].class_id)) return deny(); materials.splice(i, 1); return wait(null); },
    async materialUrl(m) { const row = materials.find((x) => x.id === m.id); return row.external_url || row._blob || "https://bpcti.org/"; },

    people: () => (isAdmin() ? wait(people) : wait(people.filter((p) => p.id === uid()))),
    setRole(pid, role) { if (!isAdmin()) return deny(); people.find((p) => p.id === pid).role = role; return wait(null); },
    createClass(c) { if (!isAdmin()) return deny(); const row = { id: id(), created_at: iso(new Date()), ...c }; classes.push(row); return wait(row); },
    updateClass(cid, patch) { if (!isAdmin()) return deny(); Object.assign(classes.find((c) => c.id === cid), patch); return wait(null); },
    deleteClass(cid) { if (!isAdmin()) return deny(); classes.splice(classes.findIndex((c) => c.id === cid), 1); return wait(null); },
    addTeacher(cid, tid) { if (!isAdmin()) return deny(); class_teachers.push({ class_id: cid, teacher_id: tid }); return wait(null); },
    removeTeacher(cid, tid) { if (!isAdmin()) return deny(); class_teachers.splice(class_teachers.findIndex((t) => t.class_id === cid && t.teacher_id === tid), 1); return wait(null); },
    setEnrollment(cid, sid, status) { if (!isAdmin()) return deny(); enrollments.find((e) => e.class_id === cid && e.student_id === sid).status = status; return wait(null); },
    async invite({ email, full_name, role, class_id }) {
      if (!isAdmin()) return deny();
      let p = people.find((x) => x.email === email.toLowerCase());
      const invited = !p;
      if (!p) { p = { id: id(), email: email.toLowerCase(), full_name: full_name || null, role, created_at: iso(new Date()) }; people.push(p); } else p.role = role;
      if (class_id && role === "student" && !enrollments.some((e) => e.class_id === class_id && e.student_id === p.id)) enrollments.push({ class_id, student_id: p.id, status: "active", enrolled_at: iso(new Date()) });
      if (class_id && role === "teacher" && !class_teachers.some((t) => t.class_id === class_id && t.teacher_id === p.id)) class_teachers.push({ class_id, teacher_id: p.id });
      return wait({ ok: true, invited });
    },
  };
})();
