import { addDays, stableId } from './http.js';

export const DEMO_TRANSCRIPT =
  '';

export const KB_DOCS = [
  {
    title: 'PMKVY Beauty and Wellness training',
    source_url: 'https://www.pmkvyofficial.org/',
    scheme_type: 'skill_course',
    content:
      'PMKVY supports short-term skill courses in beauty and wellness. Training can lead to assistant beautician, salon support, and self-employment pathways.',
  },
  {
    title: 'Odisha scholarship and girls education support',
    source_url: 'https://scholarship.odisha.gov.in/',
    scheme_type: 'scholarship',
    content:
      'Odisha scholarship programs support eligible girls and low-income learners so education can continue through secondary and higher secondary stages.',
  },
  {
    title: 'National Career Service local job matching',
    source_url: 'https://www.ncs.gov.in/',
    scheme_type: 'job_portal',
    content:
      'The National Career Service portal aggregates employer vacancies and can be searched by location, role, skills, and sector.',
  },
];

export const ACADEMIC_RESOURCE_DOCS = [
  {
    title: 'NCERT textbooks for Classes I-XII',
    source_url: 'https://ncert.nic.in/textbook.php',
    scheme_type: 'official_textbook',
    content:
      'NCERT provides official textbook PDFs for classes I to XII. For Class 12 board preparation, the first study layer should be chapter concepts, solved examples, in-text questions, and end-of-chapter exercises from the relevant NCERT books.',
  },
  {
    title: 'CBSE Class XII Sample Question Papers and Marking Scheme 2025-26',
    source_url: 'https://cbseacademic.nic.in/SQP_CLASSXII_2025-26.html',
    scheme_type: 'official_sample_paper',
    content:
      'CBSE Academic publishes Class XII sample question papers and marking schemes for the 2025-26 exam cycle. These show question pattern, answer depth, and marks distribution for each subject.',
  },
  {
    title: 'DIKSHA curriculum-aligned learning resources',
    source_url: 'https://diksha.gov.in/',
    scheme_type: 'official_digital_learning',
    content:
      'DIKSHA is India curriculum-aligned digital learning platform for school education. It supports videos, practice resources, and learning content that can be accessed on mobile devices.',
  },
  {
    title: 'CBSE previous years question papers',
    source_url: 'https://www.cbse.gov.in/cbsenew/question-paper.html',
    scheme_type: 'official_previous_papers',
    content:
      'CBSE previous year question papers help learners practice exam timing, identify repeated patterns, and revise after NCERT concept completion.',
  },
  {
    title: 'NTA JEE Main official website',
    source_url: 'https://jeemain.nta.ac.in/',
    scheme_type: 'official_entrance_exam',
    content:
      'The NTA JEE Main official website is the primary reference for JEE Main information, exam notices, syllabus references, and candidate updates. Entrance-exam plans should use official syllabus, topic coverage, practice, mocks, and error-log review before any career route.',
  },
  {
    title: 'JEE Advanced official website',
    source_url: 'https://jeeadv.ac.in/',
    scheme_type: 'official_entrance_exam',
    content:
      'The JEE Advanced official website is the primary reference for JEE Advanced information. A serious IIT route needs syllabus mapping, Physics/Chemistry/Mathematics concept repair, previous-style problem practice, timed mocks, and post-test error analysis.',
  },
];

export const DEMO_PROFILE = {
  learner_id: null,
  name: '',
  class_level: '',
  location: '',
  commute_km: null,
  commute_constraint: 'safe commute preferred',
  aspirations: [],
  device: 'mobile phone',
  income_pressure: false,
  language: 'Hindi or local language',
  dialect_guess: '',
  age: null,
};

export const DEMO_JOBS = [
  {
    id: 'job_sakhi_beauty',
    employer: 'Sakhi Beauty Studio',
    title: 'Assistant Beautician',
    wage: 'Rs. 8,500/month',
    distance_km: 12,
    constraints: ['safe commute', 'women-friendly', 'afternoon shift'],
    source_url: 'https://www.ncs.gov.in/',
    description:
      'Entry-level salon support role for beauty and wellness trainees. Customer service and hygiene skills valued.',
    contact_email: '',
    contact_status: 'source_contact_needed',
  },
  {
    id: 'job_mehandi_collective',
    employer: 'Local Event Collective',
    title: 'Wedding Mehandi Apprentice',
    wage: 'Rs. 900/day seasonally',
    distance_km: 24,
    constraints: ['women-only team', 'seasonal', 'portfolio preferred'],
    source_url: 'https://udyamregistration.gov.in/',
    description:
      'Mehandi apprentice role for wedding season teams. Informal skill verification helps shortlist candidates.',
    contact_email: '',
    contact_status: 'source_contact_needed',
  },
  {
    id: 'job_glowcare',
    employer: 'GlowCare MSME Partner',
    title: 'Salon Reception + Customer Care',
    wage: 'Rs. 7,200/month',
    distance_km: 29,
    constraints: ['customer service', 'day shift'],
    source_url: 'https://www.ncs.gov.in/',
    description:
      'Reception and appointment support for local wellness business. Good fit for learners building confidence.',
    contact_email: '',
    contact_status: 'source_contact_needed',
  },
];

export function parseJson(text, fallback) {
  if (!text) {
    return fallback;
  }

  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return fallback;
      }
    }
  }

  return fallback;
}

export function sourceLimitedPathways(profile = DEMO_PROFILE) {
  const aspirations = (profile.aspirations || []).join(' ').toLowerCase();
  const location = profile.location || 'your district';
  const firstAspiration = primarySkill(profile.aspirations || ['career skill']);
  const dataScienceIntent = /data science|machine learning|data analyst|analytics|python|sql|\bai\b|artificial intelligence/.test(aspirations);
  const academicGoalType = profile.academic_goal?.type || '';
  const academicGoalOverridesStaleCareer =
    academicGoalType === 'entrance_exam_prep' ||
    academicGoalType === 'class_12_exam_prep' ||
    academicGoalType === 'school_study_support';
  const studyLaneActive = !profile.learner_goal?.intent || profile.learner_goal.intent === 'study' || academicGoalOverridesStaleCareer;
  if (studyLaneActive && isEntranceExamPrepProfile(profile)) {
    const exam = profile.academic_goal?.exam || 'entrance exam';
    const subjects = profile.academic_goal?.subjects?.length ? profile.academic_goal.subjects.join(', ') : 'syllabus topics';
    return [
      {
        id: 'entrance-syllabus-map',
        name: `${exam} syllabus map -> topic priority`,
        time: '2-3 days diagnostic, then weekly updates',
        distance: 'Home/mobile study; no offline travel needed',
        income: 'Improves exam readiness before any career/job route',
        tradeoff: `Best first step: map ${subjects}, mark red/yellow/green topics, and stop mixing job prep with exam prep.`,
        source_url: 'https://jeemain.nta.ac.in/',
        source_title: 'NTA JEE Main official website',
        confidence: 0.88,
        focus_subjects: profile.academic_goal?.subjects || ['entrance exam syllabus'],
      },
      {
        id: 'entrance-concept-practice-loop',
        name: `${exam} concept repair -> daily problem practice`,
        time: '4-8 weeks foundation loop',
        distance: 'Phone-first plan plus notebook problem solving',
        income: 'Builds accuracy and confidence for the exam',
        tradeoff: 'Works only if every lesson ends with solved questions; watching videos alone is not counted as progress.',
        source_url: 'https://ncert.nic.in/textbook.php',
        source_title: 'NCERT official textbooks for concept foundation',
        confidence: 0.82,
        focus_subjects: profile.academic_goal?.subjects || ['entrance exam syllabus'],
      },
      {
        id: 'entrance-mock-error-log',
        name: `${exam} mock tests -> error-log sprint`,
        time: 'Weekly mock plus 2-day analysis cycle',
        distance: 'Online/home test routine',
        income: 'Improves speed, accuracy, and rank-readiness',
        tradeoff: 'Most useful after baseline concepts are started; every wrong answer must become a revision task.',
        source_url: 'https://jeeadv.ac.in/',
        source_title: 'JEE Advanced official website',
        confidence: 0.8,
        focus_subjects: profile.academic_goal?.subjects || ['entrance exam syllabus'],
      },
    ];
  }
  if (studyLaneActive && isSchoolStudyProfile(profile)) {
    const subjects = profile.academic_goal?.subjects?.length ? profile.academic_goal.subjects.join(', ') : 'selected subjects';
    const classLevel = profile.class_level || 'school';
    return [
      {
        id: 'school-ncert-foundation',
        name: `${classLevel} NCERT foundation -> chapter clarity`,
        time: '2-4 weeks foundation loop',
        distance: 'Home/mobile study; notebook practice required',
        income: 'Better school performance and confidence',
        tradeoff: `Best first route for ${subjects}; starts with concepts before tests.`,
        source_url: 'https://ncert.nic.in/textbook.php',
        source_title: 'NCERT official school textbooks',
        confidence: 0.88,
        focus_subjects: profile.academic_goal?.subjects || ['school subjects'],
      },
      {
        id: 'school-diksha-practice',
        name: `${classLevel} DIKSHA practice -> video plus questions`,
        time: '30-45 minutes/day',
        distance: 'Mobile-friendly learning support',
        income: 'Improves chapter recall and homework completion',
        tradeoff: 'Videos must end with solved questions; watching alone is not progress.',
        source_url: 'https://diksha.gov.in/',
        source_title: 'DIKSHA curriculum-aligned resources',
        confidence: 0.82,
        focus_subjects: profile.academic_goal?.subjects || ['school subjects'],
      },
      {
        id: 'school-weekly-test-loop',
        name: `${classLevel} weekly test loop -> marks improvement`,
        time: 'Weekly test + mistake-log revision',
        distance: 'Notebook-first plan with mentor check-ins',
        income: 'Builds exam confidence and consistent study habits',
        tradeoff: 'Requires honest mistake tracking after each test.',
        source_url: 'https://ncert.nic.in/textbook.php',
        source_title: 'NCERT exercises and chapter-end questions',
        confidence: 0.78,
        focus_subjects: profile.academic_goal?.subjects || ['school subjects'],
      },
    ];
  }
  if (studyLaneActive && isAcademicPrepProfile(profile)) {
    const subjects = profile.academic_goal?.subjects?.length ? profile.academic_goal.subjects.join(', ') : 'selected Class 12 subjects';
    return [
      {
        id: 'class12-ncert-foundation',
        name: 'NCERT concept mastery -> strong board basics',
        time: '4-6 weeks foundation',
        distance: 'Home/mobile study; works with shared phone',
        income: 'Better Class 12 marks and stronger eligibility for next pathways',
        tradeoff: `Best first route if the learner needs clarity in ${subjects} before solving papers.`,
        source_url: 'https://ncert.nic.in/textbook.php',
        source_title: 'NCERT official textbooks for Class 12',
        confidence: 0.9,
        focus_subjects: profile.academic_goal?.subjects || ['Class 12 subjects'],
      },
      {
        id: 'class12-cbse-sample-papers',
        name: 'Sample paper sprint -> exam pattern and marks strategy',
        time: '3-4 weeks after foundation',
        distance: 'Phone-first practice plus notebook answers',
        income: 'Improves exam readiness, answer framing, and confidence',
        tradeoff: 'Most useful after NCERT chapters are revised once; otherwise mistakes repeat.',
        source_url: 'https://cbseacademic.nic.in/SQP_CLASSXII_2025-26.html',
        source_title: 'CBSE Class XII sample papers and marking schemes 2025-26',
        confidence: 0.88,
        focus_subjects: profile.academic_goal?.subjects || ['Class 12 subjects'],
      },
      {
        id: 'class12-diksha-remedial',
        name: 'DIKSHA remedial practice -> weak chapter repair',
        time: 'Daily 30-45 minute loop',
        distance: 'Mobile learning with offline-friendly resources',
        income: 'Builds consistency for learners with gaps or low confidence',
        tradeoff: 'Needs weekly tracking so video watching turns into solved questions.',
        source_url: 'https://diksha.gov.in/',
        source_title: 'DIKSHA curriculum-aligned digital resources',
        confidence: 0.8,
        focus_subjects: profile.academic_goal?.subjects || ['Class 12 subjects'],
      },
    ];
  }
  const goalType = profile.learner_goal?.type || '';
  if (['job_search_only', 'formal_skill_job_search', 'college_job_search'].includes(goalType)) {
    const role = titleCase(firstAspiration || 'job');
    if (dataScienceIntent) {
      return [
        {
          id: 'ds-readiness-gap-map',
          name: 'Data Science job-readiness gap map',
          time: '2-3 days diagnostic',
          distance: 'Online-first; no commute needed',
          income: 'Clarifies fresher, internship, and analyst-role readiness',
          tradeoff: 'Fastest first step because the learner wants a job; it checks Python, SQL, statistics, projects, resume, and interview gaps before outreach.',
          source_url: 'https://www.ncs.gov.in/',
          source_title: 'National Career Service job search',
          confidence: 0.82,
        },
        {
          id: 'ds-portfolio-sprint',
          name: 'Two-project Data Science portfolio sprint',
          time: '10-21 days depending on current skills',
          distance: 'Remote portfolio work from current city',
          income: 'Improves shortlisting for fresher analyst/intern roles',
          tradeoff: 'Better than generic computer basics because hirers need proof: one cleaned dataset, one dashboard/model, and a clear project note.',
          source_url: 'https://www.skillindiadigital.gov.in/',
          source_title: 'Skill India Digital learning and proof pathways',
          confidence: 0.78,
        },
        {
          id: 'ds-india-wide-outreach',
          name: `${profile.relocation_preference || location} Data Science fresher outreach`,
          time: 'Daily 5-lead application loop',
          distance: profile.relocation_preference || `Current base: ${location}; remote and local roles filtered separately`,
          income: 'Internship/fresher wage depends on employer listing',
          tradeoff: 'Converts the pathway into tracked applications: shortlisted leads, consent-limited profile, draft, queue, reply status, and follow-up.',
          source_url: 'https://www.ncs.gov.in/',
          source_title: 'NCS opportunities plus outreach workflow',
          confidence: 0.76,
        },
      ];
    }
    return [
      {
        id: 'job-local-search',
        name: `${role} job search in ${location}`,
        time: 'Immediate search + 3-day follow-up loop',
        distance: `Only within ${profile.commute_km || 20} km of ${location}`,
        income: 'Market wage based on employer listing',
        tradeoff: 'Fastest route because learner wants jobs directly; training is only suggested if proof gaps block matching.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'National Career Service job search',
        confidence: 0.84,
      },
      {
        id: 'resume-proof-fit',
        name: 'Resume/proof fit check -> stronger shortlist',
        time: '1-2 days',
        distance: 'Phone-first; no offline travel',
        income: 'Improves callback chances',
        tradeoff: 'Small upfront polish before outreach, not a long training detour.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'NCS profile and employer matching',
        confidence: 0.8,
      },
      {
        id: 'outreach-pipeline',
        name: 'Employer outreach CRM -> tracked applications',
        time: 'Daily follow-up cycle',
        distance: `Location filtered to ${location}`,
        income: 'Depends on employer replies',
        tradeoff: 'Works best with consented Skill Passport/resume and clear commute limits.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'Job outreach and follow-up workflow',
        confidence: 0.76,
      },
    ];
  }
  if (goalType === 'college_career' || goalType === 'college_internship_project') {
    if (dataScienceIntent) {
      return [
        {
          id: 'college-ds-gap-map',
          name: 'College Data Science gap map -> job readiness',
          time: '3-5 days',
          distance: 'Online portfolio/resume work',
          income: 'Improves internship, analyst, and fresher job shortlisting',
          tradeoff: 'Starts with the exact stack needed for Data Science: Python, SQL, statistics, projects, resume, and interview basics.',
          source_url: 'https://www.ncs.gov.in/',
          source_title: 'NCS youth employment and career services',
          confidence: 0.8,
        },
        {
          id: 'college-ds-project-proof',
          name: 'Data Science project proof sprint',
          time: '10-21 days',
          distance: 'Remote-first project work',
          income: 'Creates shareable proof for internship/job outreach',
          tradeoff: 'A project portfolio is stronger than only course completion for college fresher roles.',
          source_url: 'https://www.skillindiadigital.gov.in/',
          source_title: 'Skill India Digital learning and proof pathways',
          confidence: 0.77,
        },
        {
          id: 'college-ds-outreach',
          name: `${profile.relocation_preference || location} Data Science internship/job outreach`,
          time: '1-2 week outreach sprint',
          distance: profile.relocation_preference || `Current base: ${location}; remote and nearby leads separated`,
          income: 'Stipend or fresher job conversion',
          tradeoff: 'Needs personalized outreach and reply tracking instead of one-time job browsing.',
          source_url: 'https://www.ncs.gov.in/',
          source_title: 'NCS internships/jobs and outreach workflow',
          confidence: 0.74,
        },
      ];
    }
    return [
      {
        id: 'college-profile-gap-map',
        name: 'College profile gap map -> internship readiness',
        time: '3-5 days',
        distance: 'Online portfolio/resume work',
        income: 'Improves internship/project shortlisting',
        tradeoff: 'Best first step before sending applications because it clarifies skills, projects, and proof.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'NCS youth employment and career services',
        confidence: 0.78,
      },
      {
        id: 'college-local-internships',
        name: `${location} internship/project search`,
        time: '1-2 week outreach sprint',
        distance: `Campus/local/remote options around ${location}`,
        income: 'Stipend or project experience',
        tradeoff: 'Location and remote preference decide whether offline internships are realistic.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'NCS internships and jobs',
        confidence: 0.74,
      },
      {
        id: 'college-outreach-crm',
        name: 'Professor/startup outreach CRM',
        time: 'Daily follow-up cycle',
        distance: 'Remote-first unless local match is verified',
        income: 'Project/internship conversion',
        tradeoff: 'Requires personalized emails and reply tracking.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'Outreach workflow',
        confidence: 0.72,
      },
    ];
  }
  if (goalType === 'informal_skill_validation') {
    const skill = titleCase(firstAspiration || 'informal skill');
    return [
      {
        id: 'informal-proof-passport',
        name: `${skill} proof -> Skill Passport`,
        time: '3-7 days',
        distance: 'Phone-first proof capture',
        income: 'Unlocks trusted local matching',
        tradeoff: 'Validates skill before any employer or training center sees the learner details.',
        source_url: 'https://www.skillindiadigital.gov.in/',
        source_title: 'Skill India Digital proof and learning pathways',
        confidence: 0.82,
      },
      {
        id: 'rpl-or-short-course',
        name: `${location} RPL/short training search`,
        time: '1-4 weeks depending on local availability',
        distance: `Only centers around ${location} within commute limit`,
        income: 'Certificate or verified proof can improve wage',
        tradeoff: 'Useful when the learner has skill but no certificate.',
        source_url: 'https://www.pmkvyofficial.org/',
        source_title: 'PMKVY / recognition and short-term training references',
        confidence: 0.76,
      },
      {
        id: 'informal-local-work',
        name: `${location} local work/apprenticeship match`,
        time: 'After proof review',
        distance: `Within ${profile.commute_km || 20} km of ${location}`,
        income: 'Entry wage or piece-rate income',
        tradeoff: 'Needs safety and consent check before outreach.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'NCS local opportunities',
        confidence: 0.72,
      },
    ];
  }
  if (goalType === 'vocational_training') {
    const skill = titleCase(firstAspiration || 'skill');
    return [
      {
        id: 'local-training-center',
        name: `${location} ${skill} training center search`,
        time: '1-8 weeks depending on course',
        distance: `Only centers around ${location} within commute limit`,
        income: 'Training-first; income after proof/placement',
        tradeoff: 'Best when the learner wants structured training before work.',
        source_url: 'https://www.pmkvyofficial.org/',
        source_title: 'PMKVY / Skill India training references',
        confidence: 0.8,
      },
      {
        id: 'phone-foundation-practice',
        name: `${skill} phone-first foundation`,
        time: 'Daily 20-45 minute practice',
        distance: 'Can start from home',
        income: 'Builds proof while local center is verified',
        tradeoff: 'Prevents waiting time from becoming dropout time.',
        source_url: 'https://www.skillindiadigital.gov.in/',
        source_title: 'Skill India Digital learning options',
        confidence: 0.76,
      },
      {
        id: 'apprenticeship-after-basics',
        name: `${skill} apprenticeship after basics`,
        time: 'After first proof task',
        distance: `Local employers around ${location}`,
        income: 'Stipend or entry wage',
        tradeoff: 'Good bridge if formal course seats are limited.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'NCS apprenticeship/local roles',
        confidence: 0.72,
      },
    ];
  }
  if (/repair|mobile|technician/.test(aspirations)) {
    return [
      {
        id: 'mobile-repair',
        name: 'Mobile Repair Technician course -> Local service work',
        time: '6-10 weeks',
        distance: `Within ${profile.commute_km || 30} km of ${location}`,
        income: 'Rs. 8,000-18,000/month starting range',
        tradeoff: 'Fast practical pathway if the learner wants hands-on technical work.',
        source_url: 'https://www.pmkvyofficial.org/',
        source_title: 'PMKVY electronics and repair training',
        confidence: 0.84,
      },
      {
        id: 'apprenticeship',
        name: 'Repair-shop apprenticeship -> Earn while learning',
        time: '1-3 months',
        distance: 'Hyperlocal shops and MSMEs',
        income: 'Stipend or piece-rate income first',
        tradeoff: 'Best when formal course seats are not immediately available.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'National Career Service local vacancies',
        confidence: 0.78,
      },
      {
        id: 'digital-basics',
        name: 'Digital basics + customer handling -> Service counter role',
        time: '4 weeks',
        distance: 'Can be practiced on phone',
        income: 'Improves employability for repair counters',
        tradeoff: 'Adds communication and billing skills to repair interest.',
        source_url: 'https://www.skillindiadigital.gov.in/',
        source_title: 'Skill India Digital learning options',
        confidence: 0.74,
      },
    ];
  }
  if (/video|content|creator/.test(aspirations)) {
    return [
      {
        id: 'video-creator',
        name: 'Video creation basics -> Local digital work',
        time: '4-6 weeks',
        distance: 'Phone-first, can start from home',
        income: 'Freelance/project income potential',
        tradeoff: 'Good creative pathway, but income may take longer than service jobs.',
        source_url: 'https://www.skillindiadigital.gov.in/',
        source_title: 'Skill India Digital creative/digital skills',
        confidence: 0.8,
      },
      {
        id: 'local-business-content',
        name: 'Local business content assistant -> MSME outreach',
        time: '2-4 weeks portfolio',
        distance: `Within ${profile.commute_km || 30} km of ${location}`,
        income: 'Small business project income',
        tradeoff: 'Works best after building 3-5 sample videos.',
        source_url: 'https://udyamregistration.gov.in/',
        source_title: 'Udyam MSME local business base',
        confidence: 0.76,
      },
      {
        id: 'digital-marketing',
        name: 'Digital marketing bridge -> Customer service/content role',
        time: '6 weeks',
        distance: 'Online plus local placement',
        income: 'More stable than pure creator income',
        tradeoff: 'Adds employable business skill to video interest.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'NCS digital/customer roles',
        confidence: 0.73,
      },
    ];
  }
  if (/computer|digital|typing|data/.test(aspirations)) {
    return [
      {
        id: 'computer-basics',
        name: 'Computer basics + digital tools course -> Office assistant',
        time: '4-8 weeks',
        distance: `Within ${profile.commute_km || 30} km of ${location}`,
        income: 'Rs. 7,000-14,000/month starting range',
        tradeoff: 'Best first step for learners who want computer-based work but need a foundation.',
        source_url: 'https://www.skillindiadigital.gov.in/',
        source_title: 'Skill India Digital computer basics',
        confidence: 0.83,
      },
      {
        id: 'data-entry',
        name: 'Typing + spreadsheet practice -> Data entry role',
        time: '3-6 weeks practice',
        distance: 'Local shops, schools, cyber cafes and MSMEs',
        income: 'Entry office income or part-time project work',
        tradeoff: 'Requires regular practice but can convert quickly to local work.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'National Career Service office roles',
        confidence: 0.78,
      },
      {
        id: 'digital-service',
        name: 'Digital service assistant -> CSC/cyber cafe support',
        time: '4 weeks',
        distance: 'Hyperlocal service centers',
        income: 'Stable local work with public service demand',
        tradeoff: 'Good fit when the learner wants computer work near home.',
        source_url: 'https://www.skillindiadigital.gov.in/',
        source_title: 'Digital service skills',
        confidence: 0.75,
      },
    ];
  }
  if (/tailor|silai|stitch|sewing|garment/.test(aspirations)) {
    return [
      {
        id: 'tailoring-foundation',
        name: 'Tailoring foundation -> Stitching assistant',
        time: '6-8 weeks',
        distance: `Within ${profile.commute_km || 30} km of ${location}`,
        income: 'Rs. 6,000-12,000/month or piece-rate income',
        tradeoff: 'Strong local pathway when the learner can build a small sample portfolio.',
        source_url: 'https://www.skillindiadigital.gov.in/',
        source_title: 'Skill India Digital apparel and local service learning',
        confidence: 0.8,
      },
      {
        id: 'alteration-apprentice',
        name: 'Alteration apprentice -> Earn with nearby tailor',
        time: '3-5 weeks practice',
        distance: 'Hyperlocal tailor shops and garment units',
        income: 'Piece-rate or assistant stipend first',
        tradeoff: 'Best if family prefers nearby work and gradual earning.',
        source_url: 'https://udyamregistration.gov.in/',
        source_title: 'Udyam local MSME base',
        confidence: 0.76,
      },
      {
        id: 'tailoring-digital-portfolio',
        name: 'WhatsApp catalogue -> Home-order tailoring',
        time: '2-4 weeks',
        distance: 'Can start from home',
        income: 'Small local orders after proof samples',
        tradeoff: 'Slower income, but safer for learners with commute limits.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'NCS and local livelihood references',
        confidence: 0.71,
      },
    ];
  }
  if (/cook|hotel|chef|hospitality|kitchen/.test(aspirations)) {
    return [
      {
        id: 'kitchen-helper',
        name: 'Kitchen hygiene + prep -> Hotel cooking assistant',
        time: '4-6 weeks',
        distance: `Within ${profile.commute_km || 30} km of ${location}`,
        income: 'Rs. 7,000-13,000/month starting range',
        tradeoff: 'Fast employment route if shift timing and commute are safe.',
        source_url: 'https://www.skillindiadigital.gov.in/',
        source_title: 'Skill India hospitality learning',
        confidence: 0.8,
      },
      {
        id: 'catering-apprentice',
        name: 'Catering apprentice -> Event-season income',
        time: '3-6 weeks',
        distance: 'Nearby caterers and food MSMEs',
        income: 'Daily/event income first',
        tradeoff: 'Good for quick earning but needs worker review for late shifts.',
        source_url: 'https://udyamregistration.gov.in/',
        source_title: 'Udyam food-service MSMEs',
        confidence: 0.74,
      },
      {
        id: 'food-safety-bridge',
        name: 'Food safety basics -> Better hotel screening',
        time: '2 weeks',
        distance: 'Phone-first lessons plus local practice',
        income: 'Improves trust for first role',
        tradeoff: 'Small upfront learning effort before outreach.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'NCS hospitality roles',
        confidence: 0.7,
      },
    ];
  }
  if (/agriculture|farming|kheti|drone|farm/.test(aspirations)) {
    return [
      {
        id: 'agri-service-assistant',
        name: 'Agri service assistant -> Local farm support',
        time: '4-8 weeks',
        distance: `Within ${profile.commute_km || 30} km of ${location}`,
        income: 'Seasonal/local service income',
        tradeoff: 'Good fit for learners near farming households or FPO networks.',
        source_url: 'https://www.skillindiadigital.gov.in/',
        source_title: 'Skill India agriculture and digital learning',
        confidence: 0.78,
      },
      {
        id: 'drone-ops-bridge',
        name: 'Drone awareness + field data -> Agri-tech trainee',
        time: '6-10 weeks',
        distance: 'Requires local center or employer partner',
        income: 'Higher upside after supervised practice',
        tradeoff: 'More aspirational; worker should verify local partner availability.',
        source_url: 'https://www.ncs.gov.in/',
        source_title: 'NCS agri-tech opportunities',
        confidence: 0.72,
      },
      {
        id: 'farm-record-digital',
        name: 'Farm records + digital forms -> Service center role',
        time: '3-5 weeks',
        distance: 'Phone-first plus local practice',
        income: 'Stable adjacent income near home',
        tradeoff: 'Less technical than drone work, but easier to start.',
        source_url: 'https://www.skillindiadigital.gov.in/',
        source_title: 'Digital service learning options',
        confidence: 0.7,
      },
    ];
  }
  return [
    {
      id: 'skill-course',
      name: `${titleCase(firstAspiration)} skill course -> entry role`,
      time: '4-12 weeks',
      distance: `Within ${profile.commute_km || 30} km of ${location}`,
      income: 'Entry income depends on local demand',
      tradeoff: `Best first step if the learner wants a structured route into ${firstAspiration}.`,
      source_url: 'https://www.pmkvyofficial.org/',
      source_title: 'PMKVY / Skill India course catalogue',
      confidence: 0.72,
    },
    {
      id: 'apprenticeship',
      name: `${titleCase(firstAspiration)} apprenticeship -> learn with local employer`,
      time: '1-3 months',
      distance: 'Local MSMEs and service shops',
      income: 'May start with stipend or project income',
      tradeoff: 'Good when nearby course seats are limited or the learner wants practical work quickly.',
      source_url: 'https://www.ncs.gov.in/',
      source_title: 'National Career Service local opportunities',
      confidence: 0.7,
    },
    {
      id: 'digital-bridge',
      name: `Digital basics + ${titleCase(firstAspiration)} portfolio -> better match`,
      time: '3-6 weeks',
      distance: 'Can start from phone',
      income: 'Improves matching and employer trust',
      tradeoff: 'Adds proof of work before employer outreach.',
      source_url: 'https://www.skillindiadigital.gov.in/',
      source_title: 'Skill India Digital learning options',
      confidence: 0.68,
    },
  ];
}

function isAcademicPrepProfile(profile = {}) {
  if (profile.academic_goal?.type === 'entrance_exam_prep') return false;
  const text = `${(profile.aspirations || []).join(' ')} ${profile.education_status || ''} ${profile.class_level || ''}`.toLowerCase();
  return profile.academic_goal?.type === 'class_12_exam_prep' || /class 12.*(exam|preparation|marks|score)|board exam|exam preparation/.test(text);
}

function isEntranceExamPrepProfile(profile = {}) {
  const text = `${(profile.aspirations || []).join(' ')} ${profile.education_status || ''} ${profile.class_level || ''}`.toLowerCase();
  return profile.academic_goal?.type === 'entrance_exam_prep' || /\bjee\b|\biit\b|\bneet\b|\bcuet\b|\bgate\b|\bcat\b|\bclat\b|\bnda\b|\bupsc\b|\bssc\b|railway|bank exam|entrance exam|competitive exam/.test(text);
}

function isSchoolStudyProfile(profile = {}) {
  if (profile.academic_goal?.type === 'entrance_exam_prep') return false;
  const text = `${(profile.aspirations || []).join(' ')} ${profile.education_status || ''} ${profile.class_level || ''}`.toLowerCase();
  return profile.academic_goal?.type === 'school_study_support' || /study support|school study|class \d+.*study/.test(text);
}

export function buildPassport(profile = DEMO_PROFILE, consent = {}) {
  const aspirations = profile.aspirations?.length ? profile.aspirations : ['career skill'];
  const primary = primarySkill(aspirations);
  return {
    learner_id: profile.learner_id || stableId('learner'),
    name: profile.name || 'Learner',
    class_level: profile.class_level || 'Class pending',
    location: profile.location || 'Location pending',
    certs: [{ name: `${primary} pathway`, status: 'planned', verified_at: 'VidyaSetu plan' }],
    informal: [
      {
        name: primary,
        verification_method: 'self-reported + counselor assessed',
        score: 82,
      },
    ],
    assessment_scores: { customer_service: 78, digital_basics: 64 },
    ncrf_credits: 12,
    consent: {
      share_certs: consent.share_certs ?? true,
      share_informal: consent.share_informal ?? true,
      share_scores: consent.share_scores ?? false,
    },
    qr_token: stableId('qr'),
  };
}

function primarySkill(aspirations = []) {
  const text = aspirations.join(' ').toLowerCase();
  if (/\bjee\b|\biit\b|\bneet\b|\bcuet\b|\bgate\b|\bcat\b|\bclat\b|\bnda\b|\bupsc\b|\bssc\b|railway|bank exam|entrance exam|competitive exam/.test(text)) return 'entrance exam preparation';
  if (/study support|school study|class \d+.*study/.test(text)) return 'school study support';
  if (/class 12|board exam|exam preparation|marks|score/.test(text)) return 'class 12 exam preparation';
  if (/data science|machine learning|data analyst|analytics|python|sql|\bai\b|artificial intelligence/.test(text)) return 'data science';
  if (/mechanic|bike|motorcycle|two wheeler|2 wheeler/.test(text)) return 'mechanic repair';
  if (/repair|mobile|technician/.test(text)) return 'mobile repair';
  if (/video|content|creator/.test(text)) return 'video creation';
  if (/computer|digital|typing|data/.test(text)) return 'computer basics';
  if (/beauty|mehandi|wellness/.test(text)) return 'beauty and wellness';
  if (/customer/.test(text)) return 'customer service';
  if (/tailor|silai|सिलाई/.test(text)) return 'tailoring';
  if (/cook|hotel|chef|hospitality/.test(text)) return 'hospitality cooking';
  if (/agriculture|farming|खेती/.test(text)) return 'agriculture skills';
  if (/drone/.test(text)) return 'drone operations';
  if (/computer|digital/.test(text)) return 'digital basics';
  return aspirations[0] || 'career skill';
}

function titleCase(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function buildLearningJourney(profile = DEMO_PROFILE, route = {}) {
  const skill = journeyPrimarySkill(profile);
  const template = JOURNEY_TEMPLATES[skill] || JOURNEY_TEMPLATES.generic;
  const language = profile.preferred_language || profile.language || 'Hindi + local language';
  const device = profile.device || profile.phone_access || 'shared mobile phone';
  const urgency = profile.earning_urgency || (profile.income_pressure ? 'high' : 'medium');
  const learnerName = profile.name || 'Learner';
  const routeName = route.name || `${titleCase(skill)} pathway`;
  const journeyModules = expandToFourWeekMvp(template.modules, skill);

  const modules = journeyModules.map((module, index) => {
    const dailyMicroTasks = module.daily_micro_tasks || defaultDailyMicroTasks(module, index, skill);
    const proofTasks = module.proof_tasks || [module.proof || `Week ${index + 1} proof note`];
    const completionCriteria = module.completion_criteria || completionCriteriaFor(module, skill);
    return {
      id: `${template.id}-${index + 1}`,
      week: index + 1,
      title: module.title,
      goal: module.goal,
      delivery: module.delivery || deliveryMode(device),
      lessons: module.lessons,
      daily_micro_tasks: dailyMicroTasks,
      practice_tasks: module.practice_tasks,
      proof: module.proof,
      proof_tasks: proofTasks,
      completion_criteria: completionCriteria,
      unlock: module.unlock,
      unlock_after_completion: module.unlock_after_completion || module.unlock,
      low_data_alternative: module.low_data_alternative || lowDataAlternativeFor(skill, device),
      voice_whatsapp_version: module.voice_whatsapp_version || voiceWhatsappVersionFor(skill, language),
      family_support_note: module.family_support_note || familySupportNoteFor(profile, skill),
      safety_commute_note: module.safety_commute_note || safetyCommuteNoteFor(profile, skill),
      dropout_prevention_trigger: module.dropout_prevention_trigger || dropoutPreventionFor(skill),
      progress_metrics: module.progress_metrics || progressMetricsFor(skill, module),
      counselor_response_after_completion:
        module.counselor_response_after_completion || counselorCompletionResponseFor(skill, module),
      worker_check:
        index === 0
          ? 'Confirm family support, safe commute, device access, and preferred call time.'
          : module.worker_check || 'Review proof and keep the learner on the next safe step.',
    };
  });

  const totalTasks = modules.reduce((sum, module) => sum + module.practice_tasks.length + module.lessons.length, 0);
  const readinessScore = Math.min(
    92,
    44 +
      (profile.profile_complete ? 14 : 0) +
      (route.confidence ? Math.round(route.confidence * 14) : 8) +
      (profile.commute_km ? 8 : 0) +
      (profile.aspirations?.length ? 8 : 0) +
      (urgency === 'high' ? 4 : 6),
  );

  return {
    id: stableId('journey'),
    learner_id: profile.learner_id || null,
    route_id: route.id || null,
    route_name: routeName,
    title: `${titleCase(skill)} bridge plan for ${learnerName}`,
    specification_source: 'VidyaSetu Complete Documentation v1.0 - Learning Journey Framework',
    mode:
      skill === 'entrance exam preparation'
        ? 'entrance_exam_prep'
        : skill === 'class 12 exam preparation'
          ? 'academic_exam_prep'
          : skill === 'school study support'
            ? 'school_study_support'
            : skill === 'data science'
              ? 'data_science_pathway'
          : ['job search', 'college pathway', 'informal skill validation', 'vocational training'].includes(skill)
            ? skill.replace(/\s+/g, '_')
          : 'career_pathway',
    language,
    duration: {
      mvp: `${modules.length}-week MVP journey`,
      full: '12-week extended journey after the MVP adds depth, revision, stronger proof, and safer opportunity discovery.',
    },
    learning_contract: {
      week_shape: 'Each week has one goal, 3-5 lessons, daily micro-tasks, practice, proof, and an unlock rule.',
      resource_policy: 'Learning resources are recommended as official/source categories; concrete live links are verified at runtime before showing.',
      proof_gate: proofGateFor(skill),
      opportunity_unlock: opportunityUnlockFor(skill, profile),
    },
    delivery: {
      primary_channel: /shared|low-end|feature/i.test(device)
        ? 'WhatsApp voice notes + SMS fallback'
        : 'WhatsApp micro-lessons + voice bot',
      lesson_length: urgency === 'high' ? '5-7 minutes/day' : '8-12 minutes/day',
      content_style: profile.content_preferences || ['voice explanation', 'picture checklist', 'small practice task'],
      accessibility: 'No laptop required for the first four weeks',
      low_data_alternative: lowDataAlternativeFor(skill, device),
      voice_whatsapp_version: voiceWhatsappVersionFor(skill, language),
    },
    learner_constraints: {
      commute_km: profile.commute_km || 30,
      commute_constraint: profile.commute_constraint || 'safe commute preferred',
      time_available: profile.time_available || '45 minutes/day',
      earning_urgency: urgency,
    },
    modules,
    weekly_plan: [
      skill === 'entrance exam preparation'
        ? `Week 1: map ${profile.academic_goal?.exam || 'entrance exam'} syllabus and diagnose weak topics in ${profile.academic_goal?.subjects?.join(', ') || 'selected subjects'}.`
        : skill === 'class 12 exam preparation'
          ? `Week 1: diagnose weak chapters in ${profile.academic_goal?.subjects?.join(', ') || 'selected subjects'} and start NCERT revision.`
          : skill === 'school study support'
            ? `Week 1: find weak chapters in ${profile.academic_goal?.subjects?.join(', ') || 'selected subjects'} and start NCERT basics.`
          : `Week 1: start in ${language}; build confidence and one visible proof artifact.`,
      skill === 'entrance exam preparation'
        ? `Week 2: repair concepts and solve daily problem sets for ${routeName}.`
        : skill === 'class 12 exam preparation'
          ? `Week 2: complete NCERT examples and back exercises for the chosen ${routeName}.`
          : skill === 'school study support'
            ? `Week 2: practice examples, homework-style questions, and one short quiz for ${routeName}.`
          : `Week 2: practice the core task for ${routeName}.`,
      skill === 'entrance exam preparation'
        ? 'Week 3: take timed section tests and convert every wrong question into an error-log revision task.'
        : skill === 'class 12 exam preparation'
          ? 'Week 3: solve CBSE sample-paper sections with marking-scheme review.'
          : skill === 'school study support'
            ? 'Week 3: solve a chapter test and review every mistake.'
          : 'Week 3: create proof that can be shown to a trainer or employer.',
      skill === 'entrance exam preparation'
        ? 'Week 4: run full/half mocks, review accuracy and speed, and rebuild the next-month revision cycle.'
        : skill === 'class 12 exam preparation'
          ? 'Week 4: run timed mocks, revise mistakes, and build the final exam-week routine.'
          : skill === 'school study support'
            ? 'Week 4: revise weak questions, retest, and set the next subject plan.'
          : 'Week 4: run mock screening, update Skill Passport, and unlock placement outreach.',
    ],
    progress: {
      current_module_id: modules[0]?.id || null,
      completed_tasks: 0,
      total_tasks: totalTasks,
      proof_required: modules.filter((module) => Boolean(module.proof)).length,
      journey_contract_fields: [
        'weekly_goals',
        'lessons',
        'daily_micro_tasks',
        'practice_tasks',
        'proof_tasks',
        'completion_criteria',
        'low_data_alternative',
        'voice_whatsapp_version',
        'unlock_after_completion',
      ],
      unlock_label: skill === 'entrance exam preparation' || skill === 'class 12 exam preparation' || skill === 'school study support' ? 'Study unlock rule' : 'Placement unlock rule',
      placement_unlock_rule:
        skill === 'entrance exam preparation'
          ? 'Unlock the next mock level after syllabus map, two concept blocks, one timed practice set, and error-log review are complete.'
          : skill === 'class 12 exam preparation'
            ? 'Unlock next subject/mock level after each week has at least two completed lessons and one checked practice task.'
            : skill === 'school study support'
              ? 'Unlock the next chapter after two lesson checks, one practice set, and one mistake-log review are complete.'
            : 'Unlock employer outreach after two proof tasks and worker safety review.',
    },
    support_plan: [
      skill === 'entrance exam preparation'
        ? 'AI study counselor checks syllabus progress, doubts, and error log every 3 days in the learner language.'
        : skill === 'class 12 exam preparation'
          ? 'AI study counselor checks weak chapters every 3 days in the learner language.'
          : skill === 'school study support'
            ? 'AI study counselor checks chapter progress every 3 days in the learner language.'
          : 'AI counselor checks in every 3 days in the learner language.',
      skill === 'entrance exam preparation'
        ? 'If two mock/practice check-ins are missed, ADEWS suggests a mentor/parent nudge before the learner silently drops off.'
        : skill === 'class 12 exam preparation'
          ? 'If two study check-ins are missed, ADEWS suggests a mentor/parent nudge.'
          : skill === 'school study support'
            ? 'If two study check-ins are missed, ADEWS suggests a guardian or mentor nudge.'
          : 'If two check-ins are missed, ADEWS asks the community worker to call.',
      skill === 'entrance exam preparation'
        ? 'The plan keeps syllabus coverage, problem accuracy, mock score, and error-log proof before moving to the next level.'
        : skill === 'class 12 exam preparation'
          ? 'The plan keeps NCERT, sample paper, and mistake-log proof before moving to the next level.'
          : skill === 'school study support'
            ? 'The plan tracks NCERT/DIKSHA lessons, practice sets, and mistake-log proof before the next chapter.'
          : 'Parent/guardian explanation message is generated before any commute-heavy opportunity.',
    ],
    readiness_score: readinessScore,
  };
}

function journeyPrimarySkill(profile = {}) {
  const aspirations = Array.isArray(profile) ? profile : profile.aspirations || [];
  const text = aspirations.join(' ').toLowerCase();
  const goalType = Array.isArray(profile) ? '' : profile.learner_goal?.type || '';
  if (profile.academic_goal?.type === 'entrance_exam_prep' || goalType === 'entrance_exam_prep' || /\bjee\b|\biit\b|\bneet\b|\bcuet\b|\bgate\b|\bcat\b|\bclat\b|\bnda\b|\bupsc\b|\bssc\b|railway|bank exam|entrance exam|competitive exam/.test(text)) {
    return 'entrance exam preparation';
  }
  if (profile.academic_goal?.type === 'school_study_support' || /study support|school study|class \d+.*study/.test(text)) {
    return 'school study support';
  }
  if (profile.academic_goal?.type === 'class_12_exam_prep' || /class 12|board exam|exam preparation|marks|score/.test(text)) {
    return 'class 12 exam preparation';
  }
  if (goalType === 'informal_skill_validation') return 'informal skill validation';
  if (/data science|machine learning|data analyst|analytics|python|sql|\bai\b|artificial intelligence/.test(text)) return 'data science';
  if (/mechanic|bike|motorcycle|two wheeler|2 wheeler/.test(text)) return 'mechanic repair';
  if (['job_search_only', 'formal_skill_job_search', 'college_job_search'].includes(goalType)) return 'job search';
  if (['college_career', 'college_internship_project'].includes(goalType)) return 'college pathway';
  if (goalType === 'vocational_training') return 'vocational training';
  if (/repair|mobile|technician/.test(text)) return 'mobile repair';
  if (/video|content|creator/.test(text)) return 'video creation';
  if (/computer|digital|typing|data/.test(text)) return 'computer basics';
  if (/tailor|silai|stitch|sewing|garment/.test(text)) return 'tailoring';
  if (/cook|hotel|chef|hospitality|kitchen/.test(text)) return 'hospitality cooking';
  if (/drone/.test(text)) return 'drone operations';
  if (/agriculture|farming|kheti|farm/.test(text)) return 'agriculture skills';
  if (/beauty|mehandi|wellness/.test(text)) return 'beauty and wellness';
  if (/customer/.test(text)) return 'customer service';
  return aspirations[0] || 'career skill';
}

function deliveryMode(device = '') {
  if (/shared|low|feature/i.test(device)) return 'voice note, SMS recap, and one image checklist';
  return 'short video, voice note, and WhatsApp checklist';
}

function expandToFourWeekMvp(modules = [], skill = 'career skill') {
  const expanded = [...modules];
  while (expanded.length < 4) {
    expanded.push(finalMvpModuleFor(skill, expanded.length + 1));
  }
  return expanded;
}

function finalMvpModuleFor(skill = 'career skill', week = 4) {
  if (/data science|web|college|job search|resume/i.test(skill)) {
    return {
      title: 'Interview and outreach readiness',
      goal: 'Learner turns proof into a safe, consent-controlled outreach or interview plan.',
      lessons: ['60-second self introduction', 'What proof will be shared', 'Consent before any external contact'],
      practice_tasks: ['Record one mock answer', 'Approve the shareable profile summary'],
      proof: 'Mock interview or outreach-readiness note',
      unlock: 'Consent-gated opportunity or outreach engine',
      completion_criteria: 'Resume/proof summary is ready, one mock answer is recorded, and consent choices are explicit.',
    };
  }
  if (/informal|tailor|beauty|cooking|hospitality|customer|mobile|repair|vocational|mechanic|electrician|drone|agriculture/i.test(skill)) {
    return {
      title: 'Readiness and branch decision',
      goal: 'Learner chooses the next safe branch: local work, apprenticeship, more training, or enterprise.',
      lessons: ['Compare next-step branches', 'Review proof confidence', 'Consent and safety before sharing details'],
      practice_tasks: ['Choose one branch with reason', 'Practice one enquiry or screening script'],
      proof: 'Branch decision + enquiry script',
      unlock: 'Location-aware opportunity engine',
      completion_criteria: 'At least one proof item exists, the branch is chosen, and location/commute/consent gates are clear.',
    };
  }
  return {
    title: 'Review and next-step unlock',
    goal: 'Learner reviews progress, saves proof, and chooses the next route without losing context.',
    lessons: ['Review what improved', 'Save the strongest proof', 'Choose the next four-week loop'],
    practice_tasks: ['Write one progress note', 'Choose the next learning or opportunity step'],
    proof: 'Progress review + next-step decision',
    unlock: 'Next pathway loop',
    completion_criteria: 'Progress note and next-step decision are saved.',
  };
}

function defaultDailyMicroTasks(module = {}, index = 0, skill = '') {
  const lessons = Array.isArray(module.lessons) ? module.lessons : [];
  const tasks = Array.isArray(module.practice_tasks) ? module.practice_tasks : [];
  const academic = /exam|study|class|school/i.test(skill);
  return [
    `Day 1: ${lessons[0] || (academic ? 'Read one short concept explanation' : 'Listen to one short skill explanation')}.`,
    `Day 2: ${lessons[1] || 'Repeat the key steps in your own words or voice note'}.`,
    `Day 3: ${tasks[0] || 'Complete one small practice task'}.`,
    `Day 4: ${tasks[1] || 'Review mistakes or improve the sample'}.`,
    `Day 5: Save proof for Week ${index + 1} and ask Meera what unlocks next.`,
  ];
}

function completionCriteriaFor(module = {}, skill = '') {
  const proof = module.proof || 'proof note';
  if (/entrance exam/i.test(skill)) {
    return `${proof} saved, timed practice attempted, and error-log next actions written.`;
  }
  if (/class 12|school study/i.test(skill)) {
    return `${proof} saved with score/mistake notes, and the next weak chapter is identified.`;
  }
  if (/data science|web/i.test(skill)) {
    return `${proof} is shareable as a link, screenshot, or project summary and is not copied blindly.`;
  }
  if (/informal|tailor|beauty|cooking|hospitality/i.test(skill)) {
    return `${proof} is clear enough for worker review, with voice/photo context if writing is difficult.`;
  }
  if (/enterprise|poultry|mushroom|goat|food processing/i.test(skill)) {
    return `${proof} includes training-to-verify, cost/buyer risk notes, and no income guarantee.`;
  }
  return `All listed lessons/tasks are checked and ${proof} is saved for review.`;
}

function lowDataAlternativeFor(skill = '', device = '') {
  if (/feature|shared|low/i.test(device)) {
    return 'Use one WhatsApp audio note, one SMS recap, and one compressed photo/checklist; no streaming required.';
  }
  if (/exam|study|class|school/i.test(skill)) {
    return 'Use NCERT/official text, downloaded once if possible, plus audio recap and a typed or photo mistake log.';
  }
  if (/data science|web|accounting/i.test(skill)) {
    return 'Use text steps, screenshots, small files, and compressed project proof; avoid long video unless on Wi-Fi.';
  }
  return 'Use text/audio lessons, one image checklist, and low-res photo/video proof instead of heavy video classes.';
}

function voiceWhatsappVersionFor(skill = '', language = 'learner language') {
  if (/informal|tailor|beauty|cooking|hospitality|rpl/i.test(skill)) {
    return `Voice-first in ${language}: learner can explain skill by voice note and submit photo/video proof with counselor summary.`;
  }
  if (/exam|study|class|school/i.test(skill)) {
    return `Meera sends short ${language} voice recaps, asks one question at a time, and accepts notebook photos or spoken answers.`;
  }
  if (/job|data science|college|resume/i.test(skill)) {
    return `Bilingual ${language} coaching with voice mock answers; final resume/outreach can be produced in simple English if needed.`;
  }
  return `Short ${language} voice lessons, WhatsApp reminders, and proof submission by voice/photo.`;
}

function familySupportNoteFor(profile = {}, skill = '') {
  const firstGen = profile.first_generation || /shared|family/i.test(`${profile.phone_access || ''} ${profile.device || ''}`);
  const school = /study|exam|class|school/i.test(skill) || Number(profile.age || 0) < 18;
  if (school) {
    return 'Family/guardian note: give the learner a fixed quiet time, do not replace school, and support proof photos or notebook checks.';
  }
  if (firstGen) {
    return 'Family/support note: a shared phone and encouragement are enough to start; proof can be voice/photo if writing is hard.';
  }
  return 'Support note: ask one trusted person to review the proof before any external sharing.';
}

function safetyCommuteNoteFor(profile = {}, skill = '') {
  const commute = profile.commute_km ? `${profile.commute_km} km` : 'not set';
  if (/study|exam|class|school|data science|web/i.test(skill)) {
    return 'Safety note: this journey can start online/from phone; offline movement is not needed for the first proof loop.';
  }
  return `Safety/commute note: offline training, employer visits, or scheme offices stay locked until location, safe commute (${commute}), timing, and consent are confirmed.`;
}

function dropoutPreventionFor(skill = '') {
  if (/exam|study|class|school/i.test(skill)) {
    return 'If two check-ins are missed, reduce to one 10-minute task and alert guardian/mentor support before the learner goes silent.';
  }
  if (/informal|tailor|beauty|rpl/i.test(skill)) {
    return 'If confidence drops, switch to one-photo proof and remind the learner that existing skill has value even without a certificate.';
  }
  if (/data science|web|accounting/i.test(skill)) {
    return 'If stuck for two days, give one worked example and a smaller proof target instead of pushing more theory.';
  }
  return 'If three days are missed, restart with one visible win and a worker/mentor nudge.';
}

function progressMetricsFor(skill = '', module = {}) {
  if (/exam|study|class|school/i.test(skill)) return ['lesson completion', 'practice score', 'mistake log', 'next weak topic'];
  if (/data science|web/i.test(skill)) return ['project proof', 'resume readiness', 'mock answer quality', 'outreach consent'];
  if (/informal|tailor|beauty|rpl/i.test(skill)) return ['evidence items', 'portfolio clarity', 'proof confidence', 'branch chosen'];
  if (/enterprise|poultry|mushroom|goat|food processing/i.test(skill)) return ['suitability', 'cost heads', 'buyer/supplier plan', '30/90-day plan'];
  return ['items completed', 'proof saved', 'worker review', module.unlock || 'next unlock'];
}

function counselorCompletionResponseFor(skill = '', module = {}) {
  if (/exam|study|class|school/i.test(skill)) {
    return `Good. ${module.proof || 'Your proof'} is saved; now Meera will open the next study block based on your mistakes.`;
  }
  if (/informal|tailor|beauty|rpl/i.test(skill)) {
    return 'Your skill is now visible as proof. Certificate na hone se koi sharm ki baat nahi; proof se next step khulega.';
  }
  if (/job|data science|college|resume/i.test(skill)) {
    return 'Your proof is stronger now. Outreach remains consent-gated and will only use the fields you approve.';
  }
  return 'Progress saved. The next step opens only after proof and safety gates are clear.';
}

function proofGateFor(skill = '') {
  if (/exam|study|class|school/i.test(skill)) return 'Mock/practice proof gates the next study level; no job outreach is unlocked.';
  if (/data science|web|resume|college|job search/i.test(skill)) return 'Professional outreach requires resume plus at least one verifiable project/proof and consent.';
  if (/informal|tailor|beauty|rpl/i.test(skill)) return 'Skill Passport/local work unlock only after enough photo/video/voice proof or RPL-grade evidence.';
  if (/enterprise|poultry|mushroom|goat|food processing/i.test(skill)) return 'Scheme/loan support unlocks only after written 30/90-day plan plus training-to-verify status.';
  return 'Opportunity unlock requires proof, location if offline, and consent.';
}

function opportunityUnlockFor(skill = '', profile = {}) {
  if (/exam|study|class|school/i.test(skill)) return 'Next topic, mock level, or mentor support only.';
  if (/enterprise|poultry|mushroom|goat|food processing/i.test(skill)) return 'Enterprise setup, buyer/supplier verification, and scheme/loan candidates after plan proof.';
  if (/data science|web|resume|college|job search/i.test(skill)) return 'Professional outreach after resume, proof confidence, and consent.';
  if (/informal|tailor|beauty|rpl/i.test(skill)) return 'RPL/Skill Passport first, then local work, clients, or enterprise by branch.';
  if (profile.location || profile.relocation_preference) return 'Location-aware training, apprenticeship, or local employment after proof.';
  return 'Online learning can start now; offline/local opportunity remains blocked until location is shared.';
}

const JOURNEY_TEMPLATES = {
  'data science': {
    id: 'data-science',
    modules: [
      {
        title: 'Skill gap diagnosis',
        goal: 'Learner knows exactly where they stand for Data Science fresher, analyst, or internship roles.',
        lessons: ['Python basics check', 'SQL and spreadsheet check', 'Statistics and ML vocabulary check'],
        practice_tasks: ['Solve one small Python/data-cleaning task', 'Write a target role statement with location or relocation preference'],
        proof: 'Data Science readiness summary',
        unlock: 'Portfolio sprint',
        worker_check: 'Confirm current city, relocation preference, daily hours, and whether the learner has laptop/internet access.',
      },
      {
        title: 'Portfolio project sprint',
        goal: 'Learner creates proof that can be shown to hirers instead of only saying they are interested.',
        lessons: ['Pick one public dataset', 'Clean and analyze data', 'Explain insight in simple language'],
        practice_tasks: ['Build one notebook/dashboard', 'Write a 6-line project summary for resume and outreach'],
        proof: 'Project link, screenshot, or notebook summary',
        unlock: 'Resume and Skill Passport',
        worker_check: 'Review whether the project is understandable and not copied blindly.',
      },
      {
        title: 'Resume and hirer outreach',
        goal: 'Learner starts a tracked India-wide or location-filtered application pipeline.',
        lessons: ['Resume bullets for projects', 'How to shortlist fresher/internship leads', 'Follow-up and interview answers'],
        practice_tasks: ['Shortlist five leads', 'Generate one personalized outreach draft'],
        proof: 'Outreach CRM record',
        unlock: 'Screening/interview preparation',
        worker_check: 'Confirm consent before sharing resume, project link, phone number, or location.',
      },
    ],
  },
  'entrance exam preparation': {
    id: 'entrance-exam',
    modules: [
      {
        title: 'Syllabus and baseline diagnosis',
        goal: 'Learner knows the exam syllabus, current weak topics, and first realistic score target.',
        lessons: ['Confirm target exam and attempt timeline', 'Break syllabus into red/yellow/green topics', 'Set daily study blocks by subject'],
        practice_tasks: ['Solve one baseline mini-test per subject', 'Create the first error-log page'],
        proof: 'Syllabus tracker and baseline score note',
        unlock: 'Concept repair block',
        worker_check: 'Confirm exam, subjects, daily hours, device access, and whether the learner needs parent/mentor support.',
      },
      {
        title: 'Concept repair and problem practice',
        goal: 'Learner repairs weak concepts and solves questions instead of only watching explanations.',
        lessons: ['Revise one weak concept from official/standard material', 'Study two solved examples', 'Learn how to tag mistakes'],
        practice_tasks: ['Solve 20 topic questions', 'Retry every wrong question after reviewing the concept'],
        proof: 'Solved problem set and updated mistake log',
        unlock: 'Timed section practice',
        worker_check: 'Check that practice is written and time-bound, not only video watching.',
      },
      {
        title: 'Timed section tests and error log',
        goal: 'Learner improves speed, accuracy, and exam temperament through timed practice.',
        lessons: ['How to attempt easy/medium/hard questions', 'How to mark guess vs concept error', 'How to review a timed section'],
        practice_tasks: ['Take one timed section test', 'Convert top 10 mistakes into revision tasks'],
        proof: 'Timed test score and error categories',
        unlock: 'Full/half mock routine',
        worker_check: 'Review whether mistakes are conceptual, speed-based, or careless.',
      },
      {
        title: 'Mock test and revision cycle',
        goal: 'Learner builds a repeatable mock-analysis-revision loop for the next month.',
        lessons: ['Mock test strategy', 'Post-mock analysis routine', 'Next-week revision calendar'],
        practice_tasks: ['Complete one half/full mock', 'Revise the top error-log topics next morning'],
        proof: 'Mock score, accuracy trend, and next revision plan',
        unlock: 'Next mock level or mentor escalation',
        worker_check: 'Escalate to a mentor if scores do not improve after two mock cycles or anxiety is high.',
      },
    ],
  },
  'school study support': {
    id: 'school-study',
    modules: [
      {
        title: 'Chapter diagnosis',
        goal: 'Learner identifies weak topics and chooses one subject focus for the week.',
        lessons: ['Pick subject and chapter', 'Rate topics red/yellow/green', 'Set a small weekly target'],
        practice_tasks: ['Solve 8 baseline questions', 'Make a weak-topic list'],
        proof: 'Chapter tracker or notebook photo',
        unlock: 'NCERT/DIKSHA lesson block',
        worker_check: 'Confirm class, subject, language, and daily study time.',
      },
      {
        title: 'Concept lesson block',
        goal: 'Learner studies the chapter concept and examples before test practice.',
        lessons: ['Read NCERT explanation', 'Watch one DIKSHA/video explanation if needed', 'Redo solved examples'],
        practice_tasks: ['Write a one-page summary', 'Solve five example questions without seeing answers'],
        proof: 'Summary page and solved examples',
        unlock: 'Practice set',
        worker_check: 'Check that the learner is solving questions, not only watching content.',
      },
      {
        title: 'Practice and mistake log',
        goal: 'Learner builds accuracy through short practice and mistake review.',
        lessons: ['How to check answers', 'How to write a mistake reason', 'How to retry wrong questions'],
        practice_tasks: ['Complete one 20-minute practice set', 'Rewrite every wrong answer correctly'],
        proof: 'Practice score and mistake log',
        unlock: 'Weekly retest',
        worker_check: 'Review repeated mistakes and adjust difficulty.',
      },
      {
        title: 'Weekly retest and next chapter',
        goal: 'Learner proves improvement and chooses the next study target.',
        lessons: ['Take a short retest', 'Compare baseline and retest score', 'Plan the next chapter'],
        practice_tasks: ['Complete one retest', 'Record what improved and what is still weak'],
        proof: 'Retest score and next-chapter plan',
        unlock: 'Next subject/chapter plan',
        worker_check: 'Escalate to a teacher/mentor if scores do not improve after two loops.',
      },
    ],
  },
  'class 12 exam preparation': {
    id: 'class12-exam',
    modules: [
      {
        title: 'Weak chapter diagnosis',
        goal: 'Learner identifies the exact subjects and chapters blocking better Class 12 marks.',
        lessons: ['Choose board and subjects', 'Rate each chapter as red/yellow/green', 'Set target marks for each subject'],
        practice_tasks: ['Create a weak-chapter list', 'Solve 10 baseline questions without looking at answers'],
        proof: 'Chapter tracker photo or typed checklist',
        unlock: 'NCERT foundation plan',
        worker_check: 'Confirm board, subjects, exam month, and realistic daily study time.',
      },
      {
        title: 'NCERT foundation practice',
        goal: 'Learner revises concepts from official NCERT chapters before jumping to random videos.',
        lessons: ['Read NCERT theory in 25-minute blocks', 'Redo solved examples', 'Complete back exercise questions'],
        practice_tasks: ['Finish one chapter exercise set', 'Mark every wrong answer in the mistake log'],
        proof: 'NCERT exercise completion photo and mistake log',
        unlock: 'Sample-paper section practice',
        worker_check: 'Check whether the learner is solving, not only watching videos.',
      },
      {
        title: 'Sample paper and marking scheme',
        goal: 'Learner understands answer format, step marking, and time allocation.',
        lessons: ['Download CBSE/current board sample paper', 'Compare answers with marking scheme', 'Practice section-wise timing'],
        practice_tasks: ['Solve one 40-minute section', 'Rewrite two answers using marking scheme language'],
        proof: 'Checked sample-paper section',
        unlock: 'Timed mock routine',
        worker_check: 'Review one answer sheet photo and identify repeated mistakes.',
      },
      {
        title: 'Mock test and revision loop',
        goal: 'Learner builds a repeatable weekly system until the exam.',
        lessons: ['Three-hour mock strategy', 'Mistake-log revision', 'Last 7-day revision timetable'],
        practice_tasks: ['Complete one timed mock or half-mock', 'Revise top 10 mistakes next morning'],
        proof: 'Mock score + mistake improvement note',
        unlock: 'Next subject plan or mentor escalation',
        worker_check: 'Escalate if scores stay low after two mocks or if exam anxiety is high.',
      },
    ],
  },
  'job search': {
    id: 'job-search',
    modules: [
      {
        title: 'Role and location fit',
        goal: 'Learner confirms target role, location, commute, shift, and salary floor before matching.',
        lessons: ['Target role and location', 'Commute and shift filter', 'Minimum wage and safety filter'],
        practice_tasks: ['Write one-line role target', 'Approve location/commute limits'],
        proof: 'Job-search preference summary',
        unlock: 'Local opportunity search',
      },
      {
        title: 'Resume and proof check',
        goal: 'Learner has enough proof for direct employer outreach.',
        lessons: ['Resume/profile basics', 'Certificate or experience proof', 'What not to share without consent'],
        practice_tasks: ['Add one certificate/experience item', 'Approve shareable profile fields'],
        proof: 'Consent-limited profile',
        unlock: 'Outreach draft',
      },
      {
        title: 'Application CRM',
        goal: 'Learner tracks applications, replies, and follow-ups.',
        lessons: ['Shortlist jobs', 'Send first outreach', 'Classify replies and follow up'],
        practice_tasks: ['Select two leads', 'Prepare one follow-up answer'],
        proof: 'Application pipeline state',
        unlock: 'Interview/screening prep',
      },
    ],
  },
  'college pathway': {
    id: 'college-pathway',
    modules: [
      {
        title: 'College profile map',
        goal: 'Learner clarifies course, year, skills, projects, and internship/project goal.',
        lessons: ['Course and semester summary', 'Skill/project inventory', 'Goal: internship, project, placement, or higher studies'],
        practice_tasks: ['Add two project/skill signals', 'Write one target statement'],
        proof: 'College profile summary',
        unlock: 'Portfolio/resume plan',
      },
      {
        title: 'Portfolio and resume sprint',
        goal: 'Learner creates proof strong enough for internship or project outreach.',
        lessons: ['Resume bullet quality', 'Project proof page', 'GitHub/portfolio/drive link hygiene'],
        practice_tasks: ['Rewrite two resume bullets', 'Attach one proof link'],
        proof: 'Resume/portfolio proof',
        unlock: 'Internship/project search',
      },
      {
        title: 'Outreach and follow-up',
        goal: 'Learner sends personalized outreach and tracks replies.',
        lessons: ['Find relevant leads', 'Personalized message', 'Follow-up timing'],
        practice_tasks: ['Select three leads', 'Generate one personalized message'],
        proof: 'Outreach CRM record',
        unlock: 'Interview/project call prep',
      },
    ],
  },
  'informal skill validation': {
    id: 'informal-proof',
    modules: [
      {
        title: 'Skill story and safety',
        goal: 'Learner explains what they can do, where they learned it, and what work is safe.',
        lessons: ['Skill story', 'Safe work boundaries', 'Consent before sharing details'],
        practice_tasks: ['Record a 60-second skill explanation', 'Set commute and shift limits'],
        proof: 'Counselor skill summary',
        unlock: 'Proof task',
      },
      {
        title: 'Proof task',
        goal: 'Learner creates visible proof of informal skill.',
        lessons: ['Choose proof task', 'Quality checklist', 'Photo/video proof rules'],
        practice_tasks: ['Complete one proof sample', 'Ask one trusted person for feedback'],
        proof: 'Skill sample photo/video/note',
        unlock: 'Skill Passport',
      },
      {
        title: 'Validation to opportunity',
        goal: 'Learner uses proof for local training, RPL, apprenticeship, or job matching.',
        lessons: ['RPL/short course option', 'Apprenticeship option', 'Job outreach option'],
        practice_tasks: ['Pick one validation route', 'Approve shareable proof'],
        proof: 'Consent-controlled Skill Passport',
        unlock: 'Local match/outreach',
      },
    ],
  },
  'vocational training': {
    id: 'vocational-training',
    modules: [
      {
        title: 'Training fit check',
        goal: 'Learner chooses the right skill, course format, location, and timing.',
        lessons: ['Skill goal', 'Local vs online training', 'Fees, commute, and safety questions'],
        practice_tasks: ['Shortlist one local and one online option', 'Set commute/time limits'],
        proof: 'Training fit summary',
        unlock: 'Course verification',
      },
      {
        title: 'Foundation practice',
        goal: 'Learner starts small practice before or during course enrollment.',
        lessons: ['Daily routine', 'Basic tool/term knowledge', 'Practice proof'],
        practice_tasks: ['Complete one starter task', 'Capture proof photo/note'],
        proof: 'Starter practice proof',
        unlock: 'Skill Passport draft',
      },
      {
        title: 'Training to work bridge',
        goal: 'Learner connects course progress to apprenticeship or entry work.',
        lessons: ['Ask trainer for feedback', 'Build proof portfolio', 'Prepare screening answers'],
        practice_tasks: ['Add one trainer/mentor note', 'Practice one screening answer'],
        proof: 'Training progress proof',
        unlock: 'Apprenticeship/job matching',
      },
    ],
  },
  'mobile repair': {
    id: 'mobile-repair',
    modules: [
      {
        title: 'Phone diagnosis foundation',
        goal: 'Learner can name phone parts, common faults, and safety steps.',
        lessons: ['Parts of a smartphone', 'Battery and charging safety', 'How to ask a customer for symptoms'],
        practice_tasks: ['Record a 60-second explanation of three common faults', 'Create a checklist for taking a repair order'],
        proof: 'Voice note + photo of handwritten fault checklist',
        unlock: 'Repair-shop observation script',
      },
      {
        title: 'Repair counter practice',
        goal: 'Learner can handle intake, estimate, and simple customer communication.',
        lessons: ['Customer handling', 'Basic bill format', 'Warranty and honesty rules'],
        practice_tasks: ['Role-play a customer call', 'Make a sample repair ticket'],
        proof: 'Sample repair ticket photo',
        unlock: 'Skill Passport informal skill badge',
      },
      {
        title: 'Apprenticeship readiness',
        goal: 'Learner is ready for a safe first visit to a repair shop.',
        lessons: ['What to ask the employer', 'Safe commute and timings', 'Interview practice'],
        practice_tasks: ['Choose two nearby shops', 'Practice one screening answer'],
        proof: 'Worker-approved shortlist of shops',
        unlock: 'Placement outreach',
      },
    ],
  },
  'video creation': {
    id: 'video-creation',
    modules: [
      {
        title: 'Phone video basics',
        goal: 'Learner can shoot clear 20-30 second clips with good light and sound.',
        lessons: ['Framing and light', 'Clean audio', 'One-message script'],
        practice_tasks: ['Shoot one product video at home', 'Write a 3-line script'],
        proof: 'One sample video link or uploaded clip note',
        unlock: 'Local business portfolio',
      },
      {
        title: 'Editing and captions',
        goal: 'Learner can make a basic edited video for a local shop.',
        lessons: ['Trim clips', 'Add captions', 'WhatsApp-friendly export'],
        practice_tasks: ['Edit one before/after clip', 'Create caption in learner language'],
        proof: 'Before/after video sample',
        unlock: 'Digital content Skill Passport badge',
      },
      {
        title: 'Client outreach readiness',
        goal: 'Learner can pitch a small video service safely.',
        lessons: ['How to explain the service', 'Pricing for first project', 'Consent before recording people'],
        practice_tasks: ['Make a list of three nearby shops', 'Practice a 30-second pitch'],
        proof: 'Worker-reviewed shop shortlist',
        unlock: 'MSME outreach draft',
      },
    ],
  },
  'computer basics': {
    id: 'computer-basics',
    modules: [
      {
        title: 'Digital confidence',
        goal: 'Learner can use forms, WhatsApp documents, and basic typing practice.',
        lessons: ['Typing routine', 'Online form safety', 'Document upload basics'],
        practice_tasks: ['Type a 100-word paragraph', 'Fill a mock form'],
        proof: 'Typing screenshot or worker score',
        unlock: 'Digital service practice',
      },
      {
        title: 'Spreadsheet and data entry',
        goal: 'Learner can enter clean rows and check mistakes.',
        lessons: ['Rows and columns', 'Simple totals', 'Mistake checking'],
        practice_tasks: ['Create a 10-row household expense sheet', 'Check three wrong entries'],
        proof: 'Spreadsheet screenshot/photo',
        unlock: 'Office assistant badge',
      },
      {
        title: 'Screening readiness',
        goal: 'Learner can answer basic digital job questions.',
        lessons: ['Office behavior', 'Data privacy', 'Interview practice'],
        practice_tasks: ['Mock customer query', 'Prepare commute and timing answer'],
        proof: 'Mock screening score',
        unlock: 'Cyber cafe or CSC outreach',
      },
    ],
  },
  tailoring: {
    id: 'tailoring',
    modules: [
      {
        title: 'Measurement and stitch basics',
        goal: 'Learner can take simple measurements and identify stitch types.',
        lessons: ['Measurement names', 'Machine safety', 'Straight stitch practice'],
        practice_tasks: ['Practice on scrap cloth', 'Record a measurement checklist'],
        proof: 'Photo of stitched sample',
        unlock: 'Tailoring practice badge',
      },
      {
        title: 'Alteration proof',
        goal: 'Learner creates one simple alteration sample.',
        lessons: ['Hemming', 'Button repair', 'Finishing quality'],
        practice_tasks: ['Complete one hem sample', 'Fix one button or seam sample'],
        proof: 'Before/after sample photos',
        unlock: 'Local tailor apprenticeship shortlist',
      },
      {
        title: 'Order handling',
        goal: 'Learner can explain price, delivery date, and customer note.',
        lessons: ['Order book basics', 'Customer communication', 'WhatsApp catalogue'],
        practice_tasks: ['Make a two-item sample catalogue', 'Practice customer reply'],
        proof: 'WhatsApp catalogue screenshot',
        unlock: 'Home-order or apprentice outreach',
      },
    ],
  },
  'hospitality cooking': {
    id: 'hospitality',
    modules: [
      {
        title: 'Kitchen hygiene foundation',
        goal: 'Learner understands safe food handling and basic prep.',
        lessons: ['Handwash and station hygiene', 'Knife safety', 'Basic prep timing'],
        practice_tasks: ['Record a hygiene checklist', 'Practice one prep task at home'],
        proof: 'Checklist photo + worker note',
        unlock: 'Kitchen helper badge',
      },
      {
        title: 'Service timing practice',
        goal: 'Learner can follow a simple kitchen sequence.',
        lessons: ['Mise-en-place', 'Serving order', 'Waste reduction'],
        practice_tasks: ['Prepare one snack with timing notes', 'Explain the sequence in voice'],
        proof: 'Timed practice note',
        unlock: 'Hotel/catering shortlist',
      },
      {
        title: 'Safe placement screen',
        goal: 'Learner can evaluate shift timing and workplace safety.',
        lessons: ['Shift questions', 'Commute planning', 'Interview answers'],
        practice_tasks: ['Ask five employer safety questions', 'Practice one interview answer'],
        proof: 'Worker-approved opportunity checklist',
        unlock: 'Employer outreach',
      },
    ],
  },
  'agriculture skills': {
    id: 'agri-skills',
    modules: [
      {
        title: 'Agri service foundation',
        goal: 'Learner can explain local crop/service needs and basic safety.',
        lessons: ['Local crop calendar', 'Tool safety', 'Farmer conversation script'],
        practice_tasks: ['List three local crop problems', 'Record a farmer question script'],
        proof: 'Crop/service note',
        unlock: 'Agri service badge',
      },
      {
        title: 'Digital farm records',
        goal: 'Learner can keep simple farm or service records.',
        lessons: ['Input records', 'Photo proof', 'Basic expense sheet'],
        practice_tasks: ['Make a 5-row farm service sheet', 'Take one clear field photo'],
        proof: 'Record sheet screenshot/photo',
        unlock: 'FPO/service center shortlist',
      },
      {
        title: 'Local service readiness',
        goal: 'Learner is ready for agri service center screening.',
        lessons: ['Workplace questions', 'Seasonal income planning', 'Commute safety'],
        practice_tasks: ['Shortlist two local partners', 'Prepare one screening answer'],
        proof: 'Worker-reviewed shortlist',
        unlock: 'Agri opportunity outreach',
      },
    ],
  },
  'drone operations': {
    id: 'drone-ops',
    modules: [
      {
        title: 'Drone awareness foundation',
        goal: 'Learner understands where drones are useful and why safety matters.',
        lessons: ['Drone use cases in farming', 'Safety perimeter', 'Weather and battery basics'],
        practice_tasks: ['Explain three drone use cases', 'Make a safety checklist'],
        proof: 'Voice explanation + checklist',
        unlock: 'Agri-tech readiness badge',
      },
      {
        title: 'Field data practice',
        goal: 'Learner can collect simple field observations without a drone.',
        lessons: ['Field mapping basics', 'Photo labels', 'Farmer report format'],
        practice_tasks: ['Create a simple field map', 'Label three crop photos'],
        proof: 'Field map photo',
        unlock: 'Drone center referral',
      },
      {
        title: 'Partner verification',
        goal: 'Worker verifies a real training center or employer before commute.',
        lessons: ['Questions for training centers', 'Fee safety', 'Commute planning'],
        practice_tasks: ['List two verified centers', 'Prepare guardian explanation'],
        proof: 'Worker-verified referral note',
        unlock: 'High-potential pathway callback',
      },
    ],
  },
  'beauty and wellness': {
    id: 'beauty-wellness',
    modules: [
      {
        title: 'Salon hygiene and basics',
        goal: 'Learner understands hygiene, customer comfort, and basic services.',
        lessons: ['Clean station checklist', 'Customer greeting', 'Tool hygiene'],
        practice_tasks: ['Record hygiene checklist', 'Practice customer greeting'],
        proof: 'Checklist photo + voice greeting',
        unlock: 'Salon support badge',
      },
      {
        title: 'Portfolio sample',
        goal: 'Learner creates one visible proof sample safely.',
        lessons: ['Simple mehandi or grooming sample', 'Consent before photos', 'Before/after note'],
        practice_tasks: ['Create one sample', 'Write a short service description'],
        proof: 'Sample photo or worker note',
        unlock: 'Beauty Skill Passport badge',
      },
      {
        title: 'Women-friendly placement',
        goal: 'Learner is ready for a safe salon or wellness screening.',
        lessons: ['Workplace safety questions', 'Shift timing', 'Interview practice'],
        practice_tasks: ['Shortlist two safe employers', 'Practice one screening answer'],
        proof: 'Worker-approved employer shortlist',
        unlock: 'Employer outreach',
      },
    ],
  },
  'customer service': {
    id: 'customer-service',
    modules: [
      {
        title: 'Communication foundation',
        goal: 'Learner can greet customers and collect basic information.',
        lessons: ['Greeting script', 'Listening skills', 'Writing clear notes'],
        practice_tasks: ['Record a greeting', 'Write a mock customer note'],
        proof: 'Voice greeting + note photo',
        unlock: 'Customer handling badge',
      },
      {
        title: 'Service counter practice',
        goal: 'Learner can handle common service requests.',
        lessons: ['Problem summary', 'Escalation', 'Polite refusal'],
        practice_tasks: ['Role-play two customer cases', 'Prepare a service ticket'],
        proof: 'Mock ticket photo',
        unlock: 'Counter role shortlist',
      },
      {
        title: 'Interview readiness',
        goal: 'Learner can explain availability, commute, and strengths.',
        lessons: ['Interview answers', 'Workplace timing', 'Consent settings'],
        practice_tasks: ['Practice three answers', 'Confirm shareable profile fields'],
        proof: 'Mock interview score',
        unlock: 'Placement outreach',
      },
    ],
  },
  generic: {
    id: 'career-skill',
    modules: [
      {
        title: 'Interest confirmation',
        goal: 'Learner chooses one realistic first-income direction.',
        lessons: ['Strengths and interests', 'Income vs learning tradeoff', 'Family support conversation'],
        practice_tasks: ['Pick top two interests', 'Record why this path fits'],
        proof: 'Counselor summary',
        unlock: 'Pathway comparison',
      },
      {
        title: 'Foundation practice',
        goal: 'Learner completes two small tasks related to the chosen pathway.',
        lessons: ['Daily practice routine', 'Proof of work', 'Asking for feedback'],
        practice_tasks: ['Finish one practice task', 'Get feedback from one trusted person'],
        proof: 'Practice proof photo/note',
        unlock: 'Skill Passport draft',
      },
      {
        title: 'Placement readiness',
        goal: 'Learner is ready for one safe trainer or employer conversation.',
        lessons: ['Screening answers', 'Commute safety', 'Consent before sharing details'],
        practice_tasks: ['Practice one screening call', 'Approve consent settings'],
        proof: 'Worker-reviewed readiness note',
        unlock: 'Opportunity matching',
      },
    ],
  },
};

export function scoreJob(job, passport, profile = DEMO_PROFILE) {
  const skills = [
    ...(passport?.certs || []).map((item) => item.name?.toLowerCase() || ''),
    ...(passport?.informal || []).map((item) => item.name?.toLowerCase() || ''),
    ...(profile.aspirations || []).map((item) => item.toLowerCase()),
  ].join(' ');
  const text = `${job.title} ${job.description} ${job.constraints?.join(' ')}`.toLowerCase();

  const skillOverlap = [
    'beauty',
    'beautician',
    'mehandi',
    'customer',
    'wellness',
    'repair',
    'mobile',
    'technician',
    'video',
    'content',
    'digital',
    'computer',
    'typing',
    'data science',
    'data analyst',
    'analytics',
    'python',
    'sql',
    'machine learning',
    'accounting',
    'finance',
    'tally',
    'gst',
    'nursing',
    'driver',
    'driving',
    'tailoring',
    'stitching',
    'cooking',
    'hotel',
    'kitchen',
    'agriculture',
    'farm',
    'drone',
  ].filter(
    (skill) => skills.includes(skill) && text.includes(skill),
  ).length;
  const skillScore = Math.min(1, skillOverlap / 3);
  const remoteOrIndiaWide =
    Number(job.distance_km || 0) === 0 ||
    /remote|india-wide|relocate|relocation|online/i.test(`${job.constraints?.join(' ') || ''} ${profile.relocation_preference || ''}`);
  const distanceScore = remoteOrIndiaWide || job.distance_km <= (profile.commute_km || 30) ? 1 : 0.35;
  const safeScore = remoteOrIndiaWide || /safe|women|day|afternoon/i.test(job.constraints?.join(' ') || '') ? 1 : 0.45;
  const wageScore = /8,|900|12,|7,/.test(job.wage || '') ? 0.86 : 0.62;
  const score = Math.round((skillScore * 0.4 + distanceScore * 0.25 + safeScore * 0.2 + wageScore * 0.15) * 100);

  const reasons = [
    remoteOrIndiaWide
      ? `${profile.relocation_preference || 'Remote/India-wide'} mobility matches this lead`
      : `${job.distance_km} km is checked against ${profile.name || 'learner'}'s ${profile.commute_km || 30} km commute limit`,
    remoteOrIndiaWide
      ? 'Remote/India-wide lead; employer legitimacy still needs verification before sharing details'
      : safeScore === 1
        ? 'Meets safe-commute or women-friendly constraint'
        : 'Needs worker review for commute safety',
    skillScore > 0 ? 'Matches Skill Passport and aspiration signals' : 'Adjacent role, skill gap remains',
    profile.income_pressure ? `Income path visible: ${job.wage}` : 'Useful experience pathway',
  ];

  return { ...job, score, reasons };
}

export function scoreJobs(jobs, passport, profile) {
  return jobs.map((job) => scoreJob(job, passport, profile)).sort((a, b) => b.score - a.score);
}

export function consentLimitedOutreach({ passport, match, journey, resumeText = '', profile = {} }) {
  const shared = [];
  const certs = Array.isArray(passport.certs) ? passport.certs : [];
  const informal = Array.isArray(passport.informal) ? passport.informal : [];
  const assessmentScores = passport.assessment_scores || {};
  if (passport.consent?.share_certs) {
    shared.push(`certification plan: ${certs.map((cert) => cert.name).filter(Boolean).join(', ') || 'pending'}`);
  }
  if (passport.consent?.share_informal) {
    shared.push(`informal skill: ${informal.map((skill) => skill.name).filter(Boolean).join(', ') || 'pending'}`);
  }
  if (passport.consent?.share_scores) {
    shared.push(`assessment scores: customer service ${assessmentScores.customer_service || 'pending'}%`);
  }
  if (journey?.readiness_score && passport.consent?.share_informal) {
    shared.push(`learning readiness: ${journey.readiness_score}% on ${journey.route_name || 'selected pathway'}`);
  }

  const learnerName = passport.name || profile.name || 'VidyaSetu learner';
  const learnerLocation = passport.location || profile.location || profile.relocation_preference || 'India';
  const recipient =
    match.contact_name && !/hiring contact|hiring team/i.test(match.contact_name)
      ? match.contact_name
      : `${match.employer} team`;
  const roleContext = /startup|founder|funded|wellfound|greenhouse|lever/i.test(
    `${match.lead_type || ''} ${match.funding_stage || ''} ${match.source_title || ''} ${match.source_url || ''}`,
  )
    ? 'your startup team'
    : 'your team';
  const resumeReady = String(resumeText || '').trim().length > 240;
  const proofLine = resumeReady
    ? 'A concise resume draft is ready and can be shared after the learner confirms consent.'
    : 'If a formal resume is needed, VidyaSetu can build a truthful one from the learner profile before sharing details.';
  const mobilityLine =
    Number(match.distance_km || 0) > 0
      ? `Mobility fit: the opportunity is around ${match.distance_km} km from the learner's location/commute filter.`
      : `Mobility fit: ${profile.relocation_preference || 'remote/India-wide'} preference is acceptable for this lead.`;

  const subject = `Subject: ${learnerName} for ${match.title}`;
  const body = [
    subject,
    '',
    `Namaste ${recipient},`,
    '',
    `${learnerName} from ${learnerLocation} is a VidyaSetu learner matched to ${roleContext} for ${match.title} with a ${match.score}% fit score.`,
    shared.length
      ? `With learner consent, I can share ${shared.join('; ')}.`
      : 'The learner has not consented to share detailed skills yet, so I am only sharing interest and commute fit.',
    proofLine,
    mobilityLine,
    journey?.progress?.placement_unlock_rule
      ? `VidyaSetu placement rule: ${journey.progress.placement_unlock_rule}`
      : 'A community worker or mentor can support the first screening if needed.',
    '',
    'Would you be open to a short screening or project-fit conversation this week?',
    '',
    'VidyaSetu Placement Agent',
  ].join('\n');

  return body;
}

export function classifyReply(replyText = '') {
  if (/interview|call|tuesday|come|meet|shortlist|interested/i.test(replyText)) {
    return {
      status: 'interview',
      extracted_next_step: 'Employer wants a screening call; community worker should confirm family availability.',
      suggested_followup_date: addDays(1),
    };
  }
  if (/filled|closed|not hiring|no vacancy/i.test(replyText)) {
    return {
      status: 'filled',
      extracted_next_step: 'Archive this match and continue with next highest score.',
      suggested_followup_date: null,
    };
  }
  return {
    status: replyText ? 'interested' : 'no_response',
    extracted_next_step: replyText ? 'Worker should review reply text.' : 'Send first follow-up in 5 days.',
    suggested_followup_date: addDays(5),
  };
}

export function computeAdews(features = {}) {
  const missed = Number(features.missed_checkins ?? 3);
  const attendanceDrop = Number(features.attendance_drop_days ?? 8);
  const economicStress = features.economic_stress ?? true;
  const examWindow = features.exam_window ?? true;
  const genderWindow = features.gender_window ?? true;

  const risk =
    0.18 +
    Math.min(0.24, missed * 0.07) +
    Math.min(0.24, attendanceDrop * 0.025) +
    (economicStress ? 0.12 : 0) +
    (examWindow ? 0.08 : 0) +
    (genderWindow ? 0.08 : 0);

  const normalized = Math.min(0.94, Number(risk.toFixed(2)));
  const top_features_json = [
    { feature: 'missed_checkins', value: missed, contribution: Number(Math.min(0.24, missed * 0.07).toFixed(2)) },
    {
      feature: 'attendance_drop_days',
      value: attendanceDrop,
      contribution: Number(Math.min(0.24, attendanceDrop * 0.025).toFixed(2)),
    },
    { feature: 'economic_stress', value: economicStress, contribution: economicStress ? 0.12 : 0 },
    { feature: 'exam_window', value: examWindow, contribution: examWindow ? 0.08 : 0 },
    { feature: 'gender_window', value: genderWindow, contribution: genderWindow ? 0.08 : 0 },
  ].sort((a, b) => b.contribution - a.contribution);

  return {
    risk: normalized,
    fired: normalized >= 0.65,
    top_features_json,
    worker_message: `ADEWS alert: learner risk ${normalized}. Missed ${missed} check-ins and attendance dropped ${attendanceDrop} days. Suggested action: home visit and pathway counseling.`,
  };
}
