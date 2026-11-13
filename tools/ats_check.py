"""ATS readiness check for the generated resume (PDF + DOCX).

Checks: single page, text extractable in reading order, no ligature glyphs,
standard section headings, contact details parseable, and coverage of common
HR Recruiter / Talent Acquisition job-description keywords.
Run: python tools/ats_check.py
"""
import re
import sys
from pathlib import Path

import pymupdf
from docx import Document

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "assets/files/Narasimha_Reddy_MC_Resume.pdf"
DOCX = ROOT / "assets/files/Narasimha_Reddy_MC_Resume.docx"

SECTIONS = ["PROFESSIONAL SUMMARY", "TECHNICAL SKILLS", "SOFT SKILLS", "PROFESSIONAL EXPERIENCE",
            "PROJECTS", "EDUCATION", "CERTIFICATIONS"]
KEYWORDS = [
    "HR Recruiter", "Talent Acquisition", "Recruitment", "end-to-end", "Candidate Sourcing", "Naukri",
    "LinkedIn", "Resume Screening", "Shortlisting", "screening interviews", "Interview Scheduling",
    "Coordination", "Candidate Database", "Onboarding", "Documentation", "clients", "job requirements",
    "MBA", "Human Resource Management", "Marketing", "MS Excel", "Pivot Tables", "MS Word",
    "Power BI", "DAX", "SQL", "Python", "Pandas", "NumPy", "Data Analysis", "Dashboards", "Reports",
    "Effective Communication", "Time Management", "Teamwork", "Problem Solving", "Adaptability",
]

failures = 0
def check(ok, label):
    global failures
    print(("PASS " if ok else "FAIL ") + label)
    failures += 0 if ok else 1

doc = pymupdf.open(PDF)
text = "\n".join(p.get_text() for p in doc)
check(len(doc) == 1, f"PDF is one page ({len(doc)})")
check(len(text) > 2500, f"PDF text is selectable ({len(text)} characters)")
check(not re.search("[ﬀ-ﬆ]", text), "no ligature glyphs (fi/fl) that break keyword matching")
check(not any(p.get_images() for p in doc), "no images in the PDF")
fonts = {f[3] for p in doc for f in p.get_fonts()}
check(all("Calibri" in f for f in fonts), f"standard font only: {sorted(fonts)}")
pos = [text.find(s) for s in SECTIONS]
check(all(p >= 0 for p in pos), "all standard section headings present")
check(pos == sorted(pos), "sections extract in reading order")
check(bool(re.search(r"[\w.]+@gmail\.com", text)), "email parseable")
check(bool(re.search(r"\+91 \d{5} \d{5}", text)), "phone parseable")
check(text.lstrip().startswith("NARASIMHA REDDY M C"), "name is the first line")
low = text.lower()
missing = [k for k in KEYWORDS if k.lower() not in low]
check(not missing, f"keyword coverage {len(KEYWORDS) - len(missing)}/{len(KEYWORDS)}" + (f" missing: {missing}" if missing else ""))
meta = doc.metadata or {}
check("Narasimha" in (meta.get("title") or ""), f"PDF title metadata: {meta.get('title')}")

d = Document(DOCX)
dtext = "\n".join(p.text for p in d.paragraphs)
check(len(d.tables) == 0, "DOCX has no tables")
check(not d.sections[0].header.paragraphs[0].text.strip(), "DOCX header is empty (contact info in body)")
check(all(s.lower() in dtext.lower() for s in SECTIONS), "DOCX has all sections")
dmiss = [k for k in KEYWORDS if k.lower() not in dtext.lower()]
check(not dmiss, f"DOCX keyword coverage {len(KEYWORDS) - len(dmiss)}/{len(KEYWORDS)}" + (f" missing: {dmiss}" if dmiss else ""))

print("\nRESULT:", "all checks passed" if not failures else f"{failures} check(s) failed")
sys.exit(1 if failures else 0)
