"""Build the ATS-friendly resume from tools/resume.json.

Outputs (paths relative to the repo root):
  resume.html                                   - online + print source
  assets/files/Narasimha_Reddy_MC_Resume.pdf    - text-based PDF (headless Edge)
  assets/files/Narasimha_Reddy_MC_Resume.docx   - Word version (python-docx)
  assets/img/resume-preview.webp                - page preview used on the site

Run:  python tools/build_resume.py
"""
from __future__ import annotations

import html
import json
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "tools" / "resume.json").read_text(encoding="utf-8"))
FILES = ROOT / "assets" / "files"
IMG = ROOT / "assets" / "img"
BASENAME = "Narasimha_Reddy_MC_Resume"
EDGE_CANDIDATES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]

e = html.escape


# --------------------------------------------------------------------------- HTML
def contact_html() -> str:
    parts = []
    for c in DATA["contact"]:
        text = e(c["text"])
        parts.append(f'<a href="{e(c["href"])}">{text}</a>' if c.get("href") else f"<span>{text}</span>")
    return ' <span class="sep">|</span> '.join(parts)


def section(title: str, body: str) -> str:
    return f'<section><h2>{e(title)}</h2>{body}</section>'


def bullets(items) -> str:
    return "<ul>" + "".join(f"<li>{e(b)}</li>" for b in items) + "</ul>"


def build_html() -> str:
    d = DATA
    skills = "".join(
        f'<p class="skill"><strong>{e(s["label"])}:</strong> {e(s["items"])}</p>' for s in d["skills"]
    )
    exp = ""
    for j in d["experience"]:
        org = " | ".join(x for x in (j["company"], j["location"]) if x)
        exp += (
            '<div class="item">'
            f'<div class="row"><h3>{e(j["title"])}</h3><span class="date">{e(j["dates"])}</span></div>'
            f'<p class="org">{e(org)}</p>'
            f'{bullets(j["bullets"])}</div>'
        )
    proj = ""
    for p in d["projects"]:
        proj += (
            '<div class="item">'
            f'<div class="row"><h3>{e(p["title"])}</h3><span class="date">{e(p["tools"])}</span></div>'
            f'{bullets(p["bullets"])}</div>'
        )
    edu = ""
    for ed in d["education"]:
        right = " | ".join(x for x in (ed["dates"], ed["result"]) if x)
        edu += (
            '<div class="item edu">'
            f'<div class="row"><h3>{e(ed["degree"])}</h3><span class="date">{e(right)}</span></div>'
            f'<p class="org">{e(ed["school"])}</p></div>'
        )
    certs = bullets(d["certifications"])

    body = (
        section("Professional Summary", f'<p>{e(d["summary"])}</p>')
        + section("Technical Skills", skills)
        + section("Soft Skills", f'<p>{e(d["soft_skills"])}</p>')
        + section("Professional Experience", exp)
        + section("Projects", proj)
        + section("Education", edu)
        + section("Certifications", certs)
    )

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Narasimha Reddy M C | Resume | HR Recruiter | Talent Acquisition</title>
<meta name="description" content="ATS-friendly resume of Narasimha Reddy M C – MBA (HR & Marketing), HR Recruiter Intern with practical knowledge in talent acquisition and recruitment.">
<meta name="author" content="Narasimha Reddy M C">
<meta name="robots" content="index,follow">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<style>
  @page {{ size: A4; margin: 10mm 13mm 9mm; }}
  * {{ box-sizing: border-box; }}
  html {{ background: #eef0f6; }}
  body {{ margin: 0; font-family: Calibri, Carlito, "Segoe UI", Arial, sans-serif; color: #111; font-size: 10.3pt; line-height: 1.25; font-variant-ligatures: none; font-feature-settings: "liga" 0, "clig" 0, "dlig" 0; font-kerning: normal; }}
  .toolbar {{ position: sticky; top: 0; z-index: 2; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; padding: 12px 16px; background: #3446d4; }}
  .toolbar a, .toolbar button {{ font: 600 14px/1 "Segoe UI", Arial, sans-serif; color: #fff; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.35); border-radius: 999px; padding: 10px 16px; text-decoration: none; cursor: pointer; }}
  .toolbar a:hover, .toolbar button:hover {{ background: rgba(255,255,255,.26); }}
  .page {{ width: 210mm; min-height: 297mm; margin: 24px auto; padding: 10mm 13mm 9mm; background: #fff; box-shadow: 0 10px 40px rgba(30,40,90,.14); }}
  header {{ text-align: center; }}
  h1 {{ margin: 0; font-size: 22pt; letter-spacing: .5px; line-height: 1.1; }}
  .headline {{ margin: 3px 0 4px; font-size: 11pt; font-weight: 700; color: #1f2f9e; }}
  .contact {{ margin: 0; font-size: 10pt; }}
  .contact a {{ color: #111; text-decoration: none; }}
  .contact .sep {{ color: #777; padding: 0 2px; }}
  section {{ margin-top: 6px; }}
  h2 {{ margin: 0 0 3px; padding-bottom: 1px; font-size: 11.2pt; text-transform: uppercase; letter-spacing: .6px; color: #1f2f9e; border-bottom: 1.2px solid #1f2f9e; }}
  h3 {{ margin: 0; font-size: 10.8pt; }}
  p {{ margin: 0; }}
  .skill {{ margin: 1px 0; }}
  .item {{ margin-top: 3px; }}
  .item.edu {{ margin-top: 2px; }}
  .row {{ display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }}
  .date {{ white-space: nowrap; font-weight: 700; font-size: 10.2pt; }}
  .org {{ font-style: italic; }}
  ul {{ margin: 2px 0 0; padding-left: 16px; }}
  li {{ margin: 0.5px 0; }}
  @media screen and (max-width: 760px) {{
    .page {{ width: auto; min-height: 0; margin: 12px; padding: 18px 16px; }}
    .row {{ flex-direction: column; gap: 0; }}
    .contact {{ word-break: normal; overflow-wrap: anywhere; }}
  }}
  @media print {{
    html, body {{ background: #fff; }}
    .toolbar {{ display: none; }}
    .page {{ width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; }}
    a {{ color: inherit; }}
  }}
</style>
</head>
<body>
<nav class="toolbar" aria-label="Resume actions">
  <a href="./">&larr; Portfolio</a>
  <a href="assets/files/{BASENAME}.pdf" download>Download PDF</a>
  <a href="assets/files/{BASENAME}.docx" download>Download Word</a>
  <button type="button" onclick="window.print()">Print</button>
</nav>
<main class="page">
<header>
  <h1>{e(d["name"])}</h1>
  <p class="headline">{e(d["headline"])}</p>
  <p class="contact">{contact_html()}</p>
</header>
{body}
</main>
</body>
</html>
"""


# --------------------------------------------------------------------------- DOCX
def build_docx(path: Path) -> None:
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Mm, Pt, RGBColor

    d = DATA
    blue = RGBColor(0x1F, 0x2F, 0x9E)
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Mm(210), Mm(297)
    sec.left_margin = sec.right_margin = Mm(14)
    sec.top_margin, sec.bottom_margin = Mm(12), Mm(11)
    text_width = sec.page_width - sec.left_margin - sec.right_margin

    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(10.5)
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    normal.paragraph_format.space_after = Pt(0)
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.line_spacing = 1.05

    props = doc.core_properties
    props.title = "Narasimha Reddy M C – Resume"
    props.author = "Narasimha Reddy M C"
    props.subject = "HR Recruiter | Talent Acquisition"
    props.keywords = "HR Recruiter, Talent Acquisition, Recruitment, MBA HR, Marketing"

    def para(text="", bold=False, size=None, color=None, align=None, italic=False, space_before=0):
        p = doc.add_paragraph()
        if text:
            r = p.add_run(text)
            r.bold, r.italic = bold, italic
            if size:
                r.font.size = Pt(size)
            if color:
                r.font.color.rgb = color
        if align is not None:
            p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        return p

    def heading(text):
        p = para(text.upper(), bold=True, size=11, color=blue, space_before=6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        ppr = p._p.get_or_add_pPr()
        bdr = OxmlElement("w:pBdr")
        bottom = OxmlElement("w:bottom")
        for k, v in (("w:val", "single"), ("w:sz", "8"), ("w:space", "1"), ("w:color", "1F2F9E")):
            bottom.set(qn(k), v)
        bdr.append(bottom)
        ppr.append(bdr)

    def row(left, right, space_before=3):
        p = para(space_before=space_before)
        p.paragraph_format.tab_stops.add_tab_stop(text_width, WD_TAB_ALIGNMENT.RIGHT)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(left)
        r.bold = True
        if right:
            r2 = p.add_run("\t" + right)
            r2.bold = True
        return p

    def bullet_list(items):
        for b in items:
            p = doc.add_paragraph(style="List Bullet")
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(1)
            p.add_run(b)

    para(d["name"], bold=True, size=22, align=WD_ALIGN_PARAGRAPH.CENTER)
    para(d["headline"], bold=True, size=11, color=blue, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2)
    para(" | ".join(c["text"] for c in d["contact"]), size=10, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2)

    heading("Professional Summary")
    para(d["summary"])

    heading("Technical Skills")
    for s in d["skills"]:
        p = para(space_before=1)
        p.add_run(s["label"] + ": ").bold = True
        p.add_run(s["items"])

    heading("Soft Skills")
    para(d["soft_skills"])

    heading("Professional Experience")
    for j in d["experience"]:
        row(j["title"], j["dates"], space_before=4)
        org = " | ".join(x for x in (j["company"], j["location"]) if x)
        para(org, italic=True)
        bullet_list(j["bullets"])

    heading("Projects")
    for pj in d["projects"]:
        row(pj["title"], pj["tools"], space_before=4)
        bullet_list(pj["bullets"])

    heading("Education")
    for ed in d["education"]:
        right = " | ".join(x for x in (ed["dates"], ed["result"]) if x)
        row(ed["degree"], right, space_before=3)
        para(ed["school"], italic=True)

    heading("Certifications")
    bullet_list(d["certifications"])

    doc.save(path)


# --------------------------------------------------------------------------- Edge
def find_edge() -> str:
    for c in EDGE_CANDIDATES:
        if Path(c).exists():
            return c
    sys.exit("Edge/Chrome not found – cannot print the PDF")


def run_edge(args: list[str], out: Path) -> None:
    """Run headless Edge and wait until it has finished writing `out`."""
    out.unlink(missing_ok=True)
    profile = tempfile.mkdtemp(prefix="edge-profile-")
    cmd = [find_edge(), "--headless=new", "--disable-gpu", "--no-first-run",
           "--hide-scrollbars", f"--user-data-dir={profile}", *args]
    subprocess.run(cmd, check=True, timeout=120, capture_output=True)
    last, stable = -1, 0
    for _ in range(150):  # up to ~30 s
        if out.exists():
            size = out.stat().st_size
            stable = stable + 1 if size == last and size > 0 else 0
            last = size
            if stable >= 3:
                break
        time.sleep(0.2)
    else:
        sys.exit(f"Edge did not write {out}")
    shutil.rmtree(profile, ignore_errors=True)


def main() -> None:
    FILES.mkdir(parents=True, exist_ok=True)
    IMG.mkdir(parents=True, exist_ok=True)

    html_path = ROOT / "resume.html"
    html_path.write_text(build_html(), encoding="utf-8")
    print("wrote", html_path.relative_to(ROOT))

    pdf_path = FILES / f"{BASENAME}.pdf"
    run_edge(["--no-pdf-header-footer", "--print-to-pdf-no-header",
              f"--print-to-pdf={pdf_path}", html_path.as_uri()], pdf_path)
    print("wrote", pdf_path.relative_to(ROOT), pdf_path.stat().st_size, "bytes")

    docx_path = FILES / f"{BASENAME}.docx"
    build_docx(docx_path)
    print("wrote", docx_path.relative_to(ROOT), docx_path.stat().st_size, "bytes")

    # Preview image rendered from the PDF itself, so it matches the download exactly
    import pymupdf
    from PIL import Image
    pdf = pymupdf.open(pdf_path)
    pages = len(pdf)
    pix = pdf[0].get_pixmap(dpi=150)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    out = IMG / "resume-preview.webp"
    im.save(out, "WEBP", quality=88, method=6)
    print("wrote", out.relative_to(ROOT), im.size, "| PDF pages:", pages)
    if pages != 1:
        print("WARNING: resume is", pages, "pages – tighten the layout")


if __name__ == "__main__":
    main()
