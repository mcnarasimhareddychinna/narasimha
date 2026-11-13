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
    const card = document.querySelector(".install-card");
    if (open && card && !card.hidden) card.hidden = true;
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

  /* ---------- installable app (PWA) */
  const installCard = $(".install-card");
  const installButtons = $$("[data-install]");
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const DISMISS_KEY = "nr-install-dismissed";
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };
  const recentlyDismissed = () => Date.now() - (Number(store.get(DISMISS_KEY)) || 0) < 7 * 864e5;
  let deferredPrompt = null;
  let suggestTimer = null;

  const showInstallButtons = (on) => installButtons.forEach((b) => { b.hidden = !on; });
  const openInstallCard = (mode) => {
    if (!installCard || isStandalone()) return;
    const ios = mode === "ios";
    installCard.classList.toggle("ios", ios);
    $(".install-ios", installCard).hidden = !ios;
    const phone = window.matchMedia("(pointer: coarse)").matches;
    $(".install-text", installCard).textContent = `Add it to your ${phone || ios ? "home screen" : "desktop"} for one-tap access to the profile and resume, even offline.`;
    const later = $("[data-later]", installCard);
    if (later) later.textContent = ios ? "Got it" : "Not now";
    installCard.hidden = false;
  };
  const closeInstallCard = (remember) => {
    if (installCard) installCard.hidden = true;
    if (remember) store.set(DISMISS_KEY, String(Date.now()));
  };
  const runInstall = async () => {
    if (deferredPrompt) {
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      closeInstallCard(false);
      showInstallButtons(false);
      promptEvent.prompt();
      const choice = await promptEvent.userChoice.catch(() => null);
      if (!choice || choice.outcome !== "accepted") store.set(DISMISS_KEY, String(Date.now()));
    } else if (isIOS) {
      openInstallCard("ios");
    }
  };
  // Suggest the app once: after the visitor has looked around (scroll or a few seconds)
  const scheduleSuggestion = (mode) => {
    if (suggestTimer || isStandalone() || recentlyDismissed()) return;
    const go = () => {
      window.removeEventListener("scroll", onScrollSuggest);
      clearTimeout(suggestTimer);
      if (installCard && installCard.hidden && (mode === "ios" || deferredPrompt)) openInstallCard(mode);
    };
    const onScrollSuggest = () => { if (window.scrollY > window.innerHeight * 0.7) go(); };
    window.addEventListener("scroll", onScrollSuggest, { passive: true });
    suggestTimer = setTimeout(go, 6000);
  };

  installButtons.forEach((b) => b.addEventListener("click", () => { setMenu(false); runInstall(); }));
  $$("[data-install-confirm]").forEach((b) => b.addEventListener("click", runInstall));
  $$("[data-install-dismiss]").forEach((b) => b.addEventListener("click", () => closeInstallCard(true)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && installCard && !installCard.hidden) closeInstallCard(true); });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();               // show our own suggestion instead of the mini-infobar
    deferredPrompt = e;
    showInstallButtons(true);
    scheduleSuggestion("prompt");
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    closeInstallCard(false);
    showInstallButtons(false);
    showToast("App installed. Find it on your home screen.");
  });
  if (isIOS && !isStandalone()) {
    showInstallButtons(true);
    scheduleSuggestion("ios");
  }

  if ("serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => { /* offline support is optional */ }); });
  }

  /* ---------- footer year */
  const year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
