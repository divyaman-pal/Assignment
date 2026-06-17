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
  const localOfficeIntent =
    /computer basics|typing|customer service|data entry|computer operator|front desk|reception|billing|office assistant|bpo|call center|retail billing/.test(
      aspirations,
    ) && !dataScienceIntent;
  const aspirationNonStudyIntent =
    dataScienceIntent ||
    localOfficeIntent ||
    /job|naukri|employment|hiring|vacancy|resume|typing|data entry|office assistant|customer service|self.?employment|business|enterprise|poultry|mushroom|shop|training|course|skill|college|internship|placement/i.test(
      aspirations,
    );
  const academicGoalType = profile.academic_goal?.type || '';
  const academicGoalOverridesStaleCareer =
    academicGoalType === 'entrance_exam_prep' ||
    academicGoalType === 'class_12_exam_prep' ||
    academicGoalType === 'school_study_support';
  const explicitNonStudyGoal =
    Boolean(profile.learner_goal?.intent && profile.learner_goal.intent !== 'study') ||
    aspirationNonStudyIntent ||
    /job|training|career|enterprise|self_employment|informal_skill|local_office|college/i.test(profile.learner_goal?.type || '');
  const studyLaneActive =
    !explicitNonStudyGoal && (!profile.learner_goal?.intent || profile.learner_goal.intent === 'study' || academicGoalOverridesStaleCareer);
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
  if (['job_search_only', 'formal_skill_job_search', 'college_job_search', 'local_office_job'].includes(goalType)) {
    const role = titleCase(firstAspiration || 'job');
    if (localOfficeIntent) {
      const commute = profile.commute_km ? `${profile.commute_km} km` : 'safe commute range';
      const place = profile.location || 'your town';
      return [
        {
          id: 'local-day-shift-office-job',
          name: `Day-shift computer job near ${place}`,
          time: 'Start today, then follow a 7-day search loop',
          distance: `Only roles within ${commute} of ${place}`,
          income: 'Entry wage depends on the employer listing',
          tradeoff:
            'Matches computer basics, typing, customer service, safe day shift, and nearby travel.',
          next_action: 'Build a one-page resume from the Class 12 certificate and save one 5-minute typing-test screenshot.',
          expected_outcome: 'Shortlist only data entry, computer operator, front desk, retail billing, or customer-care roles.',
          locked_until: 'Job contact stays blocked until resume/proof, safe shift, commute, and learner consent are checked.',
          risk: 'Reject any job asking fees, unsafe travel, night shift, unrelated trade skill, or private contact sharing without consent.',
          source_url: 'https://www.ncs.gov.in/',
          source_title: 'National Career Service local job search',
          confidence: 0.88,
        },
        {
          id: 'typing-proof-resume',
          name: 'Typing proof plus simple resume',
          time: '1-2 days',
          distance: 'Phone-first; can be done at home',
          income: 'Improves callback chances for office and customer-care roles',
          tradeoff:
            'This is the smallest useful proof for a Class 12 learner who cannot make a resume alone: simple resume, certificate photo, and typing score.',
          next_action: 'Use Meera to create the resume, then practise typing for 20 minutes and save the score photo.',
          expected_outcome: 'A shareable proof pack before applying.',
          locked_until: 'Employer outreach unlocks only after learner reviews what will be shared.',
          source_url: 'https://www.skillindiadigital.gov.in/',
          source_title: 'Skill India Digital basic digital skills',
          confidence: 0.82,
        },
        {
          id: 'safe-local-application-loop',
          name: 'Safe local application loop',
          time: 'Daily 30-45 minutes for one week',
          distance: `Nearby offices, shops, schools, clinics, cyber cafes, and service counters within ${commute}`,
          income: 'Depends on verified local openings',
          tradeoff:
            'Apply to fewer but better-fit roles: day shift, nearby, computer/customer handling, no fees, and contact verified from a public source.',
          next_action: 'Shortlist five matching roles and mark each one as safe, unsure, or reject.',
          expected_outcome: 'A tracked list of applications instead of random job links.',
          locked_until: 'Send/apply stays blocked until the learner gives consent for each employer.',
          source_url: 'https://www.ncs.gov.in/',
          source_title: 'NCS opportunities plus consent-based tracking',
          confidence: 0.78,
        },
      ];
    }
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
  if (goalType === 'self_employment_enterprise') {
    const venture = titleCase(firstAspiration || 'micro-enterprise');
    return [
      {
        id: 'enterprise-setup-plan',
        name: `${venture} setup plan -> first 30 days roadmap`,
        time: '3-5 days planning, then a 30-day setup loop',
        distance: `Home/local market around ${location}`,
        income: 'No income guarantee; first sales only after setup and buyers are confirmed',
        tradeoff: `Best first step: write the setup steps, space, equipment, and a realistic budget for ${firstAspiration} before spending money.`,
        source_url: 'https://www.pmfme.mofpi.gov.in/',
        source_title: 'PM FME / MoFPI micro-enterprise setup reference',
        confidence: 0.8,
      },
      {
        id: 'enterprise-budget-scheme',
        name: `${venture} budget + loan/scheme check`,
        time: '1-2 weeks verification',
        distance: `District industries centre / bank near ${location}`,
        income: 'Improves funding readiness; subsidy/loan depends on eligibility',
        tradeoff: 'Compare cost heads, working capital, and Mudra/PMEGP/PMFME scheme eligibility before any loan or investment.',
        source_url: 'https://www.kviconline.gov.in/pmegpeportal/',
        source_title: 'PMEGP / KVIC scheme reference',
        confidence: 0.76,
      },
      {
        id: 'enterprise-buyer-risk',
        name: `${venture} buyer/customer + risk plan`,
        time: 'Ongoing local-market loop',
        distance: `Local market and buyers around ${location}`,
        income: 'Depends on demand; start small to limit risk',
        tradeoff: 'List buyers/customers, price, suppliers, and the top risks; a worker should verify the local market before scaling.',
        source_url: 'https://udyamregistration.gov.in/',
        source_title: 'Udyam MSME registration and local market base',
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
  const skill = journeyPrimarySkill(profile, route);
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

  const journey = {
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
            : skill === 'enterprise setup'
              ? 'enterprise_setup'
          : ['job search', 'local office job', 'college pathway', 'informal skill validation', 'vocational training'].includes(skill)
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

  return enrichJourneyForLearner(profile, { ...route, name: routeName }, journey);
}

function journeyPrimarySkill(profile = {}, route = {}) {
  const aspirations = Array.isArray(profile) ? profile : profile.aspirations || [];
  const routeText = routeTextOf(route);
  const goalLabel = Array.isArray(profile) ? '' : `${profile.learner_goal?.label || ''} ${profile.learner_goal?.intent || ''}`;
  const text = `${aspirations.join(' ')} ${goalLabel} ${routeText}`.toLowerCase();
  const goalType = Array.isArray(profile) ? '' : profile.learner_goal?.type || '';
  const jobLikeGoal =
    ['job', 'career', 'proof_to_work'].includes(profile.learner_goal?.intent) ||
    ['job_search_only', 'formal_skill_job_search', 'college_job_search', 'local_office_job'].includes(goalType);
  const routeJobText = /\bjob\b|job search|\bncs\b|employer|hiring|role|vacancy|application|outreach/.test(routeText);
  const localOfficeText =
    /computer basics|typing|customer service|data entry|computer operator|front desk|reception|billing|office assistant|bpo|call center|retail billing|local data entry|office roles/.test(
      text,
    );
  const dataScienceText = /data science|machine learning|data analyst|analytics|python|sql|\bai\b|artificial intelligence/.test(text);

  if (goalType === 'local_office_job' || ((jobLikeGoal || routeJobText) && localOfficeText && !dataScienceText)) return 'local office job';
  if (jobLikeGoal && dataScienceText) return 'data science';
  if (profile.academic_goal?.type === 'entrance_exam_prep' || goalType === 'entrance_exam_prep' || /\bjee\b|\biit\b|\bneet\b|\bcuet\b|\bgate\b|\bcat\b|\bclat\b|\bnda\b|\bupsc\b|\bssc\b|railway|bank exam|entrance exam|competitive exam/.test(text)) {
    return 'entrance exam preparation';
  }
  if (profile.academic_goal?.type === 'class_12_exam_prep' || /class 12|board exam|exam preparation|marks|score/.test(text)) {
    return 'class 12 exam preparation';
  }
  if (profile.academic_goal?.type === 'school_study_support' || /study support|school study|class \d+.*study/.test(text)) {
    return 'school study support';
  }
  if (goalType === 'self_employment_enterprise') return 'enterprise setup';
  if (goalType === 'informal_skill_validation') return 'informal skill validation';
  if (/poultry|mushroom|goat|dairy|food processing|pickle|papad|bakery|enterprise|self.?employment|apna kaam|business setup/.test(text)) return 'enterprise setup';
  if (dataScienceText) return 'data science';
  if (/mechanic|bike|motorcycle|two wheeler|2 wheeler/.test(text)) return 'mechanic repair';
  if (
    ['job_search_only', 'formal_skill_job_search', 'college_job_search'].includes(goalType) &&
    localOfficeText
  ) {
    return 'local office job';
  }
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
  'local office job': {
    id: 'local-office-job',
    modules: [
      {
        title: 'Resume and typing proof',
        goal: 'Make a simple resume, attach Class 12 proof, and save one typing score before applying.',
        lessons: ['Simple resume fields', 'Class 12 certificate photo', 'Typing score proof'],
        daily_micro_tasks: ['Fill name, location, education, and skills in the resume', 'Practise typing for 20 minutes', 'Save one typing-test screenshot'],
        practice_tasks: ['Create a one-page resume', 'Take a 5-minute typing test'],
        proof: 'Resume plus typing score screenshot',
        unlock: 'Safe local shortlist',
        completion_criteria: 'Resume is readable, Class 12 certificate is noted, and one typing score is saved.',
        low_data_alternative: 'Write the resume in a notebook and send one WhatsApp photo to the worker.',
        voice_whatsapp_version: 'Meera sends one short voice note: resume fields, typing practice, and proof photo.',
      },
      {
        title: 'Safe local shortlist',
        goal: 'Filter jobs to nearby day-shift computer, data-entry, front-desk, billing, or customer-care roles only.',
        lessons: ['Allowed roles', 'Reject unsafe or unrelated jobs', 'Commute and day-shift check'],
        daily_micro_tasks: ['Mark allowed roles: data entry, computer operator, front desk, billing, customer care', 'Reject unrelated trade, delivery, night shift, and fee-based jobs', 'Set the commute limit'],
        practice_tasks: ['Shortlist five matching jobs', 'Mark each job safe, unsure, or reject'],
        proof: 'Five-role shortlist with safety notes',
        unlock: 'Application practice',
        completion_criteria: 'Every shortlisted job has role fit, source link, commute, shift, and fee-risk checked.',
        low_data_alternative: 'Worker/counselor reads two job cards aloud and the learner says safe, unsure, or reject.',
        voice_whatsapp_version: 'Meera asks one job at a time: role, distance, shift, fee, and consent.',
      },
      {
        title: 'Application practice',
        goal: 'Practise applying without sharing phone, address, certificate, or resume blindly.',
        lessons: ['What to share', 'What not to share', 'Consent before contact'],
        daily_micro_tasks: ['Prepare a 30-second introduction', 'Choose two jobs from the safe shortlist', 'Confirm what details can be shared'],
        practice_tasks: ['Record one intro voice note', 'Approve one consent-limited draft'],
        proof: 'Intro voice note plus approved draft',
        unlock: 'Interview practice',
        completion_criteria: 'Learner has approved one draft and understands no details are shared without consent.',
        low_data_alternative: 'Use a phone call script instead of email.',
        voice_whatsapp_version: 'Meera speaks the intro script and asks the learner to repeat it once.',
      },
      {
        title: 'Interview and first-week support',
        goal: 'Prepare for screening and know when to ask a worker or trusted adult for help.',
        lessons: ['Common questions', 'Shift and safety questions', 'First-week warning signs'],
        daily_micro_tasks: ['Practise three interview answers', 'Prepare two safety questions', 'Save worker/guardian support contact'],
        practice_tasks: ['Complete one mock interview', 'Write first-day checklist'],
        proof: 'Mock interview score and first-day checklist',
        unlock: 'Worker-supported placement follow-up',
        completion_criteria: 'Learner can answer availability, typing skill, commute, and safety questions clearly.',
        low_data_alternative: 'Mock interview over voice note.',
        voice_whatsapp_version: 'Meera asks three screening questions and records the score.',
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
  'enterprise setup': {
    id: 'enterprise-setup',
    modules: [
      {
        title: 'Setup plan and budget',
        goal: 'Learner writes the setup steps, space/equipment, and a realistic starting budget.',
        lessons: ['List setup steps and space/equipment', 'Estimate one-time cost and working capital', 'Decide a small safe starting size'],
        practice_tasks: ['Write a one-page setup plan', 'Make a simple budget sheet with cost heads'],
        proof: 'Setup plan + budget sheet',
        unlock: 'Loan/scheme verification',
        completion_criteria: 'Setup plan and budget with cost heads are written; starting size is realistic, not over-ambitious.',
        worker_check: 'Confirm space, budget source, family support, and that the learner is not taking on unsafe debt.',
      },
      {
        title: 'Loan, scheme and supplier check',
        goal: 'Learner checks scheme/loan eligibility and reliable suppliers before spending.',
        lessons: ['Mudra/PMEGP/PMFME scheme basics', 'Documents and eligibility', 'Comparing two suppliers'],
        practice_tasks: ['Note one scheme/loan option with eligibility', 'List two suppliers with price'],
        proof: 'Scheme/loan note + supplier list',
        unlock: 'Buyer and risk plan',
        completion_criteria: 'One scheme/loan path and at least two suppliers are listed with cost; no money spent before verification.',
        worker_check: 'Verify scheme details from an official source before the learner applies or pays anyone.',
      },
      {
        title: 'Buyers, local market and risk',
        goal: 'Learner finds first buyers/customers and writes the top risks before scaling.',
        lessons: ['Who are the first buyers/customers', 'Pricing for first sales', 'Top 3 risks and how to reduce them'],
        practice_tasks: ['List five possible buyers or sale points', 'Write a 30-day first-sales plan'],
        proof: 'Buyer list + 30-day first-sales plan',
        unlock: 'Worker-verified enterprise start',
        completion_criteria: 'Buyer list, pricing, and a 30-day plan exist with named risks; income is treated as not guaranteed.',
        worker_check: 'Confirm local-market demand and that risks are understood before any investment scales.',
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

// ---------------------------------------------------------------------------
// Goal-family route validation
// Keeps pathway cards relevant to the learner goal. Routes that do not belong
// to the learner's goal family (e.g. a beauty/PMKVY card for a JEE aspirant)
// are rejected and back-filled with deterministic, family-correct routes.
// ---------------------------------------------------------------------------

const ROUTE_FAMILY_RULES = {
  entrance_exam: {
    requireAny:
      /jee|iit|neet|cuet|gate|clat|\bnda\b|physics|chemistry|math|maths|biology|syllabus|mock|practice|error.?log|concept|revision|\btest\b|problem set/i,
    deny: /beauty|salon|mehandi|tailor|stitch|silai|electrician|plumber|pmkvy|job outreach|employer outreach|hirer outreach|placement job|vacancy|apprenticeship|data entry|computer basics/i,
  },
  board_exam: {
    requireAny:
      /ncert|diksha|sample paper|previous paper|board|revision|practice|\btest\b|mistake.?log|chapter|exam|marking scheme/i,
    deny: /job outreach|employer outreach|hirer outreach|vacancy|salon|beauty|mehandi|tailor|electrician|placement job|pmkvy|data entry/i,
  },
  school_study: {
    requireAny: /ncert|diksha|chapter|practice|\btest\b|revision|mistake.?log|homework|subject|concept|quiz|study/i,
    deny: /job outreach|employer outreach|hirer outreach|vacancy|salon|beauty|mehandi|tailor|electrician|placement job|pmkvy/i,
  },
  data_science_job: {
    requireAny:
      /python|sql|project|portfolio|resume|github|notebook|dashboard|internship|fresher|analyst|data science|outreach/i,
    deny: /beauty|salon|mehandi|tailor|stitch|silai|cooking|kitchen|\bjee\b|\biit\b|neet|ncert|sample paper|computer basics/i,
  },
  college: {
    requireAny: /college|internship|project|portfolio|resume|profile|outreach|placement|gap map|fresher|github|skill/i,
    deny: /beauty|salon|mehandi|\bjee\b|\biit\b|neet|ncert|sample paper/i,
  },
  informal_skill: {
    requireAny: /proof|sample|\brpl\b|local work|customer|photo|video|certificate|apprentice|skill passport|portfolio|stitch|silai|repair/i,
    deny: /\bjee\b|\biit\b|neet|ncert|sample paper|data science|\bpython\b|\bsql\b/i,
  },
  enterprise: {
    requireAny:
      /setup|budget|loan|scheme|mudra|pmegp|pmfme|buyer|customer|supplier|\brisk\b|local market|30.?day|working capital|first sales/i,
    deny: /employer outreach|hirer outreach|job outreach|placement job|job matching|job search|scholarship|\bvacancy\b/i,
  },
  job: {
    requireAny: /\bjob\b|vacancy|employer|outreach|resume|proof|\bncs\b|\brole\b|hiring|apprentice|placement|search/i,
    deny: /\bjee\b|\biit\b|neet|ncert|sample paper|pmkvy|training centre|training center|skill upgrade|generic skilling/i,
  },
  vocational: {
    requireAny: /training|course|center|centre|practice|apprentice|foundation|skill|certificate/i,
    deny: /\bjee\b|\biit\b|neet|ncert|sample paper/i,
  },
  generic: {
    requireAny: /skill|course|apprentice|proof|practice|\bjob\b|training|portfolio|setup|study|exam|outreach/i,
    deny: /$^/,
  },
};

const FAMILY_EXPLANATIONS = {
  entrance_exam: {
    why: 'This route keeps you on the exam track (syllabus, concepts, practice, mocks, error-log) instead of mixing in job or vocational distractions.',
    next: 'Open the study plan and start the first syllabus/diagnostic block today.',
    locked: 'Job, training, and outreach cards stay locked while you are in exam-prep mode.',
    risk: 'Watching videos alone is not progress — every block must end with solved questions and an error-log entry.',
    outcome: 'Higher syllabus coverage, accuracy, and mock scores before any career step.',
  },
  board_exam: {
    why: 'This route uses official NCERT/DIKSHA and sample papers so your board marks improve before any job route.',
    next: 'Start the NCERT/revision block and solve one practice set today.',
    locked: 'Job and outreach cards stay locked during board exam preparation.',
    risk: 'Skipping NCERT for random videos repeats mistakes; keep a mistake log every week.',
    outcome: 'Better board marks and stronger eligibility for the next pathway.',
  },
  school_study: {
    why: 'This route fixes weak chapters with NCERT/DIKSHA practice and tests, matched to your class and subjects.',
    next: 'Pick one weak chapter and finish the first practice set today.',
    locked: 'Job/outreach cards are not shown for school study help.',
    risk: 'Without honest mistake tracking, the same errors repeat in tests.',
    outcome: 'Clearer concepts, better marks, and steady study habits.',
  },
  data_science_job: {
    why: 'This route builds the exact data-science hiring stack — Python, SQL, a real project/portfolio, resume, and consent-based outreach — not generic computer basics.',
    next: 'Run the readiness gap-check, then start the first portfolio project task today.',
    locked: 'Employer outreach unlocks only after one verifiable project/proof and consent.',
    risk: 'A course certificate without a shareable project rarely gets shortlisted; proof matters more.',
    outcome: 'A shortlist-ready profile for fresher/analyst/internship roles.',
  },
  college: {
    why: 'This route turns your college profile into internship/project-ready proof (portfolio, resume, outreach) instead of starting from basics.',
    next: 'Build the profile/portfolio gap map, then add one project proof today.',
    locked: 'Outreach unlocks after resume/portfolio proof and consent.',
    risk: 'Applying with no project proof leads to silent rejections; build proof first.',
    outcome: 'Stronger shortlisting for internships, projects, or fresher roles.',
  },
  informal_skill: {
    why: 'This route makes your existing hands-on skill visible as proof (photo/video/RPL) so local work or a certificate becomes possible — no beginner course needed.',
    next: 'Capture one sample-work proof (photo/video/voice) today.',
    locked: 'Local work/outreach unlocks after enough proof or RPL-grade evidence and consent.',
    risk: 'No certificate is not a barrier — but unverified claims are; keep clear sample proof.',
    outcome: 'A trusted Skill Passport that unlocks local work, RPL, or apprenticeship.',
  },
  enterprise: {
    why: 'This route checks setup, budget, scheme/loan eligibility, buyers, and risk before any money is spent — not a job-outreach path.',
    next: 'Write the one-page setup plan and a simple budget sheet today.',
    locked: 'Loan/scheme and scaling steps unlock only after a written plan and worker verification.',
    risk: 'No income is guaranteed; start small and verify schemes from official sources before paying anyone.',
    outcome: 'A verified, low-risk plan from setup to first sales.',
  },
  job: {
    why: 'This route is a direct, location-aware job search with resume/proof readiness and consent-based outreach, not a long training detour.',
    next: 'Confirm role/commute, fix the resume/proof gap, then shortlist leads today.',
    locked: 'Outreach uses only the fields you consent to share.',
    risk: 'Offline roles need a verified location and safe commute before you travel.',
    outcome: 'A tracked application pipeline toward a real interview.',
  },
  vocational: {
    why: 'This route finds the right local/online training plus phone-first practice so you build proof while a center is verified.',
    next: 'Shortlist one local and one online option, then start the first practice task today.',
    locked: 'Offline center/commute steps stay locked until location and safety are confirmed.',
    risk: 'Waiting for a course seat can become dropout time; start phone-first practice now.',
    outcome: 'Verified training plus early proof for apprenticeship or entry work.',
  },
  generic: {
    why: 'This route is the shortest credible step from your current profile toward your goal.',
    next: 'Build the weekly plan and finish the first proof task today.',
    locked: 'The next step unlocks after proof, location (if offline), and consent.',
    risk: 'Confirm time, location, and proof so the plan stays realistic.',
    outcome: 'Clear, visible progress toward your goal.',
  },
};

const FAMILY_EXPLANATIONS_I18N = {
  hinglish: {
    entrance_exam: {
      why: 'Yeh rasta exam track par rakhta hai: syllabus, concepts, practice, mocks aur error-log. Job ya random training abhi distract nahi karegi.',
      next: 'Study plan kholo aur aaj pehla syllabus/diagnostic block shuru karo.',
      locked: 'Exam-prep mode mein job, training aur outreach cards locked rahenge.',
      risk: 'Sirf video dekhna progress nahi hai; har block ke end mein solved questions aur error-log chahiye.',
      outcome: 'Career step se pehle syllabus coverage, accuracy aur mock score better hoga.',
    },
    board_exam: {
      why: 'Yeh rasta official NCERT/DIKSHA aur sample papers use karta hai, taki job route se pehle board marks improve ho.',
      next: 'NCERT/revision block shuru karo aur aaj ek practice set solve karo.',
      locked: 'Board exam preparation ke dauran job aur outreach cards locked rahenge.',
      risk: 'Random videos se mistakes repeat hoti hain; har week mistake log rakho.',
      outcome: 'Board marks aur next pathway eligibility dono strong honge.',
    },
    school_study: {
      why: 'Yeh rasta aapki class aur subjects ke hisaab se NCERT/DIKSHA practice se weak chapters fix karta hai.',
      next: 'Ek weak chapter chuno aur aaj pehla practice set finish karo.',
      locked: 'School study help ke liye job/outreach cards nahi dikhaye jaate.',
      risk: 'Mistake tracking ke bina same errors test mein repeat honge.',
      outcome: 'Concepts clear, marks better, aur daily study habit steady hogi.',
    },
    data_science_job: {
      why: 'Yeh rasta data-science hiring stack banata hai: Python, SQL, real project/portfolio, resume aur consent-based outreach.',
      next: 'Readiness gap-check karo, phir aaj pehla portfolio project task shuru karo.',
      locked: 'Employer outreach sirf verifiable project/proof aur consent ke baad khulega.',
      risk: 'Sirf course certificate se shortlisting mushkil hoti hai; shareable project proof zyada important hai.',
      outcome: 'Fresher/analyst/internship roles ke liye shortlist-ready profile.',
    },
    college: {
      why: 'Yeh rasta college profile ko internship/project-ready proof mein badalta hai: portfolio, resume aur outreach.',
      next: 'Profile/portfolio gap map banao, phir aaj ek project proof add karo.',
      locked: 'Outreach resume/portfolio proof aur consent ke baad khulega.',
      risk: 'Project proof ke bina applications silent reject ho sakti hain.',
      outcome: 'Internships, projects aur fresher roles ke liye stronger shortlisting.',
    },
    informal_skill: {
      why: 'Yeh rasta existing hands-on skill ko proof banata hai: photo/video/RPL. Beginner course zaroori nahi.',
      next: 'Aaj ek sample-work proof photo/video/voice note capture karo.',
      locked: 'Local work/outreach enough proof ya RPL-grade evidence aur consent ke baad khulega.',
      risk: 'Certificate na hona barrier nahi; unverified claim barrier hai. Clear sample proof rakho.',
      outcome: 'Trusted Skill Passport jo local work, RPL ya apprenticeship unlock karega.',
    },
    enterprise: {
      why: 'Yeh rasta paise kharch karne se pehle setup, budget, scheme/loan eligibility, buyers aur risk check karta hai.',
      next: 'Aaj one-page setup plan aur simple budget sheet likho.',
      locked: 'Loan/scheme aur scaling steps written plan aur worker verification ke baad khulenge.',
      risk: 'Income guarantee nahi hoti; chhota start karo aur official sources se scheme verify karo.',
      outcome: 'Setup se first sales tak verified, low-risk plan.',
    },
    job: {
      why: 'Yeh direct, location-aware job search hai jisme resume/proof readiness aur consent-based outreach hai.',
      next: 'Role/commute confirm karo, resume/proof gap fix karo, phir aaj leads shortlist karo.',
      locked: 'Outreach sirf wahi fields use karega jinke liye aap consent doge.',
      risk: 'Offline roles ke liye travel se pehle verified location aur safe commute chahiye.',
      outcome: 'Real interview tak tracked application pipeline.',
    },
    vocational: {
      why: 'Yeh rasta local/online training ke saath phone-first practice deta hai, taki centre verify hote waqt proof banta rahe.',
      next: 'Ek local aur ek online option shortlist karo, phir aaj pehla practice task shuru karo.',
      locked: 'Offline centre/commute steps location aur safety confirm hone tak locked rahenge.',
      risk: 'Course seat ka wait dropout time ban sakta hai; phone-first practice abhi shuru karo.',
      outcome: 'Verified training plus apprenticeship/entry work ke liye early proof.',
    },
    generic: {
      why: 'Yeh aapke current profile se goal tak ka sabse chhota bharosemand step hai.',
      next: 'Weekly plan banao aur aaj pehla proof task finish karo.',
      locked: 'Next step proof, location (agar offline hai), aur consent ke baad khulega.',
      risk: 'Time, location aur proof confirm karo taki plan realistic rahe.',
      outcome: 'Aapke goal ki taraf clear, visible progress.',
    },
  },
  hi: {
    entrance_exam: {
      why: 'यह रास्ता आपको exam track पर रखता है: syllabus, concepts, practice, mocks और error-log. अभी job या random training distract नहीं करेगी.',
      next: 'Study plan खोलें और आज पहला syllabus/diagnostic block शुरू करें.',
      locked: 'Exam-prep mode में job, training और outreach cards locked रहेंगे.',
      risk: 'सिर्फ video देखना progress नहीं है; हर block के अंत में solved questions और error-log जरूरी है.',
      outcome: 'Career step से पहले syllabus coverage, accuracy और mock score बेहतर होंगे.',
    },
    board_exam: {
      why: 'यह रास्ता official NCERT/DIKSHA और sample papers से board marks सुधारता है, job route से पहले.',
      next: 'NCERT/revision block शुरू करें और आज एक practice set solve करें.',
      locked: 'Board exam preparation के दौरान job और outreach cards locked रहेंगे.',
      risk: 'Random videos से mistakes repeat होती हैं; हर week mistake log रखें.',
      outcome: 'Board marks और next pathway eligibility मजबूत होगी.',
    },
    school_study: {
      why: 'यह रास्ता आपकी class और subjects के हिसाब से NCERT/DIKSHA practice से weak chapters ठीक करता है.',
      next: 'एक weak chapter चुनें और आज पहला practice set finish करें.',
      locked: 'School study help में job/outreach cards नहीं दिखाए जाते.',
      risk: 'Mistake tracking के बिना वही errors test में repeat होंगे.',
      outcome: 'Concepts clear होंगे, marks बेहतर होंगे, और daily study habit बनेगी.',
    },
    data_science_job: {
      why: 'यह रास्ता Data Science hiring stack बनाता है: Python, SQL, real project/portfolio, resume और consent-based outreach.',
      next: 'Readiness gap-check करें, फिर आज पहला portfolio project task शुरू करें.',
      locked: 'Employer outreach verifiable project/proof और consent के बाद ही खुलेगा.',
      risk: 'सिर्फ course certificate से shortlisting मुश्किल है; shareable project proof ज्यादा जरूरी है.',
      outcome: 'Fresher/analyst/internship roles के लिए shortlist-ready profile.',
    },
    college: {
      why: 'यह रास्ता college profile को internship/project-ready proof में बदलता है: portfolio, resume और outreach.',
      next: 'Profile/portfolio gap map बनाएं, फिर आज एक project proof जोड़ें.',
      locked: 'Outreach resume/portfolio proof और consent के बाद खुलेगा.',
      risk: 'Project proof के बिना applications silent reject हो सकती हैं.',
      outcome: 'Internships, projects और fresher roles के लिए stronger shortlisting.',
    },
    informal_skill: {
      why: 'यह रास्ता आपकी existing hands-on skill को proof बनाता है: photo/video/RPL. Beginner course जरूरी नहीं.',
      next: 'आज एक sample-work proof photo/video/voice note capture करें.',
      locked: 'Local work/outreach enough proof या RPL-grade evidence और consent के बाद खुलेगा.',
      risk: 'Certificate न होना barrier नहीं; unverified claim barrier है. Clear sample proof रखें.',
      outcome: 'Trusted Skill Passport जो local work, RPL या apprenticeship unlock करेगा.',
    },
    enterprise: {
      why: 'यह रास्ता पैसे खर्च करने से पहले setup, budget, scheme/loan eligibility, buyers और risk check करता है.',
      next: 'आज one-page setup plan और simple budget sheet लिखें.',
      locked: 'Loan/scheme और scaling steps written plan और worker verification के बाद खुलेंगे.',
      risk: 'Income guarantee नहीं होती; छोटा start करें और official sources से scheme verify करें.',
      outcome: 'Setup से first sales तक verified, low-risk plan.',
    },
    job: {
      why: 'यह direct, location-aware job search है जिसमें resume/proof readiness और consent-based outreach है.',
      next: 'Role/commute confirm करें, resume/proof gap fix करें, फिर आज leads shortlist करें.',
      locked: 'Outreach केवल वही fields use करेगा जिनके लिए आप consent देंगे.',
      risk: 'Offline roles के लिए travel से पहले verified location और safe commute चाहिए.',
      outcome: 'Real interview तक tracked application pipeline.',
    },
    vocational: {
      why: 'यह रास्ता local/online training के साथ phone-first practice देता है, ताकि centre verify होते समय proof बनता रहे.',
      next: 'एक local और एक online option shortlist करें, फिर आज पहला practice task शुरू करें.',
      locked: 'Offline centre/commute steps location और safety confirm होने तक locked रहेंगे.',
      risk: 'Course seat का wait dropout time बन सकता है; phone-first practice अभी शुरू करें.',
      outcome: 'Verified training plus apprenticeship/entry work के लिए early proof.',
    },
    generic: {
      why: 'यह आपके current profile से goal तक का सबसे छोटा भरोसेमंद step है.',
      next: 'Weekly plan बनाएं और आज पहला proof task finish करें.',
      locked: 'Next step proof, location (अगर offline है), और consent के बाद खुलेगा.',
      risk: 'Time, location और proof confirm करें ताकि plan realistic रहे.',
      outcome: 'आपके goal की तरफ clear, visible progress.',
    },
  },
  or: {
    entrance_exam: {
      why: 'ଏହି ବାଟ exam track ରେ ରଖେ: syllabus, concepts, practice, mocks ଏବଂ error-log. ଏବେ job/training distraction ନୁହେଁ.',
      next: 'Study plan ଖୋଲନ୍ତୁ ଏବଂ ଆଜି ପ୍ରଥମ syllabus/diagnostic block ଆରମ୍ଭ କରନ୍ତୁ.',
      locked: 'Exam-prep mode ରେ job, training ଏବଂ outreach cards locked ରହିବ.',
      risk: 'କେବଳ video ଦେଖିବା progress ନୁହେଁ; ପ୍ରତି block ଶେଷରେ solved questions ଏବଂ error-log ଦରକାର.',
      outcome: 'Career step ପୂର୍ବରୁ syllabus coverage, accuracy ଏବଂ mock score ଭଲ ହେବ.',
    },
    board_exam: {
      why: 'ଏହି ବାଟ official NCERT/DIKSHA ଏବଂ sample papers ଦ୍ୱାରା board marks ସୁଧାରେ.',
      next: 'NCERT/revision block ଆରମ୍ଭ କରନ୍ତୁ ଏବଂ ଆଜି ଗୋଟିଏ practice set solve କରନ୍ତୁ.',
      locked: 'Board exam preparation ସମୟରେ job ଏବଂ outreach cards locked ରହିବ.',
      risk: 'Random videos ଦେଖିଲେ mistakes repeat ହୁଏ; ପ୍ରତି week mistake log ରଖନ୍ତୁ.',
      outcome: 'Board marks ଏବଂ next pathway eligibility ମଜବୁତ ହେବ.',
    },
    school_study: {
      why: 'ଏହି ବାଟ ଆପଣଙ୍କ class/subjects ଅନୁସାରେ NCERT/DIKSHA practice ଦ୍ୱାରା weak chapters ଠିକ କରେ.',
      next: 'ଗୋଟିଏ weak chapter ବାଛନ୍ତୁ ଏବଂ ଆଜି ପ୍ରଥମ practice set finish କରନ୍ତୁ.',
      locked: 'School study help ପାଇଁ job/outreach cards ଦେଖାଯାଏ ନାହିଁ.',
      risk: 'Mistake tracking ନଥିଲେ ସେହି errors test ରେ repeat ହେବ.',
      outcome: 'Concepts clear, marks better, ଏବଂ daily study habit steady ହେବ.',
    },
    data_science_job: {
      why: 'ଏହି ବାଟ Data Science hiring stack ତିଆରି କରେ: Python, SQL, project/portfolio, resume ଏବଂ consent-based outreach.',
      next: 'Readiness gap-check କରନ୍ତୁ, ପରେ ଆଜି ପ୍ରଥମ portfolio project task ଆରମ୍ଭ କରନ୍ତୁ.',
      locked: 'Employer outreach କେବଳ verifiable project/proof ଏବଂ consent ପରେ ଖୁଲିବ.',
      risk: 'କେବଳ course certificate ରେ shortlisting କଷ୍ଟକର; shareable project proof ଅଧିକ ଜରୁରୀ.',
      outcome: 'Fresher/analyst/internship roles ପାଇଁ shortlist-ready profile.',
    },
    college: {
      why: 'ଏହି ବାଟ college profile କୁ internship/project-ready proof କରେ: portfolio, resume ଏବଂ outreach.',
      next: 'Profile/portfolio gap map କରନ୍ତୁ, ପରେ ଆଜି ଗୋଟିଏ project proof ଯୋଡନ୍ତୁ.',
      locked: 'Outreach resume/portfolio proof ଏବଂ consent ପରେ ଖୁଲିବ.',
      risk: 'Project proof ନଥିଲେ applications silent reject ହୋଇପାରେ.',
      outcome: 'Internships, projects ଏବଂ fresher roles ପାଇଁ stronger shortlisting.',
    },
    informal_skill: {
      why: 'ଏହି ବାଟ existing hands-on skill କୁ proof କରେ: photo/video/RPL. Beginner course ଦରକାର ନୁହେଁ.',
      next: 'ଆଜି ଗୋଟିଏ sample-work proof photo/video/voice note capture କରନ୍ତୁ.',
      locked: 'Local work/outreach enough proof କିମ୍ବା RPL-grade evidence ଏବଂ consent ପରେ ଖୁଲିବ.',
      risk: 'Certificate ନଥିବା barrier ନୁହେଁ; unverified claim barrier. Clear sample proof ରଖନ୍ତୁ.',
      outcome: 'Trusted Skill Passport ଯାହା local work, RPL କିମ୍ବା apprenticeship unlock କରିବ.',
    },
    enterprise: {
      why: 'ଏହି ବାଟ ଟଙ୍କା ଖର୍ଚ୍ଚ ପୂର୍ବରୁ setup, budget, scheme/loan eligibility, buyers ଏବଂ risk check କରେ.',
      next: 'ଆଜି one-page setup plan ଏବଂ simple budget sheet ଲେଖନ୍ତୁ.',
      locked: 'Loan/scheme ଏବଂ scaling steps written plan ଓ worker verification ପରେ ଖୁଲିବ.',
      risk: 'Income guarantee ନାହିଁ; ଛୋଟ ଆରମ୍ଭ କରନ୍ତୁ ଏବଂ official sources ରୁ scheme verify କରନ୍ତୁ.',
      outcome: 'Setup ରୁ first sales ପର୍ଯ୍ୟନ୍ତ verified, low-risk plan.',
    },
    job: {
      why: 'ଏହା direct, location-aware job search; resume/proof readiness ଏବଂ consent-based outreach ସହିତ.',
      next: 'Role/commute confirm କରନ୍ତୁ, resume/proof gap fix କରନ୍ତୁ, ପରେ ଆଜି leads shortlist କରନ୍ତୁ.',
      locked: 'Outreach କେବଳ consent ଦେଇଥିବା fields use କରିବ.',
      risk: 'Offline roles ପାଇଁ travel ପୂର୍ବରୁ verified location ଏବଂ safe commute ଦରକାର.',
      outcome: 'Real interview ପର୍ଯ୍ୟନ୍ତ tracked application pipeline.',
    },
    vocational: {
      why: 'ଏହି ବାଟ local/online training ସହ phone-first practice ଦେଏ, ଯେତେବେଳେ centre verify ହୁଏ proof ବନେ.',
      next: 'ଗୋଟିଏ local ଏବଂ ଗୋଟିଏ online option shortlist କରନ୍ତୁ, ପରେ ଆଜି ପ୍ରଥମ practice task ଆରମ୍ଭ କରନ୍ତୁ.',
      locked: 'Offline centre/commute steps location ଏବଂ safety confirm ହେଉଅ ପର୍ଯ୍ୟନ୍ତ locked ରହିବ.',
      risk: 'Course seat ପାଇଁ wait କଲେ dropout time ହୋଇପାରେ; phone-first practice ଏବେ ଆରମ୍ଭ କରନ୍ତୁ.',
      outcome: 'Verified training plus apprenticeship/entry work ପାଇଁ early proof.',
    },
    generic: {
      why: 'ଏହା current profile ରୁ goal ପର୍ଯ୍ୟନ୍ତ ସବୁଠାରୁ ଛୋଟ credible step.',
      next: 'Weekly plan ବନାନ୍ତୁ ଏବଂ ଆଜି ପ୍ରଥମ proof task finish କରନ୍ତୁ.',
      locked: 'Next step proof, location (offline ହେଲେ), ଏବଂ consent ପରେ ଖୁଲିବ.',
      risk: 'Time, location ଏବଂ proof confirm କରନ୍ତୁ ଯାହାଦ୍ୱାରା plan realistic ରହିବ.',
      outcome: 'ଆପଣଙ୍କ goal ଦିଗରେ clear, visible progress.',
    },
  },
};

const TEXT_REPLACEMENTS = {
  hinglish: [
    [/This is the foundation week:/gi, 'Yeh foundation week hai:'],
    [/Builds on the previous week so that/gi, 'Pichhle week ke baad yeh help karega:'],
    [/Finish Week (\d+) lessons\/practice and save/gi, 'Week $1 lessons/practice finish karo aur save karo:'],
    [/Finish the lesson\/practice, tap it done, then save a short proof note or photo\./gi, 'Lesson/practice finish karo, done tap karo, phir chhota proof note ya photo save karo.'],
    [/Start the first lesson and complete one small practice task today\./gi, 'Aaj pehla lesson shuru karo aur ek chhota practice task complete karo.'],
    [/a short note or photo of what you completed/gi, 'jo complete kiya uska chhota note ya photo'],
    [/photo\/video or voice note/gi, 'photo/video ya voice note'],
    [/photo or note/gi, 'photo ya note'],
    [/sample work/gi, 'sample work'],
    [/mistake list/gi, 'mistake list'],
    [/error-log/gi, 'error-log'],
    [/solved questions/gi, 'solved questions'],
    [/practice set/gi, 'practice set'],
    [/weak chapter/gi, 'weak chapter'],
    [/resume/gi, 'resume'],
    [/proof/gi, 'proof'],
    [/lesson/gi, 'lesson'],
    [/task/gi, 'task'],
    [/next step/gi, 'agla step'],
    [/the next week/gi, 'agle week'],
  ],
  hi: [
    [/This is the foundation week:/gi, 'यह foundation week है:'],
    [/Builds on the previous week so that/gi, 'पिछले week के बाद यह मदद करेगा:'],
    [/Finish Week (\d+) lessons\/practice and save/gi, 'Week $1 के lessons/practice पूरा करें और save करें:'],
    [/Finish the lesson\/practice, tap it done, then save a short proof note or photo\./gi, 'Lesson/practice पूरा करें, done tap करें, फिर छोटा proof note या photo save करें.'],
    [/Start the first lesson and complete one small practice task today\./gi, 'आज पहला lesson शुरू करें और एक छोटा practice task पूरा करें.'],
    [/a short note or photo of what you completed/gi, 'जो पूरा किया उसका छोटा note या photo'],
    [/photo\/video or voice note/gi, 'photo/video या voice note'],
    [/photo or note/gi, 'photo या note'],
    [/sample work/gi, 'sample work'],
    [/mistake list/gi, 'mistake list'],
    [/error-log/gi, 'error-log'],
    [/solved questions/gi, 'solved questions'],
    [/practice set/gi, 'practice set'],
    [/weak chapter/gi, 'weak chapter'],
    [/resume/gi, 'resume'],
    [/proof/gi, 'proof'],
    [/lesson/gi, 'lesson'],
    [/task/gi, 'task'],
    [/next step/gi, 'अगला step'],
    [/the next week/gi, 'अगले week'],
  ],
  or: [
    [/This is the foundation week:/gi, 'ଏହା foundation week:'],
    [/Builds on the previous week so that/gi, 'ପୂର୍ବ week ପରେ ଏହା ସହାଯ୍ୟ କରେ:'],
    [/Finish Week (\d+) lessons\/practice and save/gi, 'Week $1 lessons/practice ସମାପ୍ତ କରନ୍ତୁ ଏବଂ save କରନ୍ତୁ:'],
    [/Finish the lesson\/practice, tap it done, then save a short proof note or photo\./gi, 'Lesson/practice ସମାପ୍ତ କରନ୍ତୁ, done tap କରନ୍ତୁ, ପରେ ଛୋଟ proof note କିମ୍ବା photo save କରନ୍ତୁ.'],
    [/Start the first lesson and complete one small practice task today\./gi, 'ଆଜି ପ୍ରଥମ lesson ଆରମ୍ଭ କରନ୍ତୁ ଏବଂ ଗୋଟିଏ ଛୋଟ practice task ସମାପ୍ତ କରନ୍ତୁ.'],
    [/a short note or photo of what you completed/gi, 'କରିଥିବା କାମର ଛୋଟ note କିମ୍ବା photo'],
    [/photo\/video or voice note/gi, 'photo/video କିମ୍ବା voice note'],
    [/photo or note/gi, 'photo କିମ୍ବା note'],
    [/sample work/gi, 'sample work'],
    [/mistake list/gi, 'mistake list'],
    [/error-log/gi, 'error-log'],
    [/solved questions/gi, 'solved questions'],
    [/practice set/gi, 'practice set'],
    [/weak chapter/gi, 'weak chapter'],
    [/resume/gi, 'resume'],
    [/proof/gi, 'proof'],
    [/lesson/gi, 'lesson'],
    [/task/gi, 'task'],
    [/next step/gi, 'ପରବର୍ତ୍ତୀ step'],
    [/the next week/gi, 'ଆଗାମୀ week'],
  ],
};

function learnerLanguageCode(profile = {}, explicitLanguage = '') {
  const raw = String(explicitLanguage || profile.preferred_language || profile.language || '').toLowerCase();
  if (/hinglish|hindi\s*\+\s*english|hindi\+english/.test(raw)) return 'hinglish';
  if (/odia|oriya|ଓଡ଼ିଆ|ଓଡିଆ/.test(raw)) return 'or';
  if (/hindi|हिंदी|हिन्दी/.test(raw)) return 'hi';
  return 'en';
}

function localizeLearnerText(value = '', language = 'en') {
  if (language === 'en' || value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;
  return (TEXT_REPLACEMENTS[language] || []).reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

function localizeLearnerArray(values = [], language = 'en') {
  return Array.isArray(values) ? values.map((value) => localizeLearnerText(value, language)) : values;
}

function familyExplanation(family = 'generic', language = 'en') {
  const fallback = FAMILY_EXPLANATIONS[family] || FAMILY_EXPLANATIONS.generic;
  return {
    ...fallback,
    ...((FAMILY_EXPLANATIONS_I18N[language] || {})[family] || (FAMILY_EXPLANATIONS_I18N[language] || {}).generic || {}),
  };
}

function coerceText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((item) => coerceText(item)).filter(Boolean).join(', ') || fallback;
  if (typeof value === 'object') {
    return coerceText(value.label || value.title || value.name || value.text || value.value || value.description, fallback);
  }
  return fallback;
}

function routeTextOf(route = {}) {
  return [
    route.name,
    route.title,
    route.route_name,
    route.tradeoff,
    route.why_this_route,
    route.route_description,
    route.description,
    route.source_title,
    route.time,
    route.distance,
    route.income,
    ...(Array.isArray(route.focus_subjects) ? route.focus_subjects : []),
  ]
    .map((value) => coerceText(value))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function sameRouteName(a = {}, b = {}) {
  return coerceText(a.name).toLowerCase() === coerceText(b.name).toLowerCase() && coerceText(a.name) !== '';
}

export function goalFamily(profile = {}, context = {}) {
  const academicType = profile.academic_goal?.type || '';
  const goalType = profile.learner_goal?.type || '';
  const intent = profile.learner_goal?.intent || '';
  const text = `${(profile.aspirations || []).join(' ')} ${profile.class_level || ''} ${profile.education_status || ''} ${goalType}`.toLowerCase();
  const explicitNonStudyGoal =
    Boolean(intent && intent !== 'study') ||
    /job|training|career|enterprise|self_employment|informal_skill|local_office|college/i.test(goalType) ||
    /job|naukri|employment|hiring|vacancy|resume|typing|data entry|office assistant|customer service|self.?employment|business|enterprise|poultry|mushroom|shop|training|course|skill|college|internship|placement/i.test(
      text,
    );
  if (
    context.entrancePrep ||
    (!explicitNonStudyGoal &&
      (academicType === 'entrance_exam_prep' || /\bjee\b|\biit\b|\bneet\b|\bcuet\b|\bgate\b|\bclat\b|\bnda\b|entrance exam|competitive exam/.test(text)))
  ) {
    return 'entrance_exam';
  }
  if (['job_search_only', 'formal_skill_job_search', 'local_office_job', 'college_job_search'].includes(goalType) || intent === 'job') {
    const earlyDataScience = /data science|machine learning|data analyst|analytics|\bpython\b|\bsql\b|artificial intelligence/.test(text);
    if (earlyDataScience) return 'data_science_job';
    return 'job';
  }
  if (
    context.academicPrep ||
    (!explicitNonStudyGoal && (academicType === 'class_12_exam_prep' || /class 12|board exam|12th|twelfth/.test(text)))
  ) {
    return 'board_exam';
  }
  if (context.schoolStudy || (!explicitNonStudyGoal && academicType === 'school_study_support') || (/class \d/.test(text) && intent === 'study')) {
    return 'school_study';
  }
  if (goalType === 'self_employment_enterprise' || /poultry|mushroom|goat|dairy|food processing|enterprise|self.?employment|apna kaam/.test(text)) {
    return 'enterprise';
  }
  const dataScience = /data science|machine learning|data analyst|analytics|\bpython\b|\bsql\b|artificial intelligence/.test(text);
  if (['college_job_search', 'college_career', 'college_internship_project'].includes(goalType) || /college|btech|b\.tech|engineering|internship|project/.test(text)) {
    return dataScience && (intent === 'job' || /naukri|\bjob\b/.test(text)) ? 'data_science_job' : 'college';
  }
  if (dataScience && (intent === 'job' || /\bjob\b|naukri/.test(text))) return 'data_science_job';
  if (goalType === 'informal_skill_validation' || intent === 'proof_to_work' || /informal|\brpl\b|certificate nahi|workshop mein|seekha hai/.test(text)) {
    return 'informal_skill';
  }
  if (['job_search_only', 'formal_skill_job_search', 'local_office_job', 'college_job_search'].includes(goalType) || intent === 'job') return 'job';
  if (goalType === 'vocational_training' || intent === 'training') return 'vocational';
  return 'generic';
}

export function routeMatchesGoalFamily(profile = {}, route = {}, family = goalFamily(profile)) {
  const rules = ROUTE_FAMILY_RULES[family] || ROUTE_FAMILY_RULES.generic;
  const text = routeTextOf(route);
  if (!text) return false;
  if (rules.deny && rules.deny.test(text)) return false;
  return rules.requireAny ? rules.requireAny.test(text) : true;
}

// Specific vocations, so a mobile-repair learner never gets a beauty/tailoring
// card just because both say "training". A route is rejected when it clearly
// belongs to a different vocation than the learner's.
const VOCATIONS = {
  mobile_repair: /mobile repair|phone repair|smartphone repair|mobile technician|cellphone/i,
  mechanic: /\bmechanic\b|bike repair|motorcycle|two.?wheeler|automobile/i,
  beauty: /beauty|salon|mehandi|mehendi|wellness|beautician|parlour|parlor|makeup/i,
  tailoring: /tailor|silai|stitch|sewing|garment|boutique|alteration/i,
  cooking: /\bcook\b|\bchef\b|kitchen|hospitality|catering|\bhotel\b/i,
  electrician: /electrician|wireman|wiring|electrical/i,
  computer: /computer basics|data entry|typing|office assistant|cyber cafe|\bcsc\b/i,
  agriculture: /agriculture|farming|kheti|\bcrop\b|\bagri\b|\bfarm\b/i,
  driving: /\bdriver\b|driving|\blicense\b/i,
  video: /video creation|content creator|videograph/i,
};

function detectVocations(text = '') {
  return Object.entries(VOCATIONS)
    .filter(([, pattern]) => pattern.test(text))
    .map(([key]) => key);
}

function crossVocationConflict(profile = {}, route = {}) {
  const learnerText = `${(profile.aspirations || []).join(' ')} ${(profile.skills || []).join(' ')}`.toLowerCase();
  const learnerVocations = detectVocations(learnerText);
  if (!learnerVocations.length) return false;
  const routeVocations = detectVocations(routeTextOf(route));
  if (!routeVocations.length) return false;
  return !routeVocations.some((vocation) => learnerVocations.includes(vocation));
}

export function rejectUnrelatedRoute(profile = {}, route = {}, family = goalFamily(profile)) {
  if (!routeMatchesGoalFamily(profile, route, family)) return true;
  if (['vocational', 'informal_skill', 'generic', 'job'].includes(family) && crossVocationConflict(profile, route)) return true;
  return false;
}

export function validatePathwayRoutes(profile = {}, routes = [], options = {}) {
  const family = options.family || goalFamily(profile, options);
  const deterministic =
    Array.isArray(options.deterministic) && options.deterministic.length ? options.deterministic : sourceLimitedPathways(profile);
  const incoming = (Array.isArray(routes) ? routes : []).filter((route) => route && typeof route === 'object' && !Array.isArray(route));
  const kept = incoming.filter((route) => !rejectUnrelatedRoute(profile, route, family));
  const rejected = incoming.filter((route) => !kept.includes(route)).map((route) => coerceText(route.name, route.id || 'route'));
  const preferDeterministicFirst = deterministic[0]?.id === 'local-day-shift-office-job';
  let finalRoutes = preferDeterministicFirst ? [...deterministic] : [...kept];
  for (const det of deterministic) {
    if (finalRoutes.length >= 3) break;
    if (!finalRoutes.some((route) => sameRouteName(route, det))) finalRoutes.push(det);
  }
  if (preferDeterministicFirst) {
    for (const route of kept) {
      if (finalRoutes.length >= 3) break;
      if (!finalRoutes.some((item) => sameRouteName(item, route))) finalRoutes.push(route);
    }
  }
  if (!finalRoutes.length) finalRoutes = deterministic.slice(0, 3);
  finalRoutes = finalRoutes.slice(0, 3);
  return {
    family,
    routes: finalRoutes,
    incoming_count: incoming.length,
    kept_count: kept.length,
    rejected_count: incoming.length - kept.length,
    rejected,
    replaced: incoming.length === 0 || kept.length < incoming.length || finalRoutes.length > kept.length,
    used_deterministic: kept.length === 0,
  };
}

export function buildLocationGuardrail(profile = {}, options = {}) {
  const goalLabel = coerceText(profile.learner_goal?.label) || (profile.aspirations || [])[0] || 'your goal';
  const message =
    options.message ||
    `To find safe ${goalLabel} options near you, share your district or block (and how far you can travel safely). VidyaSetu will not guess your location or show far-off cards.`;
  return {
    routes: [],
    confidence: options.confidence ?? 0.7,
    callback_flag: true,
    callback_message: message,
    location_required: true,
    guardrail: 'location',
  };
}

export function decorateRouteExplanation(route = {}, context = {}) {
  const family = context.family || goalFamily(context.profile || {});
  const language = learnerLanguageCode(context.profile || {}, context.language);
  const defaults = familyExplanation(family, language);
  const facts = Array.isArray(context.matchedFacts) ? context.matchedFacts : [];
  const blockers = Array.isArray(context.blockers) ? context.blockers : [];
  const factLine = facts
    .slice(0, 3)
    .map((fact) => (typeof fact === 'string' ? fact : `${fact.label}: ${fact.value}`))
    .filter(Boolean)
    .join('; ');
  const tradeoff = localizeLearnerText(coerceText(route.tradeoff), language);
  const why = localizeLearnerText(coerceText(route.why_this_route), language) || tradeoff || defaults.why;
  return {
    ...route,
    tradeoff,
    time: localizeLearnerText(coerceText(route.time), language) || route.time,
    distance: localizeLearnerText(coerceText(route.distance), language) || route.distance,
    income: localizeLearnerText(coerceText(route.income), language) || route.income,
    why_this_route: factLine && !/matched:/i.test(why) ? `${why} (matched: ${factLine})` : why,
    matched_profile_facts:
      Array.isArray(route.matched_profile_facts) && route.matched_profile_facts.length ? route.matched_profile_facts : facts,
    next_action:
      localizeLearnerText(coerceText(route.next_action), language) ||
      localizeLearnerText(coerceText(context.nextAction), language) ||
      defaults.next,
    locked_until:
      localizeLearnerText(coerceText(route.locked_until), language) ||
      localizeLearnerText(coerceText(blockers[0]), language) ||
      defaults.locked,
    risk: localizeLearnerText(coerceText(route.risk) || coerceText(route.tradeoff_risk), language) || defaults.risk,
    expected_outcome: localizeLearnerText(coerceText(route.expected_outcome) || coerceText(route.income), language) || defaults.outcome,
  };
}

// ---------------------------------------------------------------------------
// Learner journey enrichment (makes each week clear and actionable)
// ---------------------------------------------------------------------------

function familyOutcome(family = 'generic', profile = {}) {
  return familyExplanation(family, learnerLanguageCode(profile)).outcome;
}

export function buildProofTask(family = 'generic', profile = {}) {
  const language = learnerLanguageCode(profile);
  const localized = {
    hinglish: {
      entrance_exam: 'aaj ke solved questions ka photo plus error-log entry',
      board_exam: 'NCERT/sample-paper questions ka photo aur score',
      school_study: 'solved practice ka photo aur mistake list',
      data_science_job: 'project notebook/dashboard link ya screenshot with 3-line summary',
      college: 'resume, portfolio, ya project proof link/screenshot',
      informal_skill: 'sample work ka photo/video ya voice note',
      enterprise: 'setup plan, budget sheet, ya buyer list',
      job: 'resume/proof aur contacted leads ki shortlist',
      vocational: 'practice sample ka photo ya note',
      generic: 'jo complete kiya uska chhota note ya photo',
    },
    hi: {
      entrance_exam: 'आज के solved questions का photo और error-log entry',
      board_exam: 'NCERT/sample-paper questions का photo और score',
      school_study: 'solved practice का photo और mistake list',
      data_science_job: 'project notebook/dashboard link या screenshot with 3-line summary',
      college: 'resume, portfolio, या project proof link/screenshot',
      informal_skill: 'sample work का photo/video या voice note',
      enterprise: 'setup plan, budget sheet, या buyer list',
      job: 'resume/proof और contacted leads की shortlist',
      vocational: 'practice sample का photo या note',
      generic: 'जो पूरा किया उसका छोटा note या photo',
    },
    or: {
      entrance_exam: 'ଆଜିର solved questions photo plus error-log entry',
      board_exam: 'NCERT/sample-paper questions photo ଏବଂ score',
      school_study: 'solved practice photo ଏବଂ mistake list',
      data_science_job: 'project notebook/dashboard link କିମ୍ବା screenshot with 3-line summary',
      college: 'resume, portfolio, କିମ୍ବା project proof link/screenshot',
      informal_skill: 'sample work photo/video କିମ୍ବା voice note',
      enterprise: 'setup plan, budget sheet, କିମ୍ବା buyer list',
      job: 'resume/proof ଏବଂ contacted leads shortlist',
      vocational: 'practice sample photo କିମ୍ବା note',
      generic: 'କରିଥିବା କାମର ଛୋଟ note କିମ୍ବା photo',
    },
  };
  if (localized[language]?.[family]) return localized[language][family];
  switch (family) {
    case 'entrance_exam':
      return 'a photo of today’s solved questions plus your error-log entry';
    case 'board_exam':
      return 'a photo of the NCERT/sample-paper questions you solved with your score';
    case 'school_study':
      return 'a photo of your solved practice and your mistake list';
    case 'data_science_job':
      return 'a project notebook/dashboard link or screenshot with a 3-line summary';
    case 'college':
      return 'a resume, portfolio, or project proof link/screenshot';
    case 'informal_skill':
      return 'a photo/video or voice note of your sample work';
    case 'enterprise':
      return 'your setup plan, budget sheet, or buyer list';
    case 'job':
      return 'your resume/proof and a shortlist of the leads you contacted';
    case 'vocational':
      return 'a photo or note of your practice sample';
    default:
      return 'a short note or photo of what you completed';
  }
}

export function buildTodayTask(family = 'generic', profile = {}, route = {}, firstModule = {}) {
  const language = learnerLanguageCode(profile);
  const micro =
    Array.isArray(firstModule.daily_micro_tasks) && firstModule.daily_micro_tasks.length ? coerceText(firstModule.daily_micro_tasks[0]) : '';
  if (micro) return micro.replace(/^day\s*1:\s*/i, '');
  const subjects = profile.academic_goal?.subjects?.length ? profile.academic_goal.subjects.join(', ') : 'your first topic';
  const localized = {
    hinglish: {
      entrance_exam: `${profile.academic_goal?.exam || 'exam'} syllabus ko red/yellow/green mark karo aur ${subjects} mein ek short diagnostic set solve karo.`,
      board_exam: `${subjects} mein ek weak chapter chuno, NCERT explanation padho, phir 5 questions solve karo.`,
      school_study: `${subjects} mein ek weak chapter chuno aur short practice set finish karke mistakes mark karo.`,
      data_science_job: 'Python, SQL, stats, project, resume readiness gap-check karo aur pehle project ke liye one public dataset chuno.',
      college: 'Current skills/projects list karo aur internship/project target ki one-line likho.',
      informal_skill: 'Apni skill explain karte hue 60-second voice/video record karo aur ek sample-work photo lo.',
      enterprise: 'Setup steps, space/equipment aur rough starting budget likho.',
      job: 'Target role, safe commute/relocation aur resume/proof gap confirm karo.',
      vocational: 'Ek local aur ek online training option shortlist karo aur commute/time limits set karo.',
      generic: 'Pehla lesson shuru karo aur aaj ek chhota practice task complete karo.',
    },
    hi: {
      entrance_exam: `${profile.academic_goal?.exam || 'exam'} syllabus को red/yellow/green mark करें और ${subjects} में एक short diagnostic set solve करें.`,
      board_exam: `${subjects} में एक weak chapter चुनें, NCERT explanation पढ़ें, फिर 5 questions solve करें.`,
      school_study: `${subjects} में एक weak chapter चुनें और short practice set finish करके mistakes mark करें.`,
      data_science_job: 'Python, SQL, stats, project, resume readiness gap-check करें और पहले project के लिए one public dataset चुनें.',
      college: 'Current skills/projects list करें और internship/project target की one-line लिखें.',
      informal_skill: 'अपनी skill explain करते हुए 60-second voice/video record करें और एक sample-work photo लें.',
      enterprise: 'Setup steps, space/equipment और rough starting budget लिखें.',
      job: 'Target role, safe commute/relocation और resume/proof gap confirm करें.',
      vocational: 'एक local और एक online training option shortlist करें और commute/time limits set करें.',
      generic: 'पहला lesson शुरू करें और आज एक छोटा practice task पूरा करें.',
    },
    or: {
      entrance_exam: `${profile.academic_goal?.exam || 'exam'} syllabus କୁ red/yellow/green mark କରନ୍ତୁ ଏବଂ ${subjects} ରେ short diagnostic set solve କରନ୍ତୁ.`,
      board_exam: `${subjects} ରେ ଗୋଟିଏ weak chapter ବାଛନ୍ତୁ, NCERT explanation ପଢନ୍ତୁ, ପରେ 5 questions solve କରନ୍ତୁ.`,
      school_study: `${subjects} ରେ ଗୋଟିଏ weak chapter ବାଛନ୍ତୁ ଏବଂ short practice set finish କରି mistakes mark କରନ୍ତୁ.`,
      data_science_job: 'Python, SQL, stats, project, resume readiness gap-check କରନ୍ତୁ ଏବଂ ପ୍ରଥମ project ପାଇଁ one public dataset ବାଛନ୍ତୁ.',
      college: 'Current skills/projects list କରନ୍ତୁ ଏବଂ internship/project target one-line ଲେଖନ୍ତୁ.',
      informal_skill: 'ନିଜ skill explain କରି 60-second voice/video record କରନ୍ତୁ ଏବଂ sample-work photo ନିଅନ୍ତୁ.',
      enterprise: 'Setup steps, space/equipment ଏବଂ rough starting budget ଲେଖନ୍ତୁ.',
      job: 'Target role, safe commute/relocation ଏବଂ resume/proof gap confirm କରନ୍ତୁ.',
      vocational: 'ଗୋଟିଏ local ଏବଂ ଗୋଟିଏ online training option shortlist କରନ୍ତୁ ଏବଂ commute/time limits set କରନ୍ତୁ.',
      generic: 'ପ୍ରଥମ lesson ଆରମ୍ଭ କରନ୍ତୁ ଏବଂ ଆଜି ଗୋଟିଏ ଛୋଟ practice task complete କରନ୍ତୁ.',
    },
  };
  if (localized[language]?.[family]) return localized[language][family];
  switch (family) {
    case 'entrance_exam':
      return `Mark the ${profile.academic_goal?.exam || 'exam'} syllabus as red/yellow/green and solve one short diagnostic set in ${subjects}.`;
    case 'board_exam':
      return `Pick one weak chapter in ${subjects} and read the NCERT explanation, then solve 5 questions.`;
    case 'school_study':
      return `Pick one weak chapter in ${subjects} and finish a short practice set, marking mistakes.`;
    case 'data_science_job':
      return 'Do the readiness gap-check (Python, SQL, stats, project, resume) and pick one public dataset for your first project.';
    case 'college':
      return 'List your current skills/projects and write a one-line internship/project target.';
    case 'informal_skill':
      return 'Record a 60-second voice or video explaining your skill, and capture one sample-work photo.';
    case 'enterprise':
      return 'Write the setup steps, the space/equipment you need, and a rough starting budget.';
    case 'job':
      return 'Confirm your target role, safe commute/relocation, and check your resume/proof gap.';
    case 'vocational':
      return 'Shortlist one local and one online training option and set your commute/time limits.';
    default:
      return 'Start the first lesson and complete one small practice task today.';
  }
}

function whyModuleMatters(family = 'generic', module = {}, index = 0, profile = {}) {
  const language = learnerLanguageCode(profile);
  const goal = coerceText(module.goal);
  const base = familyOutcome(family, profile);
  if (index === 0) return localizeLearnerText(`This is the foundation week: ${goal || base}`, language);
  return localizeLearnerText(goal ? `Builds on the previous week so that ${goal.charAt(0).toLowerCase()}${goal.slice(1)}` : base, language);
}

function lessonResourceFor(family = 'generic') {
  switch (family) {
    case 'entrance_exam':
      return { title: 'NCERT textbooks + official exam syllabus', type: 'official', source_url: 'https://ncert.nic.in/textbook.php' };
    case 'board_exam':
      return { title: 'NCERT + CBSE sample papers', type: 'official', source_url: 'https://ncert.nic.in/textbook.php' };
    case 'school_study':
      return { title: 'NCERT + DIKSHA practice', type: 'official', source_url: 'https://diksha.gov.in/' };
    case 'data_science_job':
    case 'college':
      return { title: 'Skill India Digital learning', type: 'official', source_url: 'https://www.skillindiadigital.gov.in/' };
    case 'enterprise':
      return { title: 'PM FME / MSME setup resources', type: 'official', source_url: 'https://www.pmfme.mofpi.gov.in/' };
    default:
      return { title: 'Skill India Digital learning', type: 'official', source_url: 'https://www.skillindiadigital.gov.in/' };
  }
}

function buildLessonDetail(lesson, index = 0, module = {}, family = 'generic', profile = {}) {
  const languageName = coerceText(profile.preferred_language) || coerceText(profile.language) || 'your language';
  const language = learnerLanguageCode(profile);
  const academic = /entrance_exam|board_exam|school_study/.test(family);
  const title = coerceText(lesson, `Lesson ${index + 1}`);
  return {
    title,
    type: academic ? (index === 0 ? 'concept' : 'practice') : index === 0 ? 'watch_or_listen' : 'do',
    estimated_time: academic ? '20-30 min' : '10-15 min',
    instructions: academic
      ? localizeLearnerText(`Open "${title}" in ${languageName}. Read or listen once, then solve at least 3 questions on it without looking at answers.`, language)
      : localizeLearnerText(`Open "${title}" in ${languageName}. Watch/listen once, then do the small task by hand or in your own words.`, language),
    completion_criteria: localizeLearnerText(`You can explain "${title}" in one line and finished its small task.`, language),
    proof_required: coerceText(module.proof_task) || coerceText(module.proof) || buildProofTask(family, profile),
    resource: lessonResourceFor(family),
  };
}

export function enrichModule(module = {}, family = 'generic', profile = {}, index = 0) {
  const language = learnerLanguageCode(profile);
  const lessons = localizeLearnerArray(Array.isArray(module.lessons) ? module.lessons : [], language);
  const dailyMicroTasks = localizeLearnerArray(Array.isArray(module.daily_micro_tasks) ? module.daily_micro_tasks : [], language);
  const practiceTasks = localizeLearnerArray(Array.isArray(module.practice_tasks) ? module.practice_tasks : [], language);
  const proofTasks = localizeLearnerArray(Array.isArray(module.proof_tasks) ? module.proof_tasks : [], language);
  const proofTask =
    localizeLearnerText(coerceText(module.proof_task), language) ||
    localizeLearnerText(coerceText(module.proof), language) ||
    (proofTasks.length ? coerceText(proofTasks[0]) : '') ||
    buildProofTask(family, profile);
  return {
    ...module,
    title: localizeLearnerText(module.title, language),
    goal: localizeLearnerText(module.goal, language),
    lessons,
    daily_micro_tasks: dailyMicroTasks,
    practice_tasks: practiceTasks,
    proof: localizeLearnerText(module.proof, language),
    proof_tasks: proofTasks,
    completion_criteria: localizeLearnerText(module.completion_criteria, language),
    low_data_alternative: localizeLearnerText(module.low_data_alternative, language),
    voice_whatsapp_version: localizeLearnerText(module.voice_whatsapp_version, language),
    counselor_response_after_completion: localizeLearnerText(module.counselor_response_after_completion, language),
    worker_check: localizeLearnerText(module.worker_check, language),
    why_it_matters: localizeLearnerText(coerceText(module.why_it_matters), language) || whyModuleMatters(family, module, index, profile),
    daily_plan: Array.isArray(module.daily_plan) && module.daily_plan.length ? localizeLearnerArray(module.daily_plan, language) : dailyMicroTasks,
    proof_task: proofTask,
    checkpoint:
      localizeLearnerText(coerceText(module.checkpoint), language) ||
      localizeLearnerText(coerceText(module.completion_criteria), language) ||
      localizeLearnerText(`Finish Week ${module.week || index + 1} lessons/practice and save ${proofTask}.`, language),
    unlocks:
      localizeLearnerText(coerceText(module.unlocks) || coerceText(module.unlock_after_completion) || coerceText(module.unlock), language) ||
      localizeLearnerText('the next step', language),
    lesson_details:
      Array.isArray(module.lesson_details) && module.lesson_details.length
        ? module.lesson_details.map((detail) => ({
            ...detail,
            title: localizeLearnerText(detail.title, language),
            instructions: localizeLearnerText(detail.instructions, language),
            completion_criteria: localizeLearnerText(detail.completion_criteria, language),
            proof_required: localizeLearnerText(detail.proof_required, language),
          }))
        : lessons.map((lesson, lessonIndex) => buildLessonDetail(lesson, lessonIndex, module, family, profile)),
  };
}

// ---------------------------------------------------------------------------
// "This week" hyperlocal actions
// Concrete steps a learner can physically take this week. Only real official
// portals and real local-action TYPES are used. No fabricated employers,
// phone numbers, or specific job listings.
// ---------------------------------------------------------------------------

const OFFICIAL = {
  ncs: { title: 'National Career Service (NCS)', url: 'https://www.ncs.gov.in/' },
  skillIndia: { title: 'Skill India Digital', url: 'https://www.skillindiadigital.gov.in/' },
  pmkvy: { title: 'PMKVY / Skill India', url: 'https://www.pmkvyofficial.org/' },
  digilocker: { title: 'DigiLocker', url: 'https://www.digilocker.gov.in/' },
  nsp: { title: 'National Scholarship Portal', url: 'https://scholarships.gov.in/' },
  ncert: { title: 'NCERT official textbooks', url: 'https://ncert.nic.in/textbook.php' },
  diksha: { title: 'DIKSHA', url: 'https://diksha.gov.in/' },
  jee: { title: 'NTA JEE Main', url: 'https://jeemain.nta.ac.in/' },
  cbseSqp: { title: 'CBSE sample papers', url: 'https://cbseacademic.nic.in/' },
  udyam: { title: 'Udyam registration', url: 'https://udyamregistration.gov.in/' },
  pmegp: { title: 'PMEGP / KVIC', url: 'https://www.kviconline.gov.in/pmegpeportal/' },
  pmfme: { title: 'PM FME (MoFPI)', url: 'https://www.pmfme.mofpi.gov.in/' },
};

function action(id, type, title, how, source, byWhen = 'This week') {
  return { id, type, title, how, source_title: source.title, source_url: source.url, by_when: byWhen };
}

const THIS_WEEK_ACTION_I18N = {
  hinglish: {
    'tw-skill-passport': {
      title: 'Meera ke saath Skill Passport banao (resume zaroori nahi)',
      how: 'Meera se chat karte raho. Woh aapke jawab ko share karne layak proof mein badalti hai; formal resume likhna zaroori nahi.',
    },
    'tw-ncs': {
      title: 'Free National Career Service account banao',
      how: ({ place }) => `Link kholo, phone number se sign up karo, aur district ${place} set karo taki nearby jobs/job-melas mil sakein.`,
    },
    'tw-digilocker': {
      title: 'Documents ke liye DigiLocker set up karo',
      how: 'Phone + Aadhaar se DigiLocker banao taki marksheets/certificates safe aur one-tap shareable rahen.',
    },
    'tw-set-area': {
      title: 'Meera ko exact block / panchayat batao',
      how: ({ place }) => `Abhi hum "${place}" ke paas options dikhate hain. Block ya panchayat share karo taki centre/work sach mein reach ke andar ho.`,
    },
    'tw-jee-syllabus': { title: 'Aaj official exam syllabus download karo', how: 'Official exam site kholo, latest syllabus save karo, aur jo chapters start nahi hue unhe tick karo.' },
    'tw-ncert-start': { title: 'Ek NCERT chapter shuru karo aur 10 questions solve karo', how: 'Sabse weak topic chuno, NCERT explanation padho, phir 10 questions solve karke har mistake note karo.' },
    'tw-mock': { title: 'Is week ek timed practice set do', how: 'Ek timed section karo, phir har wrong answer ko revision note (error log) banao.' },
    'tw-ncert-board': { title: 'Ek NCERT chapter + back exercises finish karo', how: 'Chapter padho, solved examples redo karo, exercise complete karo, aur wrong answers mistake log mein mark karo.' },
    'tw-sample-paper': { title: 'Ek CBSE/board sample-paper section solve karo', how: 'Sample paper download karo, one section time mein solve karo, phir marking scheme se compare karo.' },
    'tw-scholarship': { title: 'NSP par scholarship eligibility check karo', how: 'National Scholarship Portal kholo, pre/post-matric eligibility check karo, aur application deadline note karo.', by_when: 'Portal deadline se pehle' },
    'tw-diksha-chapter': { title: 'Aaj ek DIKSHA chapter + practice karo', how: 'DIKSHA kholo, weak chapter ka short lesson dekho, phir practice questions solve karo.' },
    'tw-ncert-school': { title: '8 NCERT questions solve karo aur mistakes list karo', how: 'Ek subject chuno, NCERT se 8 questions solve karo, aur kis type mein galti hui likho.' },
    'tw-scholarship-school': { title: 'Teacher/parent ke saath NSP scholarship check karo', how: 'Guardian ke saath National Scholarship Portal kholo aur dekho aapki class kis scholarship ke liye eligible hai.', by_when: 'Portal deadline se pehle' },
    'tw-ds-project': { title: 'Ek public dataset chuno aur mini-project shuru karo', how: 'Simple dataset choose karo, clean karo, aur 6-line summary likho; yeh portfolio proof banega.' },
    'tw-ncs-analyst': { title: 'NCS par "data entry / analyst" roles search karo', how: ({ place }) => `NCS par register karo aur ${place} plus remote filter ke saath analyst/data roles search karo.` },
    'tw-skillindia-course': { title: 'Ek free Python/SQL module mein enrol karo', how: 'Ek short Python ya SQL module start karo taki skill current aur certifiable ho.' },
    'tw-portfolio': { title: 'Ek project se do strong resume bullets likho', how: 'College project lo aur profile ke liye do clear result-focused lines likho.' },
    'tw-ncs-intern': { title: 'NCS par internships/projects search karo', how: ({ place }) => `${place} aur remote ke aas-paas internship/apprenticeship listings search karo.` },
    'tw-skillindia-cert': { title: 'Ek free certified short course add karo', how: 'Goal se matching ek course chuno taki profile mein verifiable certificate aaye.' },
    'tw-sample-proof': { title: 'Aaj ek sample-work photo/video capture karo', how: 'Apna ek work sample banao aur clear photo ya 30-second video proof ke roop mein save karo.' },
    'tw-rpl': { title: 'Skill India par RPL recognition check karo', how: 'Dekho kya existing skill ko long course ke bina RPL certificate mil sakta hai.' },
    'tw-local-work': { title: ({ place }) => `${place} ke paas 3 shops/customers se chhota kaam poochho`, how: 'Teen nearby shops ya past customers list karo aur ek chhota paid task/trial poochho; proof ke saath earning shuru karo.' },
    'tw-setup-plan': { title: 'One-page setup plan + rough budget likho', how: 'Space, equipment aur realistic starting cost list karo; risk kam rakhne ke liye small start karo.' },
    'tw-udyam': { title: 'Udyam par free MSME ID register karo', how: 'Free Udyam registration baad mein schemes aur buyer trust unlock kar sakta hai.' },
    'tw-pmegp': { title: 'PMEGP/PMFME loan-scheme eligibility check karo', how: 'Scheme portal kholo, eligibility aur documents check karo, phir hi paise kharch karo.', by_when: 'Is week' },
    'tw-buyers': { title: ({ place }) => `${place} ke paas 5 possible buyers/customers list karo`, how: 'Paanch nearby people/shops likho jo kharid sakte hain, aur fair first price note karo.' },
    'tw-ncs-job': { title: 'NCS par register karo aur 5 local roles shortlist karo', how: ({ place }) => `Sign up karo, district ${place} aur commute limit set karo, phir apply ke liye five roles shortlist karo.` },
    'tw-proof': { title: 'Meera se one-page proof summary banwao', how: 'Meera ke questions answer karo; woh truthful proof summary banati hai taki formal resume zaroori na ho.' },
    'tw-walkin': { title: ({ place }) => `${place} ke paas 2 local enquiries ke liye prepare karo`, how: 'Do nearby workplaces chuno aur visit se pehle Meera ke saath 30-second introduction practice karo.' },
    'tw-pmkvy-center': { title: 'Nearest PMKVY/Skill India training centre dhoondo', how: ({ place }) => `Centre locator kholo aur ${place} ke closest centre, course aur fees note karo.` },
    'tw-skillindia-start': { title: 'Abhi ek free foundation module start karo', how: 'Phone-first short module shuru karo taki local centre confirm hote waqt proof banta rahe.' },
    'tw-practice-proof': { title: 'Ek practice task karo aur proof save karo', how: 'Ek chhota hands-on task complete karo aur first proof ke roop mein photo/note save karo.' },
    'tw-skillindia-explore': { title: 'Ek free Skill India course explore karo', how: 'Skill India Digital kholo aur interest se matching ek short course start karo.' },
    'tw-ncs-explore': { title: 'Local opportunities ke liye NCS register karo', how: ({ place }) => `NCS account banao aur district ${place} set karo.` },
  },
  hi: {
    'tw-skill-passport': { title: 'Meera के साथ Skill Passport बनाएं (resume जरूरी नहीं)', how: 'Meera से chat करते रहें. वह आपके जवाब को share करने लायक proof में बदलती है; formal resume लिखना जरूरी नहीं.' },
    'tw-ncs': { title: 'Free National Career Service account बनाएं', how: ({ place }) => `Link खोलें, phone number से sign up करें, और district ${place} set करें ताकि nearby jobs/job-melas मिलें.` },
    'tw-digilocker': { title: 'Documents के लिए DigiLocker set up करें', how: 'Phone + Aadhaar से DigiLocker बनाएं ताकि marksheets/certificates safe और one-tap shareable रहें.' },
    'tw-set-area': { title: 'Meera को exact block / panchayat बताएं', how: ({ place }) => `अभी हम "${place}" के पास options दिखाते हैं. Block या panchayat share करें ताकि centre/work सच में reach के अंदर हो.` },
    'tw-jee-syllabus': { title: 'आज official exam syllabus download करें', how: 'Official exam site खोलें, latest syllabus save करें, और जो chapters start नहीं हुए उन्हें tick करें.' },
    'tw-ncert-start': { title: 'एक NCERT chapter शुरू करें और 10 questions solve करें', how: 'सबसे weak topic चुनें, NCERT explanation पढ़ें, फिर 10 questions solve करके हर mistake note करें.' },
    'tw-mock': { title: 'इस week एक timed practice set दें', how: 'एक timed section करें, फिर हर wrong answer को revision note (error log) बनाएं.' },
    'tw-ncert-board': { title: 'एक NCERT chapter + back exercises finish करें', how: 'Chapter पढ़ें, solved examples redo करें, exercise complete करें, और wrong answers mistake log में mark करें.' },
    'tw-sample-paper': { title: 'एक CBSE/board sample-paper section solve करें', how: 'Sample paper download करें, one section time में solve करें, फिर marking scheme से compare करें.' },
    'tw-scholarship': { title: 'NSP पर scholarship eligibility check करें', how: 'National Scholarship Portal खोलें, pre/post-matric eligibility check करें, और application deadline note करें.', by_when: 'Portal deadline से पहले' },
    'tw-diksha-chapter': { title: 'आज एक DIKSHA chapter + practice करें', how: 'DIKSHA खोलें, weak chapter का short lesson देखें, फिर practice questions solve करें.' },
    'tw-ncert-school': { title: '8 NCERT questions solve करें और mistakes list करें', how: 'एक subject चुनें, NCERT से 8 questions solve करें, और किस type में गलती हुई लिखें.' },
    'tw-scholarship-school': { title: 'Teacher/parent के साथ NSP scholarship check करें', how: 'Guardian के साथ National Scholarship Portal खोलें और देखें आपकी class किस scholarship के लिए eligible है.', by_when: 'Portal deadline से पहले' },
    'tw-ds-project': { title: 'एक public dataset चुनें और mini-project शुरू करें', how: 'Simple dataset choose करें, clean करें, और 6-line summary लिखें; यह portfolio proof बनेगा.' },
    'tw-ncs-analyst': { title: 'NCS पर "data entry / analyst" roles search करें', how: ({ place }) => `NCS पर register करें और ${place} plus remote filter के साथ analyst/data roles search करें.` },
    'tw-skillindia-course': { title: 'एक free Python/SQL module में enrol करें', how: 'एक short Python या SQL module start करें ताकि skill current और certifiable हो.' },
    'tw-portfolio': { title: 'एक project से दो strong resume bullets लिखें', how: 'College project लें और profile के लिए दो clear result-focused lines लिखें.' },
    'tw-ncs-intern': { title: 'NCS पर internships/projects search करें', how: ({ place }) => `${place} और remote के आसपास internship/apprenticeship listings search करें.` },
    'tw-skillindia-cert': { title: 'एक free certified short course add करें', how: 'Goal से matching एक course चुनें ताकि profile में verifiable certificate आए.' },
    'tw-sample-proof': { title: 'आज एक sample-work photo/video capture करें', how: 'अपना एक work sample बनाएं और clear photo या 30-second video proof के रूप में save करें.' },
    'tw-rpl': { title: 'Skill India पर RPL recognition check करें', how: 'देखें क्या existing skill को long course के बिना RPL certificate मिल सकता है.' },
    'tw-local-work': { title: ({ place }) => `${place} के पास 3 shops/customers से छोटा काम पूछें`, how: 'तीन nearby shops या past customers list करें और एक छोटा paid task/trial पूछें; proof के साथ earning शुरू करें.' },
    'tw-setup-plan': { title: 'One-page setup plan + rough budget लिखें', how: 'Space, equipment और realistic starting cost list करें; risk कम रखने के लिए small start करें.' },
    'tw-udyam': { title: 'Udyam पर free MSME ID register करें', how: 'Free Udyam registration बाद में schemes और buyer trust unlock कर सकता है.' },
    'tw-pmegp': { title: 'PMEGP/PMFME loan-scheme eligibility check करें', how: 'Scheme portal खोलें, eligibility और documents check करें, फिर ही पैसे खर्च करें.', by_when: 'इस week' },
    'tw-buyers': { title: ({ place }) => `${place} के पास 5 possible buyers/customers list करें`, how: 'पांच nearby people/shops लिखें जो खरीद सकते हैं, और fair first price note करें.' },
    'tw-ncs-job': { title: 'NCS पर register करें और 5 local roles shortlist करें', how: ({ place }) => `Sign up करें, district ${place} और commute limit set करें, फिर apply के लिए five roles shortlist करें.` },
    'tw-proof': { title: 'Meera से one-page proof summary बनवाएं', how: 'Meera के questions answer करें; वह truthful proof summary बनाती है ताकि formal resume जरूरी न हो.' },
    'tw-walkin': { title: ({ place }) => `${place} के पास 2 local enquiries के लिए prepare करें`, how: 'दो nearby workplaces चुनें और visit से पहले Meera के साथ 30-second introduction practice करें.' },
    'tw-pmkvy-center': { title: 'Nearest PMKVY/Skill India training centre ढूंढें', how: ({ place }) => `Centre locator खोलें और ${place} के closest centre, course और fees note करें.` },
    'tw-skillindia-start': { title: 'अभी एक free foundation module start करें', how: 'Phone-first short module शुरू करें ताकि local centre confirm होते समय proof बनता रहे.' },
    'tw-practice-proof': { title: 'एक practice task करें और proof save करें', how: 'एक छोटा hands-on task complete करें और first proof के रूप में photo/note save करें.' },
    'tw-skillindia-explore': { title: 'एक free Skill India course explore करें', how: 'Skill India Digital खोलें और interest से matching एक short course start करें.' },
    'tw-ncs-explore': { title: 'Local opportunities के लिए NCS register करें', how: ({ place }) => `NCS account बनाएं और district ${place} set करें.` },
  },
  or: {
    'tw-skill-passport': { title: 'Meera ସହ Skill Passport ବନାନ୍ତୁ (resume ଦରକାର ନାହିଁ)', how: 'Meera ସହ chat କରନ୍ତୁ. ସେ ଆପଣଙ୍କ answers କୁ shareable proof କରେ; formal resume ଲେଖିବା ଦରକାର ନୁହେଁ.' },
    'tw-ncs': { title: 'Free National Career Service account ବନାନ୍ତୁ', how: ({ place }) => `Link ଖୋଲନ୍ତୁ, phone number ରେ sign up କରନ୍ତୁ, ଏବଂ district ${place} set କରନ୍ତୁ ଯାହାଦ୍ୱାରା nearby jobs/job-melas ମିଳିବ.` },
    'tw-digilocker': { title: 'Documents ପାଇଁ DigiLocker set up କରନ୍ତୁ', how: 'Phone + Aadhaar ରେ DigiLocker ବନାନ୍ତୁ ଯେଣ୍ଞା marksheets/certificates safe ଏବଂ one-tap shareable ରହେ.' },
    'tw-set-area': { title: 'Meera କୁ exact block / panchayat କୁହନ୍ତୁ', how: ({ place }) => `ଏବେ ଆମେ "${place}" ପାଖର options ଦେଖାଉଛୁ. Block କିମ୍ବା panchayat share କରନ୍ତୁ ଯାହାଦ୍ୱାରା centre/work ସତରେ reach ଭିତରେ ରହିବ.` },
    'tw-jee-syllabus': { title: 'ଆଜି official exam syllabus download କରନ୍ତୁ', how: 'Official exam site ଖୋଲନ୍ତୁ, latest syllabus save କରନ୍ତୁ, ଏବଂ start ହୋଇନଥିବା chapters tick କରନ୍ତୁ.' },
    'tw-ncert-start': { title: 'ଗୋଟିଏ NCERT chapter ଆରମ୍ଭ କରନ୍ତୁ ଏବଂ 10 questions solve କରନ୍ତୁ', how: 'ସବୁଠାରୁ weak topic ବାଛନ୍ତୁ, NCERT explanation ପଢନ୍ତୁ, ପରେ 10 questions solve କରି ପ୍ରତି mistake note କରନ୍ତୁ.' },
    'tw-mock': { title: 'ଏହି week ଗୋଟିଏ timed practice set କରନ୍ତୁ', how: 'ଗୋଟିଏ timed section କରନ୍ତୁ, ପରେ ପ୍ରତି wrong answer କୁ revision note (error log) କରନ୍ତୁ.' },
    'tw-ncert-board': { title: 'ଗୋଟିଏ NCERT chapter + back exercises finish କରନ୍ତୁ', how: 'Chapter ପଢନ୍ତୁ, solved examples redo କରନ୍ତୁ, exercise complete କରନ୍ତୁ, ଏବଂ wrong answers mistake log ରେ mark କରନ୍ତୁ.' },
    'tw-sample-paper': { title: 'ଗୋଟିଏ CBSE/board sample-paper section solve କରନ୍ତୁ', how: 'Sample paper download କରନ୍ତୁ, one section time ଭିତରେ solve କରନ୍ତୁ, ପରେ marking scheme ସହ compare କରନ୍ତୁ.' },
    'tw-scholarship': { title: 'NSP ରେ scholarship eligibility check କରନ୍ତୁ', how: 'National Scholarship Portal ଖୋଲନ୍ତୁ, pre/post-matric eligibility check କରନ୍ତୁ, ଏବଂ application deadline note କରନ୍ତୁ.', by_when: 'Portal deadline ପୂର୍ବରୁ' },
    'tw-diksha-chapter': { title: 'ଆଜି ଗୋଟିଏ DIKSHA chapter + practice କରନ୍ତୁ', how: 'DIKSHA ଖୋଲନ୍ତୁ, weak chapter ର short lesson ଦେଖନ୍ତୁ, ପରେ practice questions solve କରନ୍ତୁ.' },
    'tw-ncert-school': { title: '8 NCERT questions solve କରନ୍ତୁ ଏବଂ mistakes list କରନ୍ତୁ', how: 'ଗୋଟିଏ subject ବାଛନ୍ତୁ, NCERT ରୁ 8 questions solve କରନ୍ତୁ, ଏବଂ କେଉଁ type ରେ mistake ହେଲା ଲେଖନ୍ତୁ.' },
    'tw-scholarship-school': { title: 'Teacher/parent ସହ NSP scholarship check କରନ୍ତୁ', how: 'Guardian ସହ National Scholarship Portal ଖୋଲନ୍ତୁ ଏବଂ ଆପଣଙ୍କ class କେଉଁ scholarship ପାଇଁ eligible ଦେଖନ୍ତୁ.', by_when: 'Portal deadline ପୂର୍ବରୁ' },
    'tw-ds-project': { title: 'ଗୋଟିଏ public dataset ବାଛନ୍ତୁ ଏବଂ mini-project ଆରମ୍ଭ କରନ୍ତୁ', how: 'Simple dataset choose କରନ୍ତୁ, clean କରନ୍ତୁ, ଏବଂ 6-line summary ଲେଖନ୍ତୁ; ଏହା portfolio proof ହେବ.' },
    'tw-ncs-analyst': { title: 'NCS ରେ "data entry / analyst" roles search କରନ୍ତୁ', how: ({ place }) => `NCS ରେ register କରନ୍ତୁ ଏବଂ ${place} plus remote filter ସହ analyst/data roles search କରନ୍ତୁ.` },
    'tw-skillindia-course': { title: 'ଗୋଟିଏ free Python/SQL module ରେ enrol କରନ୍ତୁ', how: 'ଗୋଟିଏ short Python କିମ୍ବା SQL module start କରନ୍ତୁ ଯାହାଦ୍ୱାରା skill current ଏବଂ certifiable ହେବ.' },
    'tw-portfolio': { title: 'ଗୋଟିଏ project ରୁ ଦୁଇଟି strong resume bullets ଲେଖନ୍ତୁ', how: 'College project ନିଅନ୍ତୁ ଏବଂ profile ପାଇଁ ଦୁଇଟି clear result-focused lines ଲେଖନ୍ତୁ.' },
    'tw-ncs-intern': { title: 'NCS ରେ internships/projects search କରନ୍ତୁ', how: ({ place }) => `${place} ଏବଂ remote ପାଖର internship/apprenticeship listings search କରନ୍ତୁ.` },
    'tw-skillindia-cert': { title: 'ଗୋଟିଏ free certified short course add କରନ୍ତୁ', how: 'Goal ସହ matching ଗୋଟିଏ course ବାଛନ୍ତୁ ଯାହାଦ୍ୱାରା profile ରେ verifiable certificate ଆସିବ.' },
    'tw-sample-proof': { title: 'ଆଜି ଗୋଟିଏ sample-work photo/video capture କରନ୍ତୁ', how: 'ନିଜ work sample ବନାନ୍ତୁ ଏବଂ clear photo କିମ୍ବା 30-second video proof ଭାବେ save କରନ୍ତୁ.' },
    'tw-rpl': { title: 'Skill India ରେ RPL recognition check କରନ୍ତୁ', how: 'ଦେଖନ୍ତୁ existing skill କୁ long course ବିନା RPL certificate ମିଳିପାରେ କି.' },
    'tw-local-work': { title: ({ place }) => `${place} ପାଖର 3 shops/customers ଠାରୁ ଛୋଟ କାମ ପଚାରନ୍ତୁ`, how: 'ତିନୋଟି nearby shops କିମ୍ବା past customers list କରନ୍ତୁ ଏବଂ ଗୋଟିଏ ଛୋଟ paid task/trial ପଚାରନ୍ତୁ.' },
    'tw-setup-plan': { title: 'One-page setup plan + rough budget ଲେଖନ୍ତୁ', how: 'Space, equipment ଏବଂ realistic starting cost list କରନ୍ତୁ; risk କମ ରଖିବା ପାଇଁ small start କରନ୍ତୁ.' },
    'tw-udyam': { title: 'Udyam ରେ free MSME ID register କରନ୍ତୁ', how: 'Free Udyam registration ପରେ schemes ଏବଂ buyer trust unlock କରିପାରେ.' },
    'tw-pmegp': { title: 'PMEGP/PMFME loan-scheme eligibility check କରନ୍ତୁ', how: 'Scheme portal ଖୋଲନ୍ତୁ, eligibility ଏବଂ documents check କରନ୍ତୁ, ପରେ ମାତ୍ର ଟଙ୍କା ଖର୍ଚ୍ଚ କରନ୍ତୁ.', by_when: 'ଏହି week' },
    'tw-buyers': { title: ({ place }) => `${place} ପାଖର 5 possible buyers/customers list କରନ୍ତୁ`, how: 'ପାଞ୍ଚ nearby people/shops ଲେଖନ୍ତୁ ଯେଉଁମାନେ କିଣିପାରନ୍ତି, ଏବଂ fair first price note କରନ୍ତୁ.' },
    'tw-ncs-job': { title: 'NCS ରେ register କରନ୍ତୁ ଏବଂ 5 local roles shortlist କରନ୍ତୁ', how: ({ place }) => `Sign up କରନ୍ତୁ, district ${place} ଏବଂ commute limit set କରନ୍ତୁ, ପରେ apply ପାଇଁ five roles shortlist କରନ୍ତୁ.` },
    'tw-proof': { title: 'Meera ଠାରୁ one-page proof summary ବନାନ୍ତୁ', how: 'Meera ଙ୍କ questions answer କରନ୍ତୁ; ସେ truthful proof summary ବନାଇଥାଏ ଯାହାଦ୍ୱାରା formal resume ଦରକାର ନହେଁ.' },
    'tw-walkin': { title: ({ place }) => `${place} ପାଖର 2 local enquiries ପାଇଁ prepare କରନ୍ତୁ`, how: 'ଦୁଇଟି nearby workplaces ବାଛନ୍ତୁ ଏବଂ visit ପୂର୍ବରୁ Meera ସହ 30-second introduction practice କରନ୍ତୁ.' },
    'tw-pmkvy-center': { title: 'Nearest PMKVY/Skill India training centre ଖୋଜନ୍ତୁ', how: ({ place }) => `Centre locator ଖୋଲନ୍ତୁ ଏବଂ ${place} ର closest centre, course ଏବଂ fees note କରନ୍ତୁ.` },
    'tw-skillindia-start': { title: 'ଏବେ ଗୋଟିଏ free foundation module start କରନ୍ତୁ', how: 'Phone-first short module ଆରମ୍ଭ କରନ୍ତୁ ଯାହାଦ୍ୱାରା local centre confirm ହେଉଥିବାବେଳେ proof ବନେ.' },
    'tw-practice-proof': { title: 'ଗୋଟିଏ practice task କରନ୍ତୁ ଏବଂ proof save କରନ୍ତୁ', how: 'ଗୋଟିଏ ଛୋଟ hands-on task complete କରନ୍ତୁ ଏବଂ first proof ଭାବେ photo/note save କରନ୍ତୁ.' },
    'tw-skillindia-explore': { title: 'ଗୋଟିଏ free Skill India course explore କରନ୍ତୁ', how: 'Skill India Digital ଖୋଲନ୍ତୁ ଏବଂ interest ସହ matching short course start କରନ୍ତୁ.' },
    'tw-ncs-explore': { title: 'Local opportunities ପାଇଁ NCS register କରନ୍ତୁ', how: ({ place }) => `NCS account ବନାନ୍ତୁ ଏବଂ district ${place} set କରନ୍ତୁ.` },
  },
};

function resolveLocalizedField(value, context = {}) {
  return typeof value === 'function' ? value(context) : value;
}

function localizeByWhen(value = 'This week', language = 'en') {
  if (language === 'en') return value;
  const lower = String(value || '').toLowerCase();
  if (/portal deadline/.test(lower)) {
    if (language === 'hi') return 'Portal deadline से पहले';
    if (language === 'or') return 'Portal deadline ପୂର୍ବରୁ';
    return 'Portal deadline se pehle';
  }
  if (language === 'hi') return 'इस week';
  if (language === 'or') return 'ଏହି week';
  return 'Is week';
}

function localizeThisWeekAction(item = {}, language = 'en', context = {}) {
  if (language === 'en') return item;
  const copy = (THIS_WEEK_ACTION_I18N[language] || {})[item.id] || {};
  return {
    ...item,
    title: resolveLocalizedField(copy.title, context) || localizeLearnerText(item.title, language),
    how: resolveLocalizedField(copy.how, context) || localizeLearnerText(item.how, language),
    by_when: copy.by_when || localizeByWhen(item.by_when, language),
  };
}

export function buildThisWeekActions(profile = {}, family = goalFamily(profile), options = {}) {
  const language = learnerLanguageCode(profile, options.language);
  const place = coerceText(profile.block) || coerceText(profile.location) || 'your area';
  const hasPreciseArea = Boolean(coerceText(profile.block));

  // Steps every learner can take now.
  const base = [
    action(
      'tw-skill-passport',
      'in_app',
      'Build your Skill Passport with Meera (no resume needed)',
      'Just keep chatting with Meera. She turns your answers into proof you can share — you do not need to write a resume.',
      { title: 'VidyaSetu Skill Passport', url: '' },
    ),
    action(
      'tw-ncs',
      'register_online',
      'Create a free National Career Service account',
      `Open the link, sign up with your phone number, and set your district to ${place} so nearby jobs and job-melas reach you.`,
      OFFICIAL.ncs,
    ),
    action(
      'tw-digilocker',
      'register_online',
      'Set up DigiLocker for your documents',
      'Create DigiLocker with your phone + Aadhaar so your marksheets/certificates are safe and shareable in one tap.',
      OFFICIAL.digilocker,
    ),
  ];

  if (!hasPreciseArea) {
    base.push(
      action(
        'tw-set-area',
        'in_app',
        'Tell Meera your exact block / panchayat',
        `We currently show options near "${place}". Share your block or panchayat so centres and work shown are truly within reach.`,
        { title: 'VidyaSetu', url: '' },
      ),
    );
  }

  const byFamily = {
    entrance_exam: [
      action('tw-jee-syllabus', 'study_today', 'Download the official exam syllabus today', 'Open the official exam site, save the latest syllabus, and tick the chapters you have not started.', OFFICIAL.jee),
      action('tw-ncert-start', 'study_today', 'Start one NCERT chapter and solve 10 questions', 'Pick your weakest topic, read the NCERT explanation, then solve 10 questions and note every mistake.', OFFICIAL.ncert),
      action('tw-mock', 'practice', 'Attempt one timed practice set this week', 'Do one timed section, then convert every wrong answer into a revision note (your error log).', OFFICIAL.diksha),
    ],
    board_exam: [
      action('tw-ncert-board', 'study_today', 'Finish one NCERT chapter + back exercises', 'Read the chapter, redo the solved examples, and complete the exercise; mark wrong answers in a mistake log.', OFFICIAL.ncert),
      action('tw-sample-paper', 'practice', 'Solve one CBSE/board sample-paper section', 'Download a sample paper, solve one section in time, and compare with the marking scheme.', OFFICIAL.cbseSqp),
      action('tw-scholarship', 'deadline', 'Check scholarship eligibility on NSP', 'Open the National Scholarship Portal, check pre/post-matric eligibility, and note the application deadline.', OFFICIAL.nsp, 'Before the portal deadline'),
    ],
    school_study: [
      action('tw-diksha-chapter', 'study_today', 'Do one DIKSHA chapter + practice today', 'Open DIKSHA, watch one short lesson for your weak chapter, then solve the practice questions.', OFFICIAL.diksha),
      action('tw-ncert-school', 'study_today', 'Solve 8 NCERT questions and list mistakes', 'Pick one subject, solve 8 questions from NCERT, and write down which type you got wrong.', OFFICIAL.ncert),
      action('tw-scholarship-school', 'deadline', 'Ask a teacher/parent to check NSP scholarship', 'Open the National Scholarship Portal with a guardian and check what your class is eligible for.', OFFICIAL.nsp, 'Before the portal deadline'),
    ],
    data_science_job: [
      action('tw-ds-project', 'do_today', 'Pick one public dataset and start a mini-project', 'Choose a simple dataset, clean it, and write a 6-line summary — this becomes your portfolio proof.', OFFICIAL.skillIndia),
      action('tw-ncs-analyst', 'register_online', 'Search "data entry / analyst" roles on NCS', `Register on NCS and search analyst/data roles filtered to ${place} and remote.`, OFFICIAL.ncs),
      action('tw-skillindia-course', 'register_online', 'Enrol in one free Python/SQL module', 'Start one short Python or SQL module so your skills are current and certified.', OFFICIAL.skillIndia),
    ],
    college: [
      action('tw-portfolio', 'do_today', 'Write two strong resume bullets from one project', 'Take one college project and write two clear result-focused lines for your profile.', OFFICIAL.skillIndia),
      action('tw-ncs-intern', 'register_online', 'Search internships/projects on NCS', `Register and search internship/apprenticeship listings near ${place} and remote.`, OFFICIAL.ncs),
      action('tw-skillindia-cert', 'register_online', 'Add one free certified short course', 'Pick one course matching your goal so your profile has a verifiable certificate.', OFFICIAL.skillIndia),
    ],
    informal_skill: [
      action('tw-sample-proof', 'do_today', 'Capture one sample-work photo/video today', 'Make one piece of your work (stitch/repair/etc.) and record a clear photo or 30-second video as proof.', { title: 'VidyaSetu Skill Passport', url: '' }),
      action('tw-rpl', 'register_online', 'Check RPL recognition on Skill India', 'See if you can get your existing skill certified (RPL) without a long course.', OFFICIAL.skillIndia),
      action('tw-local-work', 'local_outreach', `Ask 3 shops/customers near ${place} for small work`, 'List three nearby shops or past customers and ask for one small paid task or trial — start earning while you build proof.', OFFICIAL.ncs),
    ],
    enterprise: [
      action('tw-setup-plan', 'do_today', 'Write a one-page setup plan + rough budget', 'List the space, equipment, and a realistic starting cost — start small to limit risk.', OFFICIAL.pmfme),
      action('tw-udyam', 'register_online', 'Register on Udyam (free MSME ID)', 'A free Udyam registration unlocks schemes and buyer trust later.', OFFICIAL.udyam),
      action('tw-pmegp', 'deadline', 'Check PMEGP/PMFME loan-scheme eligibility', 'Open the scheme portal, check eligibility and documents before spending any money.', OFFICIAL.pmegp),
      action('tw-buyers', 'local_outreach', `List 5 possible buyers/customers near ${place}`, 'Write down five nearby people or shops who might buy from you, and a fair first price.', OFFICIAL.udyam),
    ],
    job: [
      action('tw-ncs-job', 'register_online', 'Register on NCS and shortlist 5 local roles', `Sign up, set your district to ${place} and commute limit, and shortlist five roles to apply to.`, OFFICIAL.ncs),
      action('tw-proof', 'do_today', 'Let Meera build your one-page proof summary', 'Answer Meera’s questions; she creates a truthful proof summary so you do not need a formal resume.', { title: 'VidyaSetu', url: '' }),
      action('tw-walkin', 'local_outreach', `Prepare for 2 local shop/employer enquiries near ${place}`, 'Pick two nearby workplaces and practise a 30-second introduction with Meera before you visit.', OFFICIAL.ncs),
    ],
    vocational: [
      action('tw-pmkvy-center', 'visit_center', 'Find the nearest PMKVY/Skill India training centre', `Open the centre locator and note the closest centre to ${place}, its course, and fees.`, OFFICIAL.pmkvy),
      action('tw-skillindia-start', 'register_online', 'Start one free foundation module now', 'Begin a short phone-first module so you build proof while a local centre is confirmed.', OFFICIAL.skillIndia),
      action('tw-practice-proof', 'do_today', 'Do one practice task and save proof', 'Complete one small hands-on task and save a photo/note as your first proof.', { title: 'VidyaSetu Skill Passport', url: '' }),
    ],
    generic: [
      action('tw-skillindia-explore', 'register_online', 'Explore one free Skill India course', 'Open Skill India Digital and start one short course matching your interest.', OFFICIAL.skillIndia),
      action('tw-ncs-explore', 'register_online', 'Register on NCS for local opportunities', `Create an NCS account and set your district to ${place}.`, OFFICIAL.ncs),
    ],
  };

  return [...base, ...(byFamily[family] || byFamily.generic)]
    .slice(0, 10)
    .map((item) => localizeThisWeekAction(item, language, { place, family, profile }));
}

export function enrichJourneyForLearner(profile = {}, route = {}, journey = {}) {
  const family = goalFamily(profile);
  const language = learnerLanguageCode(profile);
  const baseModules = Array.isArray(journey.modules) ? journey.modules : [];
  const modules = baseModules.map((module, index) => enrichModule(module, family, profile, index));
  const first = modules[0] || {};
  const todayTask = buildTodayTask(family, profile, route, first);
  const proofRequired = coerceText(first.proof_task) || buildProofTask(family, profile);
  const startHere = {
    week: first.week || 1,
    title: coerceText(first.title) || 'Week 1',
    goal: coerceText(first.goal),
    why_it_matters: coerceText(first.why_it_matters),
    today_task: todayTask,
    how_to_complete:
      coerceText(first.checkpoint) ||
      coerceText(first.completion_criteria) ||
      'Finish the lesson/practice, tap it done, then save a short proof note or photo.',
      proof_required: proofRequired,
      unlocks_next: coerceText(first.unlocks) || coerceText(first.unlock_after_completion) || coerceText(first.unlock) || 'the next week',
  };
  const learningContract =
    journey.learning_contract && typeof journey.learning_contract === 'object' && !Array.isArray(journey.learning_contract)
      ? Object.fromEntries(
          Object.entries(journey.learning_contract).map(([key, value]) => [key, localizeLearnerText(value, language)]),
        )
      : journey.learning_contract;
  const delivery =
    journey.delivery && typeof journey.delivery === 'object' && !Array.isArray(journey.delivery)
      ? Object.fromEntries(Object.entries(journey.delivery).map(([key, value]) => [key, localizeLearnerText(value, language)]))
      : journey.delivery;
  return {
    ...journey,
    title: localizeLearnerText(journey.title, language),
    weekly_plan: localizeLearnerArray(journey.weekly_plan, language),
    support_plan: localizeLearnerArray(journey.support_plan, language),
    learning_contract: learningContract,
    delivery,
    modules,
    start_here: startHere,
    today_task: todayTask,
    selected_pathway_summary: {
      route_name: coerceText(route.name) || coerceText(journey.route_name) || coerceText(journey.title) || 'Selected pathway',
      family,
      what_you_get: familyOutcome(family, profile),
      time: localizeLearnerText(coerceText(journey.duration?.mvp) || `${modules.length}-week plan`, language),
      channel: localizeLearnerText(coerceText(journey.delivery?.primary_channel) || 'WhatsApp + voice', language),
      proof_required: proofRequired,
      unlocks_next: startHere.unlocks_next,
    },
  };
}
