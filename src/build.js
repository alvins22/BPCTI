#!/usr/bin/env node
// =====================================================================
//  BPCTI static site builder. No dependencies.
//
//    node src/build.js                 -> writes the site into the repo root
//    PREVIEW=1 OUT=/tmp/x node src/build.js
//                                      -> preview build (links end in index.html
//                                         so it also works from a file viewer)
// =====================================================================
const fs = require("fs");
const path = require("path");
const S = require("./content/site");
const { PROGRAMS, COURSES } = require("./content/courses");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.resolve(process.env.OUT || ROOT);
const PREVIEW = !!process.env.PREVIEW;
const { config: C, brand } = S;

// ---------- validation (Implementation Guide Part VII §3) ----------
for (const c of COURSES) {
  const weeks = c.curriculum.map((w) => w.week).join(",");
  if (c.curriculum.length !== 12 || weeks !== "1,2,3,4,5,6,7,8,9,10,11,12")
    throw new Error(`${c.id}: curriculum must have exactly weeks 1–12 (got ${weeks})`);
  for (const k of ["title", "tagline", "overview", "audience", "learningOutcomes", "practicalHighlights"])
    if (!c[k] || (Array.isArray(c[k]) && !c[k].length)) throw new Error(`${c.id}: missing ${k}`);
}

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pad = (n) => String(n).padStart(2, "0");
const programUrl = (pid) => `programs/${PROGRAMS[pid].slug}/`;
const courseUrl = (c) => `${programUrl(c.program)}${c.slug}/`;
const PANEL_LABEL = { A: "Interviews & Career Advancement", B: "Meetings, Virtual & Executive Presence", C: "Business Dining & Networking", D: "Global & Cross-Cultural Leadership" };

let CUR = ""; // path of the page being rendered, e.g. "programs/" ("" = home)
function href(target) {
  const [p, hash] = target.split("#");
  const depth = CUR ? CUR.split("/").filter(Boolean).length : 0;
  let out = "../".repeat(depth) + p;
  if (PREVIEW && (p === "" || p.endsWith("/"))) out += "index.html";
  if (out === "") out = "./";
  return hash !== undefined ? `${out}#${hash}` : out;
}
const asset = (p) => href(`assets/${p}`);
const current = (target) => (target === CUR ? ' aria-current="page"' : "");

// ---------- layout ----------
function header() {
  const items = S.nav.map((n) => {
    const inSection = n.href && n.href !== "" && CUR.startsWith(n.href) && CUR !== n.href;
    const homeCls = n.href === "" ? ' class="nav-home"' : "";
    if (!n.children) return `<li${homeCls}><a href="${href(n.href)}"${current(n.href)}>${esc(n.label)}</a></li>`;
    const subs = n.children.map((c) => `<li><a href="${href(c.href)}"${current(c.href)}>${esc(c.label)}</a></li>`).join("");
    return `<li class="has-sub${inSection ? " is-section" : ""}"><a href="${href(n.href)}"${current(n.href)}>${esc(n.label)}</a><button class="sub-toggle" type="button" aria-expanded="false" aria-controls="sub-${n.label.toLowerCase()}" aria-label="Show ${esc(n.label)} pages"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button><ul class="sub" id="sub-${n.label.toLowerCase()}">${subs}</ul></li>`;
  }).join("");
  return `<a class="skip" href="#main">Skip to content</a>
<div class="util"><div class="wrap">
  <div class="util__contact"><span class="addr">${esc(C.addressLine2.replace(/ \d+$/, ""))}</span><a href="tel:${C.phone.replace(/\D/g, "")}">${esc(C.phone)}</a><a class="email" href="mailto:${C.email}">${esc(C.email)}</a></div>
  <div class="util__actions"><a class="portal-link" href="${href("portal/")}">Student Portal</a><a class="support" href="${href("scholarships/#support")}">Support Our Mission</a><a class="btn btn--gold btn--sm" href="${href("contact/#program-inquiry")}">Request Information</a></div>
</div></div>
<header class="mast"><div class="wrap">
  <a class="brand" href="${href("")}"><img src="${asset("img/logo.png")}" alt="" width="54" height="54"><span>BP COMMUNICATION<br>TRAINING INSTITUTE</span></a>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
  <nav class="nav" id="site-nav" aria-label="Main"><ul>${items}</ul></nav>
</div></header>`;
}

function footer() {
  const progLinks = [
    ["Professional English Business Communication", programUrl("english")],
    ["Korean Global Business Communication", programUrl("korean")],
    ["Korean Cultural Experience Workshops", "programs/korean-cultural-workshops/"],
  ].map(([l, u]) => `<li><a href="${href(u)}">${esc(l)}</a></li>`).join("");
  const navLinks = S.nav.map((n) => `<a href="${href(n.href)}">${esc(n.label)}</a>`).join("");
  return `<footer class="foot"><div class="wrap">
  <div class="foot__top">
    <div class="foot__brand"><img src="${asset("img/logo.png")}" alt="BPCTI logo" width="72" height="72"><strong>BP COMMUNICATION TRAINING INSTITUTE</strong><p>${esc(brand.positioning)}</p></div>
    <div><h2>Programs</h2><ul>${progLinks}</ul></div>
    <div><h2>Learn More</h2><ul>
      <li><a href="${href("training-method/")}">Training Method</a></li>
      <li><a href="${href("admissions-tuition/")}">Admissions &amp; Tuition</a></li>
      <li><a href="${href("employer-training/")}">Employer Training</a></li>
      <li><a href="${href("scholarships/")}">Scholarships &amp; Support</a></li>
      <li><a href="${href("portal/")}">Student Portal</a></li>
    </ul></div>
    <div><h2>Contact</h2><ul>
      <li>${esc(C.addressLine1)}<br>${esc(C.addressLine2)}</li>
      <li><a href="tel:${C.phone.replace(/\D/g, "")}">${esc(C.phone)}</a></li>
      <li><a href="mailto:${C.email}">${esc(C.email)}</a></li>
    </ul></div>
  </div>
  <nav class="foot__nav" aria-label="Footer">${navLinks}</nav>
  <div class="foot__legal"><p>${esc(brand.nonprofit)}</p><p>BPCTI Certificates of Completion document completion of BPCTI training and are not academic degrees, state-issued professional licenses, or third-party professional certifications.</p><p>© 2022–${new Date().getFullYear()} BP Communication Training Institute. All Rights Reserved.</p></div>
</div></footer>`;
}

function page({ path: p, title, description, body, extraHead = "" }) {
  CUR = p;
  body = typeof body === "function" ? body() : body;
  const canonical = C.siteUrl + "/" + p;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="BP Communication Training Institute">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${C.siteUrl}/assets/img/hero-speaker.jpg">
<meta name="theme-color" content="#022A66">
<link rel="icon" type="image/png" href="${asset("img/favicon.png")}">
<link rel="apple-touch-icon" href="${asset("img/apple-touch-icon.png")}">
<link rel="preload" href="${asset("fonts/archivo-wdth-latin.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${asset("css/site.css")}">
<script>document.documentElement.classList.add("js")</script>
${extraHead}</head>
<body>
${header()}
<main id="main">
${body}
</main>
${footer()}
<script src="${asset("js/site.js")}" defer></script>
</body>
</html>
`;
  const file = path.join(OUT, p, p === "404.html" ? "" : "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  return file;
}

// ---------- shared blocks ----------
const crumbs = (trail) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${trail.map(([l, u], i) => i === trail.length - 1 ? `<li aria-current="page">${esc(l)}</li>` : `<li><a href="${href(u)}">${esc(l)}</a></li>`).join("")}</ol></nav>`;

function pageHero({ trail, eyebrow, title, tagline, lede, extra = "", btns = "" }) {
  return `<section class="phero on-dark"><div class="wrap">
  ${trail ? crumbs(trail) : ""}
  ${eyebrow ? `<p class="phero__kicker">${eyebrow}</p>` : ""}
  <h1>${esc(title)}</h1>
  ${tagline ? `<p class="tagline">${esc(tagline)}</p>` : ""}
  ${lede ? (Array.isArray(lede) ? lede : [lede]).map((l) => `<p class="lede">${esc(l)}</p>`).join("") : ""}
  ${btns ? `<div class="btns">${btns}</div>` : ""}
  ${extra}
</div></section>`;
}

const btn = (label, target, kind = "gold") => `<a class="btn btn--${kind}" href="${href(target)}">${esc(label)}</a>`;

function specCard(c) {
  const art = c.image
    ? `<img src="${asset(c.image)}" alt="" loading="lazy">`
    : `<div class="panel panel--${c.specialization.toLowerCase()}" aria-hidden="true"><div class="panel__lines"></div><div class="panel__rule"></div><div class="panel__label">${esc(PANEL_LABEL[c.specialization])}</div><div class="panel__glyph">${c.specialization}</div></div>`;
  return `<a class="scard" href="${href(courseUrl(c))}">
  <div class="scard__art">${art}</div>
  <div class="scard__body">
    <h3>${esc(c.title)}</h3>
    <p class="scard__value">${esc(c.tagline)}</p>
    <ul>${c.practicalHighlights.slice(0, 3).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
    <div class="scard__meta"><span class="m">${c.durationWeeks} Weeks · ${c.instructionalHours} Hours</span><span class="go">View Course Curriculum</span></div>
  </div>
</a>`;
}

function placementSection({ korean = false, id = "placement", mist = true } = {}) {
  return `<section class="sec ${mist ? "sec--mist" : ""} anchor" id="${id}"><div class="wrap two-col">
  <div>
    <h2>Choose Your Specialization. Find Your Appropriate Training Level.</h2>
    <div class="prose mt-m">
      <p>BPCTI recognizes that professional communication needs differ according to language proficiency, work experience, and career objectives.</p>
      <p>Applicants select the specialization that best matches their professional goals. A placement and training-needs assessment helps BPCTI recommend an appropriate instructional level or class.</p>
    </div>
  </div>
  <div>
    <h3>Depending on the specialization, assessment may consider:</h3>
    <ul class="checks mt-m">${S.placementFactors.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
    <div class="note mt-l"><strong>Selecting a specialization does not require completing another specialization.</strong> Placement recommendations and any applicable proficiency prerequisites are communicated before enrollment.</div>
    ${korean ? `<div class="note">Heritage Korean speakers and fluent Korean American professionals are not automatically placed in beginner instruction. Their formal professional Korean and relevant business communication competencies are assessed directly.</div>` : ""}
  </div>
</div></section>`;
}

function assessmentSection(id = "assessment") {
  return `<section class="sec anchor" id="${id}"><div class="wrap two-col">
  <div>
    <h2>Demonstrate Your Professional Communication Skills</h2>
  </div>
  <div class="prose">
    <p>Assessment may include participation in applied exercises, structured communication assignments, instructor feedback, and a final performance-based assessment aligned with the specialization's learning outcomes.</p>
    <p>Students who fulfill the published course completion requirements receive a <strong>BPCTI Certificate of Completion</strong> identifying the specialization completed.</p>
    <p class="fine mt-m">BPCTI Certificates of Completion document completion of BPCTI training. They are not academic degrees, state-issued professional licenses, industry certifications, or guarantees of employment. Attendance, assessment, and certificate eligibility requirements are provided in the applicable BPCTI catalog.</p>
  </div>
</div></section>`;
}

function ctaBand({ secondary = ["Explore Other Specializations", "programs/#specializations"] } = {}) {
  return `<section class="cta-band"><div class="wrap">
  <div><h2>Ready to Strengthen Your Professional Communication?</h2><p class="mt-s">Explore the specialization that matches your goals and connect with BPCTI to discuss course availability, placement, and enrollment.</p></div>
  <div class="btns">${btn("Request Program Information", "contact/#program-inquiry")}${btn(secondary[0], secondary[1], "ghost")}</div>
</div></section>`;
}

function flexibleTeaser() {
  const F = S.flexibleLearning;
  return `<section class="sec sec--navy on-dark"><div class="wrap two-col">
  <div>
    <span class="badge">In Development</span>
    <h2 class="mt-m">${esc(F.title)}</h2>
    <p class="lede mt-m">${esc(F.statement)}</p>
    <div class="btns"><a class="link" href="${href("training-method/#flexible-learning")}">Learn about the proposed learning model</a></div>
  </div>
  <div>
    <ul class="checks">${F.model.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
    <p class="fine mt-m" style="color:#C3CCDB">${esc(F.status)}</p>
  </div>
</div></section>`;
}

function workshopsTeaser() {
  const W = S.culturalWorkshops;
  return `<section class="sec sec--tight"><div class="wrap">
  <div class="sec-head">
    <div><h2>${esc(W.title)}</h2></div>
    <div><p class="prose">${esc(W.tagline)} These optional workshops are offered separately from BPCTI's eight professional communication specializations.</p><div class="mt-m"><a class="link" href="${href("programs/korean-cultural-workshops/")}">Explore cultural workshops</a></div></div>
  </div>
</div></section>`;
}

function founderSection() {
  const F = S.founder;
  const n = F.mobilePreview;
  const paras = F.paragraphs.map((p, i) => `<p${i >= n ? ' class="founder__more"' : ""}>${esc(p)}</p>`).join("");
  return `<section class="sec founder" id="founder" aria-labelledby="founder-h"><div class="wrap founder__grid">
  <img class="founder__img" src="${asset("img/abigail.jpg")}" alt="Abigail Ruth Sung, Founder of BP Communication Training Institute" loading="lazy">
  <div class="founder__text">
    <p class="founder__label">${esc(F.eyebrow)}</p>
    <h2 id="founder-h">${esc(F.headline)}</h2>
    <div class="founder__body prose" id="founder-body">${paras}</div>
    <button class="founder__toggle" type="button" aria-expanded="false" aria-controls="founder-body">Read Full Message</button>
    <p class="founder__sig"><strong>${esc(F.name)}</strong><span>${esc(F.title)}</span><span>${esc(F.org)}</span></p>
  </div>
</div></section>`;
}

// The course map: four professional focuses (rows) offered in both programs (columns).
function courseMap() {
  const rows = ["A", "B", "C", "D"].map((l) => {
    const cell = (pid) => {
      const c = COURSES.find((x) => x.program === pid && x.specialization === l);
      return `<td data-label="${pid === "english" ? "English program" : "Korean program"}"><a class="cmap__course" href="${href(courseUrl(c))}"><span class="cmap__title">${esc(c.title)}</span><span class="cmap__meta">${c.durationWeeks} weeks, ${c.instructionalHours} hours</span></a></td>`;
    };
    return `<tr><th scope="row"><span class="cmap__letter" aria-hidden="true">${l}</span><span class="cmap__focus">${esc(PANEL_LABEL[l])}</span></th>${cell("english")}${cell("korean")}</tr>`;
  }).join("");
  const col = (pid) => `<th scope="col"><a href="${href(programUrl(pid))}"><span class="cmap__prog">${esc(PROGRAMS[pid].title)}</span><span class="cmap__tag">${esc(PROGRAMS[pid].tagline)}</span></a></th>`;
  return `<div class="cmap-wrap"><table class="cmap"><caption class="sr-only">Eight specializations: four professional focuses, each offered in the English and Korean programs</caption><thead><tr><th scope="col" class="cmap__corner">Professional focus</th>${col("english")}${col("korean")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

// =====================================================================
//  PAGES
// =====================================================================
const built = [];

// ---------- Home ----------
built.push(page({
  path: "",
  title: S.seo.home[0],
  description: S.seo.home[1],
  extraHead: `<script>(function(){var h=location.hash;var m={"#/programs/english":"programs/english-business-communication/","#/programs/korean":"programs/korean-global-business-communication/","#/programs/public-speaking":"programs/","#/programs":"programs/","#/about":"about/","#/scholarships":"scholarships/","#/support":"scholarships/#support","#/contact":"contact/"};if(h.indexOf("#/")!==0)return;for(var k in m){if(h===k||h.indexOf(k+"/")===0){location.replace(m[k]);return;}}})();</script>\n`,
  body: () => `
<section class="hero">
  <div class="hero__copy on-dark">
    <h1 class="hero__title">${brand.statement.split(". ").map((x, i, a) => `<span>${esc(x)}${i < a.length - 1 ? "." : ""}</span>`).join(" ")}</h1>
    <p class="hero__pos">${esc(brand.positioning)}</p>
    <p class="hero__lede">Explore specialized English and Korean communication training designed for professional interviews, business meetings, executive presence, formal business events, and global leadership.</p>
    <div class="btns">${btn("Explore Our Programs", "programs/")}${btn("Request Information", "contact/#program-inquiry", "ghost")}</div>
  </div>
  <div class="hero__media"><img src="${asset("img/hero-speaker.jpg")}" alt="A professional speaking confidently to an audience with a microphone" fetchpriority="high"></div>
</section>

<section class="sec"><div class="wrap">
  <div class="sec-head">
    <h2>Two Programs. Eight Professional Specializations.</h2>
    <p class="prose">Pick the professional situation you want to master, in English or Korean. Each specialization is its own 12-week course, not a level, so you can start with any of them.</p>
  </div>
  ${courseMap()}
</div></section>

<section class="split split--rev">
  <div class="split__copy">
    <h2>Learn Through Realistic Professional Practice</h2>
    <div class="prose mt-m"><p>BPCTI combines guided instruction with professional simulations, role-play, instructor coaching, and performance-based assessment.</p><p>Participants practice realistic interviews, virtual meetings, professional introductions, formal dining conversations, and cross-cultural business scenarios, so they can apply their skills with greater clarity and confidence.</p></div>
    <div class="btns">${btn("Our Training Method", "training-method/", "navy")}</div>
  </div>
  <div class="split__media"><img src="${asset("img/group-discussion.jpg")}" alt="Adult professionals in a small-group discussion around a table" loading="lazy"></div>
</section>

${founderSection()}

<section class="sec sec--mist"><div class="wrap two-col">
  <div>
    <h2>A Nonprofit Commitment to Professional Education</h2>
  </div>
  <div class="prose">
    <p><strong>${esc(brand.nonprofit)}</strong></p>
    <p>Through professional education, scholarships, and community-focused learning opportunities, we seek to expand access to practical communication training and professional development.</p>
    <p>Limited need-based scholarships and institutional tuition assistance may be available to eligible students, subject to eligibility requirements, available funding, program availability, and BPCTI policies.</p>
    <div class="btns"><a class="link" href="${href("about/")}">About BPCTI</a><a class="link" href="${href("scholarships/")}">Scholarships &amp; support</a></div>
  </div>
</div></section>

${ctaBand({ secondary: ["Explore Our Programs", "programs/"] })}
`,
}));

// ---------- Programs overview ----------
built.push(page({
  path: "programs/",
  title: S.seo.programs[0],
  description: S.seo.programs[1],
  body: () => `
${pageHero({
  trail: [["Home", ""], ["Programs", "programs/"]],
  title: "Professional Communication Training for Career Advancement and Global Business",
  lede: ["Build the communication competencies that support professional success—from high-stakes interviews and executive meetings to business dining, formal receptions, and cross-cultural leadership.", "BP Communication Training Institute offers two distinctive programs and eight career-focused specializations. Choose the professional skills you want to develop, then receive placement guidance based on your communication proficiency, experience, and goals."],
  btns: btn("Explore English Programs", programUrl("english")) + btn("Explore Korean Programs", programUrl("korean"), "ghost"),
})}

<section class="sec"><div class="wrap">
  <div class="sec-head sec-head--stack"><h2>Two Distinctive Programs</h2></div>
  <div class="grid-2">
    <article class="pcard"><h3>${esc(PROGRAMS.english.title)}</h3><p class="tag">${esc(PROGRAMS.english.tagline)}</p><p>Strengthen the skills needed to communicate effectively in American and international professional environments. Develop confidence and precision in interviews, meetings, presentations, professional social settings, and leadership interactions.</p><div class="btns">${btn("View English Specializations", programUrl("english"), "navy")}</div></article>
    <article class="pcard"><h3>${esc(PROGRAMS.korean.title)}</h3><p class="tag">${esc(PROGRAMS.korean.tagline)}</p><p>Advance your effectiveness in Korean and Korean-American professional environments. Develop business communication, cultural fluency, executive etiquette, and relationship-building skills appropriate to your experience and language proficiency.</p><div class="btns">${btn("View Korean Specializations", programUrl("korean"), "navy")}</div></article>
  </div>
</div></section>

<section class="sec sec--mist anchor" id="specializations"><div class="wrap">
  <div class="sec-head"><div><h2>Find Your Professional Specialization</h2></div><p class="prose">Each program offers four independent specializations. Students select the specialization relevant to their professional objectives; a placement and training-needs assessment helps identify an appropriate instructional group or proficiency level.</p></div>
  ${courseMap()}
  <p class="small mt-m">Each specialization: 12 weeks · 48 instructional hours · BPCTI Certificate of Completion, subject to published completion requirements. No specialization requires completing another.</p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="sec-head"><div><h2>What Makes BPCTI Different?</h2></div><div><a class="link" href="#specializations">Find your professional specialization</a></div></div>
  <div class="grid-3">${S.differentiators.map(([t, d], i) => `<div class="feature"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}</div>
</div></section>

${flexibleTeaser()}
${workshopsTeaser()}
${ctaBand({ secondary: ["Admissions & Tuition", "admissions-tuition/"] })}
`,
}));

// ---------- Program landing pages ----------
function programPage(pid) {
  const P = PROGRAMS[pid];
  const list = COURSES.filter((c) => c.program === pid);
  const isK = pid === "korean";
  const heroLede = isK
    ? ["Develop the communication, professional etiquette, and cultural intelligence required to navigate Korean and Korean-American business environments with confidence.", "This program serves a wide range of participants, including Korean American professionals, heritage Korean speakers, individuals already fluent in conversational Korean, and professionals developing Korean communication skills for business."]
    : ["Develop the professional communication skills needed to succeed in competitive workplaces, navigate high-stakes conversations, and represent yourself confidently in American and global business environments.", "Our English program offers four independent, career-focused specializations. Participants select the training most relevant to their professional goals and receive placement guidance based on communication proficiency and experience."];

  const distinctive = isK ? `
<section class="sec"><div class="wrap two-col">
  <div>
    <h2>Speaking Korean Socially Is Not the Same as Professional Korean</h2>
    <div class="prose mt-m">
      <p>The program is not limited to language acquisition. It emphasizes professional Korean communication, executive protocol, workplace hierarchy, business relationships, formal dining, and cross-cultural leadership.</p>
      <p>Speaking Korean socially does not automatically prepare someone for formal professional communication in Korean business settings.</p>
      <p>Participants with strong Korean proficiency may focus on advanced professional applications. Those developing Korean proficiency receive instruction appropriate to their assessed level. A single 12-week course is not designed to take a beginning learner to executive-level Korean fluency.</p>
    </div>
  </div>
  <div>
    <h3>Professional situations may require additional knowledge of:</h3>
    <ul class="checks mt-m">${["Appropriate speech levels and professional honorifics", "Titles, organizational hierarchy, and forms of address", "Respectful disagreement and professional diplomacy", "Korean-style interviews and career introductions", "Formal meetings with executives and business partners", "Korean business dining, hosting, and reception etiquette", "Relationship-building between Korean and American organizations"].map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
  </div>
</div></section>` : "";

  return page({
    path: programUrl(pid),
    title: S.seo[pid][0],
    description: S.seo[pid][1],
    body: () => `
${pageHero({
  trail: [["Home", ""], ["Programs", "programs/"], [P.title, programUrl(pid)]],
  title: P.title,
  tagline: P.tagline,
  lede: heroLede,
  btns: btn("Explore Specializations", programUrl(pid) + "#specializations") + btn("Request Placement Information", "contact/#program-inquiry", "ghost"),
})}
${distinctive}
<section class="sec ${isK ? "sec--mist" : ""} anchor" id="specializations"><div class="wrap">
  <div class="sec-head"><div><h2>Choose the Training That Fits Your Goals</h2></div><p class="prose">These are four independent courses, not four sequential levels. Select the specialization most relevant to your professional objectives. No specialization requires completing another.</p></div>
  <div class="grid-4">${list.map(specCard).join("")}</div>
</div></section>

<section class="sec ${isK ? "" : "sec--mist"}"><div class="wrap two-col">
  <div><h2>A Shared Format Across All Specializations</h2><p class="prose mt-m">The same overall instructional duration does not mean that every student receives identical content or that every specialization is taught at a single language level.</p></div>
  <dl class="facts">${S.courseFormat.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
</div></section>

${placementSection({ korean: isK, mist: isK })}
${isK ? `<section class="sec sec--tight"><div class="wrap"><p class="small">Looking for hands-on cultural experiences rather than professional training? See the optional <a href="${href("programs/korean-cultural-workshops/")}">Korean Cultural Experience Workshops</a>.</p></div></section>` : ""}
${ctaBand({ secondary: [isK ? "Explore English Programs" : "Explore Korean Programs", programUrl(isK ? "english" : "korean")] })}
`,
  });
}
built.push(programPage("english"), programPage("korean"));

// ---------- Course detail pages ----------
for (const c of COURSES) {
  const P = PROGRAMS[c.program];
  const siblings = COURSES.filter((x) => x.program === c.program && x.id !== c.id);
  const counterpart = COURSES.find((x) => x.program !== c.program && x.specialization === c.specialization);
  const otherP = PROGRAMS[counterpart.program];
  const strip = [
    ["Course Format", `${c.durationWeeks} Weeks`],
    ["Instructional Time", `${c.instructionalHours} Hours`],
    ["Training Focus", "Applied Professional Communication"],
    ["Entry", "Specialization Selection & Placement Assessment"],
    ["Completion", c.credential],
  ];
  const outcomesIntro = "Upon successful completion, participants should be able to:";
  built.push(page({
    path: courseUrl(c),
    title: `${c.title} | BPCTI`,
    description: c.seoDescription,
    body: () => `
${pageHero({
  trail: [["Home", ""], ["Programs", "programs/"], [P.title, programUrl(c.program)], [c.title, courseUrl(c)]],
  eyebrow: `Specialization ${c.specialization}`,
  title: c.title,
  tagline: c.tagline,
  lede: c.overview[0],
  btns: btn("Request Information About This Course", "contact/#program-inquiry") + `<a class="btn btn--ghost" href="#curriculum">View the 12-Week Curriculum</a>`,
  extra: `<dl class="strip">${strip.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`,
})}

<section class="sec"><div class="wrap two-col">
  <div>
    <h2>About This Specialization</h2>
    <div class="prose mt-m">${c.overview.slice(1).map((p) => `<p>${esc(p)}</p>`).join("")}<p>This is one of four independent specializations in the ${esc(P.title)} program. You may enroll in it without completing any other specialization.</p></div>
  </div>
  <div>
    <h3>Who Should Enroll?</h3>
    <ul class="checks mt-m">${c.audience.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
  </div>
</div></section>

<section class="sec sec--mist"><div class="wrap">
  <div class="sec-head sec-head--stack"><h2>What You Will Be Able to Do</h2><p class="lede">${outcomesIntro}</p></div>
  <ul class="checks checks--2">${c.learningOutcomes.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
</div></section>

<section class="sec"><div class="wrap two-col">
  <div><h2>How This Course Works</h2><p class="prose mt-m">Instruction combines guided teaching with professional simulations, role-play, coaching, applied assignments, and performance assessments. The same overall instructional duration does not mean that every student receives identical content or that every specialization is taught at a single language level.</p><div class="mt-m"><a class="link" href="${href("training-method/")}">Our training method</a></div></div>
  <dl class="facts">${S.courseFormat.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
</div></section>

<section class="sec sec--mist anchor" id="curriculum"><div class="wrap">
  <div class="sec-head sec-head--stack"><h2>Your 12-Week Curriculum</h2><p class="lede">All twelve weeks together make up this one specialization. Select a week to see its learning focus and practical training.</p></div>
  <div class="curr-tools"><span class="small">${c.durationWeeks} weeks · ${c.instructionalHours} instructional hours</span><button type="button" data-toggle-weeks aria-expanded="false">Expand all weeks</button></div>
  <div class="curr">${c.curriculum.map((w) => `
    <details class="week" id="week-${pad(w.week)}">
      <summary><span class="wk-num">Week ${w.week}</span><span class="wk-title">${esc(w.title)}</span><span class="wk-icon" aria-hidden="true"></span></summary>
      <div class="wk-body"><div><h4>Learning Focus</h4><p>${esc(w.description)}</p></div><div><h4>Practical Training</h4><p>${esc(w.practicalTraining)}</p></div></div>
    </details>`).join("")}
  </div>
</div></section>

<section class="sec"><div class="wrap">
  <div class="sec-head"><div><h2>Applied Training Highlights</h2></div><p class="prose">Every week pairs a learning focus with practical training, so participants rehearse the real professional situations this specialization prepares them for.</p></div>
  <ul class="chips">${c.practicalHighlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
  ${c.notes.length ? `<div class="mt-l">${c.notes.map((n) => `<div class="note"><strong>Please note:</strong> ${esc(n)}</div>`).join("")}</div>` : ""}
</div></section>

${placementSection({ korean: c.program === "korean" })}
${assessmentSection()}
${ctaBand({ secondary: ["Explore Other Specializations", programUrl(c.program) + "#specializations"] })}

<section class="sec"><div class="wrap">
  <div class="sec-head"><div><h2>Explore Other ${esc(P.shortTitle)} Specializations</h2></div><p class="prose">Also offered in the ${esc(otherP.title)} program: <a href="${href(courseUrl(counterpart))}">${esc(counterpart.title)}</a>.</p></div>
  <div class="grid-3">${siblings.map(specCard).join("")}</div>
</div></section>
`,
  }));
}

// ---------- Korean Cultural Experience Workshops ----------
{
  const W = S.culturalWorkshops;
  built.push(page({
    path: "programs/korean-cultural-workshops/",
    title: S.seo.workshops[0],
    description: S.seo.workshops[1],
    body: () => `
${pageHero({
  trail: [["Home", ""], ["Programs", "programs/"], [W.title, "programs/korean-cultural-workshops/"]],
  eyebrow: "Optional workshops",
  title: W.title,
  tagline: W.tagline,
  lede: W.intro,
  btns: btn("Request Workshop Information", "contact/#general"),
})}
<section class="sec"><div class="wrap">
  <div class="sec-head"><div><h2>Four Ways to Experience Korean Culture</h2></div><p class="prose">${esc(W.availability)}</p></div>
  <div class="grid-2">${W.workshops.map((w, i) => `<article class="wcard"><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p></article>`).join("")}</div>
  <div class="note mt-l"><strong>Optional and separate.</strong> ${esc(W.separation)}</div>
</div></section>
<section class="sec sec--mist"><div class="wrap two-col">
  <div><h2>Korean Global Business Communication</h2><p class="prose mt-m">For formal professional Korean, executive protocol, business dining, and Korean–American leadership, explore BPCTI's four professional Korean specializations.</p></div>
  <div style="align-self:center"><div class="btns" style="margin-top:0">${btn("View Korean Specializations", programUrl("korean"), "navy")}${btn("All Programs", "programs/", "line")}</div></div>
</div></section>
`,
  }));
}

// ---------- Training Method ----------
{
  const F = S.flexibleLearning;
  built.push(page({
    path: "training-method/",
    title: S.seo.trainingMethod[0],
    description: S.seo.trainingMethod[1],
    body: () => `
${pageHero({
  trail: [["Home", ""], ["Training Method", "training-method/"]],
  title: "Learn Through Realistic Professional Practice",
  lede: "BPCTI's training approach combines guided instruction with applied communication practice, so participants build skills they can use in real professional situations.",
})}
<section class="sec"><div class="wrap">
  <div class="sec-head sec-head--stack"><h2>Five Elements of BPCTI Training</h2></div>
  <div class="grid-3">${S.trainingMethods.map(([t, d], i) => `<div class="feature"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}</div>
</div></section>

<section class="sec sec--navy on-dark"><div class="wrap">
  <div class="sec-head sec-head--stack"><h2>From Instruction to Professional Skill</h2></div>
  <ol class="steps">${[["Instruction", "Guided teaching on the communication skills of each week's professional situation."], ["Practice", "Simulations, role-play, and applied exercises."], ["Feedback", "Instructor coaching on clarity, tone, and professional presence."], ["Assessment", "Performance-based assessment aligned with learning outcomes."], ["Skill Development", "Reflection and goals for continued professional growth."]].map(([t, d], i) => `<li><span class="num">${pad(i + 1)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol>
</div></section>

<section class="sec anchor" id="flexible-learning"><div class="wrap">
  <div class="sec-head">
    <div><span class="badge">In Development</span><h2 class="mt-m">${esc(F.title)}</h2></div>
    <p class="lede">${esc(F.statement)}</p>
  </div>
  <div class="two-col">
    <div><h3>The proposed learning model includes:</h3><ul class="checks mt-m">${F.model.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>
    <div><div class="note"><strong>Not yet available.</strong> ${esc(F.status)}</div></div>
  </div>
  <div class="portal mt-xl anchor" id="student-portal">
    <span class="badge">In Development</span>
    <h3 class="mt-m" style="font-size:clamp(22px,2.2vw,28px)">${esc(F.portal.title)}</h3>
    <p class="prose mt-s">${esc(F.portal.intro)}</p>
    <div class="portal__grid">${F.portal.features.map(([t, d]) => `<div><h4>${esc(t)}</h4><p>${esc(d)}</p></div>`).join("")}</div>
    <p class="fine mt-m">${esc(F.portal.note)}</p>
  </div>
</div></section>

${placementSection({ mist: true })}
${assessmentSection()}
${ctaBand()}
`,
  }));
}

// ---------- Admissions & Tuition ----------
built.push(page({
  path: "admissions-tuition/",
  title: S.seo.admissions[0],
  description: S.seo.admissions[1],
  body: () => `
${pageHero({
  trail: [["Home", ""], ["Admissions & Tuition", "admissions-tuition/"]],
  title: "Admissions & Tuition",
  lede: ["BPCTI offers specialized professional communication training designed around practical learning outcomes and career-relevant communication competencies.", "Prospective students are encouraged to review available specializations, discuss their professional goals, and complete any applicable placement assessment before enrollment."],
})}
<section class="sec"><div class="wrap">
  <div class="sec-head sec-head--stack"><h2>Five Steps to Enrollment</h2></div>
  <ol class="steps steps--light">${S.admissionsSteps.map(([t, d], i) => `<li><span class="num">${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join("")}</ol>
  <div class="btns mt-l">${btn("Explore the Programs", "programs/", "navy")}${btn("Request Information", "contact/#program-inquiry", "line")}</div>
</div></section>

<section class="sec sec--mist anchor" id="tuition"><div class="wrap two-col">
  <div><h2>Tuition &amp; Course Format</h2><p class="prose mt-m">Each specialization is a single course. All twelve weeks belong to one specialization and are not offered as separate modules.</p></div>
  <div class="tuition">
    <h3>Per specialization</h3>
    <dl>
      <dt>Instructional format</dt><dd>12 weeks / 48 instructional hours</dd>
      <dt>Tuition</dt><dd>${C.SHOW_TUITION ? esc(C.PROPOSED_TUITION) : "Tuition and fee information is provided during the admissions process, together with the applicable catalog, enrollment agreement, and cancellation and refund policies."}</dd>
      <dt>Enrollment</dt><dd>Applications accepted throughout the year; course starts depend on scheduled cohorts and availability.</dd>
    </dl>
    <p class="fine mt-m">Please review the applicable catalog, tuition, payment terms, cancellation and refund policies, and course requirements before making an enrollment commitment.</p>
  </div>
</div></section>

${placementSection({ mist: false })}

<section class="sec sec--mist"><div class="wrap two-col">
  <div><h2>Scholarships &amp; Employer Education Benefits</h2></div>
  <div class="prose">
    <p>Limited need-based scholarships and institutional tuition assistance may be available to eligible students, subject to eligibility requirements, available funding, program availability, and BPCTI policies. Scholarship assistance is not guaranteed.</p>
    <p>Some employers offer education assistance or tuition reimbursement. Eligibility and approval are determined by each employer's own process; BPCTI does not guarantee that any course qualifies for employer or third-party education benefits.</p>
    <div class="btns"><a class="link" href="${href("scholarships/")}">Scholarships &amp; support</a><a class="link" href="${href("employer-training/")}">Employer training</a></div>
  </div>
</div></section>
${ctaBand()}
`,
}));

// ---------- Employer Training ----------
built.push(page({
  path: "employer-training/",
  title: S.seo.employer[0],
  description: S.seo.employer[1],
  body: () => `
${pageHero({
  trail: [["Home", ""], ["Employer Training", "employer-training/"]],
  title: "Professional Communication Training for Teams and Organizations",
  lede: "BPCTI welcomes conversations with organizations that want to strengthen how their employees communicate in interviews, meetings, client relationships, and cross-cultural collaboration.",
  btns: btn("Contact BPCTI", "contact/#general"),
})}
<section class="sec"><div class="wrap two-col">
  <div>
    <h2>Training Grounded in Real Workplace Situations</h2>
    <div class="prose mt-m">
      <p>BPCTI's English and Korean specializations are organized around the professional situations employees face every day. Organizations can contact BPCTI to discuss their team's communication needs, which specializations may fit, and whether group or scheduled training can be arranged.</p>
      <p>Each conversation starts with your goals. BPCTI can then share information about course availability, placement guidance, and scheduling.</p>
    </div>
  </div>
  <div>
    <h3>Areas of professional focus</h3>
    <ul class="checks mt-m">
      <li>Interview, promotion, and career advancement communication</li>
      <li>Business meetings, virtual collaboration, and executive presence</li>
      <li>Business dining, formal receptions, and professional networking</li>
      <li>Global leadership and cross-cultural communication</li>
      <li>Korean and Korean–American business communication</li>
    </ul>
  </div>
</div></section>
<section class="sec sec--mist"><div class="wrap two-col">
  <div><h2>Using Employer Education Benefits</h2></div>
  <div class="prose">
    <p>Some employers offer education assistance or tuition reimbursement programs. Eligibility, approval, and reimbursement are determined by each employer's own policies and processes.</p>
    <p>Employees should confirm with their employer before enrolling. BPCTI does not represent any course as pre-approved by a particular employer, and education benefits or reimbursement are not guaranteed.</p>
  </div>
</div></section>
${ctaBand({ secondary: ["View All Specializations", "programs/#specializations"] })}
`,
}));

// ---------- Scholarships & Support ----------
built.push(page({
  path: "scholarships/",
  title: S.seo.scholarships[0],
  description: S.seo.scholarships[1],
  body: () => `
${pageHero({
  trail: [["Home", ""], ["Scholarships & Support", "scholarships/"]],
  title: "Expanding Access to Professional Education",
  lede: ["BPCTI believes that access to professional education can create opportunities for personal growth, professional development, and stronger communities.", "As part of the educational mission of Abigail Ruth Sung Foundation, BPCTI is committed to helping expand access to professional communication training for individuals from diverse backgrounds."],
})}
<section class="sec anchor" id="scholarships"><div class="wrap two-col">
  <div>
    <h2>Scholarships &amp; Tuition Assistance</h2>
    <p class="prose mt-m">Limited need-based scholarships and institutional tuition assistance may be available to eligible students who demonstrate financial need.</p>
    <p class="fine mt-m">Scholarship and tuition assistance availability is not guaranteed and may vary by program and available funding.</p>
    <div class="btns">${btn("Request Scholarship Information", "contact/#general", "navy")}</div>
  </div>
  <div><h3>Awards are subject to:</h3><ul class="checks mt-m">${S.scholarships.awardTerms.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
</div></section>

<section class="sec sec--navy on-dark anchor" id="support"><div class="wrap two-col">
  <div>
    <h2>Help Open Doors Through Education</h2>
    <p class="lede mt-m">Your support can help expand access to professional communication education and create opportunities for learners who may otherwise face financial barriers to professional training.</p>
    <p class="prose mt-s">${esc(brand.nonprofit)}</p>
    <div class="btns"><a class="btn btn--gold" href="${C.DONATION_URL}" target="_blank" rel="noopener">Support Our Scholarship Fund</a></div>
  </div>
  <div>
    <h3>Contributions may help support:</h3>
    <ul class="checks mt-m">${S.scholarships.supportItems.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    <p class="fine mt-l" style="color:#C3CCDB">Contributions support the charitable and educational mission of Abigail Ruth Sung Foundation. Tuition payments for educational services are separate from charitable contributions.</p>
  </div>
</div></section>
${ctaBand()}
`,
}));

// ---------- About ----------
built.push(page({
  path: "about/",
  title: S.seo.about[0],
  description: S.seo.about[1],
  body: () => `
${pageHero({
  trail: [["Home", ""], ["About", "about/"]],
  title: "Professional Communication. Greater Opportunity. Stronger Connections.",
  lede: "BP Communication Training Institute is a professional communication and career development training institution offering specialized instruction in English and Korean business communication.",
})}
<section class="sec"><div class="wrap two-col">
  <div><h2>Communication That Advances Careers</h2></div>
  <div class="prose">
    <p>BPCTI's distinctive educational value is the integration of professional language, career communication, executive presence, workplace etiquette, business dining, formal networking, and cross-cultural leadership.</p>
    <p>We believe effective communication can strengthen professional confidence, improve workplace collaboration, bridge cultural differences, and create new opportunities for personal and professional growth.</p>
    <p>Our Korean program is an authentic professional development option for Korean American professionals and heritage Korean speakers, built around formal business communication rather than introductory language study.</p>
  </div>
</div></section>
<section class="sec sec--mist"><div class="wrap two-col">
  <div><h2>Empowering People Through Communication</h2></div>
  <p class="prose">Our mission is to expand access to high-quality professional communication education and empower individuals with the practical skills, confidence, and cultural understanding needed to communicate effectively in today's diverse and global workforce.</p>
</div></section>
<section class="sec"><div class="wrap two-col">
  <div><h2>Effective Communication Is Not Developed Through Theory Alone</h2></div>
  <div class="prose"><p>At BPCTI, students learn through instruction, practice, interaction, feedback, and assessment.</p><p>Our training emphasizes practical application through professional simulations, so learners develop communication skills they can use in professional and real-world environments.</p><div class="mt-m"><a class="link" href="${href("training-method/")}">Our training method</a></div></div>
</div></section>
<section class="sec sec--mist"><div class="wrap person">
  <img src="${asset("img/abigail.jpg")}" alt="Portrait of Abigail Ruth Sung" loading="lazy">
  <div>
    <h2>Education with Purpose</h2>
    <div class="prose mt-m"><p><strong>${esc(brand.nonprofit)}</strong></p><p>Abigail Ruth Sung Foundation was established on February 2, 2022, to provide educational and community-based programs that expand learning opportunities and serve the community.</p><p>BPCTI extends this educational mission through structured professional communication and career development training for adult learners and working professionals.</p></div>
  </div>
</div></section>
<section class="sec"><div class="wrap two-col">
  <div><h2>We Are Committed To</h2></div>
  <ul class="checks checks--2">${S.about.commitments.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
</div></section>
${ctaBand({ secondary: ["Explore Our Programs", "programs/"] })}
`,
}));

// ---------- Contact ----------
built.push(page({
  path: "contact/",
  title: S.seo.contact[0],
  description: S.seo.contact[1],
  body: () => `
${pageHero({
  trail: [["Home", ""], ["Contact", "contact/"]],
  title: "We'd Love to Hear From You",
  lede: "Interested in a specialization, placement, scholarships, or BPCTI? Send us an inquiry. You do not need to have chosen a specialization yet.",
})}
<section class="sec"><div class="wrap contact-grid">
  <aside class="contact-card">
    <h3>BP Communication Training Institute</h3>
    <p>Bellevue Pacific Communication Training Institute</p>
    <dl>
      <div><dt>Training Location</dt><dd>${esc(C.addressLine1)}<br>${esc(C.addressLine2)}</dd></div>
      <div><dt>Phone</dt><dd><a href="tel:${C.phone.replace(/\D/g, "")}">${esc(C.phone)}</a></dd></div>
      <div><dt>Email</dt><dd><a href="mailto:${C.email}">${esc(C.email)}</a></dd></div>
    </dl>
  </aside>
  <div>
    <div class="form-block anchor" id="program-inquiry">
      <h2>Request Program Information</h2>
      <p class="prose mt-s">Tell us which program and specialization interest you (or that you are still deciding), your communication goals, and how you'd like us to contact you. We'll follow up about course availability, placement, and next steps.</p>
      <p class="fine mt-s">Submitting an inquiry does not constitute enrollment or require payment of tuition. Please don't include sensitive personal information.</p>
      <iframe class="form-frame mt-m" title="Program information request form" src="${C.PROGRAM_INQUIRY_FORM_URL}" loading="lazy" allow="geolocation 'none'"></iframe>
      <p class="small mt-s">Having trouble with the form? <a href="${C.PROGRAM_INQUIRY_FORM_URL}" target="_blank" rel="noopener">Open it in a new tab</a>.</p>
    </div>
    <div class="form-block anchor" id="general">
      <h2>Scholarships, Workshops &amp; Other Questions</h2>
      <p class="prose mt-s">For scholarship assistance, cultural workshops, employer training, or anything else, send us a general inquiry.</p>
      <div class="btns">${`<a class="btn btn--navy" href="${C.CONTACT_FORM_URL}" target="_blank" rel="noopener">Send a General Inquiry</a>`}</div>
    </div>
  </div>
</div></section>
`,
}));

// ---------- 404 ----------
built.push(page({
  path: "404.html",
  title: S.seo.notfound[0],
  description: S.seo.notfound[1],
  body: () => `<section class="sec"><div class="wrap center" style="padding:40px 0"><h1>Page Not Found</h1>
  <p class="lede" style="margin:18px auto 0">The page you're looking for doesn't exist or has moved.</p>
  <div class="btns" style="justify-content:center">${btn("Back to Home", "")}${btn("Explore Programs", "programs/", "line")}</div>
</div></section>`,
}));

// The 404 page is served at arbitrary depths, so its relative links must be root-absolute.
{
  const f = path.join(OUT, "404.html");
  if (!PREVIEW) fs.writeFileSync(f, fs.readFileSync(f, "utf8").replace(/(href|src)="(?!https?:|mailto:|tel:|#)([^"]*)"/g, (m, a, u) => `${a}="/${u.replace(/^(\.\.\/)+/, "").replace(/^\.\/$/, "")}"`));
}

// ---------- sitemap & robots ----------
if (!PREVIEW) {
  const urls = built.map((f) => path.relative(OUT, f).replace(/index\.html$/, "")).filter((u) => u !== "404.html");
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${C.siteUrl}/${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${C.siteUrl}/sitemap.xml\n`);
}

if (OUT !== ROOT) {
  fs.cpSync(path.join(ROOT, "assets"), path.join(OUT, "assets"), { recursive: true });
}
console.log(`Built ${built.length} pages -> ${OUT}${PREVIEW ? " (preview)" : ""}`);
