"""Build the UP political-history note as a DOCX per the assessment's formatting rules.

Formatting spec (from the guidelines):
- Font: Arial, size 11; single line spacing; A4; 0.5" margins on all sides.
- One line gap between paragraphs; justified text.
- Header (right): "816258_Divyaman Pal" in Arial size 9.
- No document title inside the note; section headings are allowed.
- Pyramid principle: each section opens with the governing message, then evidence.
- The whole note reads as one storyline of UP elections over the years.
"""

import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

OUT = "up_note/Divyaman_Pal_Note writing assessment.docx"
HEADER_TEXT = "816258_Divyaman Pal"
BODY_FONT = "Arial"
BODY_SIZE = 11
GAP_AFTER = Pt(10)  # ~ one line gap between paragraphs at 11pt single spacing

# (heading, [paragraphs]) ; heading None => intro with no heading
CONTENT = [
    (None, [
        "The storyline of Uttar Pradesh, the state that with 403 Assembly and 80 Lok Sabha seats decides who "
        "governs India, is the rise and fall of one social coalition after another. Congress ruled almost "
        "unchallenged from the 1950s to the 1980s; the twin shocks of Mandal (OBC reservation) and Mandir (the Ram "
        "movement) after 1989 broke that order and handed the state to two social-justice projects, Mulayam Singh "
        "Yadav's Samajwadi Party on a Yadav-Muslim base and Kanshi Ram's Bahujan Samaj Party on a Dalit base; from "
        "2014 the BJP overtook both by uniting non-Yadav OBCs, non-Jatav Dalits and upper castes behind Hindutva, "
        "welfare and Yogi Adityanath's governance model, sweeping 2014, 2017, 2019 and 2022; and in 2024 the "
        "opposition hit back as caste arithmetic, joblessness and farm distress cut the BJP to 33 of 80 seats. The "
        "single recommendation that runs through this note is that UP is won by the broadest social coalition married "
        "to credible delivery, and the sections below trace how each force rose, fell and must now position for 2027.",
    ]),
    ("Demographic and Geographic Analysis", [
        "The story begins with arithmetic: UP is a \"20-20-20-40\" state, roughly 20% upper caste, 21% Dalit, 19-20% "
        "Muslim and 40-45% OBC, so no community wins alone and the prize is always the largest cross-caste coalition. "
        "The recommendation that follows is simple: win the swing groups in the middle, namely the non-Yadav OBCs "
        "(about 30%: Kurmi, Maurya, Kushwaha, Lodh, Nishad, Rajbhar) and the non-Jatav Dalits (8-10%: Pasi, Valmiki), "
        "because the SP's Yadav (9-10%) plus Muslim core and the BSP's Jatav (10-12%) core each stall near a 30% "
        "ceiling.",
        "The numbers prove the point across the years. The BJP built its dominance by adding these swing blocs to the "
        "upper castes (Brahmin 9-10%, Thakur 7-8%) behind Hindu unity, winning 312 seats (39.7%) in 2017 and 255 "
        "(41.3%) in 2022 while its rivals stayed stuck near their ceilings (BSP 22.2% and SP 21.8% in 2017). The 2024 "
        "reversal happened the moment the SP prised the non-Yadav OBCs and non-Jatav Dalits partly away, lifting the "
        "INDIA bloc to 43 of 80 seats as the BSP's Dalit vote collapsed to 9.4%.",
        "Geography then decides where these blocs matter. Western UP and the Terai (sugarcane, dairy, NCR proximity) "
        "are the most prosperous zones, driven by Jat and RLD farmer politics where MSP, cane arrears and the 2020-21 "
        "farm-law agitation move votes, so the RLD's side-switching (with the SP in 2022, the BJP in 2024) repeatedly "
        "tilts a dozen-odd western seats. The Awadh-central and Purvanchal (eastern) Gangetic plains are the most "
        "populous, caste-saturated battlegrounds that settle the overall verdict, while Bundelkhand (drought, debt, "
        "stray-cattle distress, out-migration) and the backward Vindhyachal south-east are resource-poor zones where "
        "welfare and basic infrastructure outweigh identity. The practical recommendation is to localise the message: "
        "development and expressways in the west, welfare and social justice in the east and Bundelkhand.",
    ]),
    ("Recent Administrative Evolution", [
        "The recommendation here is that the creation, naming and renaming of districts in UP has been used less for "
        "administration than as symbolic identity-signalling and patronage, and it should be judged instead on "
        "service delivery; the state now has 75 districts and 18 divisions.",
        "The story is bipartisan but caste-coded. Mayawati's BSP carved out about ten districts named after Bahujan "
        "icons, from Sant Ravidas Nagar (1994), Ambedkar Nagar (1995) and Mahamaya Nagar (2002) to Kanshiram Nagar "
        "(2008), Chhatrapati Shahuji Maharaj Nagar (2010) and, weeks before the 2012 polls, Prabuddh Nagar, Panchsheel "
        "Nagar and Bhim Nagar, embedding Dalit memory in the map while handing out new district headquarters, posts "
        "and contracts as patronage, and she also demanded splitting UP into Pashchimanchal, Purvanchal and "
        "Bundelkhand. The Akhilesh-led SP then reversed eight of these names in 2012 to local toponyms (Kanshiram "
        "Nagar to Kasganj, Mahamaya Nagar to Hathras, Jyotiba Phule Nagar to Amroha, CSM Nagar to Amethi, Rama Bai "
        "Nagar to Kanpur Dehat, Bhim Nagar to Sambhal, Prabuddh Nagar to Shamli, Panchsheel Nagar to Hapur), which "
        "Mayawati attacked as an insult to Dalit icons, making the renaming itself a counter-mobilisation. Since 2017 "
        "the BJP has continued the same logic through Hindutva-coded renaming, turning Allahabad into Prayagraj and "
        "Faizabad into Ayodhya in 2018 and Mughalsarai junction into Deen Dayal Upadhyaya Nagar, converting the map "
        "into cultural assertion. The lesson is that map-making is a cheap substitute for delivery and should give way "
        "to measurable administrative gains.",
    ]),
    ("Leadership Impact", [
        "The recommendation is that Mulayam Singh Yadav and Kanshi Ram permanently democratised UP politics by "
        "institutionalising backward-caste and Dalit assertion, while Yogi Adityanath has re-centralised it around "
        "governance plus Hindutva, and any opposition plan must reckon with both legacies.",
        "Mulayam, a Lohiaite socialist who founded the SP in 1992, built the Yadav-Muslim coalition into a governing "
        "force (Chief Minister in 1989-91, 1993-95 and 2003-07) and, through the 1993 SP-BSP tie-up, blocked the BJP "
        "right after Babri, making OBC empowerment the central axis of state politics. Kanshi Ram built the "
        "organisational base of Dalit power through BAMCEF (1971), DS-4 and the BSP (1984), turning Ambedkarite "
        "identity into disciplined electoral strength and mentoring Mayawati, whose 2007 sarvajan experiment (Dalit "
        "plus Brahmin) delivered a rare single-party majority of 206 of 403 seats. Together they replaced Congress's "
        "patron-client model with competitive identity mobilisation that still frames the state.",
        "Yogi Adityanath, Chief Minister since 2017 and the first UP leader in 37 years to return after a full term in "
        "2022, recast that culture. He pairs a law-and-order narrative (encounters, bulldozer action, anti-Romeo "
        "squads) with visible development (the Purvanchal, Bundelkhand and Ganga expressways, new airports, Kashi "
        "Vishwanath and the Ram temple), targeted welfare and a tightly centralised, CM-monitored bureaucracy. The "
        "effect has been to shift UP from Mandal-era caste bargaining toward a presidential-style, "
        "performance-and-Hindutva model that subordinates caste blocs, notably excluding Yadav patronage, within a "
        "larger Hindu coalition; it is durable, but it cracks when jobs and farm distress take over the agenda, as 2024 "
        "showed.",
    ]),
    ("Current Challenges", [
        "The recommendation is that UP's governance gaps, unemployment, agrarian distress, weak infrastructure and "
        "human development, and contested law-and-order claims, are now the opposition's main opening, and the party "
        "that credibly owns delivery on them gains.",
        "Joblessness is the sharpest chapter. The 2024 cancellation of both the UP Police constable exam (around 48 "
        "lakh aspirants) and the UPPSC RO/ARO exam (about 10 lakh) over paper leaks, with 178 FIRs and roughly 396 "
        "arrests, crystallised youth anger and fed the BJP's losses. Agrarian distress runs deep in Bundelkhand "
        "(drought, debt, farmer suicides) and statewide through the stray-cattle menace created by the cow-slaughter "
        "crackdown, unpaid sugarcane dues and MSP demands raised by the Bharatiya Kisan Union. Despite flagship "
        "expressways and airports, per-capita income is near half the national average, with persistent gaps in "
        "health (exposed during COVID-19), education and urban services, while on law and order the BJP claims "
        "improvement through its encounter and bulldozer model even as critics cite custodial deaths, communal "
        "flashpoints and crimes against women and Dalits.",
        "Electorally, the BJP has answered with a labharthi (beneficiary) strategy of free foodgrain to about 15 crore "
        "people, PM Awas housing, Ujjwala, toilets and Kisan Samman Nidhi, alongside its law-and-order plank, while "
        "the SP-led opposition has answered with jobs, a caste census, defence of reservation and agrarian relief. The "
        "recommendation follows directly: incumbents must turn capital spending into jobs and human-development "
        "outcomes, and challengers must pair grievance with a concrete delivery alternative rather than identity alone.",
    ]),
    ("Electoral Shifts", [
        "This section is the spine of the storyline, and its recommendation is this: Congress fell because its "
        "coalition fragmented; the SP and BSP rose and then hit caste ceilings; the BJP won by transcending those "
        "ceilings; and 2024 showed that social-justice arithmetic plus governance discontent can still beat it, which "
        "is the template for 2027.",
        "Congress's decline opens the story. From dominance in the 1950s-80s, with its last majorities in 1980 and "
        "1985, Congress collapsed after 1989 when Mandal and Mandir split its umbrella of Brahmins, Dalits and "
        "Muslims: OBCs left for the SP, Dalits for the BSP, upper castes and Hindu-consolidation voters for the BJP, "
        "and Muslims moved to whoever could beat the BJP. With no social core, an ossified organisation and no "
        "state-level leadership, Congress has not formed a UP government since 1989 and won just 2 of 403 seats in "
        "2022.",
        "The BSP-SP see-saw and the 2017 rupture come next. The BSP's 206 seats (2007) and the SP's 224 (2012) "
        "majorities were each built by widening a caste core, the BSP's Dalit base plus Brahmins under sarvajan and "
        "the SP's Yadav-Muslim base plus anti-incumbency. Both were swept away in 2017 (BJP 312) when the BJP fused "
        "non-Jatav Dalits and non-Yadav OBCs with upper castes: each rival stayed near its 22% ceiling (BSP 22.2%, SP "
        "21.8%) while the BJP's Hindu coalition reached 39.7%.",
        "The BJP's winning formula from 2014 to 2022 is the climax. Seventy-one of 80 seats (42.6%) in 2014, 312 in "
        "2017, 62 of 80 (about 50%) in 2019 and 255 in 2022 all rested on three legs: caste engineering (non-Yadav "
        "OBC, non-Jatav Dalit and upper caste, with allies Apna Dal and NISHAD), welfare delivery (the labharthi "
        "vote), and nationalism and Hindutva (Modi's leadership, Balakot in 2019 and the Ram temple) that folded caste "
        "into Hindu unity.",
        "The alliances and the 2024 turn close the arc. The 2017 SP-Congress pact (54 seats) and the 2019 "
        "SP-BSP-RLD Mahagathbandhan (15 of 80, with the BSP on 10 and the SP on 5, against the BJP's 62) both failed "
        "because arithmetic never became chemistry: the Yadav and Jatav votes did not fully transfer, non-Jatav "
        "Dalits and non-Yadav OBCs stayed with the BJP, and Modi's nationalism and welfare overrode the caste sums. "
        "2024 was different because the SP's PDA (Pichhda-Dalit-Alpsankhyak) broadened the base beyond Yadav-Muslim "
        "through disciplined ticket distribution to non-Yadav OBCs, Dalits and the most-backward castes; the "
        "\"Constitution and reservation in danger\" narrative, set against the BJP's \"400-paar\" slogan, mobilised "
        "Dalits and OBCs; jobs, paper-leak and farm anger peaked together; and the SP-Congress vote transferred "
        "efficiently as the BSP collapsed to 9.4%, producing INDIA 43 and BJP 33.",
        "The lessons for 2027 are the closing recommendations: keep and widen the PDA coalition rather than leaning on "
        "the Yadav-Muslim core; build booth-level organisation to convert vote share into seats, since the 2019 "
        "failure was chemistry and not arithmetic; lead with local delivery issues (jobs, inflation, agrarian relief "
        "and law-and-order accountability) and a credible alternative to welfare, not identity alone; keep social "
        "justice (caste census, reservation) central while absorbing the BSP's drifting Dalit vote; and lock in "
        "disciplined seat-sharing and candidate selection early. For the BJP the counter is the mirror image: turn "
        "spending into jobs and win back non-Yadav OBC and non-Jatav Dalit loyalty, because its Hindu-coalition "
        "ceiling is breached precisely when governance fails.",
    ]),
]


def normalize(text):
    # Replace en/em dashes with plain hyphens per request.
    return text.replace("\u2014", "-").replace("\u2013", "-")


def style_run(run, size=BODY_SIZE, bold=False):
    run.font.name = BODY_FONT
    run.font.size = Pt(size)
    run.font.bold = bold
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn('w:rFonts'))
    if rfonts is None:
        rfonts = rpr.makeelement(qn('w:rFonts'), {})
        rpr.append(rfonts)
    for a in ('w:ascii', 'w:hAnsi', 'w:cs'):
        rfonts.set(qn(a), BODY_FONT)


def main():
    doc = docx.Document()

    normal = doc.styles['Normal']
    normal.font.name = BODY_FONT
    normal.font.size = Pt(BODY_SIZE)
    pf = normal.paragraph_format
    pf.line_spacing = 1.0
    pf.space_before = Pt(0)
    pf.space_after = Pt(0)

    sec = doc.sections[0]
    sec.page_width = Inches(8.27)
    sec.page_height = Inches(11.69)
    sec.top_margin = Inches(0.5)
    sec.bottom_margin = Inches(0.5)
    sec.left_margin = Inches(0.5)
    sec.right_margin = Inches(0.5)
    sec.header_distance = Inches(0.3)

    hp = sec.header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hr = hp.add_run(HEADER_TEXT)
    style_run(hr, size=9)

    for heading, paras in CONTENT:
        if heading:
            hpar = doc.add_paragraph()
            hpar.alignment = WD_ALIGN_PARAGRAPH.LEFT
            hpar.paragraph_format.space_before = Pt(2)
            hpar.paragraph_format.space_after = Pt(4)
            hpar.paragraph_format.line_spacing = 1.0
            hpar.paragraph_format.keep_with_next = True
            r = hpar.add_run(normalize(heading))
            style_run(r, size=BODY_SIZE, bold=True)
        for text in paras:
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.line_spacing = 1.0
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = GAP_AFTER
            r = p.add_run(normalize(text))
            style_run(r)

    doc.save(OUT)
    print("Saved", OUT)


if __name__ == "__main__":
    main()
