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
  const today = () => iso(new Date());
  const NOTICE_VERSION = "2026-10";

  const people = [
    { id: "u-abby", email: "abbyruthsung@gmail.com", full_name: "Abigail Ruth Sung", role: "admin", is_active: true, created_at: iso(daysAgo(30)) },
    { id: "u-sarah", email: "sarah.lee@example.com", full_name: "Sarah Lee", role: "teacher", is_active: true, created_at: iso(daysAgo(25)) },
    { id: "u-minjun", email: "minjun.park@example.com", full_name: "Min-jun Park", role: "teacher", is_active: true, created_at: iso(daysAgo(25)) },
    { id: "u-daniel", email: "daniel.kim@example.com", full_name: "Daniel Kim", role: "student", is_active: true, created_at: iso(daysAgo(20)) },
    { id: "u-grace", email: "grace.cho@example.com", full_name: "Grace Cho", role: "student", is_active: true, created_at: iso(daysAgo(20)) },
    { id: "u-maria", email: "maria.lopez@example.com", full_name: "Maria Lopez", role: "student", is_active: true, created_at: iso(daysAgo(19)) },
    { id: "u-james", email: "james.ito@example.com", full_name: "James Ito", role: "student", is_active: true, created_at: iso(daysAgo(10)) },
    { id: "u-hana", email: "hana.yoon@example.com", full_name: "Hana Yoon", role: "teacher", is_active: true, created_at: iso(daysAgo(12)) },
    { id: "u-priya", email: "priya.shah@example.com", full_name: "Priya Shah", role: "student", is_active: true, created_at: iso(daysAgo(6)) },
  ];
  const classes = [
    { id: "c-eng-a", course_id: "english-a", name: "English A · Fall 2026 · Mornings", start_date: iso(daysAgo(16)), schedule: "Tue & Thu, 9:00–11:00 AM", live_meeting_url: "https://us06web.zoom.us/j/0000000000", status: "active", created_at: iso(daysAgo(21)) },
    { id: "c-eng-a2", course_id: "english-a", name: "English A · Winter 2027 · Saturdays", start_date: iso(daysAgo(-35)), schedule: "Sat, 10:00 AM–2:00 PM", live_meeting_url: null, status: "planned", created_at: iso(daysAgo(3)) },
    { id: "c-kor-b", course_id: "korean-b", name: "Korean B · Winter 2027 · Evenings", start_date: iso(daysAgo(-24)), schedule: "Mon & Wed, 6:30–8:30 PM", live_meeting_url: null, status: "planned", created_at: iso(daysAgo(5)) },
  ];
  const class_teachers = [{ class_id: "c-eng-a", teacher_id: "u-sarah" }, { class_id: "c-eng-a2", teacher_id: "u-hana" }, { class_id: "c-kor-b", teacher_id: "u-minjun" }];
  const enrollments = [
    { class_id: "c-eng-a", student_id: "u-daniel", status: "active", enrolled_at: iso(daysAgo(18)) },
    { class_id: "c-eng-a", student_id: "u-grace", status: "active", enrolled_at: iso(daysAgo(18)) },
    { class_id: "c-eng-a", student_id: "u-maria", status: "withdrawn", enrolled_at: iso(daysAgo(17)) },
    { class_id: "c-kor-b", student_id: "u-james", status: "active", enrolled_at: iso(daysAgo(4)) },
    { class_id: "c-eng-a2", student_id: "u-priya", status: "active", enrolled_at: iso(daysAgo(2)) },
  ];
  const consents = [{ user_id: "u-grace", kind: "recording_notice", version: NOTICE_VERSION, accepted_at: iso(daysAgo(15)) }];
  const recordings = [
    { id: "r1", course_id: "english-a", session_id: "c-eng-a", week: 1, title: null, zoom_url: "https://us06web.zoom.us/rec/share/demo-week-1", passcode: "Wk1#7xQ2", recorded_on: iso(daysAgo(14)), available_until: null, created_at: iso(daysAgo(14)) },
    { id: "r2", course_id: "english-a", session_id: "c-eng-a", week: 2, title: null, zoom_url: "https://us06web.zoom.us/rec/share/demo-week-2", passcode: "Wk2!m4Ra", recorded_on: iso(daysAgo(7)), available_until: null, created_at: iso(daysAgo(7)) },
    { id: "r3", course_id: "english-a", session_id: null, week: 2, title: "Lecture: building a value proposition", zoom_url: "https://us06web.zoom.us/rec/share/demo-lecture-2", passcode: "Lec2$9pZ", recorded_on: iso(daysAgo(40)), available_until: null, created_at: iso(daysAgo(40)) },
  ];
  const materials = [
    { id: "m1", course_id: "english-a", week: null, category: "student", title: "Course syllabus and completion requirements", external_url: null, storage_path: "english-a/student/syllabus.pdf", created_at: iso(daysAgo(16)) },
    { id: "m2", course_id: "english-a", week: 2, category: "student", title: "Week 2 workbook: personal value proposition", external_url: null, storage_path: "english-a/student/week2-workbook.pdf", created_at: iso(daysAgo(8)) },
    { id: "m3", course_id: "english-a", week: 2, category: "resource", title: "Sample 60-second introductions", external_url: "https://bpcti.org/", storage_path: null, created_at: iso(daysAgo(8)) },
    { id: "m4", course_id: "english-a", week: 2, category: "instructor", title: "Week 2 lesson plan", external_url: null, storage_path: "english-a/instructor/week2-lesson-plan.docx", created_at: iso(daysAgo(9)) },
    { id: "m5", course_id: "english-a", week: 2, category: "instructor", title: "Introduction rubric and answer key", external_url: null, storage_path: "english-a/instructor/week2-rubric.docx", created_at: iso(daysAgo(9)) },
    { id: "m6", course_id: "english-a", week: 3, category: "student", title: "Achievement story template", external_url: null, storage_path: "english-a/student/week3-template.pdf", created_at: iso(daysAgo(2)) },
  ];
  const student_records = [
    { id: "s1", session_id: "c-eng-a", student_id: "u-daniel", week: 1, title: "Baseline interview", zoom_url: "https://us06web.zoom.us/rec/share/demo-daniel-baseline", passcode: "Dk1@4fG", feedback: "Strong, confident opening. Next step: shorten answers to under two minutes and end each one with a clear result.", available_until: null, created_at: iso(daysAgo(13)) },
    { id: "s2", session_id: "c-eng-a", student_id: "u-grace", week: 1, title: "Baseline interview", zoom_url: "https://us06web.zoom.us/rec/share/demo-grace-baseline", passcode: "Gc1#8hJ", feedback: "Clear structure. Practice slowing down during the first minute.", available_until: null, created_at: iso(daysAgo(13)) },
  ];
  const weekContent = {
    "english-a:2": {
      learning_objectives: "Deliver 30-second, 60-second, and two-minute professional introductions\nConnect your qualifications to an employer's needs\nAdapt your introduction for interviews, networking, and internal meetings",
      lesson_overview: null,
      assignment: "Record a 60-second introduction for a role you're targeting and bring a written version to class. Use the Week 2 workbook, pages 4–6.",
    },
  };

  const PERSONAS = [
    { key: "student", label: "Student (Daniel)", uid: "u-daniel" },
    { key: "teacher", label: "Teacher (Sarah)", uid: "u-sarah" },
    { key: "teacher2", label: "Teacher (Hana)", uid: "u-hana" },
    { key: "admin", label: "Admin (Abby)", uid: "u-abby" },
  ];
  let persona = "student";
  try { persona = sessionStorage.getItem("bpcti-demo-persona") || "student"; } catch (_) {}
  let signedIn = true;
  const uid = () => PERSONAS.find((p) => p.key === persona).uid;
  const me = () => people.find((p) => p.id === uid());

  // Access rules mirrored from the database
  const active = () => me().is_active !== false;
  const isAdmin = () => active() && me().role === "admin";
  const teaches = (c) => active() && class_teachers.some((t) => t.class_id === c && t.teacher_id === uid());
  const enrolled = (c) => active() && enrollments.some((e) => e.class_id === c && e.student_id === uid() && e.status !== "withdrawn");
  const canView = (c) => isAdmin() || teaches(c) || enrolled(c);
  const canManage = (c) => isAdmin() || teaches(c);
  const sessionsOf = (course) => classes.filter((c) => c.course_id === course).map((c) => c.id);
  const teachesCourse = (course) => sessionsOf(course).some((c) => teaches(c));
  const enrolledCourse = (course) => sessionsOf(course).some((c) => enrolled(c));
  const canViewCourse = (course) => isAdmin() || teachesCourse(course) || enrolledCourse(course);
  const canManageCourse = (course) => isAdmin() || teachesCourse(course);
  const accepted = () => consents.some((c) => c.user_id === uid() && c.version === NOTICE_VERSION);
  const stillAvailable = (r) => !r.available_until || r.available_until >= today();
  const canManageRec = (r) => (r.session_id ? isAdmin() || teaches(r.session_id) : canManageCourse(r.course_id));
  const canReadRec = (r) => canManageRec(r) || (accepted() && stillAvailable(r) && (r.session_id ? enrolled(r.session_id) : enrolledCourse(r.course_id)));
  const canReadMat = (m) => canManageCourse(m.course_id) || (m.category !== "instructor" && canViewCourse(m.course_id));
  const canReadRecord = (r) => isAdmin() || teaches(r.session_id) || (r.student_id === uid() && enrolled(r.session_id) && accepted() && stillAvailable(r));
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

    async hasAcceptedNotice(userId, version) { return consents.some((c) => c.user_id === userId && c.version === version); },
    async acceptNotice(userId, version) { if (userId !== uid() || !active()) return deny(); consents.push({ user_id: userId, kind: "recording_notice", version, accepted_at: today() }); },
    async noticeStatus(ids, version) { return Object.fromEntries(consents.filter((c) => ids.includes(c.user_id) && c.version === version && (isAdmin() || ids.some((i) => i === c.user_id))).map((c) => [c.user_id, c.accepted_at])); },

    courses: () => wait(window.DEMO_COURSES),
    weeks: (c) => wait(window.DEMO_WEEKS.filter((w) => w.course_id === c).map((w) => ({ learning_objectives: null, lesson_overview: null, assignment: null, ...w, ...(weekContent[`${c}:${w.week}`] || {}) }))),
    updateWeek(c, week, patch) { if (!canManageCourse(c)) return deny(); weekContent[`${c}:${week}`] = { ...(weekContent[`${c}:${week}`] || {}), ...patch }; return wait(null); },

    sessions: () => wait(classes.filter((c) => canView(c.id)).map(withCourse)),
    getSession: (cid) => { const c = classes.find((x) => x.id === cid && canView(x.id)); return wait(c ? withCourse(c) : null); },
    teachers: (cid) => wait(canView(cid) ? class_teachers.filter((t) => t.class_id === cid).map((t) => people.find((p) => p.id === t.teacher_id)) : []),
    roster: (cid) => wait(canManage(cid) ? enrollments.filter((e) => e.class_id === cid).map((e) => ({ ...people.find((p) => p.id === e.student_id), status: e.status, enrolled_at: e.enrolled_at })) : []),

    recordings: (course) => wait(recordings.filter((r) => r.course_id === course && canReadRec(r))),
    addRecording(r) { const row = { id: id(), created_at: today(), session_id: null, available_until: null, ...r }; if (!canManageRec(row)) return deny(); recordings.push(row); return wait(row); },
    updateRecording(rid, patch) { const r = recordings.find((x) => x.id === rid); if (!r || !canManageRec(r) || !canManageRec({ ...r, ...patch })) return deny(); Object.assign(r, patch); return wait(r); },
    deleteRecording(rid) { const i = recordings.findIndex((x) => x.id === rid); if (i < 0 || !canManageRec(recordings[i])) return deny(); recordings.splice(i, 1); return wait(null); },

    materials: (course) => wait(materials.filter((m) => m.course_id === course && canReadMat(m))),
    addMaterialFile(course, week, category, title, file) { if (!canManageCourse(course)) return deny(); const row = { id: id(), course_id: course, week, category, title, storage_path: `${course}/${category}/${file.name}`, external_url: null, created_at: today(), _blob: URL.createObjectURL(file) }; materials.push(row); return wait({ ...row }); },
    addMaterialLink(course, week, category, title, url) { if (!canManageCourse(course)) return deny(); const row = { id: id(), course_id: course, week, category, title, external_url: url, storage_path: null, created_at: today() }; materials.push(row); return wait(row); },
    async replaceMaterialFile(m, file) { const row = materials.find((x) => x.id === m.id); if (!row || !canManageCourse(row.course_id)) return deny(); row.storage_path = `${row.course_id}/${row.category}/${file.name}`; row._blob = URL.createObjectURL(file); row.updated_at = today(); },
    updateMaterial(mid, patch) { const row = materials.find((x) => x.id === mid); if (!row || !canManageCourse(row.course_id)) return deny(); Object.assign(row, patch); return wait(null); },
    deleteMaterial(m) { const i = materials.findIndex((x) => x.id === m.id); if (i < 0 || !canManageCourse(materials[i].course_id)) return deny(); materials.splice(i, 1); return wait(null); },
    async materialUrl(m) { const row = materials.find((x) => x.id === m.id); if (!row || !canReadMat(row)) throw new Error("You don't have access to this file."); return row.external_url || row._blob || "https://bpcti.org/"; },
    async teachesCourse(course) { return teachesCourse(course); },

    studentRecords: (sessionId, studentId) => wait(student_records.filter((r) => r.session_id === sessionId && (!studentId || r.student_id === studentId) && canReadRecord(r))),
    addStudentRecord(r) { if (!(isAdmin() || teaches(r.session_id))) return deny(); const row = { id: id(), created_at: today(), ...r }; student_records.push(row); return wait(row); },
    updateStudentRecord(rid, patch) { const r = student_records.find((x) => x.id === rid); if (!r || !(isAdmin() || teaches(r.session_id))) return deny(); Object.assign(r, patch); return wait(r); },
    deleteStudentRecord(rid) { const i = student_records.findIndex((x) => x.id === rid); if (i < 0 || !(isAdmin() || teaches(student_records[i].session_id))) return deny(); student_records.splice(i, 1); return wait(null); },

    people: () => (isAdmin() ? wait(people) : wait(people.filter((p) => p.id === uid()))),
    setRole(pid, role) { if (!isAdmin()) return deny(); people.find((p) => p.id === pid).role = role; return wait(null); },
    setActive(pid, v) { if (!isAdmin() || pid === uid()) return deny(); people.find((p) => p.id === pid).is_active = v; return wait(null); },
    createSession(c) { if (!isAdmin()) return deny(); const row = { id: id(), created_at: today(), ...c }; classes.push(row); return wait(row); },
    updateSession(cid, patch) { if (!isAdmin()) return deny(); Object.assign(classes.find((c) => c.id === cid), patch); return wait(null); },
    deleteSession(cid) { if (!isAdmin()) return deny(); classes.splice(classes.findIndex((c) => c.id === cid), 1); return wait(null); },
    addTeacher(cid, tid) { if (!isAdmin()) return deny(); class_teachers.push({ class_id: cid, teacher_id: tid }); return wait(null); },
    removeTeacher(cid, tid) { if (!isAdmin()) return deny(); class_teachers.splice(class_teachers.findIndex((t) => t.class_id === cid && t.teacher_id === tid), 1); return wait(null); },
    setEnrollment(cid, sid, status) { if (!isAdmin()) return deny(); enrollments.find((e) => e.class_id === cid && e.student_id === sid).status = status; return wait(null); },
    async invite({ email, full_name, role, class_id }) {
      if (!isAdmin()) return deny();
      let p = people.find((x) => x.email === email.toLowerCase());
      const invited = !p;
      if (!p) { p = { id: id(), email: email.toLowerCase(), full_name: full_name || null, role, is_active: true, created_at: today() }; people.push(p); } else p.role = role;
      if (class_id && role === "student" && !enrollments.some((e) => e.class_id === class_id && e.student_id === p.id)) enrollments.push({ class_id, student_id: p.id, status: "active", enrolled_at: today() });
      if (class_id && role === "teacher" && !class_teachers.some((t) => t.class_id === class_id && t.teacher_id === p.id)) class_teachers.push({ class_id, teacher_id: p.id });
      return wait({ ok: true, invited });
    },
  };
})();
