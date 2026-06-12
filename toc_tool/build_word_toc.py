"""Add a hyperlinked Table of Contents page to the converted Word document.

Strategy
--------
* The body of the document (converted from the original PDF with pdf2docx) is
  left untouched.
* A bookmark is placed at the start of each of the 38 main headings.
* A Table of Contents block (title + 2-column table) is inserted in its own
  section right after the cover page.
* Each row links to its heading via a Word hyperlink (anchor), and the page
  number is a native PAGEREF field (so Word keeps it correct). The displayed
  page number is pre-cached from a LibreOffice render so it is visible even
  before fields are refreshed, and ``updateFields`` is enabled so Word also
  refreshes it on open.
"""

import copy
import json
import sys
import docx
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.shared import Pt, RGBColor

IN_DOCX = sys.argv[1] if len(sys.argv) > 1 else "/tmp/converted.docx"
OUT_DOCX = sys.argv[2] if len(sys.argv) > 2 else "/tmp/word_stage1.docx"
PAGE_NUMBERS = sys.argv[3] if len(sys.argv) > 3 else None  # optional json list of cached numbers

LINK_HEX = "18328B"   # dark navy-blue (matches the PDF TOC)
TITLE_HEX = "141B2F"

headings = json.load(open("/tmp/headings.json"))
CLEAN_TITLES = [" ".join(h["title"].split()) for h in headings]

cached_numbers = None
if PAGE_NUMBERS:
    cached_numbers = json.load(open(PAGE_NUMBERS))


def find_heading_paragraphs(doc):
    """Return the 38 heading paragraphs (run font size >= 13pt), in order."""
    hits = []
    for p in doc.paragraphs:
        if not p.text.strip():
            continue
        maxsz = max((r.font.size.pt for r in p.runs if r.font.size), default=0)
        if maxsz >= 13:
            hits.append(p)
    return hits


def add_bookmark_to_paragraph(paragraph, bm_id, name):
    p = paragraph._p
    start = OxmlElement('w:bookmarkStart')
    start.set(qn('w:id'), str(bm_id))
    start.set(qn('w:name'), name)
    end = OxmlElement('w:bookmarkEnd')
    end.set(qn('w:id'), str(bm_id))
    pPr = p.find(qn('w:pPr'))
    if pPr is not None:
        pPr.addnext(start)
    else:
        p.insert(0, start)
    start.addnext(end)


def _run(text, *, bold=False, color=None, size=None):
    r = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    rFonts = OxmlElement('w:rFonts')
    for a in ('w:ascii', 'w:hAnsi', 'w:cs'):
        rFonts.set(qn(a), 'Roboto')
    rPr.append(rFonts)
    if bold:
        rPr.append(OxmlElement('w:b'))
    if color:
        c = OxmlElement('w:color'); c.set(qn('w:val'), color); rPr.append(c)
    if size:
        sz = OxmlElement('w:sz'); sz.set(qn('w:val'), str(int(size * 2))); rPr.append(sz)
    r.append(rPr)
    t = OxmlElement('w:t')
    t.set(qn('xml:space'), 'preserve')
    t.text = text
    r.append(t)
    return r


def make_hyperlink(anchor, text, *, bold=False, color=LINK_HEX, size=None, underline=False):
    h = OxmlElement('w:hyperlink')
    h.set(qn('w:anchor'), anchor)
    r = _run(text, bold=bold, color=color, size=size)
    if underline:
        rPr = r.find(qn('w:rPr'))
        u = OxmlElement('w:u'); u.set(qn('w:val'), 'single'); rPr.append(u)
    h.append(r)
    return h


def make_pageref_cell_content(anchor, cached_text):
    """A PAGEREF field (with \\h hyperlink switch) showing the page number."""
    elems = []
    begin = OxmlElement('w:r')
    fc = OxmlElement('w:fldChar'); fc.set(qn('w:fldCharType'), 'begin'); begin.append(fc)
    elems.append(begin)

    instr_r = OxmlElement('w:r')
    instr = OxmlElement('w:instrText')
    instr.set(qn('xml:space'), 'preserve')
    instr.text = f' PAGEREF {anchor} \\h '
    instr_r.append(instr)
    elems.append(instr_r)

    sep = OxmlElement('w:r')
    fc2 = OxmlElement('w:fldChar'); fc2.set(qn('w:fldCharType'), 'separate'); sep.append(fc2)
    elems.append(sep)

    elems.append(_run(cached_text, color=LINK_HEX))

    end = OxmlElement('w:r')
    fc3 = OxmlElement('w:fldChar'); fc3.set(qn('w:fldCharType'), 'end'); end.append(fc3)
    elems.append(end)
    return elems


def new_paragraph(jc=None, space_after=None):
    p = OxmlElement('w:p')
    pPr = OxmlElement('w:pPr')
    if jc:
        j = OxmlElement('w:jc'); j.set(qn('w:val'), jc); pPr.append(j)
    if space_after is not None:
        sp = OxmlElement('w:spacing'); sp.set(qn('w:after'), str(space_after)); pPr.append(sp)
    p.append(pPr)
    return p, pPr


def set_no_borders(tbl):
    tblPr = tbl.find(qn('w:tblPr'))
    borders = OxmlElement('w:tblBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        e = OxmlElement('w:' + edge)
        e.set(qn('w:val'), 'none'); e.set(qn('w:sz'), '0')
        e.set(qn('w:space'), '0'); e.set(qn('w:color'), 'auto')
        borders.append(e)
    tblPr.append(borders)


def build_toc_table(num_rows):
    tbl = OxmlElement('w:tbl')
    tblPr = OxmlElement('w:tblPr')
    style = OxmlElement('w:tblStyle'); style.set(qn('w:val'), 'TableNormal'); tblPr.append(style)
    w = OxmlElement('w:tblW'); w.set(qn('w:w'), '5000'); w.set(qn('w:type'), 'pct'); tblPr.append(w)
    layout = OxmlElement('w:tblLayout'); layout.set(qn('w:type'), 'fixed'); tblPr.append(layout)
    tbl.append(tblPr)
    grid = OxmlElement('w:tblGrid')
    for wpx in (8400, 900):
        gc = OxmlElement('w:gridCol'); gc.set(qn('w:w'), str(wpx)); grid.append(gc)
    tbl.append(grid)
    set_no_borders(tbl)
    return tbl


def make_cell(width, contents, jc=None):
    tc = OxmlElement('w:tc')
    tcPr = OxmlElement('w:tcPr')
    w = OxmlElement('w:tcW'); w.set(qn('w:w'), str(width)); w.set(qn('w:type'), 'dxa'); tcPr.append(w)
    va = OxmlElement('w:vAlign'); va.set(qn('w:val'), 'center'); tcPr.append(va)
    tc.append(tcPr)
    p, pPr = new_paragraph(jc=jc, space_after=40)
    for c in contents:
        p.append(c)
    tc.append(p)
    return tc


def main():
    doc = docx.Document(IN_DOCX)
    heading_ps = find_heading_paragraphs(doc)
    assert len(heading_ps) == len(CLEAN_TITLES), (len(heading_ps), len(CLEAN_TITLES))
    for hp, title in zip(heading_ps, CLEAN_TITLES):
        assert hp.text.strip().startswith(title[:12]), (hp.text[:30], title[:30])

    # 1) bookmarks at each heading
    bm_names = []
    for i, hp in enumerate(heading_ps):
        name = f"TOC_BM_{i}"
        add_bookmark_to_paragraph(hp, 1000 + i, name)
        bm_names.append(name)

    # cover = first section. Executive Summary paragraph (index of first heading)
    # marks the start of the body proper. Insert the TOC block just before it.
    anchor_para = heading_ps[0]._p

    # Title paragraph
    title_p, title_pPr = new_paragraph(jc='center', space_after=160)
    title_p.append(_run("Table of Contents", bold=True, color=TITLE_HEX, size=20))
    anchor_para.addprevious(title_p)

    # TOC table
    tbl = build_toc_table(len(bm_names))
    for i, (name, title) in enumerate(zip(bm_names, CLEAN_TITLES)):
        tr = OxmlElement('w:tr')
        head_cell = make_cell(8400, [make_hyperlink(name, title, color=LINK_HEX)])
        num_text = str(cached_numbers[i]) if cached_numbers else "1"
        page_cell = make_cell(900, make_pageref_cell_content(name, num_text), jc='right')
        tr.append(head_cell); tr.append(page_cell)
        tbl.append(tr)
    anchor_para.addprevious(tbl)

    # Closing section break paragraph so the body restarts on a fresh page.
    sect_p = OxmlElement('w:p')
    sect_pPr = OxmlElement('w:pPr')
    # clone page geometry from an existing section
    src_sectPr = doc.sections[0]._sectPr
    new_sectPr = copy.deepcopy(src_sectPr)
    # ensure next-page break
    for t in new_sectPr.findall(qn('w:type')):
        new_sectPr.remove(t)
    typ = OxmlElement('w:type'); typ.set(qn('w:val'), 'nextPage')
    new_sectPr.insert(0, typ)
    # strip header/footer refs cloned (keep simple)
    sect_pPr.append(new_sectPr)
    sect_p.append(sect_pPr)
    anchor_para.addprevious(sect_p)

    # 2) make Word refresh fields on open
    settings = doc.settings.element
    if settings.find(qn('w:updateFields')) is None:
        uf = OxmlElement('w:updateFields'); uf.set(qn('w:val'), 'true')
        settings.append(uf)

    doc.save(OUT_DOCX)
    print(f"Saved {OUT_DOCX}; headings bookmarked={len(bm_names)}; cached_numbers={'yes' if cached_numbers else 'no'}")


if __name__ == "__main__":
    main()
