/* Narasimha Reddy M C — portfolio interactions (no dependencies) */
(() => {
  "use strict";
  const doc = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- nav: scrolled state + progress bar */
  const nav = $(".nav");
  const bar = $(".progress span");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle("scrolled", y > 8);
      const max = doc.scrollHeight - window.innerHeight;
      bar.style.setProperty("--p", max > 0 ? Math.min(y / max, 1) : 0);
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu */
  const menuBtn = $(".menu-btn");
  const menu = $("#mobile-menu");
  const setMenu = (open) => {
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open;
    if (open) nav.classList.add("scrolled");
    else onScroll();
  };
  menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
  document.addEventListener("click", (e) => { if (!menu.hidden && !e.target.closest(".nav")) setMenu(false); });
  window.matchMedia("(min-width: 961px)").addEventListener("change", (m) => { if (m.matches) setMenu(false); });

  /* ---------- active nav link */
  const links = $$(".nav-links a");
  const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.remove("active"));
      const id = en.target.id === "resume" ? "education" : en.target.id;
      const link = byId.get(id);
      if (link) link.classList.add("active");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => sectionObs.observe(s));

  /* ---------- reveal on scroll (+ pipeline / dashboard animations) */
  const revealables = $$("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("in"));
  } else {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    revealables.forEach((el) => obs.observe(el));
    // Fallback: reveal anything already scrolled past, even if an observer callback was missed
    let pending = revealables.slice();
    const sweep = () => {
      const limit = window.innerHeight * 0.96;
      pending = pending.filter((el) => {
        if (el.classList.contains("in")) return false;
        if (el.getBoundingClientRect().top < limit) { el.classList.add("in"); obs.unobserve(el); return false; }
        return true;
      });
      if (!pending.length) window.removeEventListener("scroll", onSweep);
    };
    let sweepQueued = false;
    const onSweep = () => {
      if (sweepQueued) return;
      sweepQueued = true;
      setTimeout(() => { sweepQueued = false; sweep(); }, 120);
    };
    window.addEventListener("scroll", onSweep, { passive: true });
    window.addEventListener("load", sweep);
  }

  /* ---------- count-up stats */
  const counters = $$("[data-count]");
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
    const dur = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = (0).toFixed(decimals);
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { countUp(en.target); cObs.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach((c) => cObs.observe(c));
  }

  /* ---------- rotating role words */
  const word = $(".rotator-word");
  const words = ["Talent Acquisition", "Candidate Sourcing", "Resume Screening", "Interview Coordination", "Data-Driven Hiring"];
  if (word && !reduceMotion) {
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      word.classList.add("out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        word.textContent = words[i];
        word.classList.remove("out");
        word.classList.add("in");
        requestAnimationFrame(() => requestAnimationFrame(() => word.classList.remove("in")));
      }, 380);
    }, 2600);
  }

  /* ---------- spotlight hover on skill cards */
  $$(".spot").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ---------- toast */
  const toast = $(".toast");
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
  };

  /* ---------- copy email */
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch { /* ignore */ }
        ta.remove();
      }
      showToast("Email address copied");
    });
  });

  /* ---------- contact form -> mail app */
  const form = $(".contact-form");
  if (form) {
    const err = $(".form-error", form);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const message = String(data.get("message") || "").trim();
      const valid = name && message && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      err.hidden = !!valid;
      if (!valid) return;
      const subject = `Opportunity for Narasimha Reddy M C, from ${name}`;
      const body = `${message}\n\n${name}\n${email}`;
      window.location.href = `mailto:mcnarasimhareddychinna@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      showToast("Opening your email app…");
    });
  }

  /* ---------- footer year */
  const year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
