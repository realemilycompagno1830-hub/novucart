// Default Initial Data State
const DEFAULT_SETTINGS = {
  siteTitle: "Novucart - Premium Store",
  announcement: "🔥 Exclusive Limited Offers Available Now! Free Shipping across USA.",
  brandName: "NOVUCART",
  logoImg: "",
  navCatalog: "Catalog",
  whatsapp: "+1234567890",
  heroHeadline: "WELCOME TO NOVUCART",
  heroSubtext: "Home of luxury vehicle offers and exclusive curated picks.",
  heroBtnText: "Available Products",
  catalogHeading: "Featured Catalog",
  catalogSubheading: "Explore our premium selection below.",
  footerBrandTitle: "Novucart",
  footerBrandDesc: "Your trusted destination for exclusive offers and premium vehicle promotions.",
  footerCareTitle: "Support",
  footerCopyright: "&copy; 2026 novucart.store inc. All rights reserved."
};

const DEFAULT_CATEGORIES = ["Electronics", "laptops", "Vehicles"];

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Tesla Model S Plaid",
    category: "Vehicles",
    price: 89999,
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80",
    description: "Brand new high-performance electric vehicle with ludicrous acceleration.",
    order: 1,
    heroSlider: true
  },
  {
    id: 2,
    name: "MacBook Pro 16",
    category: "laptops",
    price: 2499,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    description: "M3 Max powerhouse laptop for creators and professionals.",
    order: 2,
    heroSlider: true
  }
];

const DEFAULT_AD = {
  active: true,
  image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
  heading: "Special Vehicle Giveaway!",
  body: "Claim your chance to win exclusive rewards today.",
  link: "#catalog"
};

// LocalStorage Helpers
function getSettings() {
  return JSON.parse(localStorage.getItem("novucart_settings")) || DEFAULT_SETTINGS;
}
function saveSettings(settings) {
  localStorage.setItem("novucart_settings", JSON.stringify(settings));
}

function getCategories() {
  return JSON.parse(localStorage.getItem("novucart_categories")) || DEFAULT_CATEGORIES;
}
function saveCategories(cats) {
  localStorage.setItem("novucart_categories", JSON.stringify(cats));
}

function getProducts() {
  return JSON.parse(localStorage.getItem("novucart_products")) || DEFAULT_PRODUCTS;
}
function saveProducts(prods) {
  localStorage.setItem("novucart_products", JSON.stringify(prods));
}

function getAd() {
  return JSON.parse(localStorage.getItem("novucart_ad")) || DEFAULT_AD;
}
function saveAd(ad) {
  localStorage.setItem("novucart_ad", JSON.stringify(ad));
}

function getOrders() {
  return JSON.parse(localStorage.getItem("novucart_orders")) || [];
}
function saveOrders(orders) {
  localStorage.setItem("novucart_orders", JSON.stringify(orders));
}

function getCart() {
  return JSON.parse(localStorage.getItem("novucart_cart")) || [];
}
function saveCart(cart) {
  localStorage.setItem("novucart_cart", JSON.stringify(cart));
}

// Global filter state
let currentFilter = "All";

document.addEventListener("DOMContentLoaded", () => {
  renderFrontend();
  initAdminPanel();
  initCartAndCheckout();
});

// ==========================================
// FRONTEND RENDERING
// ==========================================
function renderFrontend() {
  const settings = getSettings();
  
  // Apply Settings to DOM elements if present
  setSafely("site-title-tag", "innerText", settings.siteTitle);
  setSafely("announcement-text", "innerText", settings.announcement);
  setSafely("logo-text", "innerText", settings.brandName);
  setSafely("nav-catalog-text", "innerText", settings.navCatalog);
  setSafely("header-contact-text", "innerText", settings.whatsapp);
  setSafely("header-contact-btn", "href", `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`);
  setSafely("hero-headline-text", "innerText", settings.heroHeadline);
  setSafely("hero-subtext", "innerText", settings.heroSubtext);
  setSafely("hero-btn-text", "innerText", settings.heroBtnText);
  setSafely("catalog-heading-text", "innerText", settings.catalogHeading);
  setSafely("catalog-subheading-text", "innerText", settings.catalogSubheading);

  // Footer dynamic fields
  setSafely("footer-brand-title", "innerText", settings.footerBrandTitle);
  setSafely("footer-brand-desc", "innerText", settings.footerBrandDesc);
  setSafely("footer-care-title", "innerText", settings.footerCareTitle);
  setSafely("footer-copyright-text", "innerHTML", settings.footerCopyright);
  setSafely("footer-whatsapp-text", "innerText", `WhatsApp: ${settings.whatsapp}`);
  setSafely("footer-whatsapp-link", "href", `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`);

  // Logo Image Handling
  const logoImgEl = document.getElementById("logo-img");
  const logoTextEl = document.getElementById("logo-text");
  if (logoImgEl && logoTextEl) {
    if (settings.logoImg) {
      logoImgEl.src = settings.logoImg;
      logoImgEl.style.display = "inline-block";
      logoTextEl.style.display = "none";
    } else {
      logoImgEl.style.display = "none";
      logoTextEl.style.display = "inline-block";
    }
  }

  // Render Categories Filter Bar
  renderCategoryFilterBar();

  // Render Products Grid
  renderProductCatalog();

  // Render Hero Background Slider
  renderHeroSlider();

  // Render Side Ad Box
  renderSideAd();

  // Update Cart Count Badge
  updateCartBadge();
}

function setSafely(id, property, value) {
  const el = document.getElementById(id);
  if (el) el[property] = value;
}

function renderCategoryFilterBar() {
  const bar = document.getElementById("category-filter-bar");
  if (!bar) return;
  const categories = getCategories();
  
  let html = `<button class="cat-btn ${currentFilter === 'All' ? 'active' : ''}" onclick="filterCategory('All')">All</button>`;
  categories.forEach(cat => {
    html += `<button class="cat-btn ${currentFilter === cat ? 'active' : ''}" onclick="filterCategory('${cat}')">${cat}</button>`;
  });
  bar.innerHTML = html;
}

window.filterCategory = function(catName) {
  currentFilter = catName;
  renderCategoryFilterBar();
  renderProductCatalog();
};

function renderProductCatalog() {
  const listEl = document.getElementById("frontend-product-list");
  if (!listEl) return;
  
  const products = getProducts();
  const filtered = currentFilter === 'All' 
    ? products 
    : products.filter(p => p.category === currentFilter);

  if (filtered.length === 0) {
    listEl.innerHTML = `<p class="text-secondary" style="grid-column: 1/-1; text-align:center; padding: 40px;">No products available in this category.</p>`;
    return;
  }

  let html = "";
  filtered.forEach(p => {
    html += `
      <div class="product-card">
        <img src="${p.image}" class="product-media" alt="${p.name}">
        <div><span class="stock-tag">In Stock</span></div>
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <div class="price">$${Number(p.price).toFixed(2)}</div>
        <button class="btn btn-primary btn-block" onclick="addToCart(${p.id})">
          <i class="fa-solid fa-cart-plus"></i> Add to Bag
        </button>
      </div>
    `;
  });
  listEl.innerHTML = html;
}

function renderHeroSlider() {
  const sliderBg = document.getElementById("hero-product-slider");
  if (!sliderBg) return;

  const products = getProducts();
  // Filter products enabled for hero slider, sorted by their priority order
  const sliderProds = products
    .filter(p => p.heroSlider && p.image)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  if (sliderProds.length === 0) {
    sliderBg.innerHTML = "";
    return;
  }

  let html = "";
  sliderProds.forEach((p, idx) => {
    html += `
      <div class="hero-slide-item ${idx === 0 ? 'active' : ''}">
        <img src="${p.image}" class="hero-slide-media" alt="${p.name}">
      </div>
    `;
  });
  sliderBg.innerHTML = html;

  // Auto slide interval if multiple images exist
  if (sliderProds.length > 1) {
    if (window.heroInterval) clearInterval(window.heroInterval);
    let currentIndex = 0;
    window.heroInterval = setInterval(() => {
      const slides = sliderBg.querySelectorAll(".hero-slide-item");
      if (slides.length === 0) return;
      slides[currentIndex].classList.remove("active");
      currentIndex = (currentIndex + 1) % slides.length;
      slides[currentIndex].classList.add("active");
    }, 4000);
  }
}

function renderSideAd() {
  const adBox = document.getElementById("frontend-promo-ad");
  if (!adBox) return;

  const ad = getAd();
  if (!ad.active) {
    adBox.style.display = "none";
    return;
  }

  adBox.style.display = "block";
  setSafely("promo-ad-heading", "innerText", ad.heading);
  setSafely("promo-ad-body", "innerText", ad.body);
  setSafely("promo-ad-link-btn", "href", ad.link || "#");

  const imgEl = document.getElementById("promo-ad-img");
  if (imgEl) {
    if (ad.image) {
      imgEl.src = ad.image;
      imgEl.style.display = "block";
    } else {
      imgEl.style.display = "none";
    }
  }

  const closeBtn = document.getElementById("close-promo-ad");
  if (closeBtn) {
    closeBtn.onclick = () => {
      adBox.style.display = "none";
    };
  }
}

// ==========================================
// CART & CHECKOUT LOGIC
// ==========================================
window.addToCart = function(productId) {
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  let cart = getCart();
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  updateCartBadge();
  openCartDrawer();
};

function updateCartBadge() {
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  setSafely("cart-count", "innerText", totalCount);
}

function openCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  if (drawer) drawer.classList.add("open");
  if (overlay) overlay.style.display = "block";
  renderCartDrawerItems();
}

function closeCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  if (drawer) drawer.classList.remove("open");
  if (overlay) overlay.style.display = "none";
}

function renderCartDrawerItems() {
  const container = document.getElementById("cart-items-container");
  const totalPriceEl = document.getElementById("cart-total-price");
  if (!container) return;

  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-cart-msg">Your bag is empty.</p>`;
    if (totalPriceEl) totalPriceEl.innerText = "$0.00";
    return;
  }

  let html = "";
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.qty;
    html += `
      <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
        <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
        <div style="flex: 1;">
          <h4 style="font-size: 0.9rem; margin-bottom: 2px;">${item.name}</h4>
          <div style="font-size: 0.8rem; color: var(--text-muted);">$${Number(item.price).toFixed(2)} x ${item.qty}</div>
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            <button class="qty-btn" onclick="adjustQty(${item.id}, -1)">-</button>
            <span style="font-size: 0.85rem; font-weight: bold; line-height: 24px;">${item.qty}</span>
            <button class="qty-btn" onclick="adjustQty(${item.id}, 1)">+</button>
          </div>
        </div>
        <button style="background: none; border: none; color: var(--accent-red); cursor: pointer;" onclick="removeFromCart(${item.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  });
  container.innerHTML = html;
  if (totalPriceEl) totalPriceEl.innerText = `$${total.toFixed(2)}`;
}

window.adjustQty = function(productId, delta) {
  let cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.id !== productId);
    }
  }
  saveCart(cart);
  updateCartBadge();
  renderCartDrawerItems();
};

window.removeFromCart = function(productId) {
  let cart = getCart();
  cart = cart.filter(i => i.id !== productId);
  saveCart(cart);
  updateCartBadge();
  renderCartDrawerItems();
};

function initCartAndCheckout() {
  const openBtn = document.getElementById("open-cart-btn");
  const closeBtn = document.getElementById("close-cart-btn");
  const overlay = document.getElementById("cart-overlay");
  
  if (openBtn) openBtn.onclick = openCartDrawer;
  if (closeBtn) closeBtn.onclick = closeCartDrawer;
  if (overlay) overlay.onclick = closeCartDrawer;

  const checkoutBtn = document.getElementById("checkout-btn");
  const checkoutModal = document.getElementById("checkout-modal");
  const closeCheckoutModalBtn = document.getElementById("close-checkout-modal-btn");

  if (checkoutBtn) {
    checkoutBtn.onclick = () => {
      const cart = getCart();
      if (cart.length === 0) {
        alert("Your shopping bag is empty.");
        return;
      }
      closeCartDrawer();
      if (checkoutModal) checkoutModal.style.display = "flex";
    };
  }

  if (closeCheckoutModalBtn && checkoutModal) {
    closeCheckoutModalBtn.onclick = () => {
      checkoutModal.style.display = "none";
    };
  }

  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById("cust-name").value;
      const email = document.getElementById("cust-email").value;
      const phone = document.getElementById("cust-phone").value;
      const address = document.getElementById("cust-address").value;
      const altContact = document.getElementById("cust-alt-contact").value;
      const promo = document.getElementById("cust-promo-code").value || "None";
      const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

      const cart = getCart();
      const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

      const newOrder = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        name,
        email,
        phone,
        address,
        altContact,
        promo,
        method: paymentMethod === 'card' ? 'Pay via Card' : 'Pay on Delivery',
        total: total.toFixed(2),
        items: cart
      };

      const orders = getOrders();
      orders.unshift(newOrder);
      saveOrders(orders);

      // Clear cart
      saveCart([]);
      updateCartBadge();

      if (checkoutModal) checkoutModal.style.display = "none";
      alert("Order placed successfully! Thank you for your purchase.");
      checkoutForm.reset();
    };
  }
}

// ==========================================
// ADMIN PANEL LOGIC
// ==========================================
function initAdminPanel() {
  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      window.location.href = "index.html";
    };
  }

  // Tab switching logic
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const targetTabId = btn.getAttribute("data-tab");
      document.querySelectorAll(".admin-tab-content").forEach(content => {
        content.style.display = content.id === targetTabId ? "block" : "none";
      });
    };
  });

  setupProductsAdmin();
  setupCategoriesAdmin();
  setupCustomizerAdmin();
  setupAdsAdmin();
  setupOrdersAdmin();
}

// 1. Products Admin
function setupProductsAdmin() {
  updateCategoryDropdowns();
  renderAdminProductsTable();

  const form = document.getElementById("add-product-form");
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById("prod-name").value;
      const category = document.getElementById("prod-category").value;
      const price = parseFloat(document.getElementById("prod-price").value);
      const image = document.getElementById("prod-img").value;
      const description = document.getElementById("prod-desc").value;
      const order = parseInt(document.getElementById("prod-order").value) || 0;
      const heroSlider = document.getElementById("prod-hero-slider").checked;

      const products = getProducts();
      const newProd = {
        id: Date.now(),
        name,
        category,
        price,
        image,
        description,
        order,
        heroSlider
      };
      products.push(newProd);
      saveProducts(products);

      form.reset();
      renderAdminProductsTable();
      alert("Product added successfully!");
    };
  }
}

function updateCategoryDropdowns() {
  const select = document.getElementById("prod-category");
  if (!select) return;
  const categories = getCategories();
  let html = `<option value="">Select Category</option>`;
  categories.forEach(cat => {
    html += `<option value="${cat}">${cat}</option>`;
  });
  select.innerHTML = html;
}

function renderAdminProductsTable() {
  const tbody = document.getElementById("admin-product-list");
  if (!tbody) return;
  const products = getProducts();

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No products found.</td></tr>`;
    return;
  }

  let html = "";
  products.forEach(p => {
    html += `
      <tr>
        <td><img src="${p.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;"></td>
        <td><strong>${p.name}</strong></td>
        <td>${p.category}</td>
        <td>$${Number(p.price).toFixed(2)}</td>
        <td>${p.order || 0} ${p.heroSlider ? '(In Hero)' : ''}</td>
        <td>
          <button class="btn btn-danger" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteProduct(${p.id})">Delete</button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

window.deleteProduct = function(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    let products = getProducts();
    products = products.filter(p => p.id !== id);
    saveProducts(products);
    renderAdminProductsTable();
  }
};

// 2. Categories Admin (With Rename, Reorder, Delete)
function setupCategoriesAdmin() {
  renderAdminCategoriesTable();

  const form = document.getElementById("add-category-form");
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("new-category-name");
      const newCat = nameInput.value.trim();
      if (!newCat) return;

      let categories = getCategories();
      if (categories.includes(newCat)) {
        alert("Category already exists!");
        return;
      }
      categories.push(newCat);
      saveCategories(categories);
      nameInput.value = "";
      renderAdminCategoriesTable();
      updateCategoryDropdowns();
    };
  }
}

function renderAdminCategoriesTable() {
  const tbody = document.getElementById("admin-category-list");
  if (!tbody) return;
  let categories = getCategories();

  if (categories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No categories found.</td></tr>`;
    return;
  }

  let html = "";
  categories.forEach((cat, index) => {
    html += `
      <tr>
        <td>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.75rem;" ${index === 0 ? 'disabled' : ''} onclick="moveCategory(${index}, -1)"><i class="fa-solid fa-arrow-up"></i></button>
            <button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.75rem;" ${index === categories.length - 1 ? 'disabled' : ''} onclick="moveCategory(${index}, 1)"><i class="fa-solid fa-arrow-down"></i></button>
          </div>
        </td>
        <td>
          <input type="text" id="cat-input-${index}" value="${cat}" style="padding: 6px; width: 220px; border: 1px solid var(--border-color); border-radius: 6px;">
          <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.75rem; margin-left: 6px;" onclick="renameCategory(${index})">Rename</button>
        </td>
        <td>
          <button class="btn btn-danger" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteCategory('${cat}')">Delete</button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

window.moveCategory = function(index, direction) {
  let categories = getCategories();
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= categories.length) return;
  
  // Swap elements
  const temp = categories[index];
  categories[index] = categories[targetIndex];
  categories[targetIndex] = temp;
  
  saveCategories(categories);
  renderAdminCategoriesTable();
  updateCategoryDropdowns();
};

window.renameCategory = function(index) {
  const input = document.getElementById(`cat-input-${index}`);
  if (!input) return;
  const newName = input.value.trim();
  if (!newName) {
    alert("Category name cannot be empty.");
    return;
  }

  let categories = getCategories();
  const oldName = categories[index];
  if (categories.includes(newName) && newName !== oldName) {
    alert("Another category with this name already exists.");
    return;
  }

  categories[index] = newName;
  saveCategories(categories);

  // Update product category references as well
  let products = getProducts();
  products.forEach(p => {
    if (p.category === oldName) {
      p.category = newName;
    }
  });
  saveProducts(products);

  renderAdminCategoriesTable();
  updateCategoryDropdowns();
  alert("Category renamed successfully!");
};

window.deleteCategory = function(catName) {
  if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
    let categories = getCategories();
    categories = categories.filter(c => c !== catName);
    saveCategories(categories);
    renderAdminCategoriesTable();
    updateCategoryDropdowns();
  }
};

// 3. Customizer Admin (Includes Footer fields)
function setupCustomizerAdmin() {
  const settings = getSettings();
  
  setValueSafely("site-title-input", settings.siteTitle);
  setValueSafely("announcement-input", settings.announcement);
  setValueSafely("brand-name-input", settings.brandName);
  setValueSafely("logo-img-input", settings.logoImg);
  setValueSafely("nav-catalog-input", settings.navCatalog);
  setValueSafely("whatsapp-input", settings.whatsapp);
  setValueSafely("hero-headline-input", settings.heroHeadline);
  setValueSafely("hero-subtext-input", settings.heroSubtext);
  setValueSafely("hero-btn-input", settings.heroBtnText);
  setValueSafely("catalog-heading-input", settings.catalogHeading);
  setValueSafely("catalog-subheading-input", settings.catalogSubheading);

  setValueSafely("footer-brand-title-input", settings.footerBrandTitle);
  setValueSafely("footer-brand-desc-input", settings.footerBrandDesc);
  setValueSafely("footer-care-title-input", settings.footerCareTitle);
  setValueSafely("footer-copyright-input", settings.footerCopyright);

  const form = document.getElementById("customizer-form");
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const updated = {
        siteTitle: document.getElementById("site-title-input").value,
        announcement: document.getElementById("announcement-input").value,
        brandName: document.getElementById("brand-name-input").value,
        logoImg: document.getElementById("logo-img-input").value,
        navCatalog: document.getElementById("nav-catalog-input").value,
        whatsapp: document.getElementById("whatsapp-input").value,
        heroHeadline: document.getElementById("hero-headline-input").value,
        heroSubtext: document.getElementById("hero-subtext-input").value,
        heroBtnText: document.getElementById("hero-btn-input").value,
        catalogHeading: document.getElementById("catalog-heading-input").value,
        catalogSubheading: document.getElementById("catalog-subheading-input").value,
        footerBrandTitle: document.getElementById("footer-brand-title-input").value,
        footerBrandDesc: document.getElementById("footer-brand-desc-input").value,
        footerCareTitle: document.getElementById("footer-care-title-input").value,
        footerCopyright: document.getElementById("footer-copyright-input").value
      };
      saveSettings(updated);
      alert("Site customizations saved successfully!");
    };
  }
}

function setValueSafely(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || "";
}

// 4. Ads Admin
function setupAdsAdmin() {
  const ad = getAd();
  const activeCheckbox = document.getElementById("ad-active");
  if (activeCheckbox) activeCheckbox.checked = ad.active;
  setValueSafely("ad-img-url", ad.image);
  setValueSafely("ad-heading-text", ad.heading);
  setValueSafely("ad-body-text", ad.body);
  setValueSafely("ad-link-url", ad.link);

  const form = document.getElementById("ad-banner-form");
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const updatedAd = {
        active: document.getElementById("ad-active").checked,
        image: document.getElementById("ad-img-url").value,
        heading: document.getElementById("ad-heading-text").value,
        body: document.getElementById("ad-body-text").value,
        link: document.getElementById("ad-link-url").value
      };
      saveAd(updatedAd);
      alert("Side ad banner settings updated!");
    };
  }
}

// 5. Orders Admin (With individual order deletion)
function setupOrdersAdmin() {
  renderAdminOrdersTable();

  const clearAllBtn = document.getElementById("clear-all-orders-btn");
  if (clearAllBtn) {
    clearAllBtn.onclick = () => {
      if (confirm("Are you sure you want to clear all logged orders?")) {
        saveOrders([]);
        renderAdminOrdersTable();
      }
    };
  }
}

function renderAdminOrdersTable() {
  const tbody = document.getElementById("admin-orders-list");
  if (!tbody) return;
  const orders = getOrders();

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No customer orders logged yet.</td></tr>`;
    return;
  }

  let html = "";
  orders.forEach(o => {
    html += `
      <tr>
        <td>${o.date}</td>
        <td><strong>${o.name}</strong></td>
        <td>${o.email}<br><span style="color:var(--text-muted);">${o.phone}</span></td>
        <td>${o.address}</td>
        <td>${o.method}<br><span style="font-size:0.75rem; color:var(--text-muted);">Promo: ${o.promo}</span></td>
        <td><strong>$${o.total}</strong></td>
        <td>
          <button class="btn btn-danger" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteOrder(${o.id})">Delete</button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

window.deleteOrder = function(orderId) {
  if (confirm("Are you sure you want to delete this order?")) {
    let orders = getOrders();
    orders = orders.filter(o => o.id !== orderId);
    saveOrders(orders);
    renderAdminOrdersTable();
  }
};
