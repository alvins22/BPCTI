// =====================================================================
//  BPCTI COURSE DATA — the single source of truth for all eight
//  specialization pages, program landing pages, and course cards.
//  Content follows the "Complete Program Pages & Website Implementation
//  Guide" (Oct 2026). Each course must have exactly 12 curriculum weeks.
//
//  To add a photo to a specialization card, place a JPG at
//  assets/img/spec-<program>-<letter>.jpg (e.g. spec-english-a.jpg) and set
//  `image` on that course. Without one, a typographic panel is shown.
// =====================================================================

const PROGRAMS = {
  english: {
    id: "english",
    slug: "english-business-communication",
    title: "Professional English Business Communication",
    shortTitle: "English Program",
    tagline: "Communicate Your Value. Strengthen Your Professional Presence.",
  },
  korean: {
    id: "korean",
    slug: "korean-global-business-communication",
    title: "Korean Global Business Communication",
    shortTitle: "Korean Program",
    tagline: "Bridging Cultures. Elevating Professional Communication.",
  },
};

// Shared defaults (Part I §3 and Part V §1)
const SHARED = {
  durationWeeks: 12,
  instructionalHours: 48,
  weeklyHours: 4,
  credential: "BPCTI Certificate of Completion",
  publicationStatus: "approved",
};

const COURSES = [
  // ------------------------------------------------------------------
  // ENGLISH A
  // ------------------------------------------------------------------
  {
    id: "english-a",
    program: "english",
    specialization: "A",
    slug: "interview-career-advancement",
    title: "Professional Interview & Career Advancement Communication",
    tagline: "Present Your Experience. Communicate Your Value. Advance with Confidence.",
    overview: [
      "This specialization develops the communication competencies required for competitive job interviews, internal promotions, leadership opportunities, career transitions, and professional negotiations.",
      "Participants learn to articulate professional accomplishments, respond to complex interview questions, demonstrate executive presence, and communicate effectively in both in-person and virtual interview settings.",
    ],
    audience: [
      "Job seekers preparing for professional interviews",
      "College graduates entering the workforce",
      "Professionals pursuing promotions or leadership roles",
      "Career changers seeking to communicate transferable skills",
      "International professionals adapting to U.S. interview expectations",
    ],
    learningOutcomes: [
      "Deliver a structured and compelling professional introduction",
      "Explain career achievements with relevant evidence",
      "Respond to behavioral and competency-based questions",
      "Demonstrate professional presence during interviews",
      "Participate effectively in virtual, panel, and executive interviews",
      "Communicate professionally during offer discussions and follow-up",
    ],
    curriculum: [
      { week: 1, title: "Professional Communication Assessment & Career Positioning", description: "Identify communication strengths, career objectives, interview challenges, and professional positioning.", practicalTraining: "Recorded baseline interview and individual development plan." },
      { week: 2, title: "Professional Self-Introduction & Personal Value Proposition", description: "Create concise, compelling introductions that connect qualifications with organizational needs.", practicalTraining: "30-second, 60-second, and two-minute professional introductions." },
      { week: 3, title: "Career Storytelling & Achievement Communication", description: "Present career experiences and measurable accomplishments using clear narrative structures.", practicalTraining: "Achievement-story development and peer feedback." },
      { week: 4, title: "Behavioral Interview Strategies", description: "Apply structured response techniques, including the STAR method, to workplace scenarios.", practicalTraining: "Behavioral question drills and response coaching." },
      { week: 5, title: "Competency-Based & Technical Interview Communication", description: "Explain technical knowledge, problem-solving approaches, collaboration, and judgment to different audiences.", practicalTraining: "Simulated competency interview." },
      { week: 6, title: "Executive Presence, Voice & Nonverbal Communication", description: "Improve posture, eye contact, vocal delivery, listening, confidence, and professional composure.", practicalTraining: "Video-recorded interview presence coaching." },
      { week: 7, title: "Virtual Interviews & Digital Professional Etiquette", description: "Manage camera positioning, professional appearance, online introductions, timing, interruptions, and technical disruptions.", practicalTraining: "Simulated Zoom interview." },
      { week: 8, title: "Panel Interviews & Challenging Questions", description: "Respond to multiple interviewers, sensitive questions, ambiguity, and unexpected follow-ups.", practicalTraining: "Panel interview simulation." },
      { week: 9, title: "Leadership, Promotion & Executive Interviews", description: "Communicate leadership potential, strategic judgment, accountability, and organizational impact.", practicalTraining: "Promotion interview and leadership scenario." },
      { week: 10, title: "Offer Discussions & Professional Negotiation Communication", description: "Practice compensation discussions, clarification questions, professional requests, and decision-making conversations.", practicalTraining: "Employment offer negotiation role-play." },
      { week: 11, title: "Comprehensive Mock Interview & Individual Coaching", description: "Integrate interview preparation, storytelling, executive presence, and responsive communication.", practicalTraining: "Full mock interview with documented feedback." },
      { week: 12, title: "Final Interview Performance Assessment", description: "Demonstrate professional interview competencies through a structured assessment.", practicalTraining: "Final simulated interview, self-reflection, and improvement plan." },
    ],
    practicalHighlights: ["Mock interviews", "Virtual interview simulations", "Recorded performance review", "Individual communication feedback", "Career storytelling exercises"],
    seoDescription: "English communication training for professional interviews, promotions, career transitions, and offer discussions: 12 weeks of mock interviews, coaching, and applied practice.",
  },

  // ------------------------------------------------------------------
  // ENGLISH B
  // ------------------------------------------------------------------
  {
    id: "english-b",
    program: "english",
    specialization: "B",
    slug: "meetings-executive-presence",
    title: "Business Meetings, Virtual Communication & Executive Presence",
    tagline: "Lead the Conversation. Command Professional Confidence.",
    overview: [
      "This specialization strengthens communication in professional meetings, virtual collaboration, presentations, and leadership interactions. Participants develop the ability to contribute strategically, facilitate discussions, communicate with authority, and maintain a professional presence across in-person and digital business environments.",
    ],
    audience: [
      "Professionals attending or leading business meetings",
      "Managers, team leaders, and emerging executives",
      "Remote and hybrid employees",
      "Professionals preparing for client presentations",
      "Individuals seeking stronger executive presence",
    ],
    learningOutcomes: [
      "Facilitate productive meetings",
      "Communicate recommendations clearly",
      "Navigate virtual meeting etiquette",
      "Present ideas confidently",
      "Manage disagreement professionally",
      "Demonstrate credible executive presence",
    ],
    curriculum: [
      { week: 1, title: "Professional Meeting Communication Assessment", description: "Evaluate meeting participation, presentation skills, professional presence, and leadership communication.", practicalTraining: "Recorded baseline meeting simulation." },
      { week: 2, title: "Meeting Preparation, Agendas & Professional Introductions", description: "Set meeting objectives, prepare agendas, introduce participants, and establish expectations.", practicalTraining: "Opening and organizing a simulated meeting." },
      { week: 3, title: "Clear, Concise & Persuasive Workplace Communication", description: "Structure updates, recommendations, questions, and concise executive summaries.", practicalTraining: "Two-minute business briefing." },
      { week: 4, title: "Active Listening, Strategic Questions & Discussion Skills", description: "Practice clarification, paraphrasing, questioning, turn-taking, and constructive participation.", practicalTraining: "Facilitated discussion exercises." },
      { week: 5, title: "Zoom & Virtual Business Meeting Etiquette", description: "Develop camera presence, professional framing, microphone discipline, screen-sharing practices, chat etiquette, and interruption management.", practicalTraining: "Live virtual meeting simulation." },
      { week: 6, title: "Professional Appearance, Style & Executive Presence", description: "Examine context-appropriate business attire, grooming, posture, nonverbal signals, vocal authority, and professional image.", practicalTraining: "Executive presence coaching and recorded delivery." },
      { week: 7, title: "Business Presentations & Visual Communication", description: "Organize persuasive presentations and communicate effectively with visual materials.", practicalTraining: "Short presentation with slides." },
      { week: 8, title: "Meeting Facilitation & Group Decision-Making", description: "Guide discussions, manage time, invite contributions, summarize decisions, and establish action items.", practicalTraining: "Rotating meeting-chair simulation." },
      { week: 9, title: "Difficult Conversations & Professional Disagreement", description: "Address conflicting opinions, objections, sensitive topics, and misunderstandings respectfully.", practicalTraining: "Conflict-management role-play." },
      { week: 10, title: "Client Meetings & Stakeholder Communication", description: "Communicate with clients, senior leaders, external partners, and multidisciplinary teams.", practicalTraining: "Client briefing and follow-up simulation." },
      { week: 11, title: "Executive Briefings & Leadership Communication", description: "Deliver concise strategic recommendations and respond to high-level questions.", practicalTraining: "Executive briefing with questions and answers." },
      { week: 12, title: "Final Professional Meeting & Presentation Assessment", description: "Demonstrate meeting leadership, virtual etiquette, presentation delivery, and executive presence.", practicalTraining: "Integrated meeting and presentation simulation." },
    ],
    practicalHighlights: ["Zoom simulations", "Executive presence coaching", "Business presentations", "Meeting facilitation", "Recorded performance feedback"],
    seoDescription: "English communication training for business meetings, Zoom and hybrid collaboration, presentations, and executive presence: 12 weeks of simulations and coaching.",
  },

  // ------------------------------------------------------------------
  // ENGLISH C
  // ------------------------------------------------------------------
  {
    id: "english-c",
    program: "english",
    specialization: "C",
    slug: "business-dining-networking",
    title: "Business Dining, Formal Receptions & Professional Networking",
    tagline: "Build Relationships Beyond the Boardroom.",
    overview: [
      "This specialization prepares professionals to communicate confidently and appropriately during business luncheons, client dinners, corporate receptions, formal banquets, networking events, and other relationship-centered professional occasions.",
      "Instruction combines practical dining etiquette with conversation skills, professional introductions, social judgment, and relationship development.",
    ],
    audience: [
      "Business owners and entrepreneurs",
      "Client-facing professionals",
      "Emerging leaders and executives",
      "Professionals attending corporate receptions or networking events",
      "International professionals navigating U.S. business social expectations",
    ],
    learningOutcomes: [
      "Navigate professional dining settings",
      "Sustain appropriate business conversation",
      "Make introductions",
      "Interact confidently at receptions",
      "Communicate with clients and senior professionals",
      "Conduct thoughtful follow-up",
    ],
    curriculum: [
      { week: 1, title: "Business Social Communication Assessment", description: "Identify strengths and challenges in networking, dining conversation, and professional social settings.", practicalTraining: "Professional introduction simulation." },
      { week: 2, title: "First Impressions, Greetings & Professional Introductions", description: "Practice introductions, names, titles, handshakes where appropriate, and professional conversation openings.", practicalTraining: "Reception-style introduction rotations." },
      { week: 3, title: "Networking Conversation & Relationship Building", description: "Initiate, sustain, and conclude meaningful professional conversations.", practicalTraining: "Structured networking simulation." },
      { week: 4, title: "Business Luncheon Planning & Restaurant Protocol", description: "Understand invitations, reservations, arrival timing, seating, host and guest responsibilities, and meeting objectives.", practicalTraining: "Business luncheon planning exercise." },
      { week: 5, title: "Restaurant Dining Etiquette & Table Manners", description: "Practice place settings, utensils, napkin etiquette, ordering, pacing, and professional table behavior.", practicalTraining: "Guided table-setting and dining simulation." },
      { week: 6, title: "Business Conversation During Meals", description: "Balance business objectives with relationship-building, appropriate topics, listening, and conversational transitions.", practicalTraining: "Simulated client luncheon." },
      { week: 7, title: "Hosting Clients & Managing Professional Hospitality", description: "Practice welcoming guests, making introductions, managing conversation, and concluding a business meal.", practicalTraining: "Host-and-guest role-play." },
      { week: 8, title: "Formal Dinners, Banquets & Seating Protocol", description: "Understand formal invitations, seating arrangements, multi-course dining, and professional banquet conduct.", practicalTraining: "Formal banquet simulation." },
      { week: 9, title: "Evening Receptions, Corporate Parties & Dress Codes", description: "Navigate reception formats, business attire expectations, appropriate conduct, and professional interactions.", practicalTraining: "Evening reception scenario." },
      { week: 10, title: "VIP Interactions & Cross-Cultural Social Etiquette", description: "Practice respectful communication with senior leaders, international guests, and professionals from different cultural backgrounds.", practicalTraining: "VIP reception and introduction scenarios." },
      { week: 11, title: "Networking Follow-Up & Professional Relationship Management", description: "Write thoughtful follow-up messages, maintain professional connections, and recognize relationship boundaries.", practicalTraining: "Post-event email and contact strategy." },
      { week: 12, title: "Integrated Business Dining & Reception Assessment", description: "Demonstrate professional introductions, dining communication, etiquette, and networking skills.", practicalTraining: "Capstone business luncheon and reception simulation." },
    ],
    practicalHighlights: ["Dining simulations", "Table etiquette practice", "Formal reception role-play", "Client conversation exercises", "Networking feedback"],
    notes: [
      "On-site restaurant, banquet, or event-based training may be offered only when specifically scheduled and confirmed. The standard course does not include off-site experiences.",
    ],
    seoDescription: "Professional training in business dining etiquette, client luncheons, formal receptions, and networking conversation for client-facing professionals and emerging leaders.",
  },

  // ------------------------------------------------------------------
  // ENGLISH D
  // ------------------------------------------------------------------
  {
    id: "english-d",
    program: "english",
    specialization: "D",
    slug: "global-leadership",
    title: "Global Business Leadership & Cross-Cultural Communication",
    tagline: "Communicate Across Cultures. Lead Across Borders.",
    overview: [
      "This specialization prepares professionals to work effectively with international colleagues, business partners, clients, and multicultural teams. Participants develop cultural intelligence, leadership communication, collaborative decision-making, negotiation skills, and the ability to navigate differences in professional expectations.",
    ],
    audience: [
      "Managers and emerging leaders",
      "International business professionals",
      "Multicultural team members",
      "Entrepreneurs working with overseas partners",
      "Professionals seeking stronger cross-cultural communication skills",
    ],
    learningOutcomes: [
      "Recognize cultural communication differences",
      "Adapt messages for international audiences",
      "Manage cross-cultural meetings",
      "Respond to misunderstandings",
      "Communicate effectively during collaboration and negotiation",
    ],
    curriculum: [
      { week: 1, title: "Global Communication Assessment & Cultural Self-Awareness", description: "Examine communication preferences, cultural assumptions, and professional development goals.", practicalTraining: "Cross-cultural communication profile." },
      { week: 2, title: "Cultural Intelligence in Professional Environments", description: "Explore context, communication styles, relationship expectations, and cultural adaptability.", practicalTraining: "Workplace case analysis." },
      { week: 3, title: "Leadership Communication Across Cultures", description: "Adapt direction, feedback, delegation, and motivation for multicultural teams.", practicalTraining: "International team leadership scenario." },
      { week: 4, title: "Global Meetings & Decision-Making Practices", description: "Compare meeting participation, hierarchy, consensus, and decision-making approaches.", practicalTraining: "Multicultural meeting simulation." },
      { week: 5, title: "Professional Diplomacy & Relationship Development", description: "Build trust, communicate respect, and manage professional expectations across cultures.", practicalTraining: "International partner introduction exercise." },
      { week: 6, title: "Cross-Cultural Presentation & Persuasion", description: "Adjust message structure, evidence, tone, and delivery for international stakeholders.", practicalTraining: "Global client presentation." },
      { week: 7, title: "International Virtual Collaboration", description: "Manage time-zone coordination, virtual meeting expectations, asynchronous communication, and remote teamwork.", practicalTraining: "Distributed-team project simulation." },
      { week: 8, title: "Negotiation Communication & Cultural Differences", description: "Practice preparation, questioning, interests-based negotiation, and culturally responsive communication.", practicalTraining: "Cross-border negotiation role-play." },
      { week: 9, title: "Conflict Resolution & Misunderstanding Repair", description: "Identify sources of misunderstanding and practice constructive communication repair.", practicalTraining: "Cross-cultural conflict scenario." },
      { week: 10, title: "Global Business Etiquette & Professional Protocol", description: "Examine introductions, titles, hospitality, professional social conduct, and culturally appropriate courtesy.", practicalTraining: "International business reception scenario." },
      { week: 11, title: "Ethical Leadership & Inclusive Communication", description: "Practice respectful leadership, transparency, inclusion, and responsible professional judgment.", practicalTraining: "Leadership case discussion." },
      { week: 12, title: "Global Leadership Capstone Assessment", description: "Demonstrate integrated leadership, meeting, presentation, and cross-cultural communication competencies.", practicalTraining: "International partnership simulation." },
    ],
    practicalHighlights: ["Cross-cultural case studies", "International meeting simulations", "Negotiation role-play", "Global leadership exercises"],
    seoDescription: "Cross-cultural communication and global leadership training for managers and international professionals: multicultural meetings, negotiation, and professional diplomacy.",
  },

  // ------------------------------------------------------------------
  // KOREAN A
  // ------------------------------------------------------------------
  {
    id: "korean-a",
    program: "korean",
    specialization: "A",
    slug: "interview-career-advancement",
    title: "Korean Professional Interview & Career Advancement Communication",
    tagline: "Communicate Your Professional Value in Korean Business Environments.",
    overview: [
      "This specialization prepares participants for interviews, career advancement discussions, professional introductions, and leadership opportunities involving Korean companies or Korean-speaking professional environments.",
      "It emphasizes culturally appropriate self-presentation, Korean professional language, career storytelling, workplace hierarchy, and the communication expectations of Korean and Korean-American organizations.",
      "The course is particularly relevant to heritage Korean speakers and Korean American professionals who communicate comfortably in everyday Korean but want greater confidence in formal career-related settings.",
    ],
    audience: [
      "Korean American professionals pursuing career advancement",
      "Heritage Korean speakers seeking stronger formal business communication",
      "Professionals interviewing with Korean companies",
      "Individuals working with Korean-speaking recruiters or executives",
      "Professionals preparing for Korean-American business leadership opportunities",
    ],
    learningOutcomes: [
      "Introduce professional qualifications appropriately",
      "Discuss career achievements",
      "Use context-appropriate formal Korean",
      "Respond to interview questions",
      "Navigate professional interactions with Korean-speaking interviewers",
    ],
    curriculum: [
      { week: 1, title: "Korean Professional Communication & Career Assessment", description: "Assess formal Korean communication, professional vocabulary, interview readiness, and career objectives.", practicalTraining: "Baseline Korean professional introduction and interview." },
      { week: 2, title: "Korean Professional Self-Introduction (자기소개)", description: "Develop culturally appropriate career introductions that communicate education, experience, strengths, and professional goals.", practicalTraining: "Structured 자기소개 delivery." },
      { week: 3, title: "Professional Speech Levels, Titles & Honorifics", description: "Practice 존댓말, professional forms of address, organizational titles, and respectful communication with interviewers and senior professionals.", practicalTraining: "Formality and title-selection exercises." },
      { week: 4, title: "Korean Career Storytelling & Achievement Presentation", description: "Explain work history, accomplishments, teamwork, and professional contributions using appropriate business language.", practicalTraining: "Korean career narrative presentation." },
      { week: 5, title: "Korean Interview Questions & Response Strategies", description: "Respond to questions about motivation, experience, problem-solving, and organizational fit.", practicalTraining: "Structured Korean interview drills." },
      { week: 6, title: "Korean Corporate Interview Culture & Professional Expectations", description: "Examine interview formality, organizational expectations, professional etiquette, and differences between Korean and American interview practices.", practicalTraining: "Korean corporate interview simulation." },
      { week: 7, title: "Korean–American Career Identity & Professional Positioning", description: "Communicate bilingual experience, cross-cultural strengths, and professional identity without relying on assumptions about cultural background.", practicalTraining: "Cross-cultural career positioning exercise." },
      { week: 8, title: "Executive Interviews & Senior Leadership Communication", description: "Practice professional composure, respectful questioning, strategic answers, and interactions with senior decision-makers.", practicalTraining: "Executive interview role-play." },
      { week: 9, title: "Virtual Interviews with Korean Organizations", description: "Develop appropriate online greetings, visual presence, speech formality, response timing, and professional follow-up.", practicalTraining: "Korean-language Zoom interview." },
      { week: 10, title: "Promotion Discussions, Career Negotiation & Professional Requests", description: "Practice advancement discussions, compensation questions, clarification, and respectful negotiation.", practicalTraining: "Promotion and offer conversation simulation." },
      { week: 11, title: "Korean Mock Interviews & Individualized Coaching", description: "Integrate professional Korean communication, interview strategies, and cultural awareness.", practicalTraining: "Full mock interview with instructor feedback." },
      { week: 12, title: "Final Korean Professional Interview Assessment", description: "Demonstrate culturally appropriate interview communication and professional self-presentation.", practicalTraining: "Final interview simulation and development review." },
    ],
    practicalHighlights: ["Korean mock interviews", "Formal speech coaching", "Korean corporate interview simulations", "Career storytelling", "Executive communication practice"],
    seoDescription: "Formal Korean interview and career communication training for heritage speakers and Korean American professionals: 자기소개, honorifics, and Korean corporate interview practice.",
  },

  // ------------------------------------------------------------------
  // KOREAN B
  // ------------------------------------------------------------------
  {
    id: "korean-b",
    program: "korean",
    specialization: "B",
    slug: "meetings-executive-presence",
    title: "Korean Business Meetings, Virtual Communication & Executive Presence",
    tagline: "Navigate Korean Business Meetings with Professional Confidence.",
    overview: [
      "This specialization develops the skills needed to participate in, lead, and communicate effectively during Korean-language and Korean-American business meetings.",
      "Instruction addresses professional Korean speech, organizational hierarchy, executive interactions, Zoom meeting etiquette, business presentations, appropriate professional appearance, and the balance between direct communication and respectful professional diplomacy.",
    ],
    audience: [
      "Korean American professionals working with Korean organizations",
      "Heritage Korean speakers seeking stronger formal workplace communication",
      "Managers participating in Korean-speaking meetings",
      "Professionals presenting to Korean clients or executives",
      "International team members collaborating with Korean businesses",
    ],
    learningOutcomes: [
      "Prepare for meetings",
      "Address participants appropriately",
      "Communicate updates",
      "Express disagreement professionally",
      "Contribute in virtual meetings",
      "Present recommendations to Korean-speaking stakeholders",
    ],
    curriculum: [
      { week: 1, title: "Korean Business Meeting Communication Assessment", description: "Assess professional Korean proficiency, meeting experience, presentation skills, and communication goals.", practicalTraining: "Baseline meeting participation simulation." },
      { week: 2, title: "Korean Corporate Hierarchy, Titles & Meeting Protocol", description: "Examine roles, titles, seating considerations, introductions, and professional expectations in Korean organizational settings.", practicalTraining: "Executive meeting introduction scenario." },
      { week: 3, title: "Formal Korean for Meetings & Workplace Discussion", description: "Practice professional requests, reporting expressions, questions, clarification, and appropriate speech levels.", practicalTraining: "Korean workplace dialogue exercises." },
      { week: 4, title: "Meeting Agendas, Briefings & Progress Reports", description: "Organize and communicate objectives, project updates, deadlines, and action items.", practicalTraining: "Korean-language project status briefing." },
      { week: 5, title: "Zoom Meetings with Korean Business Partners", description: "Practice virtual greetings, camera etiquette, speaking turns, screen-sharing, professional appearance, and online meeting closings.", practicalTraining: "Korean business Zoom simulation." },
      { week: 6, title: "Executive Presence, Professional Style & Nonverbal Communication", description: "Develop appropriate business presentation, posture, vocal control, professional attire, and confident but respectful delivery.", practicalTraining: "Recorded executive presence coaching." },
      { week: 7, title: "Korean Business Presentations & Executive Reporting", description: "Structure concise reports, explain evidence, and present recommendations to managers or clients.", practicalTraining: "Korean executive briefing." },
      { week: 8, title: "Respectful Disagreement & Professional Diplomacy", description: "Practice expressing concerns, asking challenging questions, and offering alternative recommendations appropriately.", practicalTraining: "Difficult meeting discussion role-play." },
      { week: 9, title: "Korean–American Meeting Style Differences", description: "Compare expectations surrounding participation, decision-making, directness, feedback, and meeting follow-up.", practicalTraining: "Bicultural team meeting simulation." },
      { week: 10, title: "Client Meetings & Relationship-Oriented Communication", description: "Develop professional rapport while maintaining clarity, respect, and appropriate boundaries.", practicalTraining: "Korean client meeting role-play." },
      { week: 11, title: "Leadership Meetings & Decision Communication", description: "Practice summarizing discussions, communicating decisions, assigning next steps, and maintaining accountability.", practicalTraining: "Facilitated leadership meeting." },
      { week: 12, title: "Final Korean Business Meeting Assessment", description: "Demonstrate integrated meeting communication, virtual etiquette, professional presence, and executive reporting.", practicalTraining: "Comprehensive Korean business meeting simulation." },
    ],
    practicalHighlights: ["Korean executive meeting simulations", "Zoom etiquette practice", "Honorifics and titles", "Professional image coaching", "Korean presentations"],
    seoDescription: "Korean business meeting communication training: corporate hierarchy, formal Korean, Zoom etiquette with Korean partners, executive reporting, and professional diplomacy.",
  },

  // ------------------------------------------------------------------
  // KOREAN C
  // ------------------------------------------------------------------
  {
    id: "korean-c",
    program: "korean",
    specialization: "C",
    slug: "business-dining-networking",
    title: "Korean Business Dining, Formal Receptions & Professional Networking",
    tagline: "Build Meaningful Business Relationships Through Cultural Fluency.",
    overview: [
      "This specialization prepares participants to communicate effectively during Korean business luncheons, client dinners, formal banquets, evening receptions, corporate celebrations, and professional networking events.",
      "It focuses on the relationship between business communication, hospitality, social etiquette, professional hierarchy, and culturally appropriate interaction.",
      "The course is especially relevant to Korean American professionals who may be comfortable with Korean food and family customs but want greater confidence in formal corporate dining and business social situations.",
    ],
    audience: [
      "Korean American business professionals",
      "Entrepreneurs engaging with Korean companies",
      "Professionals hosting Korean clients or executives",
      "Heritage Korean speakers seeking formal business etiquette training",
      "Individuals attending Korean corporate dinners and receptions",
    ],
    learningOutcomes: [
      "Navigate Korean professional introductions",
      "Respond appropriately to dining invitations",
      "Meet seating and hosting expectations",
      "Sustain business conversation during meals",
      "Interact confidently at formal receptions",
      "Conduct professional follow-up",
    ],
    curriculum: [
      { week: 1, title: "Korean Business Social Communication Assessment", description: "Assess familiarity with Korean professional social customs, formal communication, and networking situations.", practicalTraining: "Korean business reception introduction." },
      { week: 2, title: "Professional Greetings, Titles & Introductions", description: "Practice formal greetings, appropriate titles, introductions across seniority levels, and respectful professional conduct.", practicalTraining: "Korean executive introduction simulation." },
      { week: 3, title: "Korean Business Networking & Relationship Development", description: "Develop professional conversation openings, rapport-building, appropriate personal questions, and follow-up communication.", practicalTraining: "Korean business networking rotation." },
      { week: 4, title: "Business Luncheon Invitations, Hosting & Seating", description: "Examine invitation etiquette, arrival, hosting responsibilities, seating considerations, and business meal objectives.", practicalTraining: "Korean business luncheon planning." },
      { week: 5, title: "Korean Dining Etiquette & Table Protocol", description: "Practice appropriate table conduct, shared dishes, utensils, serving considerations, and respectful interaction.", practicalTraining: "Korean business dining table simulation." },
      { week: 6, title: "Business Conversation During Korean Meals", description: "Balance professional topics, relationship-building, listening, respectful responses, and transitions between social and business discussion.", practicalTraining: "Korean-language client luncheon role-play." },
      { week: 7, title: "Hosting Korean Executives & Business Guests", description: "Practice welcoming senior guests, introductions, conversational hosting, professional hospitality, and appropriate closings.", practicalTraining: "Executive guest-host simulation." },
      { week: 8, title: "Korean Corporate Dinners & Formal Banquets", description: "Examine banquet structure, seating, speeches, toasts, formal hospitality, and professional judgment in social situations.", practicalTraining: "Corporate banquet simulation." },
      { week: 9, title: "Evening Receptions, Corporate Celebrations & Professional Style", description: "Navigate formal invitations, dress codes, reception conversations, and business social expectations.", practicalTraining: "Korean corporate evening reception scenario." },
      { week: 10, title: "Korean–American Differences in Dining & Social Etiquette", description: "Compare professional hospitality expectations, conversation styles, personal boundaries, and social conventions across business environments.", practicalTraining: "Bicultural business dinner scenario." },
      { week: 11, title: "Professional Follow-Up & Long-Term Relationship Management", description: "Write appropriate Korean business thank-you messages, follow up after events, and maintain professional relationships.", practicalTraining: "Korean-language follow-up communication." },
      { week: 12, title: "Korean Business Dining & Reception Capstone", description: "Demonstrate professional introductions, hosting, dining communication, cultural awareness, and networking.", practicalTraining: "Integrated luncheon and formal reception simulation." },
    ],
    practicalHighlights: ["Korean business dining simulations", "Formal introductions", "Banquet and reception etiquette", "Executive hosting", "Korean-language networking"],
    notes: [
      "Korean business practices vary by organization, generation, industry, and individual preference. Instruction emphasizes situational judgment rather than rigid cultural stereotypes. Participation in alcohol-related customs is never required.",
    ],
    seoDescription: "Korean business dining, banquet, and reception etiquette training for Korean American professionals and anyone hosting or meeting Korean executives and partners.",
  },

  // ------------------------------------------------------------------
  // KOREAN D
  // ------------------------------------------------------------------
  {
    id: "korean-d",
    program: "korean",
    specialization: "D",
    slug: "global-leadership",
    title: "Korean–American Global Business Leadership & Cross-Cultural Communication",
    tagline: "Lead Across Korean and American Business Cultures.",
    overview: [
      "This advanced professional specialization focuses on communication and leadership across Korean and American business environments.",
      "Participants examine how organizational expectations, professional hierarchy, communication styles, decision-making practices, negotiation approaches, and relationship development influence business collaboration.",
      "The course is particularly valuable for bilingual Korean American professionals who bridge organizations, teams, and stakeholders across both cultures.",
    ],
    audience: [
      "Korean American managers and emerging executives",
      "Bilingual professionals serving Korean and American organizations",
      "Entrepreneurs developing U.S.–Korea business relationships",
      "Professionals involved in international partnerships",
      "Team leaders navigating cross-cultural workplace expectations",
    ],
    learningOutcomes: [
      "Interpret cultural communication differences",
      "Lead bicultural meetings",
      "Adapt leadership messages",
      "Manage sensitive conversations",
      "Support cross-border collaboration",
      "Communicate professionally with stakeholders in Korean and American business environments",
    ],
    curriculum: [
      { week: 1, title: "Bicultural Professional Communication Assessment", description: "Evaluate Korean and English professional communication strengths, leadership experience, and cross-cultural challenges.", practicalTraining: "Bicultural leadership scenario." },
      { week: 2, title: "Korean & American Organizational Communication Cultures", description: "Compare hierarchy, initiative, feedback, formality, and workplace expectations without assuming that all organizations behave identically.", practicalTraining: "Organizational case analysis." },
      { week: 3, title: "Korean Professional Hierarchy, Respect & Leadership Language", description: "Practice communicating across levels of seniority while maintaining clarity, mutual respect, and professional effectiveness.", practicalTraining: "Manager–executive communication simulation." },
      { week: 4, title: "Bicultural Leadership & Team Communication", description: "Develop communication strategies for leading teams with different expectations regarding autonomy, collaboration, and decision-making.", practicalTraining: "Cross-cultural team leadership exercise." },
      { week: 5, title: "Korean–American Executive Meetings & Strategic Briefings", description: "Practice executive updates, decision requests, respectful disagreement, and meeting summaries for bicultural stakeholders.", practicalTraining: "Bilingual executive briefing simulation." },
      { week: 6, title: "Professional Diplomacy & Sensitive Conversations", description: "Address disagreement, corrective feedback, misunderstandings, and competing expectations constructively.", practicalTraining: "Sensitive workplace conversation role-play." },
      { week: 7, title: "Cross-Border Virtual Collaboration & Digital Etiquette", description: "Manage virtual meetings, time-zone expectations, asynchronous updates, professional tone, and collaboration practices.", practicalTraining: "U.S.–Korea virtual project meeting." },
      { week: 8, title: "Korean–American Negotiation Communication", description: "Practice relationship-building, clarification, proposal framing, negotiation language, and culturally responsive communication.", practicalTraining: "Cross-border business negotiation." },
      { week: 9, title: "Business Partnerships, Trust & Relationship Management", description: "Develop professional approaches to partner introductions, relationship continuity, communication expectations, and accountability.", practicalTraining: "Partnership development scenario." },
      { week: 10, title: "Executive Hospitality, Protocol & Global Networking", description: "Apply culturally appropriate communication during professional dinners, receptions, leadership visits, and international business events.", practicalTraining: "Korean–American executive reception simulation." },
      { week: 11, title: "Conflict Resolution, Ethical Leadership & Cultural Intelligence", description: "Practice repairing misunderstandings, balancing organizational expectations, and making responsible leadership decisions.", practicalTraining: "Bicultural leadership case workshop." },
      { week: 12, title: "Global Business Leadership Capstone Assessment", description: "Demonstrate integrated bicultural leadership, meeting, negotiation, and professional relationship skills.", practicalTraining: "Korean–American partnership leadership simulation." },
    ],
    practicalHighlights: ["Bicultural executive meetings", "Korean–American leadership cases", "International negotiation", "Professional diplomacy", "Cross-border partnership simulations"],
    seoDescription: "Advanced Korean–American leadership and cross-cultural communication training for bilingual managers bridging Korean and American organizations and partnerships.",
  },
].map((c) => ({ ...SHARED, image: null, notes: [], ...c }));

module.exports = { PROGRAMS, COURSES };
