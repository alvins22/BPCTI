// =====================================================================
//  BPCTI Student Portal — screens. Hash routes:
//    #/                         home (my sessions / all classes for admins)
//    #/class/<course>           class library: 12 weeks of shared recordings
//                               and materials, plus the class's sessions
//    #/class/<course>/week/<n>  library week page
//    #/session/<id>             session: dates, teacher, students, 12 weeks
//    #/session/<id>/week/<n>    week page with this session's dates
//    #/session/<id>/student/<s> one student's private recordings & feedback
//    #/people                 admin: invite people, roles
//    #/account                name and password
// =====================================================================
(function () {
  const API = window.API;
  const app = document.getElementById("app");
  const state = { me: null, courses: null, needsPassword: null, noticeOk: false };

  // ---------- helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const PROGRAM = { english: "English Program", korean: "Korean Program" };
  const ZOOM_RE = /^https:\/\/([a-z0-9-]+\.)*zoom\.(us|com)\//i;
  const MAX_FILE = 50 * 1024 * 1024;
  // Recording notice students accept before using the portal. DRAFT for
  // BPCTI review. Changing the text? Bump the version here AND in the
  // database (private.recording_notice_version) so everyone re-accepts.
  const NOTICE = {
    version: "2026-10",
    title: "Recording Notice",
    paragraphs: [
      "BPCTI classes may be recorded to support learning, review, make-up sessions, and individual coaching. Recordings may include your name, voice, image, and contributions to class discussions, interviews, presentations, and role-plays.",
      "Class recordings are available only through this portal, to students and teachers in your class. Recordings of instructional lectures may also be shared with other sessions of the same course. Individual interview and coaching recordings, and personal feedback, are available only to you, your instructor, and authorized BPCTI administrators.",
      "Recordings are never posted publicly. Please do not download, copy, share, or post recordings, recording links, or passcodes.",
      "Recordings are kept only as long as they're needed for the course and are then removed.",
    ],
    agree: "I have read this notice and agree to the recording and use of my class participation as described.",
  };

  function parseDate(s) { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function fmtDate(s) { const d = typeof s === "string" ? parseDate(s.slice(0, 10)) : s; return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""; }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function todayISO() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  // 0 = not started yet, 1..12 = current week, 13 = finished, null = no start date
  function currentWeek(cls) {
    const start = parseDate(cls.start_date);
    if (!start) return null;
    const days = Math.floor((new Date().setHours(0, 0, 0, 0) - start) / 86400000);
    if (days < 0) return 0;
    return Math.min(13, Math.floor(days / 7) + 1);
  }
  function weekLabel(cls) {
    const w = currentWeek(cls);
    if (w === null) return "Start date to be announced";
    if (w === 0) return `Starts ${fmtDate(cls.start_date)}`;
    if (w === 13) return "Course finished";
    return `Week ${w} of 12`;
  }
  const firstName = (p) => (p.full_name || p.email || "").split(/[\s@]/)[0];
  const display = (p) => p.full_name || p.email;
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  function toast(text) {
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }
  function showMsg(el, kind, text) { el.hidden = false; el.classList.remove("err", "ok", "info"); el.classList.add("msg", kind); el.setAttribute("role", kind === "err" ? "alert" : "status"); el.textContent = text; }
  async function busy(btn, fn) {
    const label = btn.textContent; btn.disabled = true; btn.textContent = "Working…";
    try { return await fn(); } finally { btn.disabled = false; btn.textContent = label; }
  }
  // Two-step confirm without browser dialogs.
  function confirmBtn(btn, prompt, fn) {
    btn.addEventListener("click", async () => {
      if (btn.dataset.armed !== "1") {
        btn.dataset.armed = "1"; btn.dataset.label = btn.textContent; btn.textContent = prompt;
        setTimeout(() => { if (btn.isConnected) { btn.dataset.armed = ""; btn.textContent = btn.dataset.label; } }, 4000);
        return;
      }
      btn.dataset.armed = "";
      await busy(btn, fn);
    });
  }
  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); btn.textContent = "Copied"; }
    catch (_) { const r = document.createRange(); const el = btn.previousElementSibling; if (el) { r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } btn.textContent = "Selected — press Ctrl/Cmd+C"; }
    setTimeout(() => (btn.textContent = "Copy"), 2500);
  }

  // ---------- auth screens ----------
  function authFrame(inner) {
    app.innerHTML = `${API.demo && state.me ? demoBar() : ""}<div class="auth">
      <div class="side">
        <div><img src="assets/logo.png" alt="BPCTI logo"><h1>BPCTI Student Portal</h1>
        <p>Your classes, weekly recordings, and course materials in one place.</p></div>
        <p class="small"><a href="https://bpcti.org" style="color:#fff">← Back to bpcti.org</a></p>
      </div>
      <div class="box">${inner}</div>
    </div>`;
    if (API.demo && state.me) bindDemoBar();
  }

  function loginView(notice) {
    authFrame(`
      <h2>Sign in</h2>
      <p class="muted small" style="margin-bottom:22px">Use the email address BPCTI invited.</p>
      <div id="m" hidden></div>
      <form class="f" id="login" novalidate>
        <label class="fld">Email<input id="login-email" type="email" autocomplete="email" required></label>
        <label class="fld">Password<input id="login-pass" type="password" autocomplete="current-password" required></label>
        <div class="actions"><button class="btn btn-navy" type="submit">Sign in</button>
        <button class="linkbtn" type="button" id="forgot" style="color:var(--navy)">Forgot your password?</button></div>
      </form>
      <form class="f" id="reset" hidden novalidate style="margin-top:8px">
        <p class="small muted">Enter your email and we'll send a link to set a new password.</p>
        <label class="fld">Email<input id="reset-email" type="email" autocomplete="email" required></label>
        <div class="actions"><button class="btn btn-navy" type="submit">Send reset link</button>
        <button class="linkbtn" type="button" id="back" style="color:var(--navy)">Back to sign in</button></div>
      </form>
      <p class="tiny" style="margin-top:28px">Don't have an account? The portal is for enrolled students and BPCTI teachers. <a href="https://bpcti.org/contact/">Contact BPCTI</a>.</p>`);
    const m = $("#m");
    if (notice) showMsg(m, notice.kind, notice.text);
    $("#forgot").onclick = () => { $("#login").hidden = true; $("#reset").hidden = false; $("#reset-email").value = $("#login-email").value; m.hidden = true; };
    $("#back").onclick = () => { $("#login").hidden = false; $("#reset").hidden = true; m.hidden = true; };
    $("#login").onsubmit = (e) => {
      e.preventDefault();
      const btn = e.submitter || $("#login button[type=submit]");
      busy(btn, async () => {
        try { await API.signIn($("#login-email").value.trim(), $("#login-pass").value); await boot(); }
        catch (err) { showMsg(m, "err", /invalid/i.test(err.message) ? "That email and password don't match. Check them and try again." : err.message); }
      });
    };
    $("#reset").onsubmit = (e) => {
      e.preventDefault();
      const btn = $("#reset button[type=submit]");
      busy(btn, async () => {
        try { await API.sendReset($("#reset-email").value.trim()); showMsg(m, "ok", "If that email has a portal account, a reset link is on its way."); }
        catch (err) { showMsg(m, "err", err.message); }
      });
    };
  }

  function setPasswordView(kind) {
    const invite = kind === "invite";
    authFrame(`
      <h2>${invite ? "Welcome to BPCTI" : "Set a new password"}</h2>
      <p class="muted small" style="margin-bottom:22px">${invite ? "Choose a password to finish setting up your account." : "Choose a new password for your account."}</p>
      <div id="m" hidden></div>
      <form class="f" id="pw" novalidate>
        <label class="fld">New password <span class="hint">At least 8 characters</span><input id="pw1" type="password" autocomplete="new-password" minlength="8" required></label>
        <label class="fld">Confirm password<input id="pw2" type="password" autocomplete="new-password" required></label>
        <div class="actions"><button class="btn btn-navy" type="submit">Save password</button></div>
      </form>`);
    const m = $("#m");
    $("#pw").onsubmit = (e) => {
      e.preventDefault();
      const a = $("#pw1").value, b = $("#pw2").value;
      if (a.length < 8) return showMsg(m, "err", "Use at least 8 characters.");
      if (a !== b) return showMsg(m, "err", "The two passwords don't match.");
      busy($("#pw button"), async () => {
        try { await API.setPassword(a); state.needsPassword = null; toast("Password saved"); location.hash = "#/"; await boot(); }
        catch (err) { showMsg(m, "err", err.message); }
      });
    };
  }

  // ---------- shell ----------
  function shell(active, body) {
    const me = state.me;
    const nav = [["#/", me.role === "admin" ? "Classes" : me.role === "teacher" ? "My Sessions" : "My Classes", "home"]];
    if (me.role === "admin") nav.push(["#/people", "People", "people"]);
    nav.push(["#/account", "Account", "account"]);
    app.innerHTML = `
      ${API.demo ? demoBar() : ""}
      <header class="topbar"><div class="in">
        <a class="brand" href="#/"><img src="assets/logo.png" alt=""><div><b>BP COMMUNICATION<br>TRAINING INSTITUTE</b><span>STUDENT PORTAL</span></div></a>
        <nav class="topnav" aria-label="Portal">${nav.map(([h, l, k]) => `<a href="${h}"${k === active ? ' aria-current="page"' : ""}>${l}</a>`).join("")}</nav>
        <div class="who"><span class="name">${esc(display(me))}</span><span class="role ${me.role}">${me.role}</span><button class="linkbtn" id="signout">Sign out</button></div>
      </div></header>
      <main id="main">${body}</main>`;
    $("#signout").onclick = async () => { await API.signOut(); state.me = null; location.hash = "#/"; boot(); };
    if (API.demo) bindDemoBar();
  }
  const loading = (active) => shell(active, `<div class="loading">Loading…</div>`);
  const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([l, h]) => (h ? `<a href="${h}">${esc(l)}</a>` : `<span>${esc(l)}</span>`)).join(" / ")}</nav>`;

  async function courses() { if (!state.courses) state.courses = await API.courses(); return state.courses; }

  // ---------- home ----------
  async function homeView() {
    loading("home");
    const me = state.me;
    const [sessions, allCourses] = await Promise.all([API.sessions(), courses()]);
    if (me.role === "admin") return adminHome(sessions, allCourses);

    const weeksBy = {};
    await Promise.all([...new Set(sessions.map((s) => s.course_id))].map(async (id) => (weeksBy[id] = await API.weeks(id))));
    const card = (s) => {
      const w = currentWeek(s);
      const wk = w >= 1 && w <= 12 ? weeksBy[s.course_id]?.[w - 1] : null;
      return `<a class="ccard" href="#/session/${s.id}">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><span class="eyebrow" style="margin:0">${esc(PROGRAM[s.course.program])} · ${esc(s.course.specialization)}</span><span class="pill ${s.status}">${esc(s.status)}</span></div>
        <h3>${esc(s.course.title)}</h3>
        <div class="meta">${esc(s.name)}${s.schedule ? ` · ${esc(s.schedule)}` : ""}</div>
        <div class="now">${wk ? `<b>This week:</b> Week ${w} — ${esc(wk.title)}` : esc(weekLabel(s))}</div>
      </a>`;
    };
    const teacher = me.role === "teacher";
    const empty = teacher
      ? "You haven't been assigned to a session yet. Once BPCTI adds you as a teacher, your sessions will appear here."
      : "You're not enrolled in a class yet. Once BPCTI adds you to a session, it will appear here.";
    shell("home", `<div class="pagehead"><div><h1>${teacher ? "Your sessions" : `Welcome, ${esc(firstName(me))}`}</h1>${sessions.length ? `<p class="muted">${teacher ? "Open a session for its students and weekly lessons. Recordings and materials you add are shared with every session of that class." : "Open your class to see this week's lesson, recordings, and materials."}</p>` : ""}</div></div>
      ${sessions.length ? `<div class="grid">${sessions.map(card).join("")}</div>` : `<div class="panel"><p class="empty">${empty}</p></div>`}`);
  }

  function adminHome(sessions, allCourses) {
    const byCourse = (cid) => sessions.filter((s) => s.course_id === cid);
    const card = (k) => {
      const list = byCourse(k.id);
      const live = list.filter((s) => s.status === "active" || s.status === "planned");
      return `<a class="ccard" href="#/class/${k.id}">
        <span class="eyebrow" style="margin:0">${esc(PROGRAM[k.program])} · ${esc(k.specialization)}</span>
        <h3>${esc(k.title)}</h3>
        <div class="now">${list.length ? `${plural(list.length, "session")}${live.length ? ` · ${live.map((s) => esc(s.name)).join(", ")}` : ""}` : "No sessions yet"}</div>
      </a>`;
    };
    shell("home", `<div class="pagehead"><div><h1>Classes</h1><p class="muted">Each class has one shared library of recordings and materials. Its sessions each have their own start date, teacher, and students.</p></div>
      <button class="btn btn-primary" id="newsession">New session</button></div>
      <div id="newsession-form" hidden></div>
      ${["english", "korean"].map((prog) => `<h2 style="margin:28px 0 12px">${PROGRAM[prog]}</h2><div class="grid">${allCourses.filter((k) => k.program === prog).map(card).join("")}</div>`).join("")}`);
    $("#newsession").onclick = () => sessionForm($("#newsession-form"));
  }

  async function sessionForm(host, existing, courseId) {
    const list = await courses();
    host.hidden = false;
    const c = existing || { status: "planned", course_id: courseId };
    host.innerHTML = `<div class="panel" style="margin-bottom:20px"><h2>${existing ? "Edit session" : "New session"}</h2>
      <p class="muted small" style="margin:4px 0 16px">A session is one run of a class: its own start date, schedule, teacher, and students. It uses the class's shared recordings and materials.</p>
      <div id="sf-m" hidden></div>
      <form class="f" id="sf" novalidate>
        <label class="fld">Class<select id="sf-course" ${existing ? "disabled" : ""} required>${list.map((k) => `<option value="${k.id}" ${k.id === c.course_id ? "selected" : ""}>${esc(PROGRAM[k.program].replace(" Program", ""))} ${k.specialization} — ${esc(k.title)}</option>`).join("")}</select></label>
        <div class="row">
          <label class="fld">Session name <span class="hint">How it appears to students and teachers</span><input id="sf-name" type="text" value="${esc(c.name || "")}" placeholder="e.g. English A · Winter 2027 · Mornings" required></label>
          <label class="fld">Status<select id="sf-status">${["planned", "active", "completed", "cancelled"].map((s) => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}</select></label>
        </div>
        <div class="row">
          <label class="fld">Start date <span class="hint">Week 1 begins this day</span><input id="sf-start" type="date" value="${esc(c.start_date || "")}"></label>
          <label class="fld">Schedule<input id="sf-sched" type="text" value="${esc(c.schedule || "")}" placeholder="e.g. Tue & Thu, 9:00–11:00 AM"></label>
        </div>
        <label class="fld">Live class Zoom link <span class="hint">Optional. The recurring meeting this session joins each week.</span><input id="sf-live" type="url" value="${esc(c.live_meeting_url || "")}" placeholder="https://us06web.zoom.us/j/…"></label>
        <div class="actions"><button class="btn btn-navy" type="submit">${existing ? "Save changes" : "Create session"}</button><button class="btn btn-line" type="button" id="sf-cancel">Cancel</button></div>
      </form></div>`;
    const m = $("#sf-m");
    if (!existing) {
      const suggest = () => { const k = list.find((x) => x.id === $("#sf-course").value); if (k && !$("#sf-name").dataset.touched) $("#sf-name").value = `${PROGRAM[k.program].replace(" Program", "")} ${k.specialization} · ${new Date().getFullYear() + (new Date().getMonth() > 8 ? 1 : 0)}`; };
      $("#sf-course").onchange = suggest; $("#sf-name").oninput = () => ($("#sf-name").dataset.touched = "1"); suggest();
    }
    $("#sf-cancel").onclick = () => { host.hidden = true; host.innerHTML = ""; };
    $("#sf").onsubmit = (e) => {
      e.preventDefault();
      const live = $("#sf-live").value.trim();
      const patch = { name: $("#sf-name").value.trim(), status: $("#sf-status").value, start_date: $("#sf-start").value || null, schedule: $("#sf-sched").value.trim() || null, live_meeting_url: live || null };
      if (!patch.name) return showMsg(m, "err", "Give the session a name.");
      if (live && !/^https:\/\//i.test(live)) return showMsg(m, "err", "The live class link should start with https://");
      busy($("#sf button[type=submit]"), async () => {
        try {
          if (existing) { await API.updateSession(existing.id, patch); toast("Session updated"); route(); }
          else { const row = await API.createSession({ ...patch, course_id: $("#sf-course").value }); toast("Session created"); location.hash = `#/session/${row.id}`; }
        } catch (err) { showMsg(m, "err", err.message); }
      });
    };
  }

  // Manager of a class library = admin, or teacher of any session of that class.
  async function managesCourse(courseId) {
    if (state.me.role === "admin") return true;
    if (state.me.role !== "teacher") return false;
    return API.teachesCourse(courseId, state.me.id);
  }

  function weekRows(weeks, recs, mats, hrefFor, session) {
    const cw = session ? currentWeek(session) : null;
    const start = session ? parseDate(session.start_date) : null;
    return weeks.map((w) => {
      const r = recs.filter((x) => x.week === w.week).length, f = mats.filter((x) => x.week === w.week).length, cur = w.week === cw;
      const dates = start ? ` · ${fmtDate(addDays(start, (w.week - 1) * 7)).replace(/, \d{4}$/, "")}` : "";
      return `<a href="${hrefFor(w.week)}" class="${cur ? "current" : ""}">
        <span class="wk">Week ${pad(w.week)}${dates}</span>
        <span class="wt">${esc(w.title)}</span>
        <span class="marks">${cur ? `<span class="mark" style="background:var(--navy);color:#fff">This week</span>` : ""}${r ? `<span class="mark rec">Recording</span>` : ""}${f ? `<span class="mark">${f} file${f > 1 ? "s" : ""}</span>` : ""}</span>
      </a>`;
    }).join("");
  }

  // ---------- class (library + sessions) ----------
  const forSession = (recs, sessionId) => recs.filter((r) => !r.session_id || r.session_id === sessionId);

  async function classView(courseId) {
    loading("home");
    const course = (await courses()).find((k) => k.id === courseId);
    if (!course) return shell("home", `${crumbs([["Classes", "#/"]])}<div class="panel"><h2>Class not found</h2></div>`);
    const [weeks, recs, mats, allSessions, manager] = await Promise.all([API.weeks(courseId), API.recordings(courseId), API.materials(courseId), API.sessions(), managesCourse(courseId)]);
    const sessions = allSessions.filter((s) => s.course_id === courseId);
    const admin = state.me.role === "admin";
    const sessionRow = (s) => `<a href="#/session/${s.id}"><span class="wk">${esc(s.start_date ? fmtDate(s.start_date) : "No start date")}</span><span class="wt">${esc(s.name)}${s.schedule ? `<span class="small muted" style="display:block;font-weight:400">${esc(s.schedule)}</span>` : ""}</span><span class="marks"><span class="pill ${s.status}">${esc(s.status)}</span></span></a>`;
    const wholeClass = mats.filter((x) => x.week === null);

    shell("home", `
      ${crumbs([[admin ? "Classes" : "My Classes", "#/"], [course.title]])}
      <div class="pagehead"><div><span class="eyebrow">${esc(PROGRAM[course.program])} · Specialization ${esc(course.specialization)}</span><h1>${esc(course.title)}</h1>${course.tagline ? `<p class="muted">${esc(course.tagline)}</p>` : ""}</div></div>
      <div class="cols">
        <div class="stack">
          <div class="panel"><div class="head"><div><h2>Class library</h2><p class="muted small">Lesson content, materials, and shared recordings for each week. Every session of this class uses this library.</p></div></div>
            <div class="weeks">${weekRows(weeks, recs.filter((r) => !r.session_id), mats, (n) => `#/class/${courseId}/week/${n}`)}</div></div>
          ${materialsPanel(courseId, null, "student", wholeClass.filter((x) => x.category === "student"), manager, "Course-wide student materials")}
          ${manager ? materialsPanel(courseId, null, "instructor", wholeClass.filter((x) => x.category === "instructor"), manager, "Course-wide instructor materials") : ""}
        </div>
        <div class="stack">
          <div class="panel"><div class="head"><div><h2>Sessions</h2><p class="muted small">${admin ? "Each has its own start date, teacher, and students." : "Your sessions of this class."}</p></div>${admin ? `<button class="btn btn-line btn-sm" id="newsession">New session</button>` : ""}</div>
            <div id="newsession-form" hidden></div>
            ${sessions.length ? `<div class="weeks">${sessions.map(sessionRow).join("")}</div>` : `<p class="empty">No sessions yet.</p>`}
          </div>
        </div>
      </div>`);
    bindMaterials(courseId, null, wholeClass);
    if (admin) $("#newsession").onclick = () => sessionForm($("#newsession-form"), null, courseId);
  }

  // ---------- session ----------
  async function sessionView(id) {
    loading("home");
    const s = await API.getSession(id);
    if (!s) return shell("home", `${crumbs([["Classes", "#/"]])}<div class="panel"><h2>Session not found</h2><p class="muted" style="margin-top:6px">It may have been removed, or you may not have access to it.</p></div>`);
    const [weeks, recsAll, mats, teachers] = await Promise.all([API.weeks(s.course_id), API.recordings(s.course_id), API.materials(s.course_id), API.teachers(id)]);
    const recs = forSession(recsAll, id);
    const admin = state.me.role === "admin";
    const staff = admin || teachers.some((t) => t.id === state.me.id);
    const roster = staff ? await API.roster(id) : [];
    const notice = staff ? await API.noticeStatus(roster.map((x) => x.id), NOTICE.version) : {};
    const myRecords = staff ? [] : await API.studentRecords(id, state.me.id);
    const start = parseDate(s.start_date);

    const details = `<div class="panel"><h2>Session details</h2>
      <dl class="facts" style="margin-top:14px">
        <dt>Session</dt><dd>${esc(s.name)}</dd>
        <dt>Status</dt><dd><span class="pill ${s.status}">${esc(s.status)}</span> ${esc(weekLabel(s))}</dd>
        ${s.schedule ? `<dt>Schedule</dt><dd>${esc(s.schedule)}</dd>` : ""}
        ${start ? `<dt>Dates</dt><dd>${fmtDate(s.start_date)} – ${fmtDate(addDays(start, 83))}</dd>` : ""}
        <dt>Teacher${teachers.length > 1 ? "s" : ""}</dt><dd>${teachers.length ? teachers.map((t) => esc(display(t))).join(", ") : "To be assigned"}</dd>
      </dl>
      ${s.live_meeting_url ? `<a class="btn btn-primary" style="margin-top:18px;width:100%" href="${esc(s.live_meeting_url)}" target="_blank" rel="noopener">Join live class on Zoom</a>` : ""}
      ${staff ? `<a class="btn btn-line" style="margin-top:10px;width:100%" href="#/class/${s.course_id}">Open class library</a>` : ""}
    </div>`;

    const rosterPanel = staff ? `<div class="panel" id="roster"><div class="head"><div><h2>Students</h2><p class="muted small">${roster.filter((x) => x.status === "active").length} active in this session. Open a student for their private recordings and feedback.</p></div>${admin ? `<button class="btn btn-line btn-sm" id="inv-student">Invite student</button>` : ""}</div>
      <div id="inv-student-form" hidden></div>
      ${roster.length ? `<div class="tablewrap"><table class="t"><thead><tr><th>Name</th><th>Recording notice</th><th>Status</th><th></th></tr></thead><tbody>
        ${roster.map((x) => `<tr><td><b style="color:var(--navy-deep)">${esc(x.full_name || "—")}</b><span class="tiny" style="display:block">${esc(x.email)}${x.is_active === false ? " · account deactivated" : ""}</span></td>
          <td>${notice[x.id] ? `<span class="pill active">Accepted ${fmtDate(notice[x.id])}</span>` : `<span class="pill planned">Not yet</span>`}</td>
          <td>${admin ? `<select data-enroll="${x.id}" aria-label="Status for ${esc(display(x))}">${["active", "completed", "withdrawn"].map((v) => `<option ${v === x.status ? "selected" : ""}>${v}</option>`).join("")}</select>` : `<span class="pill ${x.status}">${x.status}</span>`}</td>
          <td><a class="btn btn-line btn-sm" href="#/session/${id}/student/${x.id}">Records</a></td></tr>`).join("")}
      </tbody></table></div>` : `<p class="empty">No students in this session yet.</p>`}
    </div>` : "";

    const myPanel = !staff ? `<div class="panel"><div class="head"><div><h2>My recordings &amp; feedback</h2><p class="muted small">Private to you, your instructor, and BPCTI administrators.</p></div></div>
      ${myRecords.length ? myRecords.map((r) => recordItem(r, false)).join("") : `<p class="empty">Your individual interview recordings and instructor feedback will appear here.</p>`}</div>` : "";

    const adminPanel = admin ? `<div class="panel" id="manage"><h2>Manage session</h2>
      <p class="muted small" style="margin:4px 0 16px">Only admins see this.</p>
      <h3 style="margin-bottom:8px">Teachers</h3>
      ${teachers.length ? teachers.map((t) => `<div class="item"><div class="what"><b>${esc(display(t))}</b><span class="small muted">${esc(t.email)}</span></div><div class="acts"><button class="btn btn-danger btn-sm" data-unassign="${t.id}">Remove</button></div></div>`).join("") : `<p class="empty">No teacher assigned.</p>`}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><select id="assign-teacher" style="width:auto;min-width:200px"><option value="">Add an existing teacher…</option></select><button class="btn btn-line btn-sm" id="inv-teacher">Invite new teacher</button></div>
      <div id="inv-teacher-form" hidden></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px;padding-top:18px;border-top:1px solid var(--line)">
        <button class="btn btn-line btn-sm" id="edit-session">Edit session details</button>
        <button class="btn btn-danger btn-sm" id="del-session">Delete session</button>
      </div>
      <div id="edit-session-form" hidden></div>
    </div>` : "";

    const wholeClass = mats.filter((x) => x.week === null && x.category !== "instructor");
    shell("home", `
      ${crumbs([[admin ? "Classes" : "My Classes", "#/"], ...(admin ? [[s.course.title, `#/class/${s.course_id}`]] : []), [s.name]])}
      <div class="pagehead"><div><span class="eyebrow">${esc(PROGRAM[s.course.program])} · Specialization ${esc(s.course.specialization)}</span><h1>${esc(s.course.title)}</h1><p class="muted">${esc(s.name)}</p></div></div>
      <div class="cols">
        <div class="stack">
          <div class="panel"><div class="head"><div><h2>12-week curriculum</h2><p class="muted small">Open a week for its lesson, materials, assignment, and recording.</p></div></div><div class="weeks">${weekRows(weeks, recs, staff ? mats : mats.filter((x) => x.category !== "instructor"), (n) => `#/session/${id}/week/${n}`, s)}</div></div>
          ${myPanel}
          ${wholeClass.length ? materialsPanel(s.course_id, null, "student", wholeClass, false, "Course materials") : ""}
          ${rosterPanel}
        </div>
        <div class="stack">${details}${adminPanel}</div>
      </div>`);

    bindMaterials(s.course_id, null, wholeClass);
    bindRecordCopy();
    if (admin) bindSessionAdmin(s, teachers);
  }

  // ---------- one student's private records (staff) ----------
  async function studentRecordsView(sessionId, studentId) {
    loading("home");
    const s = await API.getSession(sessionId);
    if (!s) return shell("home", `<div class="panel"><h2>Session not found</h2></div>`);
    const [roster, records] = await Promise.all([API.roster(sessionId), API.studentRecords(sessionId, studentId)]);
    const st = roster.find((x) => x.id === studentId);
    if (!st) return shell("home", `${crumbs([["Classes", "#/"], [s.name, `#/session/${sessionId}`]])}<div class="panel"><h2>Student not found</h2><p class="muted" style="margin-top:6px">They may not be in this session, or you may not have access.</p></div>`);
    shell("home", `
      ${crumbs([[state.me.role === "admin" ? "Classes" : "My Sessions", "#/"], [s.name, `#/session/${sessionId}`], [display(st)]])}
      <div class="pagehead"><div><span class="eyebrow">Private student records</span><h1>${esc(display(st))}</h1><p class="muted">${esc(st.email)} · ${esc(s.name)}</p></div></div>
      <div class="note-box"><b>Private.</b> Only ${esc(firstName(st))}, this session's teachers, and BPCTI administrators can see these. Other students never see them.</div>
      <div class="panel" style="margin-top:20px"><div class="head"><div><h2>Individual recordings &amp; feedback</h2><p class="muted small">Interview recordings, coaching sessions, and written feedback for this student.</p></div><button class="btn btn-line btn-sm" id="addrecord">Add record</button></div>
        <div id="addrecord-form" hidden></div>
        ${records.length ? records.map((r) => recordItem(r, true)).join("") : `<p class="empty">No records for this student yet.</p>`}
      </div>`);
    bindRecordCopy();
    $("#addrecord").onclick = () => studentRecordForm($("#addrecord-form"), sessionId, studentId);
    $$("[data-editrecord]").forEach((b) => (b.onclick = () => studentRecordForm($(`[data-recordform="${b.dataset.editrecord}"]`), sessionId, studentId, records.find((r) => r.id === b.dataset.editrecord))));
    $$("[data-delrecord]").forEach((b) => confirmBtn(b, "Confirm delete", async () => {
      try { await API.deleteStudentRecord(b.dataset.delrecord); toast("Record deleted"); route(); } catch (err) { toast(err.message); }
    }));
  }

  function recordItem(r, manager) {
    return `<div class="item"><div class="what"><b>${esc(r.title)}</b><span class="tiny">${r.week ? `Week ${r.week} · ` : ""}Added ${fmtDate(r.created_at)}${r.available_until ? ` · Available until ${fmtDate(r.available_until)}` : ""}</span>
        ${r.feedback ? `<div class="feedback">${esc(r.feedback).replace(/\n/g, "<br>")}</div>` : ""}
        ${r.zoom_url && r.passcode ? `<div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="small muted">Passcode</span><span class="pass">${esc(r.passcode)}</span><button class="btn btn-line btn-sm" data-copy="${esc(r.passcode)}">Copy</button></div>` : ""}</div>
      <div class="acts">${r.zoom_url && ZOOM_RE.test(r.zoom_url) ? `<a class="btn btn-primary" href="${esc(r.zoom_url)}" target="_blank" rel="noopener">Watch recording</a>` : ""}
        ${manager ? `<button class="btn btn-line btn-sm" data-editrecord="${r.id}">Edit</button><button class="btn btn-danger btn-sm" data-delrecord="${r.id}">Delete</button>` : ""}</div>
      ${manager ? `<div data-recordform="${r.id}" hidden style="flex-basis:100%"></div>` : ""}</div>`;
  }
  function bindRecordCopy() { $$("[data-copy]").forEach((b) => (b.onclick = () => copy(b.dataset.copy, b))); }

  function studentRecordForm(host, sessionId, studentId, existing) {
    host.hidden = false;
    const r = existing || {};
    host.innerHTML = `<div class="drawer" style="margin-bottom:12px"><div class="sr-m" hidden></div>
      <form class="f sr" novalidate>
        <div class="row">
          <label class="fld">Title<input class="sr-title" type="text" value="${esc(r.title || "")}" placeholder="e.g. Mock interview #1" required></label>
          <label class="fld">Week <span class="hint">Optional</span><select class="sr-week"><option value="">Not tied to a week</option>${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${r.week === i + 1 ? "selected" : ""}>Week ${i + 1}</option>`).join("")}</select></label>
        </div>
        <label class="fld">Zoom recording link <span class="hint">Optional</span><input class="sr-url" type="url" value="${esc(r.zoom_url || "")}" placeholder="https://us06web.zoom.us/rec/share/…"></label>
        <div class="row">
          <label class="fld">Passcode<input class="sr-pass" type="text" value="${esc(r.passcode || "")}" autocomplete="off"></label>
          <label class="fld">Available to the student until <span class="hint">Optional</span><input class="sr-until" type="date" value="${esc(r.available_until || "")}"></label>
        </div>
        <label class="fld">Feedback <span class="hint">Optional. Written feedback the student will see.</span><textarea class="sr-feedback" rows="5">${esc(r.feedback || "")}</textarea></label>
        <p class="tiny">Only this student, this session's teachers, and administrators can see this record.</p>
        <div class="actions"><button class="btn btn-navy btn-sm" type="submit">${existing ? "Save" : "Add record"}</button><button class="btn btn-line btn-sm" type="button" data-cancel>Cancel</button></div>
      </form></div>`;
    const f = $(".sr", host), m = $(".sr-m", host);
    $("[data-cancel]", f).onclick = () => { host.hidden = true; host.innerHTML = ""; };
    f.onsubmit = (e) => {
      e.preventDefault();
      const title = $(".sr-title", f).value.trim();
      const zoom_url = $(".sr-url", f).value.trim() || null;
      const feedback = $(".sr-feedback", f).value.trim() || null;
      if (!title) return showMsg(m, "err", "Give the record a title.");
      if (!zoom_url && !feedback) return showMsg(m, "err", "Add a Zoom link, written feedback, or both.");
      if (zoom_url && !ZOOM_RE.test(zoom_url)) return showMsg(m, "err", "That doesn't look like a Zoom link. Copy the share link from Zoom; it starts with https:// and contains zoom.us.");
      const rec = { title, zoom_url, feedback, passcode: $(".sr-pass", f).value.trim() || null, week: Number($(".sr-week", f).value) || null, available_until: $(".sr-until", f).value || null };
      busy($("button[type=submit]", f), async () => {
        try {
          if (existing) await API.updateStudentRecord(existing.id, rec); else await API.addStudentRecord({ ...rec, session_id: sessionId, student_id: studentId });
          toast(existing ? "Record updated" : "Record added"); route();
        } catch (err) { showMsg(m, "err", err.message); }
      });
    };
  }

  function inviteForm(host, { role, sessionId, onDone }) {
    host.hidden = false;
    host.innerHTML = `<div class="drawer"><div id="if-m" hidden></div>
      <form class="f" id="if" novalidate>
        <div class="row"><label class="fld">Email<input id="if-email" type="email" required></label><label class="fld">Full name<input id="if-name" type="text"></label></div>
        <p class="tiny">They'll get an email to set a password. If they already have an account, they're added right away.</p>
        <div class="actions"><button class="btn btn-navy btn-sm" type="submit">Send invite</button><button class="btn btn-line btn-sm" type="button" id="if-cancel">Cancel</button></div>
      </form></div>`;
    const m = $("#if-m", host);
    $("#if-cancel", host).onclick = () => { host.hidden = true; host.innerHTML = ""; };
    $("#if", host).onsubmit = (e) => {
      e.preventDefault();
      const email = $("#if-email", host).value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showMsg(m, "err", "Enter a valid email address.");
      busy($("#if button[type=submit]", host), async () => {
        try {
          const r = await API.invite({ email, full_name: $("#if-name", host).value.trim() || undefined, role, class_id: sessionId });
          toast(r.invited ? `Invite sent to ${email}` : `${email} already had an account and was added`);
          onDone();
        } catch (err) { showMsg(m, "err", err.message); }
      });
    };
  }

  async function bindSessionAdmin(s, teachers) {
    $("#inv-student").onclick = () => inviteForm($("#inv-student-form"), { role: "student", sessionId: s.id, onDone: route });
    $("#inv-teacher").onclick = () => inviteForm($("#inv-teacher-form"), { role: "teacher", sessionId: s.id, onDone: route });
    $("#edit-session").onclick = () => sessionForm($("#edit-session-form"), s);
    confirmBtn($("#del-session"), "Click again to delete", async () => {
      try { await API.deleteSession(s.id); toast("Session deleted"); location.hash = `#/class/${s.course_id}`; } catch (err) { toast(err.message); }
    });
    $$("[data-unassign]").forEach((b) => confirmBtn(b, "Confirm remove", async () => {
      try { await API.removeTeacher(s.id, b.dataset.unassign); toast("Teacher removed"); route(); } catch (err) { toast(err.message); }
    }));
    $$("[data-enroll]").forEach((sel) => sel.addEventListener("change", async () => {
      try { await API.setEnrollment(s.id, sel.dataset.enroll, sel.value); toast(sel.value === "withdrawn" ? "Withdrawn: their access to this session is removed" : "Status updated"); } catch (err) { toast(err.message); route(); }
    }));
    const people = await API.people();
    const pick = $("#assign-teacher");
    if (!pick) return;
    people.filter((p) => p.role === "teacher" && p.is_active !== false && !teachers.some((t) => t.id === p.id))
      .forEach((p) => pick.insertAdjacentHTML("beforeend", `<option value="${p.id}">${esc(display(p))}</option>`));
    pick.onchange = async () => {
      if (!pick.value) return;
      try { await API.addTeacher(s.id, pick.value); toast("Teacher added"); route(); } catch (err) { toast(err.message); }
    };
  }

  // ---------- materials (class library, by category) ----------
  const CATS = {
    student: { title: "Student learning materials", sub: "PDF workbooks, lesson notes, worksheets, and assignments.", accept: ".pdf", hint: "PDF, up to 50 MB", links: false, empty: "No student materials yet." },
    resource: { title: "Additional resources", sub: "Links and extra reading.", accept: "", hint: "Any file up to 50 MB", links: true, empty: "No additional resources yet." },
    instructor: { title: "Instructor materials", sub: "Lesson plans, teaching instructions, answer keys, rubrics, and evaluation forms. Students can't see these.", accept: ".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx", hint: "Word (.docx) preferred; PDF, PowerPoint, Excel also OK. Up to 50 MB", links: true, empty: "No instructor materials yet." },
  };

  function materialsPanel(courseId, week, cat, list, manager, title) {
    const C = CATS[cat];
    const key = `${cat}-${week === null ? "course" : week}`;
    const instr = cat === "instructor";
    return `<div class="panel${instr ? " panel--instructor" : ""}" id="mat-${key}"><div class="head"><div><h2>${esc(title || C.title)}${instr ? ` <span class="role teacher" style="vertical-align:3px">Instructor only</span>` : ""}</h2>${C.sub && (manager || !instr) ? `<p class="muted small">${C.sub}</p>` : ""}</div>${manager ? `<button class="btn btn-line btn-sm" data-addmat="${key}">Add</button>` : ""}</div>
      <div data-matform="${key}" hidden></div>
      ${list.length ? list.map((x) => `<div class="item"><div class="what"><b>${esc(x.title)}</b><span class="tiny">${x.external_url ? "Link" : fileType(x.storage_path)} · updated ${fmtDate(x.updated_at || x.created_at)}</span></div>
        <div class="acts"><button class="btn btn-navy btn-sm" data-open="${x.id}">${x.external_url ? "Open link" : "Download"}</button>${manager ? `${x.storage_path ? `<button class="btn btn-line btn-sm" data-replace="${x.id}">Replace file</button>` : ""}<button class="btn btn-danger btn-sm" data-delmat="${x.id}">Delete</button>` : ""}</div></div>`).join("")
        : `<p class="empty">${C.empty}</p>`}
      ${manager ? `<input type="file" data-replacefile="${key}" accept="${C.accept}" hidden>` : ""}
    </div>`;
  }
  function fileType(path) { const ext = (path || "").split(".").pop().toLowerCase(); return { pdf: "PDF", doc: "Word", docx: "Word", ppt: "PowerPoint", pptx: "PowerPoint", xls: "Excel", xlsx: "Excel" }[ext] || "File"; }

  function bindMaterials(courseId, week, list) {
    ["student", "resource", "instructor"].forEach((cat) => {
      const key = `${cat}-${week === null ? "course" : week}`;
      const panel = $(`#mat-${key}`);
      if (!panel) return;
      const C = CATS[cat];
      $$("[data-open]", panel).forEach((b) => b.addEventListener("click", () => busy(b, async () => {
        const m = list.find((x) => x.id === b.dataset.open);
        try { const url = await API.materialUrl(m); const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); }
        catch (err) { toast(err.message); }
      })));
      $$("[data-delmat]", panel).forEach((b) => confirmBtn(b, "Delete for all sessions?", async () => {
        try { await API.deleteMaterial(list.find((x) => x.id === b.dataset.delmat)); toast("Material deleted"); route(); } catch (err) { toast(err.message); }
      }));
      const picker = $(`[data-replacefile="${key}"]`, panel);
      $$("[data-replace]", panel).forEach((b) => (b.onclick = () => {
        picker.onchange = () => {
          const file = picker.files[0]; picker.value = "";
          if (!file) return;
          if (file.size > MAX_FILE) return toast("That file is over 50 MB.");
          busy(b, async () => {
            try { await API.replaceMaterialFile(list.find((x) => x.id === b.dataset.replace), file); toast("File replaced"); route(); } catch (err) { toast(err.message); }
          });
        };
        picker.click();
      }));
      const add = $("[data-addmat]", panel);
      if (!add) return;
      add.onclick = () => {
        const host = $(`[data-matform="${key}"]`, panel);
        host.hidden = false;
        host.innerHTML = `<div class="drawer" style="margin-bottom:12px"><div class="mf-m" hidden></div>
          <form class="f mf" novalidate>
            <label class="fld">Title<input class="mf-title" type="text" placeholder="${cat === "instructor" ? "e.g. Week 3 lesson plan" : "e.g. Week 3 STAR worksheet"}" required></label>
            ${C.links ? `<div class="row"><label class="fld">Type<select class="mf-kind"><option value="file">Upload a file</option><option value="link">Paste a link</option></select></label></div>` : ""}
            <label class="fld mf-file-wrap">File <span class="hint">${C.hint}</span><input class="mf-file" type="file" accept="${C.accept}"></label>
            ${C.links ? `<label class="fld mf-link-wrap" hidden>Link<input class="mf-link" type="url" placeholder="https://"></label>` : ""}
            <p class="tiny">${cat === "instructor" ? "Visible to teachers of this class and administrators only." : "Every session of this class will see it."}</p>
            <div class="actions"><button class="btn btn-navy btn-sm" type="submit">Add</button><button class="btn btn-line btn-sm" type="button" data-cancel>Cancel</button></div>
          </form></div>`;
        const f = $(".mf", host), m = $(".mf-m", host);
        const kindSel = $(".mf-kind", f);
        if (kindSel) kindSel.onchange = (e) => { const link = e.target.value === "link"; $(".mf-file-wrap", f).hidden = link; $(".mf-link-wrap", f).hidden = !link; };
        $(".mf-file", f).onchange = (e) => { const file = e.target.files[0]; if (file && !$(".mf-title", f).value) $(".mf-title", f).value = file.name.replace(/\.[^.]+$/, ""); };
        $("[data-cancel]", f).onclick = () => { host.hidden = true; host.innerHTML = ""; };
        f.onsubmit = (e) => {
          e.preventDefault();
          const title = $(".mf-title", f).value.trim();
          if (!title) return showMsg(m, "err", "Give the material a title.");
          const kind = kindSel ? kindSel.value : "file";
          busy($("button[type=submit]", f), async () => {
            try {
              if (kind === "file") {
                const file = $(".mf-file", f).files[0];
                if (!file) return showMsg(m, "err", "Choose a file to upload.");
                if (file.size > MAX_FILE) return showMsg(m, "err", "That file is over 50 MB. Try a smaller file or share it as a link.");
                if (cat === "student" && !/\.pdf$/i.test(file.name)) return showMsg(m, "err", "Student materials must be PDFs. Save the file as PDF and upload it again.");
                await API.addMaterialFile(courseId, week, cat, title, file);
              } else {
                const url = $(".mf-link", f).value.trim();
                if (!/^https?:\/\//i.test(url)) return showMsg(m, "err", "Paste a full link starting with https://");
                await API.addMaterialLink(courseId, week, cat, title, url);
              }
              toast("Material added"); route();
            } catch (err) { showMsg(m, "err", err.message); }
          });
        };
      };
    });
  }

  // ---------- week (from a session, or from the class library) ----------
  async function weekView({ sessionId, courseId, n }) {
    loading("home");
    const week = Number(n);
    const s = sessionId ? await API.getSession(sessionId) : null;
    if (sessionId && !s) return shell("home", `${crumbs([["Classes", "#/"]])}<div class="panel"><h2>Page not found</h2></div>`);
    const cid = s ? s.course_id : courseId;
    const course = (await courses()).find((k) => k.id === cid);
    if (!course || !(week >= 1 && week <= 12)) return shell("home", `${crumbs([["Classes", "#/"]])}<div class="panel"><h2>Page not found</h2></div>`);
    const [weeks, recsAll, matsAll, manager, allSessions] = await Promise.all([API.weeks(cid), API.recordings(cid), API.materials(cid), managesCourse(cid), API.sessions()]);
    const sessionName = Object.fromEntries(allSessions.map((x) => [x.id, x.name]));
    const teachesThis = s ? (state.me.role === "admin" || (await API.teachers(s.id)).some((t) => t.id === state.me.id)) : manager;
    const w = weeks.find((x) => x.week === week);
    const recs = (s ? forSession(recsAll, s.id) : recsAll).filter((r) => r.week === week);
    const mats = matsAll.filter((x) => x.week === week);
    const myRecords = s && !teachesThis ? (await API.studentRecords(s.id, state.me.id)).filter((r) => r.week === week) : [];
    const start = s ? parseDate(s.start_date) : null;
    const when = start ? `${fmtDate(addDays(start, (week - 1) * 7))} – ${fmtDate(addDays(start, week * 7 - 1))}` : "";
    const cw = s ? currentWeek(s) : null;
    const admin = state.me.role === "admin";
    const base = s ? `#/session/${s.id}` : `#/class/${cid}`;
    const trail = s
      ? [[admin ? "Classes" : "My Classes", "#/"], [s.name, `#/session/${s.id}`], [`Week ${week}`]]
      : [[admin ? "Classes" : "My Classes", "#/"], [course.title, `#/class/${cid}`], [`Week ${week}`]];
    const objectives = (w.learning_objectives || "").split("\n").map((x) => x.replace(/^[-•*\d.)\s]+/, "").trim()).filter(Boolean);
    const canEditRec = (r) => (r.session_id ? admin || (s && teachesThis && r.session_id === s.id) : manager);

    const recItem = (r) => `<div class="item" data-rec="${r.id}"><div class="what"><b>${esc(r.title || `Week ${week} class recording`)}</b><span class="tiny">${r.recorded_on ? `Recorded ${fmtDate(r.recorded_on)}` : "Class recording"}${manager ? ` · ${r.session_id ? `Only ${esc(sessionName[r.session_id] || "one session")}` : "Shared with all sessions"}` : ""}${r.available_until ? ` · Available until ${fmtDate(r.available_until)}` : ""}</span>
        ${r.passcode ? `<div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="small muted">Passcode</span><span class="pass">${esc(r.passcode)}</span><button class="btn btn-line btn-sm" data-copy="${esc(r.passcode)}">Copy</button></div>` : ""}</div>
      <div class="acts">${ZOOM_RE.test(r.zoom_url) ? `<a class="btn btn-primary" href="${esc(r.zoom_url)}" target="_blank" rel="noopener">Watch on Zoom</a>` : ""}
        ${canEditRec(r) ? `<button class="btn btn-line btn-sm" data-editrec="${r.id}">Edit</button><button class="btn btn-danger btn-sm" data-delrec="${r.id}">Delete</button>` : ""}</div>
      <div data-recform="${r.id}" hidden style="flex-basis:100%"></div></div>`;

    const section = (title, body) => `<div class="panel"><h2 style="margin-bottom:12px">${title}</h2>${body}</div>`;
    const showObjectives = objectives.length || manager;
    const showAssignment = w.assignment || manager;

    shell("home", `
      ${crumbs(trail)}
      <div class="pagehead"><div><span class="eyebrow">Week ${pad(week)} of 12${when ? ` · ${when}` : ""}${week === cw ? " · This week" : ""}</span><h1>Week ${week} — ${esc(w.title)}</h1><p class="muted">${esc(course.title)}${s ? "" : " · Class library"}</p></div>
        ${manager ? `<button class="btn btn-line" id="editweek">Edit week content</button>` : ""}</div>
      <div id="editweek-form" hidden></div>
      <div class="stack">
        ${showObjectives ? section("Learning objectives", objectives.length ? `<ul class="objectives">${objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>` : `<p class="empty">Not added yet. Use "Edit week content" to add this week's objectives.</p>`) : ""}
        ${section("Lesson overview", `<p class="lesson-text">${esc(w.lesson_overview || w.description).replace(/\n/g, "<br>")}</p>`)}
        ${materialsPanel(cid, week, "student", mats.filter((x) => x.category === "student"), manager)}
        ${section("Practical training &amp; activities", `<p class="lesson-text">${esc(w.practical_training)}</p>`)}
        ${showAssignment ? section("Weekly assignment", w.assignment ? `<p class="lesson-text">${esc(w.assignment).replace(/\n/g, "<br>")}</p>` : `<p class="empty">Not added yet.</p>`) : ""}
        <div class="panel" id="recs"><div class="head"><div><h2>Class recording</h2><p class="muted small">${manager ? "Paste the Zoom cloud-recording share link and passcode. Choose who can see it." : "Missed class or want to review? Watch the recording here. Please don't share recording links or passcodes."}</p></div>${manager ? `<button class="btn btn-line btn-sm" id="addrec">Add recording</button>` : ""}</div>
          <div id="addrec-form" hidden></div>
          ${recs.length ? recs.map(recItem).join("") : `<p class="empty">${manager ? "No recording for this week yet." : "No recording for this week yet. Check back later."}</p>`}
        </div>
        ${myRecords.length ? `<div class="panel"><div class="head"><div><h2>My recordings &amp; feedback</h2><p class="muted small">Private to you, your instructor, and BPCTI administrators.</p></div></div>${myRecords.map((r) => recordItem(r, false)).join("")}</div>` : ""}
        ${materialsPanel(cid, week, "resource", mats.filter((x) => x.category === "resource"), manager)}
        ${manager ? materialsPanel(cid, week, "instructor", mats.filter((x) => x.category === "instructor"), manager) : ""}
      </div>
      <div class="weeknav">${week > 1 ? `<a class="btn btn-line" href="${base}/week/${week - 1}">← Week ${week - 1}</a>` : "<span></span>"}${week < 12 ? `<a class="btn btn-line" href="${base}/week/${week + 1}">Week ${week + 1} →</a>` : "<span></span>"}</div>`);

    bindRecordCopy();
    bindMaterials(cid, week, mats);
    if (!manager) return;
    $("#editweek").onclick = () => weekContentForm($("#editweek-form"), cid, w);
    $("#addrec").onclick = () => recordingForm($("#addrec-form"), cid, week, null, s && teachesThis ? s : null);
    $$("[data-editrec]").forEach((b) => (b.onclick = () => recordingForm($(`[data-recform="${b.dataset.editrec}"]`), cid, week, recs.find((r) => r.id === b.dataset.editrec), s && teachesThis ? s : null)));
    $$("[data-delrec]").forEach((b) => confirmBtn(b, "Confirm delete", async () => {
      try { await API.deleteRecording(b.dataset.delrec); toast("Recording deleted"); route(); } catch (err) { toast(err.message); }
    }));
  }

  function weekContentForm(host, courseId, w) {
    host.hidden = false;
    host.innerHTML = `<div class="panel" style="margin-bottom:20px"><h2>Edit week ${w.week} content</h2>
      <p class="muted small" style="margin:4px 0 16px">Shared by every session of this class. The week title and practical training come from the course curriculum on the website.</p>
      <div class="wf-m" hidden></div>
      <form class="f wf" novalidate>
        <label class="fld">Learning objectives <span class="hint">One per line</span><textarea class="wf-obj" rows="5" placeholder="Deliver a 60-second professional introduction&#10;Connect qualifications to an employer's needs">${esc(w.learning_objectives || "")}</textarea></label>
        <label class="fld">Lesson overview <span class="hint">Leave empty to use the curriculum description</span><textarea class="wf-over" rows="5" placeholder="${esc(w.description)}">${esc(w.lesson_overview || "")}</textarea></label>
        <label class="fld">Weekly assignment<textarea class="wf-asg" rows="4">${esc(w.assignment || "")}</textarea></label>
        <div class="actions"><button class="btn btn-navy btn-sm" type="submit">Save week content</button><button class="btn btn-line btn-sm" type="button" data-cancel>Cancel</button></div>
      </form></div>`;
    const f = $(".wf", host), m = $(".wf-m", host);
    $("[data-cancel]", f).onclick = () => { host.hidden = true; host.innerHTML = ""; };
    f.onsubmit = (e) => {
      e.preventDefault();
      const patch = { learning_objectives: $(".wf-obj", f).value.trim() || null, lesson_overview: $(".wf-over", f).value.trim() || null, assignment: $(".wf-asg", f).value.trim() || null };
      busy($("button[type=submit]", f), async () => {
        try { await API.updateWeek(courseId, w.week, patch); toast("Week content saved"); route(); } catch (err) { showMsg(m, "err", err.message); }
      });
    };
  }

  function recordingForm(host, courseId, week, existing, session) {
    host.hidden = false;
    const r = existing || {};
    const scopeDefault = existing ? (r.session_id ? "session" : "all") : session ? "session" : "all";
    host.innerHTML = `<div class="drawer" style="margin-bottom:12px"><div class="rf-m" hidden></div>
      <form class="f rf" novalidate>
        <label class="fld">Zoom share link <span class="hint">From Zoom → Recordings → Share. Starts with https:// and contains zoom.us</span><input class="rf-url" type="url" value="${esc(r.zoom_url || "")}" placeholder="https://us06web.zoom.us/rec/share/…" required></label>
        ${session || r.session_id ? `<label class="fld">Who can watch<select class="rf-scope">
          <option value="session" ${scopeDefault === "session" ? "selected" : ""}>Only students in ${esc(session ? session.name : "this session")} (recommended for class discussions)</option>
          <option value="all" ${scopeDefault === "all" ? "selected" : ""}>Students in every session of this class (lectures with no student participation)</option>
        </select></label>` : `<p class="tiny">Added from the class library, so it's shared with every session. For a recording of one session's class discussion, add it from that session's week page instead.</p>`}
        <div class="row">
          <label class="fld">Passcode<input class="rf-pass" type="text" value="${esc(r.passcode || "")}" autocomplete="off"></label>
          <label class="fld">Date recorded <span class="hint">Optional</span><input class="rf-date" type="date" value="${esc(r.recorded_on || "")}"></label>
          <label class="fld">Available to students until <span class="hint">Optional</span><input class="rf-until" type="date" value="${esc(r.available_until || "")}"></label>
        </div>
        <label class="fld">Title <span class="hint">Optional</span><input class="rf-title" type="text" value="${esc(r.title || "")}" placeholder="Week ${week} class recording"></label>
        <p class="tiny">In Zoom's share settings: require a passcode, turn off "Viewers can download", and set an expiration date.</p>
        <div class="actions"><button class="btn btn-navy btn-sm" type="submit">${existing ? "Save" : "Add recording"}</button><button class="btn btn-line btn-sm" type="button" data-cancel>Cancel</button></div>
      </form></div>`;
    const f = $(".rf", host), m = $(".rf-m", host);
    $("[data-cancel]", f).onclick = () => { host.hidden = true; host.innerHTML = ""; };
    f.onsubmit = (e) => {
      e.preventDefault();
      const zoom_url = $(".rf-url", f).value.trim();
      if (!ZOOM_RE.test(zoom_url)) return showMsg(m, "err", "That doesn't look like a Zoom link. Copy the share link from Zoom; it starts with https:// and contains zoom.us.");
      const scopeSel = $(".rf-scope", f);
      const session_id = scopeSel && scopeSel.value === "session" ? (session ? session.id : r.session_id) : null;
      const rec = { zoom_url, session_id, passcode: $(".rf-pass", f).value.trim() || null, recorded_on: $(".rf-date", f).value || null, available_until: $(".rf-until", f).value || null, title: $(".rf-title", f).value.trim() || null };
      busy($("button[type=submit]", f), async () => {
        try {
          if (existing) await API.updateRecording(existing.id, rec); else await API.addRecording({ ...rec, course_id: courseId, week });
          toast(existing ? "Recording updated" : "Recording added"); route();
        } catch (err) { showMsg(m, "err", err.message); }
      });
    };
  }

  // ---------- recording notice & account status ----------
  function noticeView() {
    authFrame(`
      <span class="eyebrow">Before you begin</span>
      <h2>${esc(NOTICE.title)}</h2>
      <div class="notice-text">${NOTICE.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      <div id="m" hidden></div>
      <form class="f" id="nf" novalidate style="margin-top:18px">
        <label class="check"><input type="checkbox" id="nf-ok"> <span>${esc(NOTICE.agree)}</span></label>
        <div class="actions"><button class="btn btn-navy" type="submit">Continue to the portal</button><button class="linkbtn" type="button" id="nf-out" style="color:var(--navy)">Sign out</button></div>
      </form>
      <p class="tiny" style="margin-top:20px">Questions, or prefer not to be recorded? <a href="https://bpcti.org/contact/">Contact BPCTI</a> before your class.</p>`);
    $("#nf-out").onclick = async () => { await API.signOut(); state.me = null; boot(); };
    $("#nf").onsubmit = (e) => {
      e.preventDefault();
      if (!$("#nf-ok").checked) return showMsg($("#m"), "err", "Please check the box to confirm you've read the notice.");
      busy($("#nf button[type=submit]"), async () => {
        try { await API.acceptNotice(state.me.id, NOTICE.version); state.noticeOk = true; route(); } catch (err) { showMsg($("#m"), "err", err.message); }
      });
    };
  }

  function inactiveView() {
    authFrame(`<h2>Your portal access is turned off</h2>
      <p class="muted" style="margin:10px 0 22px">Your BPCTI account has been deactivated, so classes, recordings, and materials aren't available. If you think this is a mistake, contact BPCTI.</p>
      <div class="actions" style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-navy" href="https://bpcti.org/contact/">Contact BPCTI</a><button class="btn btn-line" id="io-out">Sign out</button></div>`);
    $("#io-out").onclick = async () => { await API.signOut(); state.me = null; boot(); };
  }

  // ---------- people (admin) ----------
  async function peopleView() {
    if (state.me.role !== "admin") { location.hash = "#/"; return; }
    loading("people");
    const [people, sessions] = await Promise.all([API.people(), API.sessions()]);
    const counts = { admin: 0, teacher: 0, student: 0 };
    people.forEach((p) => counts[p.role]++);
    shell("people", `
      <div class="pagehead"><div><h1>People</h1><p class="muted">${plural(counts.student, "student")} · ${plural(counts.teacher, "teacher")} · ${plural(counts.admin, "admin")}</p></div><button class="btn btn-primary" id="inv">Invite someone</button></div>
      <div id="inv-form" hidden class="panel" style="margin-bottom:20px"></div>
      <div class="panel"><div class="tablewrap"><table class="t"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Account</th><th>Joined</th></tr></thead><tbody>
        ${people.map((p) => `<tr${p.is_active === false ? ' class="inactive"' : ""}><td>${esc(p.full_name || "—")}</td><td>${esc(p.email)}</td><td>${p.id === state.me.id ? `<span class="role ${p.role}">${p.role}</span> <span class="tiny">(you)</span>` : `<select data-role="${p.id}" aria-label="Role for ${esc(display(p))}">${["student", "teacher", "admin"].map((r) => `<option ${r === p.role ? "selected" : ""}>${r}</option>`).join("")}</select>`}</td>
          <td>${p.id === state.me.id ? `<span class="pill active">Active</span>` : p.is_active === false ? `<span class="pill withdrawn">Deactivated</span> <button class="btn btn-line btn-sm" data-active="${p.id}" data-to="1">Reactivate</button>` : `<span class="pill active">Active</span> <button class="btn btn-danger btn-sm" data-active="${p.id}" data-to="0">Deactivate</button>`}</td>
          <td class="small muted">${fmtDate(p.created_at)}</td></tr>`).join("")}
      </tbody></table></div>
      <p class="tiny" style="margin-top:14px">Deactivating removes all access to classes, recordings, and materials right away. Their account and records are kept, and you can reactivate them later.</p></div>`);
    $("#inv").onclick = () => {
      const host = $("#inv-form"); host.hidden = false;
      host.innerHTML = `<h2>Invite someone</h2><p class="muted small" style="margin:4px 0 16px">They'll get an email to set a password. Add them to a session now or later.</p><div id="pi-m" hidden></div>
        <form class="f" id="pi" novalidate>
          <div class="row"><label class="fld">Email<input id="pi-email" type="email" required></label><label class="fld">Full name<input id="pi-name" type="text"></label></div>
          <div class="row"><label class="fld">Role<select id="pi-role"><option>student</option><option>teacher</option><option>admin</option></select></label>
          <label class="fld">Session <span class="hint">Optional</span><select id="pi-class"><option value="">Not yet</option>${sessions.filter((c) => c.status !== "cancelled").map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></label></div>
          <div class="actions"><button class="btn btn-navy" type="submit">Send invite</button><button class="btn btn-line" type="button" id="pi-cancel">Cancel</button></div>
        </form>`;
      const m = $("#pi-m");
      $("#pi-cancel").onclick = () => { host.hidden = true; };
      $("#pi").onsubmit = (e) => {
        e.preventDefault();
        const email = $("#pi-email").value.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showMsg(m, "err", "Enter a valid email address.");
        busy($("#pi button[type=submit]"), async () => {
          try {
            const r = await API.invite({ email, full_name: $("#pi-name").value.trim() || undefined, role: $("#pi-role").value, class_id: $("#pi-class").value || undefined });
            toast(r.invited ? `Invite sent to ${email}` : `${email} already had an account and was updated`); route();
          } catch (err) { showMsg(m, "err", err.message); }
        });
      };
    };
    $$("[data-active]").forEach((b) => {
      const go = async () => { try { await API.setActive(b.dataset.active, b.dataset.to === "1"); toast(b.dataset.to === "1" ? "Account reactivated" : "Account deactivated"); route(); } catch (err) { toast(err.message); } };
      if (b.dataset.to === "0") confirmBtn(b, "Confirm deactivate", go); else b.onclick = () => busy(b, go);
    });
    $$("[data-role]").forEach((sel) => sel.addEventListener("change", async () => {
      try { await API.setRole(sel.dataset.role, sel.value); toast("Role updated"); } catch (err) { toast(err.message); route(); }
    }));
  }

  // ---------- account ----------
  function accountView() {
    const me = state.me;
    shell("account", `
      <div class="pagehead"><div><h1>Account</h1><p class="muted">${esc(me.email)}</p></div></div>
      <div class="stack" style="max-width:640px">
        <div class="panel"><h2>Your name</h2><div id="n-m" hidden style="margin-top:12px"></div>
          <form class="f" id="n" style="margin-top:14px" novalidate><label class="fld">Full name<input id="n-name" type="text" value="${esc(me.full_name || "")}"></label><div class="actions"><button class="btn btn-navy btn-sm" type="submit">Save name</button></div></form></div>
        <div class="panel"><h2>Change password</h2><div id="p-m" hidden style="margin-top:12px"></div>
          <form class="f" id="p" style="margin-top:14px" novalidate>
            <label class="fld">New password <span class="hint">At least 8 characters</span><input id="p1" type="password" autocomplete="new-password"></label>
            <label class="fld">Confirm password<input id="p2" type="password" autocomplete="new-password"></label>
            <div class="actions"><button class="btn btn-navy btn-sm" type="submit">Update password</button></div></form></div>
      </div>`);
    $("#n").onsubmit = (e) => {
      e.preventDefault();
      busy($("#n button"), async () => {
        try { await API.updateMyName(me.id, $("#n-name").value.trim() || null); state.me.full_name = $("#n-name").value.trim(); toast("Name saved"); accountView(); }
        catch (err) { showMsg($("#n-m"), "err", err.message); }
      });
    };
    $("#p").onsubmit = (e) => {
      e.preventDefault();
      const a = $("#p1").value, b = $("#p2").value, m = $("#p-m");
      if (a.length < 8) return showMsg(m, "err", "Use at least 8 characters.");
      if (a !== b) return showMsg(m, "err", "The two passwords don't match.");
      busy($("#p button"), async () => {
        try { await API.setPassword(a); $("#p").reset(); showMsg(m, "ok", "Password updated."); } catch (err) { showMsg(m, "err", err.message); }
      });
    };
  }

  // ---------- demo bar (demo build only) ----------
  function demoBar() {
    return `<div class="demobar"><div class="in"><b>Demo with sample data</b>View as:${API.personas().map((p) => `<button data-persona="${p.key}" aria-pressed="${p.key === API.currentPersona()}">${esc(p.label)}</button>`).join("")}</div></div>`;
  }
  function bindDemoBar() {
    $$("[data-persona]").forEach((b) => (b.onclick = async () => {
      API.setPersona(b.dataset.persona); state.me = await API.me();
      state.noticeOk = state.me.role !== "student" || (await API.hasAcceptedNotice(state.me.id, NOTICE.version));
      location.hash = "#/"; route();
    }));
  }

  // ---------- router & boot ----------
  async function route() {
    if (!state.me) return;
    if (state.me.is_active === false) return inactiveView();
    if (state.me.role === "student" && !state.noticeOk) return noticeView();
    const parts = (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
    try {
      if (parts[0] === "session" && parts[1] && parts[2] === "week") await weekView({ sessionId: parts[1], n: parts[3] });
      else if (parts[0] === "session" && parts[1] && parts[2] === "student" && parts[3]) await studentRecordsView(parts[1], parts[3]);
      else if (parts[0] === "session" && parts[1]) await sessionView(parts[1]);
      else if (parts[0] === "class" && parts[1] && parts[2] === "week") await weekView({ courseId: parts[1], n: parts[3] });
      else if (parts[0] === "class" && parts[1]) await classView(parts[1]);
      else if (parts[0] === "people") await peopleView();
      else if (parts[0] === "account") accountView();
      else await homeView();
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      shell("home", `<div class="panel"><h2>Something went wrong</h2><p class="muted" style="margin-top:6px">${esc(err.message)}</p><p style="margin-top:14px"><a class="btn btn-line" href="#/">Back to classes</a></p></div>`);
    }
  }

  async function boot() {
    if (API.linkError()) return loginView({ kind: "err", text: `That link didn't work: ${API.linkError()}. Ask BPCTI to send a new invite, or reset your password below.` });
    const session = await API.session();
    if (!session) return loginView();
    if (state.needsPassword) return setPasswordView(state.needsPassword);
    state.me = await API.me();
    if (!state.me) return loginView({ kind: "err", text: "Your account isn't set up yet. Contact BPCTI." });
    if (state.me.is_active === false) return inactiveView();
    if (state.me.role === "student" && !state.noticeOk) {
      state.noticeOk = await API.hasAcceptedNotice(state.me.id, NOTICE.version);
      if (!state.noticeOk) return noticeView();
    }
    route();
  }

  const t = API.linkType();
  if (t === "invite" || t === "recovery") state.needsPassword = t;
  API.onAuth((event) => { if (event === "PASSWORD_RECOVERY") { state.needsPassword = "recovery"; setPasswordView("recovery"); } });
  window.addEventListener("hashchange", route);
  boot();
})();
