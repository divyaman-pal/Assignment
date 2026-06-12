"""Insert a hyperlinked Table of Contents page into the Compendium PDF.

The script keeps every existing page exactly as-is and only inserts ONE new
page (the Table of Contents) right after the cover page. Each row in the table
is an internal hyperlink that jumps to the page where that main heading starts.
Main headings are detected as the lines rendered in the document's largest
heading font sizes (>= 13 pt).
"""

import json
import sys
import fitz  # PyMuPDF

SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/source.pdf"
OUT = sys.argv[2] if len(sys.argv) > 2 else "toc_tool/output/Compendium_Nutritional_Protocols_with_TOC.pdf"

TOC_INSERT_INDEX = 1  # insert after the cover page (page 1)

# ---- colours / layout -------------------------------------------------------
LINK_COLOR = (0.094, 0.196, 0.545)   # dark navy-blue to signal clickable text
TITLE_COLOR = (0.078, 0.106, 0.184)
RULE_COLOR = (0.75, 0.78, 0.85)
DOT_COLOR = (0.55, 0.58, 0.66)

MARGIN_L = 64
MARGIN_R = 64
TITLE_Y = 86          # baseline-ish top of title
ENTRIES_TOP = 138
ROW_H = 17.2
FONT = "helv"
FONT_BOLD = "hebo"
ENTRY_SIZE = 10.5
PAGE_NUM_GAP = 6      # gap between dots and page number


def collect_headings(doc):
    headings = []
    for pno, page in enumerate(doc):
        d = page.get_text("dict")
        for b in d["blocks"]:
            if b["type"] != 0:
                continue
            for line in b["lines"]:
                spans = line["spans"]
                txt = "".join(s["text"] for s in spans).strip()
                if not txt:
                    continue
                maxsize = max(s["size"] for s in spans)
                if maxsize >= 13:
                    y0 = min(s["bbox"][1] for s in spans)
                    headings.append({
                        "src_index": pno,        # 0-based index in source doc
                        "y": round(y0, 1),
                        "title": " ".join(txt.split()),
                    })
    return headings


def fit_title(title, max_width, size):
    """Truncate a title with an ellipsis if it would overflow the text column."""
    if fitz.get_text_length(title, fontname=FONT, fontsize=size) <= max_width:
        return title
    ell = "\u2026"
    while title and fitz.get_text_length(title + ell, fontname=FONT, fontsize=size) > max_width:
        title = title[:-1]
    return title.rstrip() + ell


def main():
    doc = fitz.open(SRC)
    headings = collect_headings(doc)
    print(f"Detected {len(headings)} main headings")

    page_w = doc[0].rect.width
    page_h = doc[0].rect.height

    # Insert blank TOC page (same dimensions as the rest of the document).
    toc_page = doc.new_page(pno=TOC_INSERT_INDEX, width=page_w, height=page_h)

    # After insertion, every source page at index >= TOC_INSERT_INDEX shifts +1.
    def new_index(src_index):
        return src_index + 1 if src_index >= TOC_INSERT_INDEX else src_index

    # ---- Title --------------------------------------------------------------
    title_text = "Table of Contents"
    tw = fitz.get_text_length(title_text, fontname=FONT_BOLD, fontsize=20)
    toc_page.insert_text((page_w / 2 - tw / 2, TITLE_Y), title_text,
                         fontname=FONT_BOLD, fontsize=20, color=TITLE_COLOR)
    # underline rule beneath the title
    toc_page.draw_line((MARGIN_L, TITLE_Y + 12), (page_w - MARGIN_R, TITLE_Y + 12),
                       color=RULE_COLOR, width=1.0)

    # ---- Column header ------------------------------------------------------
    header_y = ENTRIES_TOP - 16
    toc_page.insert_text((MARGIN_L, header_y), "Heading",
                         fontname=FONT_BOLD, fontsize=10, color=TITLE_COLOR)
    pg_lbl = "Page"
    pg_lbl_w = fitz.get_text_length(pg_lbl, fontname=FONT_BOLD, fontsize=10)
    toc_page.insert_text((page_w - MARGIN_R - pg_lbl_w, header_y), pg_lbl,
                         fontname=FONT_BOLD, fontsize=10, color=TITLE_COLOR)

    page_num_col_right = page_w - MARGIN_R   # right edge for page numbers
    page_num_col_w = 26                       # reserved width for page number
    text_col_right = page_num_col_right - page_num_col_w - PAGE_NUM_GAP

    y = ENTRIES_TOP
    for h in headings:
        tgt_index = new_index(h["src_index"])
        disp_page = tgt_index + 1            # 1-based human page number in final PDF

        baseline = y + ENTRY_SIZE            # text baseline for this row

        # Heading text (clickable colour)
        title = fit_title(h["title"], text_col_right - MARGIN_L, ENTRY_SIZE)
        title_w = fitz.get_text_length(title, fontname=FONT, fontsize=ENTRY_SIZE)
        toc_page.insert_text((MARGIN_L, baseline), title,
                             fontname=FONT, fontsize=ENTRY_SIZE, color=LINK_COLOR)

        # Page number, right aligned
        num = str(disp_page)
        num_w = fitz.get_text_length(num, fontname=FONT, fontsize=ENTRY_SIZE)
        toc_page.insert_text((page_num_col_right - num_w, baseline), num,
                             fontname=FONT, fontsize=ENTRY_SIZE, color=LINK_COLOR)

        # Dot leaders between title and page number
        dot_start = MARGIN_L + title_w + 4
        dot_end = page_num_col_right - num_w - 4
        if dot_end > dot_start:
            dots_y = baseline - 2.5
            dot_str = ""
            one_dot = fitz.get_text_length(". ", fontname=FONT, fontsize=ENTRY_SIZE)
            n_dots = max(0, int((dot_end - dot_start) / one_dot))
            dot_str = ". " * n_dots
            toc_page.insert_text((dot_start, dots_y), dot_str,
                                 fontname=FONT, fontsize=ENTRY_SIZE, color=DOT_COLOR)

        # Clickable hyperlink covering the full row
        row_rect = fitz.Rect(MARGIN_L - 4, y - 2, page_num_col_right + 4, y + ROW_H - 3)
        toc_page.insert_link({
            "kind": fitz.LINK_GOTO,
            "from": row_rect,
            "page": tgt_index,
            "to": fitz.Point(0, max(0, h["y"] - 12)),
            "zoom": 0,
        })

        y += ROW_H

    # ---- PDF outline / bookmarks (navigation aid, no visible page change) ---
    outline = [[1, h["title"], new_index(h["src_index"]) + 1] for h in headings]
    doc.set_toc(outline)

    doc.save(OUT, garbage=4, deflate=True)
    print(f"Saved {OUT} with {doc.page_count} pages (was {doc.page_count - 1})")

    # Persist the resolved mapping for the Word builder & verification.
    mapping = [{
        "title": h["title"],
        "src_index": h["src_index"],
        "final_index": new_index(h["src_index"]),
        "display_page": new_index(h["src_index"]) + 1,
        "y": h["y"],
    } for h in headings]
    json.dump(mapping, open("/tmp/toc_mapping.json", "w"), indent=1)


if __name__ == "__main__":
    main()
