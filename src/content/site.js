// =====================================================================
//  BPCTI SITE SETTINGS & SHARED CONTENT — edit here, then run
//  `node src/build.js` to regenerate the pages.
// =====================================================================

const config = {
  // Forms (Jotform) and donations (Zeffy)
  PROGRAM_INQUIRY_FORM_URL: "https://form.jotform.com/262735898611065",
  CONTACT_FORM_URL: "https://form.jotform.com/262736097023054",
  DONATION_URL: "https://www.zeffy.com/en-US/donation-form/donation-to-abigail-ruth-sung-foundation",

  phone: "206-778-3030",
  email: "abigail@bpcti.org",
  addressLine1: "14400 Bel-Red Rd., STE 108A & 109B",
  addressLine2: "Bellevue, WA 98007",
  website: "bpcti.org",
  siteUrl: "https://bpcti.org",

  // ------------------------------------------------------------------
  // PUBLICATION SWITCHES
  // Keep false until the catalog, enrollment agreement, refund policy,
  // and applicable Washington regulatory status have been reconciled
  // (Implementation Guide, Part VI and Part VII §10).
  // ------------------------------------------------------------------
  SHOW_TUITION: false,
  PROPOSED_TUITION: "$2,890 per specialization",
};

const brand = {
  statement: "Communicate with Confidence. Advance Your Career. Connect Globally.",
  positioning: "Professional Business Communication & Career Development",
  nonprofit: "BP Communication Training Institute (BPCTI) is a DBA of Abigail Ruth Sung Foundation, a 501(c)(3) nonprofit organization.",
};

// Top navigation. `children` renders as a dropdown.
const nav = [
  { label: "Home", href: "" },
  { label: "About", href: "about/" },
  {
    label: "Programs",
    href: "programs/",
    children: [
      { label: "All Programs", href: "programs/" },
      { label: "Professional English Business Communication", href: "programs/english-business-communication/" },
      { label: "Korean Global Business Communication", href: "programs/korean-global-business-communication/" },
      { label: "Korean Cultural Experience Workshops", href: "programs/korean-cultural-workshops/" },
    ],
  },
  { label: "Training Method", href: "training-method/" },
  { label: "Admissions & Tuition", href: "admissions-tuition/" },
  { label: "Employer Training", href: "employer-training/" },
  { label: "Scholarships & Support", href: "scholarships/" },
  { label: "Contact", href: "contact/" },
];

// Part II — "What Makes BPCTI Different?"
const differentiators = [
  ["Career-Relevant Communication", "Training is organized around professional situations and workplace performance rather than language drills alone."],
  ["Experiential Professional Training", "Participants practice realistic interviews, virtual meetings, professional introductions, formal dining conversations, and cross-cultural business scenarios."],
  ["Professional Presence and Etiquette", "Instruction connects what professionals say with how they present themselves, interact with others, and navigate business settings."],
  ["Individualized Placement Guidance", "Students select their professional focus and receive assessment-based guidance on the instructional level appropriate to their needs."],
  ["Global Business Perspective", "Programs address the cultural expectations, communication practices, and professional relationships that influence international business."],
];

// Part V §4 — Training Method
const trainingMethods = [
  ["Professional Simulations", "Practice realistic interviews, meetings, business meals, formal receptions, presentations, and negotiations."],
  ["Instructor-Guided Coaching", "Receive feedback on communication clarity, tone, professional presence, and situational effectiveness."],
  ["Cultural Intelligence", "Examine how communication expectations differ across workplaces, industries, organizations, and cultural settings."],
  ["Performance-Based Learning", "Demonstrate skills through structured role-play, practical exercises, and final assessments."],
  ["Reflective Development", "Identify strengths, evaluate progress, and establish professional communication improvement goals."],
];

// Part V §3 — Placement factors
const placementFactors = [
  "Current communication proficiency",
  "Formal versus conversational language skills",
  "Professional and leadership experience",
  "Relevant workplace communication needs",
  "Career development objectives",
  "Readiness for applied professional training",
];

// Part I §3 — course format
const courseFormat = [
  ["Duration", "12 weeks per specialization"],
  ["Instructional time", "48 hours per specialization"],
  ["Typical weekly instruction", "4 hours"],
  ["Instructional methods", "Guided instruction, professional simulations, role-play, coaching, applied assignments, and performance assessments"],
  ["Completion credential", "BPCTI Certificate of Completion, subject to published completion requirements"],
  ["Enrollment", "Applications accepted throughout the year; actual course starts depend on scheduled cohorts and availability"],
];

// Part VI — admissions steps
const admissionsSteps = [
  ["Explore the Programs", "Review the English and Korean programs and their professional specializations."],
  ["Select Your Specialization", "Identify the course most relevant to your professional objectives."],
  ["Request Information", "Contact BPCTI regarding scheduling, course availability, and admissions requirements."],
  ["Complete Placement Guidance", "Participate in a communication assessment or consultation when required."],
  ["Review Enrollment Documents", "Review the applicable catalog, tuition, payment terms, cancellation and refund policies, and course requirements before making an enrollment commitment."],
];

// Additional instructions §1 — Flexible learning (IN DEVELOPMENT)
const flexibleLearning = {
  title: "Flexible Learning for Working Professionals",
  statement: "BPCTI is developing flexible learning options designed to accommodate rotating shifts, overtime schedules, and the professional responsibilities of working adults.",
  model: [
    "Morning and afternoon class options",
    "Week-by-week recorded lesson access",
    "Online learning materials and assignments",
    "Make-up learning opportunities for missed sessions",
    "Instructor feedback and performance-based assessments",
    "Individual student progress tracking",
  ],
  status: "These options are currently in development and are not yet available. Class times, formats, and availability will be announced once scheduling, technology, instructional policies, and applicable approvals are finalized.",
  portal: {
    title: "Student Learning Portal",
    intro: "BPCTI is planning a secure student learning portal to support enrolled students throughout their 12-week specialization.",
    features: [
      ["Course dashboard", "One place to see your specialization, schedule, and next steps."],
      ["Week 1–12 curriculum navigation", "Move through each week's learning focus and practical training."],
      ["Recorded lesson library", "Stream recorded lessons week by week."],
      ["Instructor-approved materials", "Download handouts and resources provided by your instructor."],
      ["Assignment submission", "Submit applied assignments and receive instructor feedback."],
      ["Practical assessment scheduling", "Schedule simulations and performance-based assessments."],
      ["Progress and completion tracking", "Follow your progress toward Certificate of Completion requirements."],
    ],
    note: "Recorded lessons are planned for streaming. Offline downloads may be offered for authorized instructional videos where licensing, privacy, and content security permit.",
  },
};

// Additional instructions §2 — Korean Cultural Experience Workshops
const culturalWorkshops = {
  title: "Korean Cultural Experience Workshops",
  tagline: "Experience Korean Culture. Discover Traditions. Connect Through Shared Experiences.",
  intro: "Alongside its professional communication programs, BPCTI offers optional workshops that invite participants to experience Korean culture firsthand through food, traditional attire, celebration, and performance.",
  separation: "Cultural workshops are optional enrichment experiences. They are separate from BPCTI's eight professional communication specializations and are not part of any specialization's curriculum or Certificate of Completion requirements.",
  availability: "Workshop dates, formats, and availability are announced as workshops are scheduled. Contact BPCTI to ask about upcoming workshops or group sessions.",
  workshops: [
    { key: "culinary", title: "Korean Culinary Culture & Dining Experience", text: "Explore Korean food traditions through guided cooking activities, dining etiquette, and cultural conversation." },
    { key: "hanbok-etiquette", title: "Hanbok & Korean Formal Event Etiquette", text: "Discover traditional Korean attire, formal greetings, cultural celebrations, and appropriate conduct at special events." },
    { key: "hanbok-styling", title: "Hanbok Styling, Hair & Makeup Workshop", text: "Learn traditional-inspired styling techniques, accessories, hair preparation, and makeup appropriate for formal Korean cultural occasions." },
    { key: "kpop", title: "K-Pop Performance & Social Confidence Workshop", text: "Learn selected K-Pop choreography, develop stage confidence, and prepare a group performance for a cultural or social event." },
  ],
};

// Carried over from the existing site
const about = {
  commitments: ["High-quality professional education", "Practical and measurable learning", "Inclusive learning opportunities", "Cross-cultural understanding", "Professional development", "Educational accessibility", "Community impact"],
};
const scholarships = {
  awardTerms: ["Eligibility requirements", "Demonstrated financial need", "Available scholarship funding", "Program availability", "BPCTI scholarship policies"],
  supportItems: ["Need-based scholarships", "Tuition assistance opportunities", "Educational and instructional resources", "Professional communication learning opportunities", "Community-focused educational initiatives"],
};

// Page-level SEO (course pages use their own seoDescription)
const seo = {
  home: ["BP Communication Training Institute | Professional Business Communication & Career Development", "Professional English and Korean business communication training in Bellevue, WA for interviews, meetings, executive presence, business dining, networking, and global leadership."],
  programs: ["Professional Business Communication Programs | BPCTI", "Explore professional English and Korean business communication training in interviews, meetings, executive presence, business dining, networking, and global leadership."],
  english: ["Professional English Business Communication | BPCTI", "Career-focused English communication training for interviews, professional meetings, executive presence, business networking, and global leadership."],
  korean: ["Korean Global Business Communication | BPCTI", "Professional Korean and Korean-American business communication training for heritage speakers, Korean American professionals, and global business participants."],
  workshops: ["Korean Cultural Experience Workshops | BPCTI", "Optional workshops in Korean culinary culture, hanbok and formal event etiquette, hanbok styling, and K-Pop performance, offered separately from BPCTI's professional programs."],
  trainingMethod: ["Training Method | BPCTI", "How BPCTI teaches professional communication: simulations, instructor coaching, cultural intelligence, and performance-based learning."],
  admissions: ["Admissions & Tuition | BPCTI", "How to apply to BPCTI's professional communication specializations: choose a specialization, request information, and complete placement guidance."],
  employer: ["Employer Training | BPCTI", "Professional communication training for organizations and teams from BP Communication Training Institute in Bellevue, WA."],
  scholarships: ["Scholarships & Support | BPCTI", "Need-based scholarships and tuition assistance at BPCTI, and how to support access to professional communication education."],
  about: ["About | BPCTI", "BP Communication Training Institute provides professional communication and career development training for adult learners and working professionals."],
  contact: ["Contact | BPCTI", "Contact BP Communication Training Institute in Bellevue, WA about programs, placement, scholarships, or general questions."],
  notfound: ["Page Not Found | BPCTI", "This page could not be found."],
};

module.exports = {
  config, brand, nav, differentiators, trainingMethods, placementFactors, courseFormat,
  admissionsSteps, flexibleLearning, culturalWorkshops, about, scholarships, seo,
};
