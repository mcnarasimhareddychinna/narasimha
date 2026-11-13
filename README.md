# Narasimha Reddy M C — Portfolio

Personal portfolio and ATS-friendly resume of **Narasimha Reddy M C**: MBA (Human Resource Management & Marketing) student, HR Recruiter Intern at Job Hunter, Bengaluru, with practical knowledge in talent acquisition and recruitment.

A fast static site with no build step and no dependencies: plain HTML, CSS and JavaScript.

## What's inside

| Path | Purpose |
| --- | --- |
| `index.html` | The portfolio (hero, about, experience, skills, project, education, resume, contact) |
| `resume.html` | Online version of the resume (also the source of the PDF) |
| `assets/css/styles.css` | All styles, responsive from 320 px phones to wide desktops |
| `assets/js/main.js` | Scroll reveals, counters, mobile menu, copy-email, contact form |
| `assets/files/` | `Narasimha_Reddy_MC_Resume.pdf` and `.docx` (ATS-friendly) |
| `assets/img/` | Portrait crops, resume preview, favicon, share image |
| `tools/resume.json` | **Single source of truth for the resume text** |
| `tools/build_resume.py` | Builds `resume.html`, the PDF (headless Edge), the Word file and the preview image |
| `tools/ats_check.py` | Checks the resume is one page, parseable, ligature-free and keyword-complete |
| `tools/og.html` | Template used to render `assets/img/og-image.jpg` |
| `vercel.json` | Clean URLs, caching and security headers |

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import this GitHub repository.
2. Set **Framework Preset** to **Other**. Leave the build command empty and the output directory as the repository root.
3. Click **Deploy**. Every push to `main` redeploys the site automatically.

After the first deploy:

- Replace `assets/img/og-image.jpg` in the `og:image` meta tag of `index.html` with the full URL (for example `https://<your-domain>/assets/img/og-image.jpg`). LinkedIn and WhatsApp previews need an absolute URL.
- Add the portfolio URL to the `contact` list in `tools/resume.json` and rebuild the resume.

## Updating the resume

```bash
# 1. edit tools/resume.json
python -m pip install python-docx pymupdf pillow
python tools/build_resume.py   # regenerates resume.html, PDF, DOCX and preview (needs Microsoft Edge or Chrome)
python tools/ats_check.py      # must print "all checks passed"
```

## Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.
