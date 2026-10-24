// =====================================================================
//  BPCTI Student Portal — screens. Hash routes:
//    #/                       home (my classes / all classes)
//    #/class/<id>             class page (12 weeks, details, roster, admin)
//    #/class/<id>/week/<n>    week page (focus, recordings, materials)
//    #/people                 admin: invite people, roles
//    #/account                name and password
// =====================================================================
(function () {
  const API = window.API;
  const app = document.getElementById("app");
  const state = { me: null, courses: null, needsPassword: null };

  // ---------- helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const PROGRAM = { english: "English Program", korean: "Korean Program" };
  const ZOOM_RE = /^https:\/\/([a-z0-9-]+\.)*zoom\.(us|com)\//i;
  const MAX_FILE = 50 * 1024 * 1024;

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
  const isManager = (cls, teachers) => state.me.role === "admin" || teachers.some((t) => t.id === state.me.id);

  // ---------- auth screens ----------
  function authFrame(inner) {
    app.innerHTML = `<div class="auth">
      <div class="side">
        <div><img src="assets/logo.png" alt="BPCTI logo"><h1>BPCTI Student Portal</h1>
        <p>Your classes, weekly recordings, and course materials in one place.</p></div>
        <p class="small"><a href="https://bpcti.org" style="color:#fff">← Back to bpcti.org</a></p>
      </div>
      <div class="box">${inner}</div>
    </div>`;
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
    const nav = [["#/", me.role === "admin" ? "Classes" : "My Classes", "home"]];
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
    const classes = await API.classes();
    const weeksBy = {};
    await Promise.all([...new Set(classes.map((c) => c.course_id))].map(async (id) => (weeksBy[id] = await API.weeks(id))));
    const card = (c) => {
      const w = currentWeek(c);
      const wk = w >= 1 && w <= 12 ? weeksBy[c.course_id]?.[w - 1] : null;
      return `<a class="ccard" href="#/class/${c.id}">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><span class="eyebrow" style="margin:0">${esc(PROGRAM[c.course.program])} · ${esc(c.course.specialization)}</span><span class="pill ${c.status}">${esc(c.status)}</span></div>
        <h3>${esc(c.course.title)}</h3>
        <div class="meta">${esc(c.name)}${c.schedule ? ` · ${esc(c.schedule)}` : ""}</div>
        <div class="now">${wk ? `<b>This week:</b> Week ${w} — ${esc(wk.title)}` : esc(weekLabel(c))}</div>
      </a>`;
    };
    let body;
    if (me.role === "admin") {
      const groups = [["active", "Active"], ["planned", "Planned"], ["completed", "Completed"], ["cancelled", "Cancelled"]];
      body = `<div class="pagehead"><div><h1>Classes</h1><p class="muted">Every class group at BPCTI. Open one to manage its teachers, students, recordings, and materials.</p></div>
        <button class="btn btn-primary" id="newclass">New class</button></div>
        <div id="newclass-form" hidden></div>
        ${classes.length ? groups.map(([k, l]) => { const g = classes.filter((c) => c.status === k); return g.length ? `<h2 style="margin:28px 0 12px">${l}</h2><div class="grid">${g.map(card).join("")}</div>` : ""; }).join("")
          : `<div class="panel"><h2>No classes yet</h2><p class="muted" style="margin-top:6px">Create the first class group, then invite its teacher and students.</p></div>`}`;
    } else {
      const title = me.role === "teacher" ? "Your classes" : `Welcome, ${esc(firstName(me))}`;
      const empty = me.role === "teacher"
        ? "You haven't been assigned to a class yet. Once BPCTI adds you as a teacher, your classes will appear here."
        : "You're not enrolled in a class yet. Once BPCTI adds you to a class, it will appear here.";
      body = `<div class="pagehead"><div><h1>${title}</h1>${me.role === "student" && classes.length ? `<p class="muted">Pick a class to see this week's lesson, recordings, and materials.</p>` : ""}</div></div>
        ${classes.length ? `<div class="grid">${classes.map(card).join("")}</div>` : `<div class="panel"><p class="empty">${empty}</p></div>`}`;
    }
    shell("home", body);
    if (me.role === "admin") $("#newclass").onclick = () => classForm($("#newclass-form"));
  }

  async function classForm(host, existing) {
    const list = await courses();
    host.hidden = false;
    const c = existing || { status: "planned" };
    host.innerHTML = `<div class="panel" style="margin-bottom:20px"><h2>${existing ? "Edit class details" : "New class"}</h2>
      <p class="muted small" style="margin:4px 0 16px">A class is one specialization taught to one group of students on one schedule.</p>
      <div id="cf-m" hidden></div>
      <form class="f" id="cf" novalidate>
        <div class="row">
          <label class="fld">Specialization<select id="cf-course" ${existing ? "disabled" : ""} required>${list.map((k) => `<option value="${k.id}" ${k.id === c.course_id ? "selected" : ""}>${esc(PROGRAM[k.program].replace(" Program", ""))} ${k.specialization} — ${esc(k.title)}</option>`).join("")}</select></label>
        </div>
        <div class="row">
          <label class="fld">Class name <span class="hint">How it appears to students and teachers</span><input id="cf-name" type="text" value="${esc(c.name || "")}" placeholder="e.g. English B · Winter 2027 · Mornings" required></label>
          <label class="fld">Status<select id="cf-status">${["planned", "active", "completed", "cancelled"].map((s) => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}</select></label>
        </div>
        <div class="row">
          <label class="fld">Start date <span class="hint">Week 1 begins this day</span><input id="cf-start" type="date" value="${esc(c.start_date || "")}"></label>
          <label class="fld">Schedule<input id="cf-sched" type="text" value="${esc(c.schedule || "")}" placeholder="e.g. Tue & Thu, 9:00–11:00 AM"></label>
        </div>
        <label class="fld">Live class Zoom link <span class="hint">Optional. The recurring meeting students join each week.</span><input id="cf-live" type="url" value="${esc(c.live_meeting_url || "")}" placeholder="https://us06web.zoom.us/j/…"></label>
        <div class="actions"><button class="btn btn-navy" type="submit">${existing ? "Save changes" : "Create class"}</button><button class="btn btn-line" type="button" id="cf-cancel">Cancel</button></div>
      </form></div>`;
    const m = $("#cf-m");
    if (!existing) {
      const suggest = () => { const k = list.find((x) => x.id === $("#cf-course").value); if (k && !$("#cf-name").dataset.touched) $("#cf-name").value = `${PROGRAM[k.program].replace(" Program", "")} ${k.specialization} · ${new Date().getFullYear() + (new Date().getMonth() > 8 ? 1 : 0)}`; };
      $("#cf-course").onchange = suggest; $("#cf-name").oninput = () => ($("#cf-name").dataset.touched = "1"); suggest();
    }
    $("#cf-cancel").onclick = () => { host.hidden = true; host.innerHTML = ""; };
    $("#cf").onsubmit = (e) => {
      e.preventDefault();
      const live = $("#cf-live").value.trim();
      const patch = { name: $("#cf-name").value.trim(), status: $("#cf-status").value, start_date: $("#cf-start").value || null, schedule: $("#cf-sched").value.trim() || null, live_meeting_url: live || null };
      if (!patch.name) return showMsg(m, "err", "Give the class a name.");
      if (live && !/^https:\/\//i.test(live)) return showMsg(m, "err", "The live class link should start with https://");
      busy($("#cf button[type=submit]"), async () => {
        try {
          if (existing) { await API.updateClass(existing.id, patch); toast("Class updated"); route(); }
          else { const row = await API.createClass({ ...patch, course_id: $("#cf-course").value }); toast("Class created"); location.hash = `#/class/${row.id}`; }
        } catch (err) { showMsg(m, "err", err.message); }
      });
    };
  }

  // ---------- class ----------
  async function classView(id) {
    loading("home");
    const cls = await API.getClass(id);
    if (!cls) return shell("home", `${crumbs([["Classes", "#/"]])}<div class="panel"><h2>Class not found</h2><p class="muted" style="margin-top:6px">It may have been removed, or you may not have access to it.</p></div>`);
    const [weeks, recs, mats, teachers] = await Promise.all([API.weeks(cls.course_id), API.recordings(id), API.materials(id), API.teachers(id)]);
    const manager = isManager(cls, teachers);
    const roster = manager ? await API.roster(id) : [];
    const admin = state.me.role === "admin";
    const cw = currentWeek(cls);
    const start = parseDate(cls.start_date);
    const recCount = (w) => recs.filter((r) => r.week === w).length;
    const matCount = (w) => mats.filter((x) => x.week === w).length;

    const weekRows = weeks.map((w) => {
      const r = recCount(w.week), f = matCount(w.week), cur = w.week === cw;
      const dates = start ? ` · ${fmtDate(addDays(start, (w.week - 1) * 7)).replace(/, \d{4}$/, "")}` : "";
      return `<a href="#/class/${id}/week/${w.week}" class="${cur ? "current" : ""}">
        <span class="wk">Week ${pad(w.week)}${dates}</span>
        <span class="wt">${esc(w.title)}</span>
        <span class="marks">${cur ? `<span class="mark" style="background:var(--navy);color:#fff">This week</span>` : ""}${r ? `<span class="mark rec">Recording</span>` : ""}${f ? `<span class="mark">${f} file${f > 1 ? "s" : ""}</span>` : ""}</span>
      </a>`;
    }).join("");

    const details = `<div class="panel"><h2>Class details</h2>
      <dl class="facts" style="margin-top:14px">
        <dt>Class</dt><dd>${esc(cls.name)}</dd>
        <dt>Status</dt><dd><span class="pill ${cls.status}">${esc(cls.status)}</span> ${esc(weekLabel(cls))}</dd>
        ${cls.schedule ? `<dt>Schedule</dt><dd>${esc(cls.schedule)}</dd>` : ""}
        ${start ? `<dt>Dates</dt><dd>${fmtDate(cls.start_date)} – ${fmtDate(addDays(start, 83))}</dd>` : ""}
        <dt>Teacher${teachers.length > 1 ? "s" : ""}</dt><dd>${teachers.length ? teachers.map((t) => esc(display(t))).join(", ") : "To be assigned"}</dd>
      </dl>
      ${cls.live_meeting_url ? `<a class="btn btn-primary" style="margin-top:18px;width:100%" href="${esc(cls.live_meeting_url)}" target="_blank" rel="noopener">Join live class on Zoom</a>` : ""}
    </div>`;

    const courseMats = materialsPanel(cls, null, mats.filter((x) => x.week === null), manager, "Course materials", "Handouts and resources for the whole course.");

    const rosterPanel = manager ? `<div class="panel" id="roster"><div class="head"><div><h2>Students</h2><p class="muted small">${roster.filter((s) => s.status === "active").length} active</p></div>${admin ? `<button class="btn btn-line btn-sm" id="inv-student">Invite student</button>` : ""}</div>
      <div id="inv-student-form" hidden></div>
      ${roster.length ? `<div class="tablewrap"><table class="t"><thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead><tbody>
        ${roster.map((s) => `<tr><td>${esc(s.full_name || "—")}</td><td>${esc(s.email)}</td><td>${admin ? `<select data-enroll="${s.id}" aria-label="Status for ${esc(display(s))}">${["active", "completed", "withdrawn"].map((x) => `<option ${x === s.status ? "selected" : ""}>${x}</option>`).join("")}</select>` : `<span class="pill ${s.status}">${s.status}</span>`}</td></tr>`).join("")}
      </tbody></table></div>` : `<p class="empty">No students in this class yet.</p>`}
    </div>` : "";

    const adminPanel = admin ? `<div class="panel" id="manage"><h2>Manage class</h2>
      <p class="muted small" style="margin:4px 0 16px">Only admins see this.</p>
      <h3 style="margin-bottom:8px">Teachers</h3>
      ${teachers.length ? teachers.map((t) => `<div class="item"><div class="what"><b>${esc(display(t))}</b><span class="small muted">${esc(t.email)}</span></div><div class="acts"><button class="btn btn-danger btn-sm" data-unassign="${t.id}">Remove</button></div></div>`).join("") : `<p class="empty">No teacher assigned.</p>`}
      <div class="actions" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><select id="assign-teacher" style="width:auto;min-width:200px"><option value="">Add an existing teacher…</option></select><button class="btn btn-line btn-sm" id="inv-teacher">Invite new teacher</button></div>
      <div id="inv-teacher-form" hidden></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px;padding-top:18px;border-top:1px solid var(--line)">
        <button class="btn btn-line btn-sm" id="edit-class">Edit class details</button>
        <button class="btn btn-danger btn-sm" id="del-class">Delete class</button>
      </div>
      <div id="edit-class-form" hidden></div>
    </div>` : "";

    shell("home", `
      ${crumbs([[state.me.role === "admin" ? "Classes" : "My Classes", "#/"], [cls.name]])}
      <div class="pagehead"><div><span class="eyebrow">${esc(PROGRAM[cls.course.program])} · Specialization ${esc(cls.course.specialization)}</span><h1>${esc(cls.course.title)}</h1>${cls.course.tagline ? `<p class="muted">${esc(cls.course.tagline)}</p>` : ""}</div></div>
      <div class="cols">
        <div class="stack">
          <div class="panel"><div class="head"><div><h2>12-week curriculum</h2><p class="muted small">Open a week for its lesson, recording, and materials.</p></div></div><div class="weeks">${weekRows}</div></div>
          ${courseMats}
          ${rosterPanel}
        </div>
        <div class="stack">${details}${adminPanel}</div>
      </div>`);

    bindMaterials(cls, null, mats.filter((x) => x.week === null));
    if (admin) bindAdmin(cls, teachers);
  }

  function inviteForm(host, { role, classId, onDone }) {
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
          const r = await API.invite({ email, full_name: $("#if-name", host).value.trim() || undefined, role, class_id: classId });
          toast(r.invited ? `Invite sent to ${email}` : `${email} already had an account and was added`);
          onDone();
        } catch (err) { showMsg(m, "err", err.message); }
      });
    };
  }

  async function bindAdmin(cls, teachers) {
    $("#inv-student").onclick = () => inviteForm($("#inv-student-form"), { role: "student", classId: cls.id, onDone: route });
    $("#inv-teacher").onclick = () => inviteForm($("#inv-teacher-form"), { role: "teacher", classId: cls.id, onDone: route });
    $("#edit-class").onclick = () => classForm($("#edit-class-form"), cls);
    confirmBtn($("#del-class"), "Click again to delete", async () => {
      try { await API.deleteClass(cls.id); toast("Class deleted"); location.hash = "#/"; } catch (err) { toast(err.message); }
    });
    $$("[data-unassign]").forEach((b) => confirmBtn(b, "Confirm remove", async () => {
      try { await API.removeTeacher(cls.id, b.dataset.unassign); toast("Teacher removed"); route(); } catch (err) { toast(err.message); }
    }));
    $$("[data-enroll]").forEach((sel) => sel.addEventListener("change", async () => {
      try { await API.setEnrollment(cls.id, sel.dataset.enroll, sel.value); toast("Status updated"); } catch (err) { toast(err.message); route(); }
    }));
    const people = await API.people();
    const pick = $("#assign-teacher");
    if (!pick) return;
    people.filter((p) => p.role === "teacher" && !teachers.some((t) => t.id === p.id))
      .forEach((p) => pick.insertAdjacentHTML("beforeend", `<option value="${p.id}">${esc(display(p))}</option>`));
    pick.onchange = async () => {
      if (!pick.value) return;
      try { await API.addTeacher(cls.id, pick.value); toast("Teacher added"); route(); } catch (err) { toast(err.message); }
    };
  }

  // ---------- materials (shared by class + week pages) ----------
  function materialsPanel(cls, week, list, manager, title, sub) {
    const key = week === null ? "course" : `w${week}`;
    return `<div class="panel" id="mat-${key}"><div class="head"><div><h2>${title}</h2>${sub ? `<p class="muted small">${sub}</p>` : ""}</div>${manager ? `<button class="btn btn-line btn-sm" data-addmat="${key}">Add material</button>` : ""}</div>
      <div data-matform="${key}" hidden></div>
      ${list.length ? list.map((x) => `<div class="item"><div class="what"><b>${esc(x.title)}</b><span class="tiny">${x.external_url ? "Link" : "File"} · added ${fmtDate(x.created_at)}</span></div>
        <div class="acts"><button class="btn btn-navy btn-sm" data-open="${x.id}">${x.external_url ? "Open link" : "Download"}</button>${manager ? `<button class="btn btn-danger btn-sm" data-delmat="${x.id}">Delete</button>` : ""}</div></div>`).join("")
        : `<p class="empty">No materials ${week === null ? "for the whole course" : "for this week"} yet.</p>`}
    </div>`;
  }

  function bindMaterials(cls, week, list) {
    const key = week === null ? "course" : `w${week}`;
    const panel = $(`#mat-${key}`);
    if (!panel) return;
    $$("[data-open]", panel).forEach((b) => b.addEventListener("click", () => busy(b, async () => {
      const m = list.find((x) => x.id === b.dataset.open);
      try { const url = await API.materialUrl(m); const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); }
      catch (err) { toast(err.message); }
    })));
    $$("[data-delmat]", panel).forEach((b) => confirmBtn(b, "Confirm delete", async () => {
      try { await API.deleteMaterial(list.find((x) => x.id === b.dataset.delmat)); toast("Material deleted"); route(); } catch (err) { toast(err.message); }
    }));
    const add = $("[data-addmat]", panel);
    if (!add) return;
    add.onclick = () => {
      const host = $(`[data-matform="${key}"]`, panel);
      host.hidden = false;
      host.innerHTML = `<div class="drawer" style="margin-bottom:12px"><div class="mf-m" hidden></div>
        <form class="f mf" novalidate>
          <label class="fld">Title<input class="mf-title" type="text" placeholder="e.g. Week 3 STAR worksheet" required></label>
          <div class="row"><label class="fld">Type<select class="mf-kind"><option value="file">Upload a file</option><option value="link">Paste a link</option></select></label></div>
          <label class="fld mf-file-wrap">File <span class="hint">PDF, slides, documents, up to 50 MB</span><input class="mf-file" type="file"></label>
          <label class="fld mf-link-wrap" hidden>Link<input class="mf-link" type="url" placeholder="https://"></label>
          <div class="actions"><button class="btn btn-navy btn-sm" type="submit">Add</button><button class="btn btn-line btn-sm" type="button" data-cancel>Cancel</button></div>
        </form></div>`;
      const f = $(".mf", host), m = $(".mf-m", host);
      $(".mf-kind", f).onchange = (e) => { const link = e.target.value === "link"; $(".mf-file-wrap", f).hidden = link; $(".mf-link-wrap", f).hidden = !link; };
      $(".mf-file", f).onchange = (e) => { const file = e.target.files[0]; if (file && !$(".mf-title", f).value) $(".mf-title", f).value = file.name.replace(/\.[^.]+$/, ""); };
      $("[data-cancel]", f).onclick = () => { host.hidden = true; host.innerHTML = ""; };
      f.onsubmit = (e) => {
        e.preventDefault();
        const title = $(".mf-title", f).value.trim();
        if (!title) return showMsg(m, "err", "Give the material a title.");
        const kind = $(".mf-kind", f).value;
        busy($("button[type=submit]", f), async () => {
          try {
            if (kind === "file") {
              const file = $(".mf-file", f).files[0];
              if (!file) return showMsg(m, "err", "Choose a file to upload.");
              if (file.size > MAX_FILE) return showMsg(m, "err", "That file is over 50 MB. Try a smaller file or share it as a link.");
              await API.addMaterialFile(cls.id, week, title, file);
            } else {
              const url = $(".mf-link", f).value.trim();
              if (!/^https?:\/\//i.test(url)) return showMsg(m, "err", "Paste a full link starting with https://");
              await API.addMaterialLink(cls.id, week, title, url);
            }
            toast("Material added"); route();
          } catch (err) { showMsg(m, "err", err.message); }
        });
      };
    };
  }

  // ---------- week ----------
  async function weekView(id, n) {
    loading("home");
    const week = Number(n);
    const cls = await API.getClass(id);
    if (!cls || !(week >= 1 && week <= 12)) return shell("home", `${crumbs([["Classes", "#/"]])}<div class="panel"><h2>Page not found</h2></div>`);
    const [weeks, recsAll, matsAll, teachers] = await Promise.all([API.weeks(cls.course_id), API.recordings(id), API.materials(id), API.teachers(id)]);
    const w = weeks.find((x) => x.week === week);
    const recs = recsAll.filter((r) => r.week === week);
    const mats = matsAll.filter((x) => x.week === week);
    const manager = isManager(cls, teachers);
    const start = parseDate(cls.start_date);
    const when = start ? `${fmtDate(addDays(start, (week - 1) * 7))} – ${fmtDate(addDays(start, week * 7 - 1))}` : "";
    const cw = currentWeek(cls);

    const recItem = (r) => `<div class="item" data-rec="${r.id}"><div class="what"><b>${esc(r.title || `Week ${week} class recording`)}</b><span class="tiny">${r.recorded_on ? `Recorded ${fmtDate(r.recorded_on)}` : "Class recording"}</span>
        ${r.passcode ? `<div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="small muted">Passcode</span><span class="pass">${esc(r.passcode)}</span><button class="btn btn-line btn-sm" data-copy="${esc(r.passcode)}">Copy</button></div>` : ""}</div>
      <div class="acts">${ZOOM_RE.test(r.zoom_url) ? `<a class="btn btn-primary" href="${esc(r.zoom_url)}" target="_blank" rel="noopener">Watch on Zoom</a>` : ""}
        ${manager ? `<button class="btn btn-line btn-sm" data-editrec="${r.id}">Edit</button><button class="btn btn-danger btn-sm" data-delrec="${r.id}">Delete</button>` : ""}</div>
      <div data-recform="${r.id}" hidden style="flex-basis:100%"></div></div>`;

    shell("home", `
      ${crumbs([[state.me.role === "admin" ? "Classes" : "My Classes", "#/"], [cls.name, `#/class/${id}`], [`Week ${week}`]])}
      <div class="pagehead"><div><span class="eyebrow">Week ${pad(week)} of 12${when ? ` · ${when}` : ""}${week === cw ? " · This week" : ""}</span><h1>${esc(w.title)}</h1><p class="muted">${esc(cls.course.title)}</p></div></div>
      <div class="stack">
        <div class="panel"><div class="focus"><div><h3>Learning focus</h3><p>${esc(w.description)}</p></div><div><h3>Practical training</h3><p>${esc(w.practical_training)}</p></div></div></div>
        <div class="panel" id="recs"><div class="head"><div><h2>Class recording</h2><p class="muted small">${manager ? "Paste the Zoom cloud-recording share link and passcode after class." : "Missed class or want to review? Watch the recording here."}</p></div>${manager ? `<button class="btn btn-line btn-sm" id="addrec">Add recording</button>` : ""}</div>
          <div id="addrec-form" hidden></div>
          ${recs.length ? recs.map(recItem).join("") : `<p class="empty">${manager ? "No recording added for this week yet." : "No recording for this week yet. Check back after class."}</p>`}
        </div>
        ${materialsPanel(cls, week, mats, manager, "Materials", "")}
      </div>
      <div class="weeknav">${week > 1 ? `<a class="btn btn-line" href="#/class/${id}/week/${week - 1}">← Week ${week - 1}</a>` : "<span></span>"}${week < 12 ? `<a class="btn btn-line" href="#/class/${id}/week/${week + 1}">Week ${week + 1} →</a>` : "<span></span>"}</div>`);

    $$("[data-copy]").forEach((b) => (b.onclick = () => copy(b.dataset.copy, b)));
    bindMaterials(cls, week, mats);
    if (!manager) return;
    $("#addrec").onclick = () => recordingForm($("#addrec-form"), cls.id, week);
    $$("[data-editrec]").forEach((b) => (b.onclick = () => recordingForm($(`[data-recform="${b.dataset.editrec}"]`), cls.id, week, recs.find((r) => r.id === b.dataset.editrec))));
    $$("[data-delrec]").forEach((b) => confirmBtn(b, "Confirm delete", async () => {
      try { await API.deleteRecording(b.dataset.delrec); toast("Recording deleted"); route(); } catch (err) { toast(err.message); }
    }));
  }

  function recordingForm(host, classId, week, existing) {
    host.hidden = false;
    const r = existing || {};
    host.innerHTML = `<div class="drawer" style="margin-bottom:12px"><div class="rf-m" hidden></div>
      <form class="f rf" novalidate>
        <label class="fld">Zoom share link <span class="hint">From Zoom → Recordings → Share. Starts with https:// and contains zoom.us</span><input class="rf-url" type="url" value="${esc(r.zoom_url || "")}" placeholder="https://us06web.zoom.us/rec/share/…" required></label>
        <div class="row">
          <label class="fld">Passcode<input class="rf-pass" type="text" value="${esc(r.passcode || "")}" autocomplete="off"></label>
          <label class="fld">Class date<input class="rf-date" type="date" value="${esc(r.recorded_on || todayISO())}"></label>
          <label class="fld">Title <span class="hint">Optional</span><input class="rf-title" type="text" value="${esc(r.title || "")}" placeholder="Week ${week} class recording"></label>
        </div>
        <p class="tiny">Before sharing, turn off "Viewers can download" in Zoom's share settings. Only students in this class will see the link and passcode.</p>
        <div class="actions"><button class="btn btn-navy btn-sm" type="submit">${existing ? "Save" : "Add recording"}</button><button class="btn btn-line btn-sm" type="button" data-cancel>Cancel</button></div>
      </form></div>`;
    const f = $(".rf", host), m = $(".rf-m", host);
    $("[data-cancel]", f).onclick = () => { host.hidden = true; host.innerHTML = ""; };
    f.onsubmit = (e) => {
      e.preventDefault();
      const zoom_url = $(".rf-url", f).value.trim();
      if (!ZOOM_RE.test(zoom_url)) return showMsg(m, "err", "That doesn't look like a Zoom link. Copy the share link from Zoom; it starts with https:// and contains zoom.us.");
      const rec = { zoom_url, passcode: $(".rf-pass", f).value.trim() || null, recorded_on: $(".rf-date", f).value || null, title: $(".rf-title", f).value.trim() || null };
      busy($("button[type=submit]", f), async () => {
        try {
          if (existing) await API.updateRecording(existing.id, rec); else await API.addRecording({ ...rec, class_id: classId, week });
          toast(existing ? "Recording updated" : "Recording added"); route();
        } catch (err) { showMsg(m, "err", err.message); }
      });
    };
  }

  // ---------- people (admin) ----------
  async function peopleView() {
    if (state.me.role !== "admin") { location.hash = "#/"; return; }
    loading("people");
    const [people, classes] = await Promise.all([API.people(), API.classes()]);
    const counts = { admin: 0, teacher: 0, student: 0 };
    people.forEach((p) => counts[p.role]++);
    shell("people", `
      <div class="pagehead"><div><h1>People</h1><p class="muted">${plural(counts.student, "student")} · ${plural(counts.teacher, "teacher")} · ${plural(counts.admin, "admin")}</p></div><button class="btn btn-primary" id="inv">Invite someone</button></div>
      <div id="inv-form" hidden class="panel" style="margin-bottom:20px"></div>
      <div class="panel"><div class="tablewrap"><table class="t"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody>
        ${people.map((p) => `<tr><td>${esc(p.full_name || "—")}</td><td>${esc(p.email)}</td><td>${p.id === state.me.id ? `<span class="role ${p.role}">${p.role}</span> <span class="tiny">(you)</span>` : `<select data-role="${p.id}" aria-label="Role for ${esc(display(p))}">${["student", "teacher", "admin"].map((r) => `<option ${r === p.role ? "selected" : ""}>${r}</option>`).join("")}</select>`}</td><td class="small muted">${fmtDate(p.created_at)}</td></tr>`).join("")}
      </tbody></table></div></div>`);
    $("#inv").onclick = () => {
      const host = $("#inv-form"); host.hidden = false;
      host.innerHTML = `<h2>Invite someone</h2><p class="muted small" style="margin:4px 0 16px">They'll get an email to set a password. Add them to a class now or later.</p><div id="pi-m" hidden></div>
        <form class="f" id="pi" novalidate>
          <div class="row"><label class="fld">Email<input id="pi-email" type="email" required></label><label class="fld">Full name<input id="pi-name" type="text"></label></div>
          <div class="row"><label class="fld">Role<select id="pi-role"><option>student</option><option>teacher</option><option>admin</option></select></label>
          <label class="fld">Class <span class="hint">Optional</span><select id="pi-class"><option value="">Not yet</option>${classes.filter((c) => c.status !== "cancelled").map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></label></div>
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
    $$("[data-persona]").forEach((b) => (b.onclick = async () => { API.setPersona(b.dataset.persona); state.me = await API.me(); location.hash = "#/"; route(); }));
  }

  // ---------- router & boot ----------
  async function route() {
    if (!state.me) return;
    const parts = (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
    try {
      if (parts[0] === "class" && parts[1] && parts[2] === "week") await weekView(parts[1], parts[3]);
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
    route();
  }

  const t = API.linkType();
  if (t === "invite" || t === "recovery") state.needsPassword = t;
  API.onAuth((event) => { if (event === "PASSWORD_RECOVERY") { state.needsPassword = "recovery"; setPasswordView("recovery"); } });
  window.addEventListener("hashchange", route);
  boot();
})();
