const WHATSAPP_NUMBER = "919910420242";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyn83kyI-z9MbVdgS2xCfpdJIv530oAj-eDYMEVCWrlghpESpvppE96TrsHLLZCOADPcw/exec"; // Paste your Google Apps Script web app URL here

const products = [
  {
    id: "pink-dress",
    name: "Pretty in Pink",
    code: "CC-PINK-01",
    description: "A soft pink dress with delicate embroidery, feminine detailing, and a graceful drape. Perfect for brunches, celebrations, and special days out.",
    short: "Soft pink with delicate embroidery and a graceful drape.",
    occasions: ["Day out", "Brunch", "Celebrations"],
    sizes: ["S", "M", "L", "XL"],
    image: "assets/images/collection-3.png",
    tag: "New arrival"
  },
  {
    id: "white-dress",
    name: "Grace in White",
    code: "CC-WHITE-01",
    description: "An elegant white handcrafted piece with lace detailing, soft fabric, and a timeless silhouette for festive looks and special evenings.",
    short: "Elegant white with lace detailing and a timeless silhouette.",
    occasions: ["Special occasions", "Festive looks", "Evenings"],
    sizes: ["S", "M", "L", "XL"],
    image: "assets/images/collection-4.png",
    tag: "Limited pieces"
  }
];

const productsGrid = document.getElementById("productsGrid");
const modal = document.getElementById("productModal");
const lightbox = document.getElementById("lightbox");
const toast = document.getElementById("toast");
const header = document.getElementById("header");
const navSentinel = document.getElementById("navSentinel");
const sizeError = document.getElementById("sizeError");
const contactForm = document.getElementById("contactForm");

let activeProduct = null;
let selectedSize = "";
let quantity = 1;
let toastTimer = null;
let pendingWhatsAppMessage = "";
let welcomeSlideIndex = 0;
let welcomeAutoTimer = null;

const thankYouPopup = document.getElementById("thankYouPopup");
const welcomePopup = document.getElementById("welcomePopup");
const welcomeTrack = document.getElementById("welcomeTrack");
const welcomeDots = document.getElementById("welcomeDots");
const WELCOME_SLIDE_COUNT = 3;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function isValidPhone(value) {
  return /^[0-9+\s-]{10,15}$/.test(String(value).trim());
}

function setFieldError(id, show) {
  const el = document.getElementById(id);
  if (el) el.hidden = !show;
}

async function submitToGoogleSheet(payload) {
  if (!GOOGLE_SCRIPT_URL) {
    return { success: false, skipped: true };
  }

  try {
    // Google Apps Script web apps need a redirect-friendly POST.
    // text/plain avoids preflight CORS issues.
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    // If Google returned a login / Drive access HTML page, treat as deploy permission error.
    if (text.includes("You need access") || text.includes("accounts.google.com") || text.trim().startsWith("<!")) {
      return {
        success: false,
        message: "Google Sheets access blocked. Redeploy Apps Script as Web app with Execute as: Me and Who has access: Anyone."
      };
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      return { success: false, message: "Unexpected response from Google Sheets." };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function renderProducts() {
  productsGrid.innerHTML = products.map(product => `
    <article class="product-card reveal">
      <div class="product-image">
        <span class="product-tag">${product.tag}</span>
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.short}</p>
        <div class="product-bottom">
          <span class="product-note">Price shared on WhatsApp</span>
          <div class="product-actions">
            <button class="mini-btn" type="button" data-view="${product.id}">View details</button>
            <button class="mini-btn primary" type="button" data-order="${product.id}">Order</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");

  productsGrid.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => openProduct(btn.dataset.view));
  });

  productsGrid.querySelectorAll("[data-order]").forEach(btn => {
    btn.addEventListener("click", () => openProduct(btn.dataset.order));
  });

  observeReveal(productsGrid.querySelectorAll(".reveal"));
}

function openProduct(id) {
  activeProduct = products.find(p => p.id === id);
  if (!activeProduct) return;

  selectedSize = "";
  quantity = 1;
  sizeError.hidden = true;
  setFieldError("orderNameError", false);
  setFieldError("orderPhoneError", false);

  document.getElementById("modalImage").src = activeProduct.image;
  document.getElementById("modalImage").alt = activeProduct.name;
  document.getElementById("modalTag").textContent = activeProduct.tag;
  document.getElementById("modalTitle").textContent = activeProduct.name;
  document.getElementById("modalNote").textContent = "Price shared on WhatsApp";
  document.getElementById("modalDescription").textContent = activeProduct.description;
  document.getElementById("modalCode").textContent = `Product code: ${activeProduct.code}`;
  document.getElementById("qtyValue").textContent = String(quantity);
  document.getElementById("orderName").value = "";
  document.getElementById("orderPhone").value = "";
  document.getElementById("orderNotes").value = "";

  document.getElementById("modalOccasions").innerHTML = activeProduct.occasions
    .map(item => `<span class="occasion-pill">${item}</span>`)
    .join("");

  renderSizes();
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  lockBodyScroll();
}

function renderSizes() {
  const container = document.getElementById("sizeOptions");
  container.innerHTML = activeProduct.sizes.map(size =>
    `<button type="button" class="${selectedSize === size ? "selected" : ""}" data-size="${size}">${size}</button>`
  ).join("");

  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedSize = btn.dataset.size;
      sizeError.hidden = true;
      renderSizes();
    });
  });
}

function lockBodyScroll() {
  document.body.style.overflow = "hidden";
}

function unlockBodyScroll() {
  const anyOpen =
    modal.classList.contains("active") ||
    lightbox.classList.contains("active") ||
    thankYouPopup.classList.contains("active") ||
    welcomePopup.classList.contains("active");

  if (!anyOpen) document.body.style.overflow = "";
}

function openThankYouPopup(message, summary) {
  pendingWhatsAppMessage = message;
  document.getElementById("thankYouText").textContent = summary;
  thankYouPopup.classList.add("active");
  thankYouPopup.setAttribute("aria-hidden", "false");
  lockBodyScroll();
}

function closeThankYouPopup() {
  thankYouPopup.classList.remove("active");
  thankYouPopup.setAttribute("aria-hidden", "true");
  pendingWhatsAppMessage = "";
  unlockBodyScroll();
}

function openWelcomePopup() {
  if (sessionStorage.getItem("ccWelcomeSeen") === "1") return;
  welcomePopup.classList.add("active");
  welcomePopup.setAttribute("aria-hidden", "false");
  lockBodyScroll();
  setWelcomeSlide(0);
  startWelcomeAutoplay();
}

function closeWelcomePopup() {
  welcomePopup.classList.remove("active");
  welcomePopup.setAttribute("aria-hidden", "true");
  sessionStorage.setItem("ccWelcomeSeen", "1");
  stopWelcomeAutoplay();
  unlockBodyScroll();
}

function setWelcomeSlide(index) {
  welcomeSlideIndex = (index + WELCOME_SLIDE_COUNT) % WELCOME_SLIDE_COUNT;
  welcomeTrack.style.transform = `translateX(-${welcomeSlideIndex * 100}%)`;
  welcomeDots.querySelectorAll("button").forEach((dot, i) => {
    dot.classList.toggle("active", i === welcomeSlideIndex);
  });
}

function startWelcomeAutoplay() {
  stopWelcomeAutoplay();
  welcomeAutoTimer = setInterval(() => setWelcomeSlide(welcomeSlideIndex + 1), 3200);
}

function stopWelcomeAutoplay() {
  if (welcomeAutoTimer) {
    clearInterval(welcomeAutoTimer);
    welcomeAutoTimer = null;
  }
}

function initWelcomeCarousel() {
  welcomeDots.innerHTML = Array.from({ length: WELCOME_SLIDE_COUNT }, (_, i) =>
    `<button type="button" aria-label="Go to slide ${i + 1}" class="${i === 0 ? "active" : ""}"></button>`
  ).join("");

  welcomeDots.querySelectorAll("button").forEach((dot, i) => {
    dot.addEventListener("click", () => {
      setWelcomeSlide(i);
      startWelcomeAutoplay();
    });
  });

  document.getElementById("welcomePrev").addEventListener("click", () => {
    setWelcomeSlide(welcomeSlideIndex - 1);
    startWelcomeAutoplay();
  });

  document.getElementById("welcomeNext").addEventListener("click", () => {
    setWelcomeSlide(welcomeSlideIndex + 1);
    startWelcomeAutoplay();
  });

  document.querySelectorAll("[data-close-welcome]").forEach(el => {
    el.addEventListener("click", closeWelcomePopup);
  });

  setTimeout(openWelcomePopup, 3000);
}

function closeModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  unlockBodyScroll();
}

function openLightbox(src, caption) {
  document.getElementById("lightboxImage").src = src;
  document.getElementById("lightboxImage").alt = caption;
  document.getElementById("lightboxCaption").textContent = caption;
  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
  lockBodyScroll();
}

function closeLightbox() {
  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  unlockBodyScroll();
}

document.querySelectorAll("[data-close-modal]").forEach(el => {
  el.addEventListener("click", closeModal);
});

document.querySelectorAll("[data-close-lightbox]").forEach(el => {
  el.addEventListener("click", closeLightbox);
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeModal();
    closeLightbox();
    closeThankYouPopup();
    closeWelcomePopup();
    closeMobileMenu();
  }
});

document.getElementById("minusQty").addEventListener("click", () => {
  quantity = Math.max(1, quantity - 1);
  document.getElementById("qtyValue").textContent = String(quantity);
});

document.getElementById("plusQty").addEventListener("click", () => {
  quantity += 1;
  document.getElementById("qtyValue").textContent = String(quantity);
});

function openWhatsApp(message) {
  if (WHATSAPP_NUMBER.includes("XXXXXXXX")) {
    showToast("Add your WhatsApp number in script.js to enable ordering.");
    return;
  }
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
}

function createOrderMessage(product, size = "", qty = 1, name = "", phone = "", notes = "") {
  return [
    "Hi Chhavi's Creations,",
    "",
    "I would like to order:",
    "",
    name ? `Name: ${name}` : "",
    phone ? `Phone: ${phone}` : "",
    `Product: ${product.name}`,
    `Product code: ${product.code}`,
    size ? `Size: ${size}` : "",
    `Quantity: ${qty}`,
    notes ? `Notes: ${notes}` : "",
    "",
    "Please share availability and payment details. Thank you."
  ].filter(Boolean).join("\n");
}

async function saveOrderToSheet(orderData) {
  return submitToGoogleSheet({
    type: "order",
    ...orderData
  });
}

document.getElementById("modalOrderBtn").addEventListener("click", async () => {
  const name = document.getElementById("orderName").value.trim();
  const phone = document.getElementById("orderPhone").value.trim();
  const notes = document.getElementById("orderNotes").value.trim();

  let valid = true;

  if (!selectedSize) {
    sizeError.hidden = false;
    valid = false;
  }

  if (!name) {
    setFieldError("orderNameError", true);
    valid = false;
  } else {
    setFieldError("orderNameError", false);
  }

  if (!isValidPhone(phone)) {
    setFieldError("orderPhoneError", true);
    valid = false;
  } else {
    setFieldError("orderPhoneError", false);
  }

  if (!valid || !activeProduct) return;

  const orderBtn = document.getElementById("modalOrderBtn");
  orderBtn.disabled = true;
  orderBtn.classList.add("loading");

  const sheetResult = await saveOrderToSheet({
    name,
    phone,
    product: activeProduct.name,
    productCode: activeProduct.code,
    size: selectedSize,
    quantity: String(quantity),
    notes
  });

  orderBtn.disabled = false;
  orderBtn.classList.remove("loading");

  const message = createOrderMessage(activeProduct, selectedSize, quantity, name, phone, notes);

  if (sheetResult.skipped) {
    closeModal();
    openThankYouPopup(message, "Your order details are ready. Connect Google Sheets to auto-save future orders.");
    return;
  }

  if (sheetResult.success) {
    closeModal();
    openThankYouPopup(message, `Thank you, ${name}. Your order for ${activeProduct.name} has been saved successfully.`);
    return;
  }

  showToast(sheetResult.message || "Could not save order. Please try again.");
});

document.querySelectorAll("[data-close-thankyou]").forEach(el => {
  el.addEventListener("click", closeThankYouPopup);
});

document.getElementById("thankYouWhatsAppYes").addEventListener("click", () => {
  if (pendingWhatsAppMessage) openWhatsApp(pendingWhatsAppMessage);
  closeThankYouPopup();
});

contactForm.addEventListener("submit", async e => {
  e.preventDefault();

  const name = document.getElementById("contactName").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const inquiryType = document.getElementById("contactType").value;
  const message = document.getElementById("contactMessage").value.trim();

  let valid = true;

  setFieldError("contactNameError", !name);
  setFieldError("contactPhoneError", !isValidPhone(phone));
  setFieldError("contactMessageError", !message);

  if (!name || !isValidPhone(phone) || !message) {
    valid = false;
  }

  if (!valid) return;

  const submitBtn = document.getElementById("contactSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.classList.add("loading");

  const result = await submitToGoogleSheet({
    type: "contact",
    name,
    phone,
    email,
    inquiryType,
    message
  });

  submitBtn.disabled = false;
  submitBtn.classList.remove("loading");

  if (result.skipped) {
    showToast("Connect Google Sheets URL in script.js to save messages.");
    return;
  }

  if (result.success) {
    contactForm.reset();
    showToast("Message sent. We will get back to you soon.");
  } else {
    showToast("Could not send message. Please try WhatsApp instead.");
  }
});

document.querySelectorAll('[data-whatsapp="general"]').forEach(button => {
  button.addEventListener("click", () => {
    openWhatsApp("Hi Chhavi's Creations, I have a question about your collection.");
  });
});

document.querySelectorAll("[data-lightbox]").forEach(item => {
  item.addEventListener("click", () => {
    openLightbox(item.dataset.lightbox, item.dataset.caption || "Chhavi's Creations");
  });
});

const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const menuBackdrop = document.getElementById("menuBackdrop");

function closeMobileMenu() {
  mobileMenu.classList.remove("open");
  menuBackdrop.classList.remove("open");
  menuBtn.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
  mobileMenu.setAttribute("aria-hidden", "true");
  menuBackdrop.setAttribute("aria-hidden", "true");
}

menuBtn.addEventListener("click", () => {
  const open = !mobileMenu.classList.contains("open");
  mobileMenu.classList.toggle("open", open);
  menuBackdrop.classList.toggle("open", open);
  menuBtn.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  mobileMenu.setAttribute("aria-hidden", String(!open));
  menuBackdrop.setAttribute("aria-hidden", String(!open));
});

menuBackdrop.addEventListener("click", closeMobileMenu);

mobileMenu.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", closeMobileMenu);
});

const navLinks = document.querySelectorAll("[data-nav]");
const sections = [...navLinks].map(link => document.getElementById(link.dataset.nav)).filter(Boolean);

const headerObserver = new IntersectionObserver(
  ([entry]) => header.classList.toggle("scrolled", !entry.isIntersecting),
  { threshold: 0 }
);
headerObserver.observe(navSentinel);

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        link.classList.toggle("active", link.dataset.nav === entry.target.id);
      });
    });
  },
  { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
);

sections.forEach(section => sectionObserver.observe(section));

function observeReveal(elements) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    elements.forEach(el => el.classList.add("visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const delay = Number(entry.target.dataset.delay || 0);
        setTimeout(() => entry.target.classList.add("visible"), delay);
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  elements.forEach(el => revealObserver.observe(el));
}

observeReveal(document.querySelectorAll(".reveal"));
renderProducts();
initWelcomeCarousel();
