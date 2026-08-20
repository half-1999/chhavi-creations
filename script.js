const WHATSAPP_NUMBER = "919910420242";

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

let activeProduct = null;
let selectedSize = "";
let quantity = 1;
let toastTimer = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
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
            <button class="mini-btn primary" type="button" data-order="${product.id}">WhatsApp</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");

  productsGrid.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => openProduct(btn.dataset.view));
  });

  productsGrid.querySelectorAll("[data-order]").forEach(btn => {
    btn.addEventListener("click", () => quickOrder(btn.dataset.order));
  });

  observeReveal(productsGrid.querySelectorAll(".reveal"));
}

function openProduct(id) {
  activeProduct = products.find(p => p.id === id);
  if (!activeProduct) return;

  selectedSize = "";
  quantity = 1;
  sizeError.hidden = true;

  document.getElementById("modalImage").src = activeProduct.image;
  document.getElementById("modalImage").alt = activeProduct.name;
  document.getElementById("modalTag").textContent = activeProduct.tag;
  document.getElementById("modalTitle").textContent = activeProduct.name;
  document.getElementById("modalNote").textContent = "Price shared on WhatsApp";
  document.getElementById("modalDescription").textContent = activeProduct.description;
  document.getElementById("modalCode").textContent = `Product code: ${activeProduct.code}`;
  document.getElementById("qtyValue").textContent = String(quantity);

  document.getElementById("modalOccasions").innerHTML = activeProduct.occasions
    .map(item => `<span class="occasion-pill">${item}</span>`)
    .join("");

  renderSizes();
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
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

function closeModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function openLightbox(src, caption) {
  document.getElementById("lightboxImage").src = src;
  document.getElementById("lightboxImage").alt = caption;
  document.getElementById("lightboxCaption").textContent = caption;
  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  if (!modal.classList.contains("active")) {
    document.body.style.overflow = "";
  }
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

function createOrderMessage(product, size = "", qty = 1) {
  return [
    "Hi Chhavi's Creations,",
    "",
    "I would like to order:",
    "",
    `Product: ${product.name}`,
    `Product code: ${product.code}`,
    size ? `Size: ${size}` : "",
    `Quantity: ${qty}`,
    "",
    "Please share availability and payment details. Thank you."
  ].filter(Boolean).join("\n");
}

function quickOrder(id) {
  const product = products.find(p => p.id === id);
  if (product) openWhatsApp(createOrderMessage(product));
}

document.getElementById("modalOrderBtn").addEventListener("click", () => {
  if (!selectedSize) {
    sizeError.hidden = false;
    return;
  }
  openWhatsApp(createOrderMessage(activeProduct, selectedSize, quantity));
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
