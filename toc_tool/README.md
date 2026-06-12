# Hyperlinked Table of Contents generator

Adds a clickable Table of Contents page to the *Compendium of Nutritional
Protocols* document, in both PDF and Word (`.docx`) formats. Every existing
page is preserved exactly; only one new TOC page is inserted (right after the
cover page).

The TOC lists all 38 main headings (the document's large heading-font
sections) with their starting page numbers. Each row is an internal hyperlink
that jumps to the start of that heading.

## Outputs

- `output/Compendium_Nutritional_Protocols_with_TOC.pdf`
- `output/Compendium_Nutritional_Protocols_with_TOC.docx`

## How it was built

```bash
pip install pymupdf pdf2docx python-docx
# (LibreOffice is used only to compute/verify Word page numbers)

# 1) PDF: insert the TOC page + internal links + PDF bookmarks
python3 build_pdf_toc.py <source.pdf> output/...with_TOC.pdf

# 2) Word: convert the source PDF to .docx, then add the TOC
python3 -c "from pdf2docx import Converter; c=Converter('<source.pdf>'); c.convert('/tmp/converted.docx'); c.close()"
python3 build_word_toc.py /tmp/converted.docx /tmp/word_stage1.docx          # placeholder page numbers
soffice --headless --convert-to pdf --outdir /tmp/lo /tmp/word_stage1.docx   # render to read real page numbers
#   (detect heading pages -> /tmp/word_pages.json)
python3 build_word_toc.py /tmp/converted.docx output/...with_TOC.docx /tmp/word_pages.json
```

### Notes

- **PDF**: the original 140 pages are byte-for-content identical; a single TOC
  page is inserted as page 2. Links are `GoTo` actions; a matching PDF outline
  (bookmarks) is also added.
- **Word**: page numbers use native `PAGEREF` fields (so Word keeps them
  correct), pre-filled with the computed values and flagged to refresh on open.
  Both the heading text and the page number are clickable. The Word body is
  produced by converting the source PDF, so its layout closely mirrors — but is
  not pixel-identical to — the original PDF.
