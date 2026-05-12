"""
Outreach message templates — English + Hindi, per (segment, channel).
Used as fallback if the LLM is unavailable, AND as the seed prompt for the LLM.
"""
from __future__ import annotations
from typing import Tuple

# All templates use Python f-string-ish {placeholders} resolved by .format(**vars)
# Required vars: name, city, segment_label, video_url, sender_name

# ──────────────────────────────────────────────────────────────────
# Email — English
# ──────────────────────────────────────────────────────────────────
EMAIL_EN = {
    "farm_infra": {
        "subject": "Build your poultry shed in 3 days — no excavation, no RCC",
        "body": (
            "Hi {name},\n\n"
            "Saw that you operate in {city}. For farm structures like poultry sheds, "
            "dairy units and cold-storage godowns, our PEN Foundation — validated by "
            "NIT Calicut — installs in 2-3 days with no excavation and supports up to "
            "15 MT per nail. Designed strictly for single-storey and G+1 structures.\n\n"
            "Can I share a 2-minute installation video + a cost comparison vs RCC? "
            "Could save 3-4 weeks on your next farm build.\n\n"
            "— {sender_name}, C-DISC Technologies\n"
            "{video_url}"
        ),
    },
    "industrial_shed": {
        "subject": "Foundation for your industrial shed in 72 hours — no excavation",
        "body": (
            "Hi {name},\n\n"
            "You're developing single-storey industrial / warehouse structures in {city}. "
            "Our PEN Foundation — patented soil-nail tech validated by NIT Calicut — "
            "installs in 2-3 days for single-storey sheds with 15 MT load capacity per "
            "nail. Cost is typically 20-30% lower than conventional RCC footing.\n\n"
            "Can I share a 2-minute installation video? Could save 3 weeks on your next "
            "project.\n\n"
            "— {sender_name}, C-DISC Technologies\n"
            "{video_url}"
        ),
    },
    "resort": {
        "subject": "Eco-cottages with zero land disturbance — modular, net zero energy",
        "body": (
            "Hi {name},\n\n"
            "For resort and hospitality developers in {city}, our MNZE Homes offer "
            "relocatable eco-cottages with zero excavation (PEN Foundation, "
            "NIT-Calicut-validated) and integrated solar/energy systems. Single-storey "
            "and G+1 only — perfect for eco-resort, glamping, or heritage-stay projects "
            "where ground disturbance isn't permitted.\n\n"
            "Happy to share a site-visit video and discuss a pilot. Interested in a "
            "quick 15-min call?\n\n"
            "— {sender_name}, C-DISC Technologies\n"
            "{video_url}"
        ),
    },
    "self_build_g1": {
        "subject": "Your G+1 home — built in weeks, not months",
        "body": (
            "Hi {name},\n\n"
            "For single-storey or G+1 homes on individual plots in {city}, C-DISC "
            "combines MNZE light-gauge-steel homes with PEN Foundation (NIT-Calicut "
            "validated) — no deep excavation, factory-fabricated panels, site-assembled "
            "in days. Designed exclusively for G+1 and below.\n\n"
            "Can I share a 2-minute installation video + indicative price per sq.ft?\n\n"
            "— {sender_name}, C-DISC Technologies\n"
            "{video_url}"
        ),
    },
    "disaster_shelter": {
        "subject": "Rapid-deploy G+1 shelters for disaster relief — hours, not weeks",
        "body": (
            "Hi {name},\n\n"
            "For relief, rehabilitation and field-deployment needs in {city}, C-DISC's "
            "MNZE Homes + PEN Foundation deploy single-storey shelters in hours with no "
            "excavation. NIT-Calicut-validated soil-nail tech, 15 MT load capacity per "
            "nail, fully relocatable.\n\n"
            "We have completed similar deployments in South India and would value a "
            "15-minute call to discuss a pilot.\n\n"
            "— {sender_name}, C-DISC Technologies\n"
            "{video_url}"
        ),
    },
    "compound_wall": {
        "subject": "Compound walls without RCC footing — patented PEN Foundation",
        "body": (
            "Hi {name},\n\n"
            "For compound walls and perimeter fencing in {city}, PEN Foundation eliminates "
            "RCC footing entirely. Installs in hours, supports 15 MT per nail, validated "
            "by NIT Calicut. Ideal for plot boundaries, farm fencing and industrial perimeters.\n\n"
            "Can I share a 2-minute install video + cost comparison?\n\n"
            "— {sender_name}, C-DISC Technologies\n"
            "{video_url}"
        ),
    },
}

# ──────────────────────────────────────────────────────────────────
# Email — Hindi (Devanagari)
# ──────────────────────────────────────────────────────────────────
EMAIL_HI = {
    "farm_infra": {
        "subject": "अपनी पोल्ट्री शेड या डेयरी की नींव 3 दिन में — बिना खुदाई के",
        "body": (
            "नमस्ते {name} जी,\n\n"
            "{city} में आपके farm infrastructure projects के लिए — पोल्ट्री शेड, डेयरी, "
            "कोल्ड स्टोरेज, गोदाम — हमारी PEN Foundation technology (NIT Calicut से validated) "
            "बिना खुदाई के सिर्फ 2-3 दिन में install हो जाती है। 15 MT load capacity per nail। "
            "सिर्फ single-storey और G+1 structures के लिए।\n\n"
            "एक 2 मिनट का installation video और RCC से cost comparison भेज दूँ? आपके अगले "
            "project में 3-4 हफ्ते बच सकते हैं।\n\n"
            "— {sender_name}, C-DISC Technologies\n"
            "{video_url}"
        ),
    },
    "industrial_shed": {
        "subject": "Industrial shed की नींव 72 घंटे में — पेटेंटेड PEN Foundation",
        "body": (
            "नमस्ते {name} जी,\n\n"
            "{city} में आपके single-storey industrial / warehouse projects के लिए — हमारी "
            "PEN Foundation (NIT Calicut से validated) सिर्फ 2-3 दिन में install हो जाती है। "
            "15 MT load capacity per nail, और conventional RCC footing से 20-30% सस्ती।\n\n"
            "एक 2 मिनट का installation video भेज दूँ? आपके अगले project में 3 हफ्ते बच सकते हैं।\n\n"
            "— {sender_name}, C-DISC Technologies\n"
            "{video_url}"
        ),
    },
    "self_build_g1": {
        "subject": "आपका G+1 घर — हफ्तों में, महीनों में नहीं",
        "body": (
            "नमस्ते {name} जी,\n\n"
            "{city} में individual plot पर single-storey या G+1 घर बनाने के लिए — C-DISC के "
            "MNZE light-gauge-steel homes + PEN Foundation (NIT Calicut validated)। बिना deep "
            "excavation के, factory-made panels, दिनों में site पर assembled। सिर्फ G+1 और "
            "उससे कम के लिए।\n\n"
            "एक 2 मिनट का installation video और indicative price per sq.ft भेज दूँ?\n\n"
            "— {sender_name}, C-DISC Technologies\n"
            "{video_url}"
        ),
    },
    "compound_wall": {
        "subject": "बिना RCC footing के compound wall — पेटेंटेड PEN Foundation",
        "body": (
            "नमस्ते {name} जी,\n\n"
            "{city} में boundary wall या fencing के लिए — PEN Foundation को कोई RCC footing "
            "नहीं चाहिए। घंटों में install, 15 MT load per nail, NIT Calicut से validated। "
            "Plot, farm और industrial perimeter — सबके लिए perfect।\n\n"
            "2 मिनट का install video और cost comparison भेज दूँ?\n\n"
            "— {sender_name}, C-DISC Technologies\n"
            "{video_url}"
        ),
    },
}

# ──────────────────────────────────────────────────────────────────
# WhatsApp — Hindi (most farm/agri leads). Keep under 350 chars.
# ──────────────────────────────────────────────────────────────────
WHATSAPP_HI = {
    "farm_infra": (
        "Namaste {name} ji, C-DISC Technologies se hoon. Aapke {city} ke poultry/dairy/godown "
        "projects ke liye ek naya foundation — PEN Foundation, NIT Calicut se validated, "
        "bina khudai 2-3 din me install, 15 MT load per nail, G+1 tak. Ek 2-min ka video "
        "bhej sakta hoon? {video_url}"
    ),
    "industrial_shed": (
        "Namaste {name} ji, C-DISC Technologies se. Aapke {city} ke industrial shed projects "
        "ke liye PEN Foundation — NIT Calicut validated, koi excavation nahi, 2-3 din me "
        "install, RCC se 20-30% sasti. Single-storey ke liye. 2-min video bhejun? {video_url}"
    ),
    "self_build_g1": (
        "Namaste {name} ji, C-DISC Technologies se. {city} me G+1 ya single-floor ghar ke "
        "liye — MNZE Homes + PEN Foundation, NIT Calicut validated, factory-made, "
        "haftein me ready, bina deep digging. Sirf G+1 tak. Video bhejun? {video_url}"
    ),
    "compound_wall": (
        "Namaste {name} ji, C-DISC Technologies se. {city} me boundary wall / fencing ke "
        "liye PEN Foundation — bina RCC footing, ghanto me install, 15 MT load per nail. "
        "2-min ka demo video bhejun? {video_url}"
    ),
}

# ──────────────────────────────────────────────────────────────────
# LinkedIn — English (connection request + follow-up DM)
# ──────────────────────────────────────────────────────────────────
LINKEDIN_EN = {
    "industrial_shed": (
        "Hi {name}, noticed you're working on industrial shed / warehouse projects in "
        "{city}. We make pre-engineered foundations that cut install time to 2-3 days "
        "for single-storey structures (NIT-Calicut-validated). Would love to connect."
    ),
    "resort": (
        "Hi {name}, came across your profile in {city} hospitality space. We build "
        "MNZE eco-cottages with zero excavation — single-storey/G+1 only, ideal for "
        "eco-resort and heritage-stay projects. Would love to connect."
    ),
    "self_build_g1": (
        "Hi {name}, I noticed you work with self-build / individual home projects in "
        "{city}. We make pre-engineered G+1 home systems (MNZE + PEN Foundation) "
        "validated by NIT Calicut. Worth a 15-min call?"
    ),
    "farm_infra": (
        "Hi {name}, saw your work in farm infrastructure in {city}. We make a "
        "pre-engineered foundation (NIT-Calicut-validated) that installs in 2-3 days "
        "for poultry/dairy/godown sheds. Worth exploring?"
    ),
}

# ──────────────────────────────────────────────────────────────────
# Follow-up messages (Day 5 and Day 14)
# ──────────────────────────────────────────────────────────────────
FOLLOWUP_D5_EN = (
    "Hi {name}, following up on my note from last week. Sharing the 2-minute "
    "installation video here: {video_url}\n\n"
    "What kind of structure are you planning next? Happy to share a quick spec "
    "sheet matched to your project.\n\n— {sender_name}, C-DISC"
)
FOLLOWUP_D14_EN = (
    "Hi {name}, last check-in from my side. We're running a live demo near {city} "
    "next month — would you (or your site engineer) be interested in attending? "
    "30 minutes, no obligation.\n\n— {sender_name}, C-DISC"
)
FOLLOWUP_D5_HI = (
    "नमस्ते {name} जी, पिछले हफ्ते वाले message का follow-up। 2 मिनट का install video "
    "यहाँ है: {video_url}\n\nआप अगला कौनसा structure plan कर रहे हैं? उसके हिसाब से spec "
    "sheet भेज दूँगा।\n\n— {sender_name}, C-DISC"
)
FOLLOWUP_D14_HI = (
    "नमस्ते {name} जी, last check-in। {city} के पास अगले महीने एक live demo है — "
    "क्या आप या आपके site engineer आना चाहेंगे? 30 मिनट, कोई obligation नहीं।\n\n"
    "— {sender_name}, C-DISC"
)


def get_template(channel: str, language: str, segment_key: str) -> Tuple[str, str]:
    """Returns (subject_or_empty, body) template for the (channel, language, segment) tuple.

    Falls back to industrial_shed template if segment-specific template is missing.
    """
    if channel == "email":
        table = EMAIL_HI if language == "hi" else EMAIL_EN
        t = table.get(segment_key) or table.get("industrial_shed") or EMAIL_EN["industrial_shed"]
        return t["subject"], t["body"]
    if channel == "whatsapp":
        table = WHATSAPP_HI  # WhatsApp default is Hindi
        body = table.get(segment_key) or table.get("industrial_shed", "")
        return "", body
    if channel == "linkedin":
        body = LINKEDIN_EN.get(segment_key) or LINKEDIN_EN["industrial_shed"]
        return "", body
    raise ValueError(f"Unknown channel: {channel}")


def get_followups(channel: str, language: str) -> Tuple[str, str]:
    """Returns (d5_body, d14_body)."""
    if language == "hi":
        return FOLLOWUP_D5_HI, FOLLOWUP_D14_HI
    return FOLLOWUP_D5_EN, FOLLOWUP_D14_EN
