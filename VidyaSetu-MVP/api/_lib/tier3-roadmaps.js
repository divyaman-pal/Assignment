const ROADMAPS = [
  {
    id: 'tailoring_business',
    match: /tailor|tailoring|silai|stitch|sewing|garment|alteration/i,
    title: 'Tailoring and stitching business',
    weeks: 8,
    persona: 'Home-maker or informal worker who wants own income',
    resources: [
      'WhatsApp Business - https://business.whatsapp.com',
      'Skill India Digital - search Self Employed Tailor / Sewing Machine Operator - https://www.skillindiadigital.gov.in',
      'Hindi YouTube slot: machine threading, measurements, alterations, blouse/kurti cutting',
    ],
    flow:
      'Week 1 machine/stitches, Week 2 measurements/alterations, Week 3 first paid alteration/petticoat, Week 4 blouse practice, Week 5 first paid blouse, Week 6 salwar/kurti, Week 7 steady orders, Week 8 Udyam/Skill India and monthly review.',
  },
  {
    id: 'home_food_tiffin',
    match: /food|tiffin|snack|pickle|papad|laddoo|namkeen|cooking|kitchen|bakery/i,
    title: 'Home food, tiffin, and snacks',
    weeks: 8,
    persona: 'Home-maker or micro-entrepreneur starting food income',
    resources: [
      'WhatsApp Business - https://business.whatsapp.com',
      'Nisha Madhulika recipes - https://nishamadhulika.com',
      'Hebbar Kitchen recipes - https://hebbarskitchen.com',
      'FSSAI FoSCoS basic registration - https://foscos.fssai.gov.in',
    ],
    flow:
      'Week 1 choose hero dish/costing, Week 2 packaging/photos/samples, Week 3 menu routine, Week 4 customers plus FSSAI check, Week 5 shelf-life add-on, Week 6 pricing/retention, Week 7 discovery, Week 8 stabilise.',
  },
  {
    id: 'beauty_mehndi',
    match: /beauty|salon|mehndi|mehandi|threading|facial|waxing|makeup/i,
    title: 'Home beauty and mehndi',
    weeks: 8,
    persona: 'Home-maker or local-service learner',
    resources: [
      'WhatsApp Business - https://business.whatsapp.com',
      'Skill India Digital - search Assistant Beauty Therapist - https://www.skillindiadigital.gov.in',
      'Hindi YouTube slot: threading, cleanup/facial, waxing, mehndi cone control',
    ],
    flow:
      'Week 1 hygiene/threading/mehndi basics, Week 2 cleanup/skin basics, Week 3 first paid services, Week 4 facial/waxing, Week 5 hair/festive mehndi, Week 6 home visits, Week 7 Google Business Profile, Week 8 upskill/formalise.',
  },
  {
    id: 'computer_office_data',
    match: /computer|typing|data entry|office|excel|word|google docs|operator|billing|front desk/i,
    title: 'Computer and office skills to data/office work',
    weeks: 10,
    persona: 'Unemployed or underemployed youth needing phone-first office skills',
    resources: [
      'GCFGlobal Computer Basics - https://edu.gcfglobal.org/en/computerbasics/',
      'GCFGlobal Internet Basics - https://edu.gcfglobal.org/en/internetbasics/',
      'GCFGlobal Word - https://edu.gcfglobal.org/en/word/',
      'GCFGlobal Excel - https://edu.gcfglobal.org/en/excel/',
      'TypingClub - https://www.typingclub.com',
      'Keybr - https://www.keybr.com',
      'Skill India Digital - Domestic Data Entry Operator - https://www.skillindiadigital.gov.in',
    ],
    flow:
      'Week 1 basics/typing, Week 2 Word/docs/resume, Week 3 Excel basics, Week 4 formulas/slides, Week 5 certificate/portfolio, Week 6 freelance setup, Week 7 first local/remote task, Week 8 speed/add-on, Week 9 virtual assistant, Week 10 stabilise.',
  },
  {
    id: 'spoken_english_bpo',
    match: /spoken english|english speaking|bpo|customer support|call center|customer service/i,
    title: 'Spoken English to customer support/BPO',
    weeks: 8,
    persona: 'Graduate or youth preparing for support jobs',
    resources: ['BBC Learning English - https://www.bbc.co.uk/learningenglish'],
    flow:
      'Build daily speaking habit, record voice, learn customer phrases, practise calls, create simple CV, apply only after role/source verification.',
  },
  {
    id: 'digital_marketing_freelance',
    match: /digital marketing|social media|instagram|facebook|ads|canva|freelance marketing/i,
    title: 'Digital marketing freelancing for local businesses',
    weeks: 10,
    persona: 'Youth with phone/computer access and local-business network',
    resources: [
      'Canva - https://www.canva.com',
      'Meta business learning - https://www.facebook.com/business/learn',
    ],
    flow:
      'Business pages, Canva posts, reels, local business samples, first client pitch, small ad basics, portfolio, repeat clients.',
  },
  {
    id: 'graphic_design',
    match: /graphic design|poster|logo|canva design|creative design/i,
    title: 'Graphic design to freelancing',
    weeks: 8,
    persona: 'Student or youth building creative proof',
    resources: ['Canva - https://www.canva.com'],
    flow:
      'Design basics, poster/logo practice, local samples, portfolio, first small client, pricing and repeat work.',
  },
  {
    id: 'video_editing',
    match: /video editing|capcut|reel|youtube|content creation|davinci/i,
    title: 'Video editing and content creation',
    weeks: 10,
    persona: 'Student/youth with phone-first creative interest',
    resources: [
      'CapCut - https://www.capcut.com',
      'DaVinci Resolve - https://www.blackmagicdesign.com/products/davinciresolve',
    ],
    flow:
      'Cutting basics, captions/audio, short reels, niche, portfolio, local-client edit, posting routine, stabilise.',
  },
  {
    id: 'coding_foundations',
    match: /coding|programming|web development|python|javascript|future tech/i,
    title: 'Coding foundations to future tech career',
    weeks: 12,
    persona: 'Student or early-college learner',
    resources: ['freeCodeCamp - https://www.freecodecamp.org', 'GitHub - https://github.com'],
    flow:
      'Basics, HTML/CSS/JS or Python, small projects, GitHub proof, portfolio page, tutoring or internship readiness.',
  },
  {
    id: 'shop_digitisation',
    match: /shop|retail|payment|upi|google business|online selling|ondc|seller/i,
    title: 'Digitise a local shop or micro-business',
    weeks: 8,
    persona: 'Local micro-business owner',
    resources: [
      'Google Business Profile - https://www.google.com/business',
      'Amazon Seller - https://sell.amazon.in',
      'Flipkart Seller - https://seller.flipkart.com',
      'ONDC - https://ondc.org',
    ],
    flow:
      'Payments/discovery, WhatsApp catalogue, Google profile, online listings, ONDC/seller app check, customer retention, stabilise.',
  },
  {
    id: 'business_bookkeeping_credit',
    match: /bookkeeping|business fundamentals|mudra|loan|credit|udyam|gst|inventory|cash flow/i,
    title: 'Business fundamentals, bookkeeping, and credit readiness',
    weeks: 10,
    persona: 'Micro-business owner preparing for responsible growth or loan',
    resources: [
      'Udyam registration - https://udyamregistration.gov.in',
      'GST portal - https://www.gst.gov.in',
      'MUDRA - https://www.mudra.org.in',
      'Jan Samarth - https://www.jansamarth.in',
      'Stand-Up India - https://www.standupmitra.in',
    ],
    flow:
      'Costs/pricing, daily bookkeeping, inventory/cash flow, Udyam/GST check, margins, savings buffer, loan readiness, apply carefully, reinvest, system.',
  },
  {
    id: 'mobile_repair',
    match: /mobile repair|phone repair|smartphone repair|repair technician/i,
    title: 'Mobile-phone repair technician',
    weeks: 10,
    persona: 'Skilled-trade aspirant',
    resources: [
      'Skill India Digital - smartphone/home appliance technician searches - https://www.skillindiadigital.gov.in',
      'WhatsApp Business - https://business.whatsapp.com',
      'Hindi YouTube slot: mobile parts, opening phone, battery/screen replacement, multimeter, soldering',
    ],
    flow:
      'Week 1 parts/safety, Week 2 tools/basic swaps, Week 3 screen, Week 4 software, Week 5 charging/power, Week 6 diagnostics, Week 7 apprenticeship/first repairs, Week 8 service setup, Week 9 chip-level basics, Week 10 certification and growth.',
  },
  {
    id: 'electrician_solar',
    match: /electrician|electrical|wireman|wiring|solar|suryamitra|pv installer/i,
    title: 'Electrician or solar PV installer',
    weeks: 12,
    persona: 'Skilled-trade aspirant; safety-sensitive',
    resources: [
      'Skill India Digital - Electrician / Suryamitra searches - https://www.skillindiadigital.gov.in',
      'PM Surya Ghar - https://pmsuryaghar.gov.in',
      'SWAYAM - search Basic Electrical - https://swayam.gov.in',
      'Udyam registration later - https://udyamregistration.gov.in',
    ],
    flow:
      'Week 1 safety/basics, Week 2 circuits/measurement, Week 3 house wiring, Week 4 local ITI/PMKVY course, Week 5 appliance repair, Week 6 wiring jobs shadowing, Week 7 solar basics, Week 8 solar scheme/practical, Week 9 assessment, Week 10 first small supervised jobs, Week 11 steady work, Week 12 specialise.',
  },
  {
    id: 'driving_delivery',
    match: /driving|delivery|gig|rider|driver|zomato|swiggy|uber|logistics|licence|license/i,
    title: 'Driving plus delivery/gig logistics',
    weeks: 8,
    persona: 'Worker with/without vehicle and phone',
    resources: [
      'Parivahan Sarathi - https://sarathi.parivahan.gov.in',
      'Swiggy rider - https://ride.swiggy.com',
      'Zomato rider - https://www.zomato.com/rider',
      'Uber driver - https://www.uber.com/in/en/drive',
      'Amazon Flex - https://flex.amazon.in',
    ],
    flow:
      'Driving fundamentals, licence, driving test, choose earning mode, onboarding, first earnings, maximise, stabilise or level up.',
  },
];

export function roadmapMatches(profile = {}, question = '', route = {}) {
  const text = [
    question,
    route.name,
    route.title,
    route.tradeoff,
    route.income_path,
    route.what_it_asks,
    profile.learner_goal?.label,
    profile.learner_goal?.type,
    profile.class_level,
    profile.education_status,
    ...(profile.aspirations || []),
    ...(profile.skills || []),
    ...(profile.proof_available || []),
  ]
    .filter(Boolean)
    .join(' ');
  return ROADMAPS.filter((roadmap) => roadmap.match.test(text)).slice(0, 3);
}

export function tier3PlannerGuide(profile = {}, question = '', route = {}) {
  const matches = roadmapMatches(profile, question, route);
  const selected = matches.length ? matches : ROADMAPS.slice(0, 5);
  const guide = selected
    .map(
      (roadmap) =>
        `${roadmap.title} (${roadmap.weeks} weeks) | Persona: ${roadmap.persona} | Flow: ${roadmap.flow} | Resources: ${roadmap.resources.join('; ')}`,
    )
    .join('\n');
  return {
    matched_ids: matches.map((item) => item.id),
    exact_match: matches.length > 0,
    guide,
  };
}

export function plannerResourceHints(profile = {}, question = '', route = {}) {
  const matches = roadmapMatches(profile, question, route);
  const resources = matches.flatMap((roadmap) => roadmap.resources);
  return [...new Set(resources)].slice(0, 8);
}

const WEEK_DETAIL_BY_ROADMAP = {
  tailoring_business: [
    ['Machine and stitch basics', 'Thread the machine safely and make straight stitch lines.', 'Straight stitch sample photo'],
    ['Measurements and alteration', 'Take simple measurements and alter one old cloth carefully.', 'Measurement note + alteration photo'],
    ['First paid simple work', 'Try petticoat, fall-pico, or a small repair inside the neighbourhood.', 'Customer/order note without private details'],
    ['Blouse or kurti basics', 'Practise cutting steps on newspaper or waste cloth first.', 'Cutting practice photo'],
    ['First blouse/kurti proof', 'Complete one supervised blouse/kurti step with fitting notes.', 'Fitting correction note'],
    ['Salwar/kurti finishing', 'Improve finishing, hemming, button, zip, or neck work.', 'Before/after finishing proof'],
    ['Order routine', 'Make a small WhatsApp catalogue and delivery/date notebook.', 'Catalogue screenshot/note'],
    ['Business review', 'Review costs, price, repeat customers, and Udyam/Skill India only if needed.', 'Monthly income-cost review'],
  ],
  home_food_tiffin: [
    ['Hero dish and costing', 'Choose one dish/snack and calculate ingredients, gas, packaging, and margin.', 'Costing notebook photo'],
    ['Packaging and samples', 'Make safe samples, take clear photos, and collect feedback.', 'Sample photo + feedback notes'],
    ['Simple menu routine', 'Fix 2-3 items, timing, quantity limit, and order method.', 'One-page menu proof'],
    ['Customer and FSSAI check', 'Ask nearby buyers and check when FSSAI registration is needed.', 'Buyer list + FSSAI note'],
    ['Shelf-life add-on', 'Test one safer longer-life item like pickle, papad, snack, or laddoo.', 'Shelf-life observation note'],
    ['Pricing and retention', 'Track repeat customers, complaints, and what not to sell yet.', 'Repeat-customer register'],
    ['Discovery', 'Prepare WhatsApp status/catalogue and safe local referral script.', 'WhatsApp catalogue/status proof'],
    ['Stabilise', 'Review hygiene, profit, capacity, and whether to formalise.', 'Weekly sales-cost review'],
  ],
  beauty_mehndi: [
    ['Hygiene and basics', 'Practise threading/mehndi strokes with clean tools and consent.', 'Practice hand/photo note'],
    ['Cleanup and skin basics', 'Learn skin-type caution and basic cleanup steps without risky claims.', 'Checklist proof'],
    ['First paid safe services', 'Offer only simple safe services to known local customers.', 'Service register without private data'],
    ['Facial/waxing basics', 'Practise only supervised, low-risk steps and allergy caution.', 'Safety checklist proof'],
    ['Hair/festive mehndi', 'Build 3-5 sample designs/services for local demand.', 'Sample catalogue proof'],
    ['Home visit rules', 'Set women-safety, timing, pricing, and family support rules.', 'Safe-visit rule note'],
    ['Local discovery', 'Create WhatsApp/Google Business profile only with consent.', 'Profile/catalogue draft'],
    ['Upskill and review', 'Review income, repeat customers, and formal course need.', 'Monthly review proof'],
  ],
  computer_office_data: [
    ['Computer and typing foundation', 'Learn keyboard, files, internet safety, and daily typing.', 'Typing score screenshot'],
    ['Word/docs and resume', 'Create one simple document and a no-fake resume/proof sheet.', 'Document/resume PDF proof'],
    ['Excel basics', 'Practise rows, columns, totals, and simple tables.', 'Excel practice screenshot'],
    ['Forms and slides', 'Fill safe online forms and create one simple slide/poster.', 'Form checklist + slide proof'],
    ['Certificate/portfolio', 'Finish one free module and save a proof folder.', 'Certificate or course-progress proof'],
    ['Freelance/local task setup', 'Prepare one service offer: typing, form fill, billing, data entry.', 'Service offer note'],
    ['First local/remote task review', 'Review real tasks only from known/public sources; block fee traps.', 'Two source reviews'],
    ['Speed and accuracy', 'Improve typing speed and reduce mistakes with daily practice.', 'Typing progress proof'],
    ['Virtual assistant basics', 'Practise email, calendar, calling script, and data cleanliness.', 'VA task checklist'],
    ['Stabilise', 'Choose job, freelance, or further course based on proof.', 'Next-step decision proof'],
  ],
  spoken_english_bpo: [
    ['Speaking habit', 'Record one-minute introductions and customer greetings daily.', 'Voice-note proof'],
    ['Listening basics', 'Listen to short lessons and repeat useful phrases.', 'Phrase notebook proof'],
    ['Customer phrases', 'Practise complaint, order, and helpdesk scripts.', 'Call-script recording'],
    ['Call practice', 'Do mock calls with a trusted person.', 'Mock-call feedback'],
    ['Simple CV and profile', 'Build a consent-safe CV and voice sample.', 'CV + voice sample'],
    ['Role/source check', 'Search support roles only from public sources; reject fee traps.', 'Two source reviews'],
    ['Interview prep', 'Practise screening questions in learner language plus simple English.', 'Interview answers proof'],
    ['Apply safely', 'Apply only after source/contact/shift verification.', 'Consent checklist'],
  ],
  digital_marketing_freelance: [
    ['Business page basics', 'Understand local business needs and page/account setup.', 'Business-page checklist'],
    ['Canva post practice', 'Create 3 simple posts for one local business type.', 'Three post samples'],
    ['Reels and captions', 'Make one short reel script and caption set.', 'Reel/caption proof'],
    ['Local business samples', 'Prepare sample calendar for a shop, salon, tutor, or food seller.', '7-day content calendar'],
    ['First client pitch', 'Write a simple no-pressure pitch and price range.', 'Pitch note'],
    ['Ad basics caution', 'Understand budget/risk before touching paid ads.', 'Ad-risk checklist'],
    ['Portfolio', 'Organise samples and results without fake claims.', 'Portfolio link/note'],
    ['Repeat clients', 'Create follow-up and reporting routine.', 'Client-report template'],
    ['Pricing and scope', 'Define what is included and what costs extra.', 'Scope/pricing sheet'],
    ['Stabilise', 'Choose service niche and next learning need.', 'Monthly review proof'],
  ],
  graphic_design: [
    ['Canva basics', 'Learn layout, contrast, readable text, and templates.', 'Two poster samples'],
    ['Poster practice', 'Make posters for local shop, tuition, event, or food item.', 'Poster proof'],
    ['Logo/name card basics', 'Create simple logo/name card without copying brands.', 'Name-card proof'],
    ['Local samples', 'Build 5 samples for local business categories.', 'Sample folder proof'],
    ['Portfolio', 'Organise best samples and short descriptions.', 'Portfolio proof'],
    ['First small client', 'Offer one small design with clear price and revision limit.', 'Client-task note'],
    ['Pricing and delivery', 'Create delivery checklist and payment safety rules.', 'Pricing checklist'],
    ['Repeat work', 'Review which designs got interest and plan next skill.', 'Review proof'],
  ],
  video_editing: [
    ['Editing basics', 'Cut clips, trim silence, and keep one clear story.', 'Edited 20-second clip'],
    ['Captions and audio', 'Add readable captions and clean audio.', 'Captioned clip proof'],
    ['Short reels', 'Make 3 reels for one topic/business type.', 'Three reel samples'],
    ['Niche choice', 'Pick one niche: shop, education, food, farm, wedding, or local service.', 'Niche sample proof'],
    ['Portfolio', 'Organise before/after videos and notes.', 'Portfolio proof'],
    ['Local client edit', 'Edit one safe sample for a known/local person/business.', 'Client-sample note'],
    ['Posting routine', 'Create upload checklist, thumbnails, and captions.', 'Posting checklist'],
    ['Improve speed', 'Practise templates, shortcuts, and export settings.', 'Timed edit proof'],
    ['Pricing and scope', 'Define clip length, revisions, delivery time, and payment rules.', 'Scope sheet'],
    ['Stabilise', 'Choose client route, content route, or further learning.', 'Next-step proof'],
  ],
  coding_foundations: [
    ['Computer/web basics', 'Understand browser, files, typing, and code editor basics.', 'Setup screenshot'],
    ['HTML foundation', 'Build one simple page with headings, text, and links.', 'HTML file/link proof'],
    ['CSS foundation', 'Style the page with readable layout and colors.', 'Styled page proof'],
    ['JavaScript or Python basics', 'Practise variables, input/output, and simple logic.', 'Solved exercise proof'],
    ['Small project 1', 'Build a calculator, quiz, or profile page.', 'Project proof'],
    ['GitHub proof', 'Create GitHub account and upload one project if safe.', 'GitHub/screenshot proof'],
    ['Debugging habit', 'Fix errors using notes, not copy-paste.', 'Bug log proof'],
    ['Small project 2', 'Build one useful local problem mini app/page.', 'Second project proof'],
    ['Portfolio page', 'Create one page showing projects and learning proof.', 'Portfolio proof'],
    ['Interview basics', 'Explain your project simply in learner language and English keywords.', 'Voice explanation proof'],
    ['Internship/tutoring check', 'Review public sources; no unpaid/fee traps without worker review.', 'Source review proof'],
    ['Next tech path', 'Choose web, Python, data, or support route.', 'Next-step decision'],
  ],
  shop_digitisation: [
    ['UPI and records', 'Set daily sales/expense record and UPI safety.', 'Daily record proof'],
    ['WhatsApp catalogue', 'Create product/service list with prices and photos.', 'Catalogue proof'],
    ['Google Business Profile', 'Prepare accurate location, hours, photos, and categories.', 'GBP draft proof'],
    ['Online listing check', 'Compare seller apps/ONDC only for fit and fees.', 'Listing-fee checklist'],
    ['Customer retention', 'Make repeat-customer messages and complaint log.', 'Retention note'],
    ['Inventory discipline', 'Track fast/slow items and stockouts.', 'Inventory proof'],
    ['Local discovery', 'Ask customers how they found the shop and improve photos.', 'Discovery note'],
    ['Stabilise', 'Review revenue, time, fees, and next digital step.', 'Monthly review proof'],
  ],
  business_bookkeeping_credit: [
    ['Cost and pricing', 'List all costs and set price with margin.', 'Cost sheet proof'],
    ['Daily bookkeeping', 'Record cash in/out every day.', '7-day cashbook proof'],
    ['Inventory and cash flow', 'Track stock, credit given, and payment delay risk.', 'Inventory/cash-flow proof'],
    ['Udyam/GST check', 'Check whether registration is needed now or later.', 'Registration decision note'],
    ['Margins and savings buffer', 'Identify low-margin items and emergency buffer.', 'Margin review proof'],
    ['Loan readiness caution', 'Calculate repayment before any loan application.', 'Repayment-risk note'],
    ['Scheme comparison', 'Compare MUDRA/Jan Samarth/Stand-Up only on official sources.', 'Scheme comparison proof'],
    ['Apply carefully', 'Apply only if documents, repayment, and buyer plan are ready.', 'Consent/family review proof'],
    ['Reinvest safely', 'Choose one small reinvestment, not a large risky jump.', 'Reinvestment plan'],
    ['Business system', 'Make weekly review routine.', 'Monthly system proof'],
  ],
  mobile_repair: [
    ['Parts and safety', 'Name phone parts and basic battery/screen safety.', 'Parts notebook/photo proof'],
    ['Tools and basic swaps', 'Learn screwdriver, opener, tweezer, and simple supervised swaps.', 'Tool checklist proof'],
    ['Screen basics', 'Understand screen replacement steps through demo/practice phone only.', 'Screen-step note'],
    ['Software basics', 'Learn backup, reset caution, and common software symptoms.', 'Software checklist'],
    ['Charging and power', 'Diagnose charging cable, port, battery, and adapter basics.', 'Charging diagnosis note'],
    ['Diagnostics', 'Use symptom checklist before opening any device.', 'Diagnosis form proof'],
    ['Apprenticeship/first repairs', 'Find supervised repair shop/trainer; no customer device alone yet.', 'Shop/trainer source review'],
    ['Service setup', 'Prepare service register, price caution, and warranty note.', 'Service register proof'],
    ['Chip-level awareness', 'Understand limits; do not do risky soldering unsupervised.', 'Limit/safety note'],
    ['Certification and growth', 'Review Skill India/course/certificate and next role.', 'Next-step proof'],
  ],
  electrician_solar: [
    ['Safety and basics', 'Learn shock risk, live/dead check, PPE, MCB, wire colors, and tool names.', 'Safety checklist proof'],
    ['Circuits and measurement', 'Practise series/parallel basics and multimeter/tester use with supervision.', 'Circuit diagram/photo proof'],
    ['House wiring basics', 'Learn switch, socket, bulb holder, earthing, and load caution.', 'Wiring practice proof'],
    ['ITI/PMKVY course check', 'Check local/online course source, fee, commute, and trainer credibility.', 'Course/source review proof'],
    ['Appliance repair basics', 'Learn fan/iron/basic appliance symptoms without opening live devices.', 'Appliance diagnosis note'],
    ['Shadowing wiring jobs', 'Observe a verified electrician; do not work alone on live wiring.', 'Shadowing checklist'],
    ['Solar basics', 'Learn panel, inverter, battery/grid-tie basics and rooftop safety.', 'Solar terms proof'],
    ['Solar scheme/practical', 'Check PM Surya Ghar information, not eligibility promises.', 'Scheme/source caution note'],
    ['Assessment', 'Review safety, circuits, tool use, and supervised practice evidence.', 'Assessment proof'],
    ['First small supervised jobs', 'Only supervised switch/socket/light tasks after safety review.', 'Supervised-job note'],
    ['Steady work routine', 'Create service register, complaint log, and payment rules.', 'Service register proof'],
    ['Specialise', 'Choose house wiring, appliance repair, or solar installer next.', 'Specialisation decision proof'],
  ],
  driving_delivery: [
    ['Driving basics and safety', 'Confirm vehicle access, road safety, and family/commute limits.', 'Safety checklist proof'],
    ['Licence steps', 'Use Parivahan Sarathi to check learner/permanent licence steps.', 'Licence-step note'],
    ['Driving practice', 'Practise supervised driving and parking basics.', 'Practice log proof'],
    ['Earning mode choice', 'Compare delivery, driver, logistics, or local transport work.', 'Mode comparison proof'],
    ['Onboarding source check', 'Review Swiggy/Zomato/Uber/Amazon Flex only from official pages.', 'Source review proof'],
    ['First earnings caution', 'Check fuel, maintenance, penalties, timing, and safety.', 'Earnings-cost sheet'],
    ['Maximise safely', 'Plan route/time and avoid unsafe late-night work if risky.', 'Safe route plan'],
    ['Stabilise or level up', 'Review weekly net income and next skill/licence step.', 'Weekly income review'],
  ],
};

export function matchedRoadmapPlan(profile = {}, question = '', route = {}) {
  const [match] = roadmapMatches(profile, question, route);
  if (!match) return null;
  const details = WEEK_DETAIL_BY_ROADMAP[match.id] || [];
  return {
    ...match,
    weeks_detail: details.slice(0, match.weeks).map(([title, goal, proof], index) => ({
      week: index + 1,
      title,
      goal,
      proof,
    })),
  };
}
