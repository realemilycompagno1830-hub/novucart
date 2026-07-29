// Default Initial State Data
const DEFAULT_SETTINGS = {
  cardPaymentLink: "https://checkout.stripe.com/pay/sample",
  siteTitle: "Novucart | Exclusive Vehicle Promotions",
  logoType: "text",
  logoUrl: "",
  catalogMode: "grid",
  announcement: "🔥 Exclusive US Market Vehicle Promotions & Giveaways — Limited Time Only!",
  navCatalog: "View Catalog",
  navContact: "WhatsApp Support",
  heroHeadline: "WELCOME TO NOVUCART",
  heroSubtext: "Your trusted destination for exclusive offers and premium vehicle promotions.",
  heroBtnText: "Explore Catalog",
  catalogHeading: "Featured Vehicles & Inventory",
  catalogSubheading: "Browse our handpicked inventory available for immediate purchase or booking.",
  email: "buycheapcarsonline@gmail.com",
  whatsapp: "https://wa.me/1234567890",
  footerBrandTitle: "Novucart",
  footerBrandDesc: "Your trusted destination for exclusive offers and premium vehicle promotions.",
  footerCareTitle: "Support",
  footerText: "© 2026 novucart.store inc. All rights reserved."
};

const DEFAULT_CATEGORIES = ["Sedans", "SUVs", "Luxury", "Electric"];

const DEFAULT_HERO_REEL = [
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80"
];

const DEFAULT_PRODUCTS = [
  {
    id: "prod-1",
    title: "Tesla Model Y Performance",
    category: "Electric",
    desc: "Brand new electric crossover with instant dual-motor acceleration and autopilot.",
    price: 48999,
    stock: 5,
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80",
    badge: "In Stock"
  },
  {
    id: "prod-2",
    title: "Toyota Camry SE",
    category: "Sedans",
    desc: "Reliable, fuel-efficient midsize sedan with modern safety tech and sleek styling.",
    price: 26500,
    stock: 8,
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=600&q=80",
    badge: "Best Seller"
  },
  {
    id: "prod-3",
    title: "Ford Explorer Limited",
    category: "SUVs",
    desc: "Spacious 3-row family SUV equipped with premium leather seating and advanced towing.",
    price: 39999,
    stock: 3,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
    badge: "Hot Deal"
  }
];

const DEFAULT_PROMO_AD = {
  active: true,
  title: "Special Vehicle Giveaway!",
  desc: "Register your details today to qualify for our nationwide Tesla & SUV promotional event.",
  image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80",
  btnText: "Claim Entry Now",
  btnLink: "#catalog"
};

// LocalStorage Helper Management
function getStorage(key, fallback) {
  const data = localStorage.getItem("novucart_" + key);
  return data ? JSON.parse(data) : fallback;
}

function setStorage(key, value) {
  localStorage.setItem("novucart_" + key, JSON.stringify(value));
}

// Initializers
let siteSettings = getStorage("settings", DEFAULT_SETTINGS);
let categories = getStorage("categories", DEFAULT_CATEGORIES);
let heroReel = getStorage("heroReel", DEFAULT_HERO_REEL);
let products = getStorage("products", DEFAULT_PRODUCTS);
let promoAd = getStorage("promoAd", DEFAULT_PROMO_AD);
let orders = getStorage("orders", []);
let cart = getStorage("cart", []);
let currentCategoryFilter = "All";

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("admin-page-bg")) {
    initAdminPanel();
  } else {
    initStorefront();
  }
});

/* ==========================================================
   FRONTEND LOGIC
   ========================================================== */
function initStorefront() {
  renderSiteContent();
  renderCategoryFilterBar();
  renderFrontendProducts();
  renderHeroSlider();
  renderPromoAdBox();
  setupCartAndCheckout();
}

function renderSiteContent() {
  document.getElementById("site-title-tag").textContent = siteSettings.siteTitle;
  document.getElementById("announcement-text").textContent = siteSettings.announcement;
  
  const logoImg = document.getElementById("logo-img");
  const logoText = document.getElementById("logo-text");
  if (siteSettings.logoType === "image" && siteSettings.logoUrl) {
    logoImg.src = siteSettings.logoUrl;
    logoImg.style.display = "block";
    logoText.style.display = "none";
  } else {
    logoImg.style.display = "none";
    logoText.textContent = siteSettings.footerBrandTitle || "Novucart";
    logoText.style.display = "inline";
  }

  document.getElementById("nav-catalog-text").textContent = siteSettings.navCatalog;
  document.getElementById("header-contact-text").textContent = siteSettings.navContact;
  document.getElementById("header-contact-btn").href = siteSettings.whatsapp;

  document.getElementById("hero-headline-text").textContent = siteSettings.heroHeadline;
  document.getElementById("hero-subtext").textContent = siteSettings.heroSubtext;
  document.getElementById("hero-btn-text").textContent = siteSettings.heroBtnText;

  document.getElementById("catalog-heading-text").textContent = siteSettings.catalogHeading;
  document.getElementById("catalog-subheading-text").textContent = siteSettings.catalogSubheading;

  document.getElementById("footer-brand-title").textContent = siteSettings.footerBrandTitle;
  document.getElementById("footer-brand-desc").textContent = siteSettings.footerBrandDesc;
  document.getElementById("footer-care-title").textContent = siteSettings.footerCareTitle;
  document.getElementById("footer-whatsapp-link").href = siteSettings.whatsapp;
  document.getElementById("footer-email-link").href = "mailto:" + siteSettings.email;
  document.getElementById("footer-email-text").textContent = siteSettings.email;
  document.getElementById("footer-copyright-text").textContent = siteSettings.footerText;
}

function renderHeroSlider() {
  const sliderContainer = document.getElementById("hero-product-slider");
  if (!sliderContainer) return;
  
  if (!heroReel || heroReel.length === 0) {
    sliderContainer.innerHTML = "";
    return;
  }

  sliderContainer.innerHTML = heroReel.map((url, idx) => `
    <div class="hero-slide-item ${idx === 0 ? 'active' : ''}">
      ${url.endsWith('.mp4') ? `<video src="${url}" autoplay muted loop class="hero-slide-media"></video>` : `<img src="${url}" class="hero-slide-media" alt="Hero Reel">`}
    </div>
  `).join('');

  if (heroReel.length > 1) {
    let currentSlide = 0;
    setInterval(() => {
      const slides = sliderContainer.querySelectorAll('.hero-slide-item');
      if (slides.length === 0) return;
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 4000);
  }
}

function renderCategoryFilterBar() {
  const filterBar = document.getElementById("category-filter-bar");
  if (!filterBar) return;

  let html = `<button class="cat-btn ${currentCategoryFilter === 'All' ? 'active' : ''}" onclick="filterCategory('All')">All</button>`;
  categories.forEach(cat => {
    html += `<button class="cat-btn ${currentCategoryFilter === cat ? 'active' : ''}" onclick="filterCategory('${cat}')">${cat}</button>`;
  });
  filterBar.innerHTML = html;
}

window.filterCategory = function(catName) {
  currentCategoryFilter = catName;
  renderCategoryFilterBar();
  renderFrontendProducts();
};

function renderFrontendProducts() {
  const container = document.getElementById("frontend-product-list");
  if (!container) return;

  const filtered = currentCategoryFilter === 'All' ? products : products.filter(p => p.category === currentCategoryFilter);

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-secondary" style="grid-column: 1/-1; text-align:center; padding:30px;">No vehicles found in this category.</p>`;
    return;
  }

  if (siteSettings.catalogMode === 'slider') {
    container.className = "product-slider-container";
  } else {
    container.className = "product-grid";
  }

  container.innerHTML = filtered.map(p => `
    <div class="product-card">
      ${p.image.endsWith('.mp4') ? `<video src="${p.image}" autoplay muted loop class="product-media"></video>` : `<img src="${p.image}" class="product-media" alt="${p.title}">`}
      <div><span class="stock-tag">${p.badge || 'In Stock'} (${p.stock} available)</span></div>
      <h3>${p.title}</h3>
      <p>${p.desc || ''}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
        <span class="price">$${Number(p.price).toLocaleString()}</span>
        <button class="btn btn-primary" onclick="addToCart('${p.id}')"><i class="fa-solid fa-cart-plus"></i> Add to Bag</button>
      </div>
    </div>
  `).join('');
}

function renderPromoAdBox() {
  const adBox = document.getElementById("frontend-promo-ad");
  if (!adBox) return;

  if (!promoAd.active) {
    adBox.style.display = "none";
    return;
  }

  document.getElementById("promo-ad-heading").textContent = promoAd.title;
  document.getElementById("promo-ad-body").textContent = promoAd.desc;
  const imgEl = document.getElementById("promo-ad-img");
  if (promoAd.image) {
    imgEl.src = promoAd.image;
    imgEl.style.display = "block";
  } else {
    imgEl.style.display = "none";
  }

  const btnEl = document.getElementById("promo-ad-link-btn");
  btnEl.textContent = promoAd.btnText;
  btnEl.href = promoAd.btnLink;
  adBox.style.display = "block";

  document.getElementById("close-promo-ad").onclick = () => {
    adBox.style.display = "none";
  };
}

// Cart & Checkout Management
window.addToCart = function(prodId) {
  const prod = products.find(p => p.id === prodId);
  if (!prod) return;

  const existing = cart.find(item => item.id === prodId);
  if (existing) {
    if (existing.qty < prod.stock) {
      existing.qty++;
    } else {
      alert("Maximum available stock reached.");
      return;
    }
  } else {
    cart.push({ ...prod, qty: 1 });
  }

  setStorage("cart", cart);
  updateCartUI();
  openCartDrawer();
};

function updateCartUI() {
  const countEl = document.getElementById("cart-count");
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  if (countEl) countEl.textContent = totalCount;

  const itemsContainer = document.getElementById("cart-items-container");
  const totalPriceEl = document.getElementById("cart-total-price");
  if (!itemsContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `<p class="empty-cart-msg">Your bag is empty.</p>`;
    if (totalPriceEl) totalPriceEl.textContent = "$0.00";
    return;
  }

  let total = 0;
  itemsContainer.innerHTML = cart.map(item => {
    total += item.price * item.qty;
    return `
      <div style="display:flex; gap:12px; margin-bottom:14px; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
        <img src="${item.image}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;" alt="">
        <div style="flex:1;">
          <h4 style="font-size:0.9rem; margin-bottom:2px;">${item.title}</h4>
          <p style="font-size:0.8rem; color:var(--text-muted);">$${Number(item.price).toLocaleString()} x ${item.qty}</p>
          <div style="display:flex; gap:6px; margin-top:4px;">
            <button class="qty-btn" onclick="adjustQty('${item.id}', -1)">-</button>
            <button class="qty-btn" onclick="adjustQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button onclick="removeFromCart('${item.id}')" style="background:none; border:none; color:var(--accent-red); cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  }).join('');

  if (totalPriceEl) totalPriceEl.textContent = "$" + total.toLocaleString();
}

window.adjustQty = function(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  const prod = products.find(p => p.id === id);

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  } else if (prod && item.qty > prod.stock) {
    item.qty = prod.stock;
    alert("Cannot exceed available stock limit.");
  }

  setStorage("cart", cart);
  updateCartUI();
};

window.removeFromCart = function(id) {
  cart = cart.filter(i => i.id !== id);
  setStorage("cart", cart);
  updateCartUI();
};

function openCartDrawer() {
  document.getElementById("cart-drawer")?.classList.add("open");
  document.getElementById("cart-overlay")?.style.setProperty("display", "block");
}

function closeCartDrawer() {
  document.getElementById("cart-drawer")?.classList.remove("open");
  document.getElementById("cart-overlay")?.style.setProperty("display", "none");
}

function setupCartAndCheckout() {
  document.getElementById("open-cart-btn")?.addEventListener("click", openCartDrawer);
  document.getElementById("close-cart-btn")?.addEventListener("click", closeCartDrawer);
  document.getElementById("cart-overlay")?.addEventListener("click", closeCartDrawer);

  document.getElementById("checkout-btn")?.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Your shopping bag is empty.");
      return;
    }
    closeCartDrawer();
    document.getElementById("checkout-modal").style.display = "flex";
  });

  document.getElementById("close-checkout-modal-btn")?.addEventListener("click", () => {
    document.getElementById("checkout-modal").style.display = "none";
  });

  document.getElementById("checkout-form")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("cust-name").value;
    const email = document.getElementById("cust-email").value;
    const phone = document.getElementById("cust-phone").value;
    const address = document.getElementById("cust-address").value;
    const altContact = document.getElementById("cust-alt-contact").value;
    const promoCode = document.getElementById("cust-promo-code").value || "None";
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const newOrder = {
      id: "ord-" + Date.now(),
      date: new Date().toLocaleDateString(),
      name,
      email,
      phone,
      address,
      altContact,
      promoCode,
      method: paymentMethod === 'card' ? 'Pay via Card' : 'Pay on Delivery',
      total,
      items: [...cart]
    };

    orders.unshift(newOrder);
    setStorage("orders", orders);

    cart = [];
    setStorage("cart", cart);
    updateCartUI();

    document.getElementById("checkout-modal").style.display = "none";
    document.getElementById("checkout-form").reset();

    if (paymentMethod === 'card') {
      window.location.href = siteSettings.cardPaymentLink;
    } else {
      alert("Order successfully placed! Our team will contact you for delivery verification.");
    }
  });
}


/* ==========================================================
   ADMIN PANEL LOGIC
   ========================================================== */
function initAdminPanel() {
  const isLoggedIn = sessionStorage.getItem("novucart_admin_logged") === "true";
  if (!isLoggedIn) {
    document.getElementById("login-section").style.display = "flex";
    document.getElementById("dashboard-section").style.display = "none";
  } else {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("dashboard-section").style.display = "block";
    loadAdminDashboard();
  }

  document.getElementById("admin-login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("admin-email").value;
    const passInput = document.getElementById("admin-password").value;

    if (emailInput === "admin@novucart.com" && passInput === "admin123") {
      sessionStorage.setItem("novucart_admin_logged", "true");
      document.getElementById("login-section").style.display = "none";
      document.getElementById("dashboard-section").style.display = "block";
      loadAdminDashboard();
    } else {
      document.getElementById("login-error").textContent = "Invalid administrator credentials (try admin@novucart.com / admin123)";
    }
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    sessionStorage.removeItem("novucart_admin_logged");
    location.reload();
  });
}

function loadAdminDashboard() {
  renderAdminProducts();
  renderAdminCategories();
  renderAdminHeroReel();
  renderAdminOrders();
  populateSettingsForm();
  populatePromoAdForm();
  setupAdminProductModal();
  setupAdminForms();
}

function renderAdminProducts() {
  const tbody = document.getElementById("admin-product-list");
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No products in inventory.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map((p, idx) => `
    <tr>
      <td>
        <button class="qty-btn" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} onclick="reorderProduct(${idx}, -1)"><i class="fa-solid fa-arrow-up"></i></button>
        <button class="qty-btn" ${idx === products.length - 1 ? 'disabled style="opacity:0.3;"' : ''} onclick="reorderProduct(${idx}, 1)"><i class="fa-solid fa-arrow-down"></i></button>
      </td>
      <td><img src="${p.image}" style="width:45px; height:45px; object-fit:cover; border-radius:6px;" alt=""></td>
      <td><strong>${p.title}</strong><br><small style="color:var(--text-muted);">${p.category}</small></td>
      <td>$${Number(p.price).toLocaleString()}</td>
      <td><span style="color:${p.stock > 0 ? '#16A34A' : '#DC2626'}; font-weight:700;">${p.stock} units</span></td>
      <td>
        <button class="btn btn-outline" style="padding:4px 10px; font-size:0.8rem;" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn btn-danger" style="padding:4px 10px; font-size:0.8rem;" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

window.reorderProduct = function(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= products.length) return;
  const temp = products[index];
  products[index] = products[targetIndex];
  products[targetIndex] = temp;
  setStorage("products", products);
  renderAdminProducts();
};

function renderAdminCategories() {
  const tbody = document.getElementById("admin-categories-list");
  const select = document.getElementById("modal-product-category");
  if (!tbody) return;

  tbody.innerHTML = categories.map((cat, idx) => `
    <tr>
      <td>
        <button class="qty-btn" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} onclick="reorderCategory(${idx}, -1)"><i class="fa-solid fa-arrow-up"></i></button>
        <button class="qty-btn" ${idx === categories.length - 1 ? 'disabled style="opacity:0.3;"' : ''} onclick="reorderCategory(${idx}, 1)"><i class="fa-solid fa-arrow-down"></i></button>
      </td>
      <td><input type="text" value="${cat}" id="cat-input-${idx}" style="padding:6px 10px; border:1px solid var(--border-color); border-radius:6px; width:220px;"></td>
      <td>
        <button class="btn btn-outline" style="padding:4px 10px; font-size:0.8rem;" onclick="saveCategoryEdit(${idx})">Save</button>
        <button class="btn btn-danger" style="padding:4px 10px; font-size:0.8rem;" onclick="deleteCategory('${cat}')">Delete</button>
      </td>
    </tr>
  `).join('');

  if (select) {
    select.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }
}

window.reorderCategory = function(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= categories.length) return;
  const temp = categories[index];
  categories[index] = categories[targetIndex];
  categories[targetIndex] = temp;
  setStorage("categories", categories);
  renderAdminCategories();
};

window.saveCategoryEdit = function(index) {
  const inputVal = document.getElementById(`cat-input-${index}`).value.trim();
  if (!inputVal) {
    alert("Category name cannot be empty.");
    return;
  }
  const oldName = categories[index];
  if (categories.includes(inputVal) && inputVal !== oldName) {
    alert("Category name already exists.");
    return;
  }

  categories[index] = inputVal;
  // Update associated products
  products.forEach(p => {
    if (p.category === oldName) p.category = inputVal;
  });

  setStorage("categories", categories);
  setStorage("products", products);
  renderAdminCategories();
  alert("Category updated successfully!");
};

window.deleteCategory = function(catName) {
  if (categories.length <= 1) {
    alert("You must keep at least one category.");
    return;
  }
  if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
    categories = categories.filter(c => c !== catName);
    setStorage("categories", categories);
    renderAdminCategories();
  }
};

function renderAdminHeroReel() {
  const tbody = document.getElementById("admin-hero-reel-list");
  if (!tbody) return;

  if (heroReel.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">No background reel media added.</td></tr>`;
    return;
  }

  tbody.innerHTML = heroReel.map((url, idx) => `
    <tr>
      <td>
        <button class="qty-btn" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} onclick="reorderHeroReel(${idx}, -1)"><i class="fa-solid fa-arrow-up"></i></button>
        <button class="qty-btn" ${idx === heroReel.length - 1 ? 'disabled style="opacity:0.3;"' : ''} onclick="reorderHeroReel(${idx}, 1)"><i class="fa-solid fa-arrow-down"></i></button>
        <span style="margin-left:8px; font-weight:600;">Position #${idx + 1}</span>
      </td>
      <td><div style="font-size:0.8rem; word-break:break-all; max-width:400px;">${url}</div></td>
      <td>
        <button class="btn btn-danger" style="padding:4px 10px; font-size:0.8rem;" onclick="deleteHeroReelItem(${idx})">Remove</button>
      </td>
    </tr>
  `).join('');
}

window.reorderHeroReel = function(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= heroReel.length) return;
  const temp = heroReel[index];
  heroReel[index] = heroReel[targetIndex];
  heroReel[targetIndex] = temp;
  setStorage("heroReel", heroReel);
  renderAdminHeroReel();
};

window.deleteHeroReelItem = function(index) {
  heroReel.splice(index, 1);
  setStorage("heroReel", heroReel);
  renderAdminHeroReel();
};

function renderAdminOrders() {
  const tbody = document.getElementById("admin-orders-list");
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No customer orders logged yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(ord => `
    <tr>
      <td>${ord.date}</td>
      <td><strong>${ord.name}</strong></td>
      <td>${ord.email}<br><small>${ord.phone}</small></td>
      <td>${ord.address}</td>
      <td>${ord.method}<br><small style="color:var(--text-muted);">Promo: ${ord.promoCode}</small></td>
      <td><strong>$${Number(ord.total).toLocaleString()}</strong></td>
      <td>
        <button class="btn btn-danger" style="padding:4px 10px; font-size:0.8rem;" onclick="deleteOrder('${ord.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

window.deleteOrder = function(orderId) {
  if (confirm("Are you sure you want to delete this order record?")) {
    orders = orders.filter(o => o.id !== orderId);
    setStorage("orders", orders);
    renderAdminOrders();
  }
};

document.getElementById("clear-all-orders-btn")?.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all customer orders?")) {
    orders = [];
    setStorage("orders", orders);
    renderAdminOrders();
  }
});

function populateSettingsForm() {
  document.getElementById("setting-card-payment-link").value = siteSettings.cardPaymentLink || "";
  document.getElementById("setting-site-title").value = siteSettings.siteTitle || "";
  document.getElementById("setting-logo-type").value = siteSettings.logoType || "text";
  document.getElementById("setting-logo-url").value = siteSettings.logoUrl || "";
  document.getElementById("setting-catalog-mode").value = siteSettings.catalogMode || "grid";
  document.getElementById("setting-announcement").value = siteSettings.announcement || "";
  document.getElementById("setting-nav-catalog").value = siteSettings.navCatalog || "";
  document.getElementById("setting-nav-contact").value = siteSettings.navContact || "";
  document.getElementById("setting-hero-headline").value = siteSettings.heroHeadline || "";
  document.getElementById("setting-hero-subtext").value = siteSettings.heroSubtext || "";
  document.getElementById("setting-hero-btn-text").value = siteSettings.heroBtnText || "";
  document.getElementById("setting-catalog-heading").value = siteSettings.catalogHeading || "";
  document.getElementById("setting-catalog-subheading").value = siteSettings.catalogSubheading || "";
  document.getElementById("setting-email").value = siteSettings.email || "";
  document.getElementById("setting-whatsapp").value = siteSettings.whatsapp || "";
  document.getElementById("setting-footer-brand-title").value = siteSettings.footerBrandTitle || "";
  document.getElementById("setting-footer-brand-desc").value = siteSettings.footerBrandDesc || "";
  document.getElementById("setting-footer-care-title").value = siteSettings.footerCareTitle || "";
  document.getElementById("setting-footer-text").value = siteSettings.footerText || "";
}

function populatePromoAdForm() {
  document.getElementById("promo-ad-active").checked = promoAd.active;
  document.getElementById("promo-ad-title").value = promoAd.title || "";
  document.getElementById("promo-ad-desc").value = promoAd.desc || "";
  document.getElementById("promo-ad-image").value = promoAd.image || "";
  document.getElementById("promo-ad-btn-text").value = promoAd.btnText || "";
  document.getElementById("promo-ad-btn-link").value = promoAd.btnLink || "";
}

function setupAdminProductModal() {
  const modal = document.getElementById("product-modal");
  document.getElementById("open-product-modal-btn")?.addEventListener("click", () => {
    document.getElementById("modal-title").textContent = "Add New Product";
    document.getElementById("product-form").reset();
    document.getElementById("modal-product-id").value = "";
    modal.style.display = "flex";
  });

  document.getElementById("close-product-modal-btn")?.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

window.editProduct = function(id) {
  const p = products.find(prod => prod.id === id);
  if (!p) return;

  document.getElementById("modal-title").textContent = "Edit Product";
  document.getElementById("modal-product-id").value = p.id;
  document.getElementById("modal-product-title").value = p.title;
  document.getElementById("modal-product-category").value = p.category;
  document.getElementById("modal-product-desc").value = p.desc;
  document.getElementById("modal-product-price").value = p.price;
  document.getElementById("modal-product-stock").value = p.stock;
  document.getElementById("modal-product-image").value = p.image;
  document.getElementById("modal-product-badge").value = p.badge || "";

  document.getElementById("product-modal").style.display = "flex";
};

window.deleteProduct = function(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    products = products.filter(p => p.id !== id);
    setStorage("products", products);
    renderAdminProducts();
  }
};

function setupAdminForms() {
  // Product Save Form
  document.getElementById("product-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("modal-product-id").value;
    const title = document.getElementById("modal-product-title").value;
    const category = document.getElementById("modal-product-category").value;
    const desc = document.getElementById("modal-product-desc").value;
    const price = parseFloat(document.getElementById("modal-product-price").value);
    const stock = parseInt(document.getElementById("modal-product-stock").value);
    const image = document.getElementById("modal-product-image").value;
    const badge = document.getElementById("modal-product-badge").value;

    if (id) {
      const p = products.find(prod => prod.id === id);
      if (p) {
        p.title = title;
        p.category = category;
        p.desc = desc;
        p.price = price;
        p.stock = stock;
        p.image = image;
        p.badge = badge;
      }
    } else {
      const newProd = {
        id: "prod-" + Date.now(),
        title,
        category,
        desc,
        price,
        stock,
        image,
        badge: badge || "In Stock"
      };
      products.push(newProd);
    }

    setStorage("products", products);
    renderAdminProducts();
    document.getElementById("product-modal").style.display = "none";
  });

  // Category Add Form
  document.getElementById("category-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("new-category-name").value.trim();
    if (name && !categories.includes(name)) {
      categories.push(name);
      setStorage("categories", categories);
      renderAdminCategories();
      document.getElementById("category-form").reset();
    } else {
      alert("Category already exists or invalid name.");
    }
  });

  // Hero Reel Add Form
  document.getElementById("hero-reel-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = document.getElementById("new-reel-url").value.trim();
    if (url) {
      heroReel.push(url);
      setStorage("heroReel", heroReel);
      renderAdminHeroReel();
      document.getElementById("hero-reel-form").reset();
    }
  });

  // Site Settings Form
  document.getElementById("site-settings-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    siteSettings = {
      cardPaymentLink: document.getElementById("setting-card-payment-link").value,
      siteTitle: document.getElementById("setting-site-title").value,
      logoType: document.getElementById("setting-logo-type").value,
      logoUrl: document.getElementById("setting-logo-url").value,
      catalogMode: document.getElementById("setting-catalog-mode").value,
      announcement: document.getElementById("setting-announcement").value,
      navCatalog: document.getElementById("setting-nav-catalog").value,
      navContact: document.getElementById("setting-nav-contact").value,
      heroHeadline: document.getElementById("setting-hero-headline").value,
      heroSubtext: document.getElementById("setting-hero-subtext").value,
      heroBtnText: document.getElementById("setting-hero-btn-text").value,
      catalogHeading: document.getElementById("setting-catalog-heading").value,
      catalogSubheading: document.getElementById("setting-catalog-subheading").value,
      email: document.getElementById("setting-email").value,
      whatsapp: document.getElementById("setting-whatsapp").value,
      footerBrandTitle: document.getElementById("setting-footer-brand-title").value,
      footerBrandDesc: document.getElementById("setting-footer-brand-desc").value,
      footerCareTitle: document.getElementById("setting-footer-care-title").value,
      footerText: document.getElementById("setting-footer-text").value
    };

    setStorage("settings", siteSettings);
    alert("All customizations saved successfully!");
  });

  // Promo Ad Form
  document.getElementById("promo-ad-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    promoAd = {
      active: document.getElementById("promo-ad-active").checked,
      title: document.getElementById("promo-ad-title").value,
      desc: document.getElementById("promo-ad-desc").value,
      image: document.getElementById("promo-ad-image").value,
      btnText: document.getElementById("promo-ad-btn-text").value,
      btnLink: document.getElementById("promo-ad-btn-link").value
    };

    setStorage("promoAd", promoAd);
    alert("Side ad banner updated successfully!");
  });
}
