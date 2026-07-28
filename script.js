import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg = window.SATURN_CONFIG || {};
const supabase =
  cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY
    ? createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

// ---------------------------------------------------------------------------
// Scroll reveal
// ---------------------------------------------------------------------------
const revealTargets = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  revealTargets.forEach((el) => el.classList.add("is-visible"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const staggerItems = el.querySelectorAll(".bento-card, .loc-card");
        if (staggerItems.length) {
          staggerItems.forEach((item, i) => {
            item.style.transitionDelay = `${Math.min(i * 45, 400)}ms`;
          });
        }
        el.classList.add("is-visible");
        io.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );
  revealTargets.forEach((el) => io.observe(el));
}

// ---------------------------------------------------------------------------
// Mobile drawer
// ---------------------------------------------------------------------------
const navToggle = document.getElementById("navToggle");
const drawer = document.getElementById("mobileDrawer");
const drawerClose = document.getElementById("drawerClose");

function openDrawer() {
  drawer.classList.add("open");
  navToggle.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}
function closeDrawer() {
  drawer.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

navToggle?.addEventListener("click", openDrawer);
drawerClose?.addEventListener("click", closeDrawer);
drawer?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeDrawer));

// ---------------------------------------------------------------------------
// Footer year
// ---------------------------------------------------------------------------
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Enquiry form
// ---------------------------------------------------------------------------
const form = document.getElementById("enquiryForm");
const submitBtn = document.getElementById("submitBtn");
const submitLabel = document.getElementById("submitLabel");
const formStatus = document.getElementById("formStatus");

const FIELD_RULES = {
  name: (v) => (v.trim().length >= 2 ? "" : "Enter your full name."),
  phone: (v) => (/^[+\d][\d\s-]{7,}$/.test(v.trim()) ? "" : "Enter a valid phone number."),
  email: (v) => (!v || /^\S+@\S+\.\S+$/.test(v.trim()) ? "" : "Enter a valid email address."),
  location: (v) => (v ? "" : "Select a preferred centre."),
};

function setFieldError(name, message) {
  const input = form.elements[name];
  const errorEl = document.getElementById(`err-${name}`);
  const field = input.closest(".field");
  if (message) {
    field.classList.add("has-error");
    errorEl.textContent = message;
  } else {
    field.classList.remove("has-error");
    errorEl.textContent = "";
  }
  return !message;
}

function validateField(name) {
  const rule = FIELD_RULES[name];
  if (!rule) return true;
  const value = form.elements[name].value;
  return setFieldError(name, rule(value));
}

["name", "phone", "email", "location"].forEach((name) => {
  const el = form.elements[name];
  el.addEventListener("blur", () => validateField(name));
});

function setStatus(message, tone) {
  formStatus.classList.remove("is-success", "is-error");
  if (tone) formStatus.classList.add(tone);
  formStatus.lastChild.textContent = ` ${message}`;
}

function buildWhatsAppMessage(data) {
  const lines = [
    "Hi Saturn UPSC / GPSC Training Centre, I'd like to enquire about the Ancient India course.",
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    data.email ? `Email: ${data.email}` : null,
    `Preferred centre: ${data.location}`,
    data.message ? `Message: ${data.message}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fields = ["name", "phone", "email", "location"];
  const results = fields.map(validateField);
  if (results.includes(false)) {
    const firstInvalid = fields.find((name, i) => !results[i]);
    form.elements[firstInvalid].focus();
    setStatus("Please fix the highlighted fields.", "is-error");
    return;
  }

  const data = {
    name: form.elements.name.value.trim(),
    phone: form.elements.phone.value.trim(),
    email: form.elements.email.value.trim(),
    location: form.elements.location.value,
    message: form.elements.message.value.trim(),
  };

  submitBtn.disabled = true;
  submitLabel.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending…';
  setStatus("Sending your enquiry…", "");

  try {
    if (supabase) {
      const { error } = await supabase.from("enquiries").insert([data]);
      if (error) throw error;
    }
    setStatus("Enquiry sent. Opening WhatsApp to confirm details…", "is-success");
    const waNumber = cfg.WHATSAPP_NUMBER || "919499500333";
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(buildWhatsAppMessage(data))}`;
    window.open(waUrl, "_blank", "noopener");
    form.reset();
  } catch (err) {
    console.error("Enquiry submission failed:", err);
    setStatus("Something went wrong. Please call us directly or try again.", "is-error");
  } finally {
    submitBtn.disabled = false;
    submitLabel.textContent = "Send enquiry";
  }
});

// Keep the hero WhatsApp CTA prefilled even without a form submission.
const whatsappCta = document.getElementById("whatsappCta");
if (whatsappCta) {
  const waNumber = cfg.WHATSAPP_NUMBER || "919499500333";
  const defaultMsg =
    "Hi Saturn UPSC / GPSC Training Centre, I'd like to know more about the Ancient India course.";
  whatsappCta.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMsg)}`;
}
