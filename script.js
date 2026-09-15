document.getElementById("year").textContent = new Date().getFullYear();

const navToggle = document.getElementById("nav-toggle");
const mobileNav = document.getElementById("mobile-nav");

if (navToggle && mobileNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

if (isIOS) {
  document.querySelectorAll(".map-link").forEach((link) => {
    link.href = "https://maps.apple.com/?address=7224+Eckhert+Rd%2C+San+Antonio%2C+TX+78238";
  });
}

const baGrid = document.querySelector(".ba-grid");
const baDots = document.querySelectorAll(".ba-dot");

if (baGrid && baDots.length) {
  const baCards = Array.from(baGrid.querySelectorAll(".ba-card"));
  const dotObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = baCards.indexOf(entry.target);
          baDots.forEach((dot, i) => dot.classList.toggle("active", i === index));
        }
      });
    },
    { root: baGrid, threshold: 0.6 }
  );
  baCards.forEach((card) => dotObserver.observe(card));
}

const form = document.getElementById("appointment-form");
const submitBtn = document.getElementById("submit-btn");
const successEl = document.getElementById("form-success");
const errorEl = document.getElementById("form-error");
const errorMessageEl = document.getElementById("form-error-message");
const DEFAULT_ERROR_MESSAGE = errorMessageEl.textContent;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.hidden = true;

  submitBtn.disabled = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = "Sending...";

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.botcheck = form.elements.botcheck.checked;

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (result.success) {
      form.hidden = true;
      successEl.hidden = false;
    } else {
      throw new Error(result.error || "Submission failed");
    }
  } catch (err) {
    errorMessageEl.textContent = err.message && err.message !== "Submission failed"
      ? err.message
      : DEFAULT_ERROR_MESSAGE;
    errorEl.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = typeof gsap !== "undefined";

// Hero wordmark: ink stroke draws in per letter, then the yellow fill fades in.
(function animateWordmark() {
  const svg = document.querySelector(".wordmark-svg");
  const strokeText = document.querySelector(".wordmark-stroke");
  const fillText = document.querySelector(".wordmark-fill");
  if (!svg || !strokeText || !fillText) return;

  function fitViewBox() {
    let box;
    try {
      box = strokeText.getBBox();
    } catch {
      return;
    }
    if (!box || !box.width) return;
    const pad = 10;
    svg.setAttribute(
      "viewBox",
      `${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`
    );
  }

  function playDraw() {
    fitViewBox();
    if (prefersReducedMotion || !hasGsap) {
      fillText.style.opacity = 1;
      return;
    }
    const letters = strokeText.querySelectorAll("tspan");
    const dash = 500;
    gsap.set(letters, { strokeDasharray: dash, strokeDashoffset: dash });
    gsap.timeline()
      .to(letters, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out", stagger: 0.06 })
      .to(fillText, { opacity: 1, duration: 0.5, ease: "power1.out" }, "-=0.3");
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(playDraw).catch(playDraw);
  } else {
    playDraw();
  }
  window.addEventListener("resize", fitViewBox);
})();

// Before/after cards: pop in like tossed-down comic panels, each settling at a slight tilt.
(function animateBeforeAfter() {
  if (!baGrid || prefersReducedMotion || !hasGsap) return;

  const cards = Array.from(baGrid.querySelectorAll(".ba-card"));
  if (!cards.length) return;

  const tilts = [-2, 1.5, -1.5, 2, -1];
  cards.forEach((card, i) => {
    card.style.setProperty("--ba-tilt", `${tilts[i % tilts.length]}deg`);
    gsap.set(card, { scale: 0.5, opacity: 0, rotate: 0 });
  });

  const seen = new WeakSet();
  const bounceObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        const tilt = getComputedStyle(entry.target).getPropertyValue("--ba-tilt") || "0deg";
        gsap.to(entry.target, {
          scale: 1,
          opacity: 1,
          rotate: tilt,
          duration: 0.9,
          ease: "elastic.out(1, 0.6)",
        });
      });
    },
    { threshold: 0.25 }
  );
  cards.forEach((card) => bounceObserver.observe(card));
})();
