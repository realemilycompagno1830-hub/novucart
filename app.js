import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, 
  getDocs, addDoc, deleteDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// State Variables
let cart = JSON.parse(localStorage.getItem('novucart_cart')) || [];
let currentProducts = [];
let siteSettings = {};
let activeCategory = 'All';

// ==========================================
// 2. DOM CONTENT LOADED & INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
});

function initApp() {
  // Listen for realtime product updates
  onSnapshot(collection(db, "products"), (snapshot) => {
    currentProducts = [];
    snapshot.forEach((doc) => {
      currentProducts.push({ id: doc.id, ...doc.data() });
    });
    // Sort by order index if exists
    currentProducts.sort((a, b) => (a.order || 0) - (b.order || 0));
    renderFrontendProducts();
    renderMenuProductGallery();
    renderAdminProducts();
  });

  // Listen for site settings
  onSnapshot(doc(db, "settings", "site_config"), (docSnap) => {
    if (docSnap.exists()) {
      siteSettings = docSnap.data();
      applySiteSettings();
    }
  });

  // Listen for side promo ad settings
  onSnapshot(doc(db, "settings", "promo_ad"), (docSnap) => {
    if (docSnap.exists()) {
      renderPromoAd(docSnap.data());
    }
  });

  // Listen for categories
  onSnapshot(collection(db, "categories"), (snapshot) => {
    const categories = [];
    snapshot.forEach((doc) => categories.push({ id: doc.id, ...doc.data() }));
    renderCategories(categories);
  });

  // Auth state listener for Admin page
  onAuthStateChanged(auth, (user) => {
    const loginSec = document.getElementById('login-section');
    const dashSec = document.getElementById('dashboard-section');
    if (loginSec && dashSec) {
      if (user) {
        loginSec.style.display = 'none';
        dashSec.style.display = 'block';
        loadAdminOrders();
      } else {
        loginSec.style.display = 'flex';
        dashSec.style.display = 'none';
      }
    }
  });

  updateCartUI();
}

// ==========================================
// 3. FRONTEND RENDER FUNCTIONS
// ==========================================

// Render Catalog Grid or Slider based on admin settings
function renderFrontendProducts() {
  const container = document.getElementById('frontend-product-list');
  if (!container) return;

  const filtered = activeCategory === 'All' 
    ? currentProducts 
    : currentProducts.filter(p => p.category === activeCategory);

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--text-muted);">No products found in this category.</p>';
    return;
  }

  // Toggle slider vs grid layout
  const isSlider = siteSettings.catalogMode === 'slider';
  container.className = isSlider ? 'product-slider-container' : 'product-grid';

  container.innerHTML = filtered.map(product => {
    const isVideo = product.image && product.image.match(/\.(mp4|webm|ogg)$/i);
    const mediaHtml = isVideo 
      ? `<video class="product-media" src="${product.image}" autoplay loop muted playsinline></video>`
      : `<img class="product-media" src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.title}" loading="lazy">`;

    return `
      <div class="product-card">
        ${mediaHtml}
        <h3>${product.title}</h3>
        <span class="stock-tag">${product.badge || 'In Stock'} (${product.stock ?? 0} available)</span>
        <p>${product.description || ''}</p>
        <div class="price">$${parseFloat(product.price).toFixed(2)}</div>
        <button class="btn btn-primary btn-block" onclick="addToCart('${product.id}')">
          <i class="fa-solid fa-cart-plus"></i> Add to Cart
        </button>
      </div>
    `;
  }).join('');
}

// Render Menu Header Product Slider Bar
function renderMenuProductGallery() {
  const gallery = document.getElementById('menu-product-gallery');
  if (!gallery) return;

  if (currentProducts.length === 0) {
    gallery.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">No featured items</span>';
    return;
  }

  gallery.innerHTML = currentProducts.map(p => `
    <div class="menu-product-item" onclick="scrollToProduct('${p.id}')">
      <img src="${p.image || 'https://via.placeholder.com/50'}" class="menu-product-img" alt="${p.title}">
      <div class="menu-product-info">
        <span class="menu-product-title">${p.title}</span>
        <span class="menu-product-price">$${parseFloat(p.price).toFixed(2)}</span>
      </div>
    </div>
  `).join('');
}

window.slideMenuGallery = function(direction) {
  const gallery = document.getElementById('menu-product-gallery');
  if (gallery) {
    gallery.scrollBy({ left: direction * 160, behavior: 'smooth' });
  }
};

window.scrollToProduct = function(id) {
  const catalog = document.getElementById('catalog');
  if (catalog) {
    catalog.scrollIntoView({ behavior: 'smooth' });
  }
};

// Category Tabs
function renderCategories(categories) {
  const filterBar = document.getElementById('category-filter-bar');
  const modalCatSelect = document.getElementById('modal-product-category');
  const adminCatList = document.getElementById('admin-categories-list');

  if (filterBar) {
    let html = `<button type="button" class="cat-btn ${activeCategory === 'All' ? 'active' : ''}" onclick="filterCategory('All')">All</button>`;
    categories.forEach(cat => {
      html += `<button type="button" class="cat-btn ${activeCategory === cat.name ? 'active' : ''}" onclick="filterCategory('${cat.name}')">${cat.name}</button>`;
    });
    filterBar.innerHTML = html;
  }

  if (modalCatSelect) {
    modalCatSelect.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  }

  if (adminCatList) {
    adminCatList.innerHTML = categories.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td><button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="deleteCategory('${c.id}')">Delete</button></td>
      </tr>
    `).join('');
  }
}

window.filterCategory = function(catName) {
  activeCategory = catName;
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === catName);
  });
  renderFrontendProducts();
};

// Apply Admin Text/Logo Settings across Homepage
function applySiteSettings() {
  if (!siteSettings) return;

  const setElemText = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.textContent = val;
  };

  setElemText('site-title-tag', siteSettings.siteTitle || 'Novucart');
  setElemText('announcement-text', siteSettings.announcement || 'Free express delivery on all orders today!');
  setElemText('nav-catalog-text', siteSettings.navCatalog || 'Catalog');
  setElemText('header-contact-text', siteSettings.navContact || 'Contact');
  setElemText('hero-headline-text', siteSettings.heroHeadline || 'Welcome to Novucart');
  setElemText('hero-subtext', siteSettings.heroSubtext || 'Discover quality items.');
  setElemText('hero-btn-text', siteSettings.heroBtnText || 'Shop Now');
  setElemText('catalog-heading-text', siteSettings.catalogHeading || 'Featured Collection');
  setElemText('catalog-subheading-text', siteSettings.catalogSubheading || 'Browse our inventory.');
  setElemText('footer-brand-title', siteSettings.siteTitle || 'Novucart');
  setElemText('footer-brand-desc', siteSettings.footerBrandDesc || 'Your target destination for fast fulfillment.');
  setElemText('footer-care-title', siteSettings.footerCareTitle || 'Customer Care');
  setElemText('footer-whatsapp-text', siteSettings.navContact || 'Contact on WhatsApp');
  setElemText('footer-email-text', siteSettings.email || 'support@novucart.com');
  setElemText('footer-copyright-text', siteSettings.footerText || '© Novucart. All rights reserved.');

  // Handle WhatsApp Link
  const waLink = siteSettings.whatsapp ? `https://wa.me/${siteSettings.whatsapp.replace(/[^0-9]/g, '')}` : '#';
  const headerContact = document.getElementById('header-contact-btn');
  const footerWa = document.getElementById('footer-whatsapp-link');
  if (headerContact) headerContact.href = waLink;
  if (footerWa) footerWa.href = waLink;

  // Handle Brand Logo (Text vs Image)
  const logoImg = document.getElementById('logo-img');
  const logoText = document.getElementById('logo-text');
  if (siteSettings.logoType === 'image' && siteSettings.logoUrl) {
    if (logoImg) { logoImg.src = siteSettings.logoUrl; logoImg.style.display = 'block'; }
    if (logoText) logoText.style.display = 'none';
  } else {
    if (logoImg) logoImg.style.display = 'none';
    if (logoText) { logoText.textContent = siteSettings.siteTitle || 'Novucart'; logoText.style.display = 'block'; }
  }

  // Auto-fill admin form if open
  populateSettingsForm();
}

// Side Ad Banner
function renderPromoAd(adData) {
  const adBox = document.getElementById('frontend-promo-ad');
  if (!adBox) return;

  if (adData && adData.active) {
    document.getElementById('promo-ad-heading').textContent = adData.title || '';
    document.getElementById('promo-ad-body').textContent = adData.desc || '';
    
    const adImg = document.getElementById('promo-ad-img');
    if (adData.image) {
      adImg.src = adData.image;
      adImg.style.display = 'block';
    } else {
      adImg.style.display = 'none';
    }

    const btn = document.getElementById('promo-ad-link-btn');
    btn.textContent = adData.btnText || 'Claim Offer';
    btn.href = adData.btnLink || '#';

    adBox.style.display = 'block';
  } else {
    adBox.style.display = 'none';
  }
}

// ==========================================
// 4. CART & CHECKOUT LOGIC
// ==========================================
window.addToCart = function(productId) {
  const product = currentProducts.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    if (existing.qty < (product.stock || 99)) {
      existing.qty++;
    } else {
      alert('Maximum available stock reached.');
      return;
    }
  } else {
    cart.push({ id: product.id, title: product.title, price: product.price, image: product.image, qty: 1 });
  }

  saveCart();
  openCartDrawer();
};

window.updateQty = function(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  saveCart();
};

function saveCart() {
  localStorage.setItem('novucart_cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const cartCount = document.getElementById('cart-count');
  const itemsContainer = document.getElementById('cart-items-container');
  const totalPriceElem = document.getElementById('cart-total-price');

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (cartCount) cartCount.textContent = totalQty;
  if (totalPriceElem) totalPriceElem.textContent = `$${totalPrice.toFixed(2)}`;

  if (itemsContainer) {
    if (cart.length === 0) {
      itemsContainer.innerHTML = '<p class="empty-cart-msg">Your bag is empty.</p>';
    } else {
      itemsContainer.innerHTML = cart.map(item => `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <img src="${item.image || 'https://via.placeholder.com/40'}" style="width:40px; height:40px; object-fit:cover; border-radius:6px;">
          <div style="flex:1;">
            <div style="font-size:0.85rem; font-weight:600;">${item.title}</div>
            <div style="font-size:0.8rem; color:var(--primary-color);">$${parseFloat(item.price).toFixed(2)}</div>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
            <span style="font-size:0.85rem; font-weight:600;">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
          </div>
        </div>
      `).join('');
    }
  }
}

function openCartDrawer() {
  document.getElementById('cart-drawer')?.classList.add('open');
  const overlay = document.getElementById('cart-overlay');
  if (overlay) overlay.style.display = 'block';
}

function closeCartDrawer() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  const overlay = document.getElementById('cart-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ==========================================
// 5. EVENT LISTENERS
// ==========================================
function setupEventListeners() {
  // Cart overlay controls
  document.getElementById('open-cart-btn')?.addEventListener('click', openCartDrawer);
  document.getElementById('close-cart-btn')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cart-overlay')?.addEventListener('click', closeCartDrawer);

  // Close Promo Ad Box
  document.getElementById('close-promo-ad')?.addEventListener('click', () => {
    document.getElementById('frontend-promo-ad').style.display = 'none';
  });

  // Open Checkout Modal
  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    closeCartDrawer();
    document.getElementById('checkout-modal').style.display = 'flex';
  });

  document.getElementById('close-checkout-modal-btn')?.addEventListener('click', () => {
    document.getElementById('checkout-modal').style.display = 'none';
  });

  // Handle Checkout Submission
  document.getElementById('checkout-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('cust-name').value;
    const email = document.getElementById('cust-email').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;
    const altContact = document.getElementById('cust-alt-contact').value;
    const promoCode = document.getElementById('cust-promo-code').value;
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const orderData = {
      customer: { name, email, phone, address, altContact },
      items: cart,
      promoCode: promoCode || 'None',
      paymentMethod,
      totalAmount,
      timestamp: new Date().toISOString()
    };

    try {
      // Save order in Firestore
      await addDoc(collection(db, "orders"), orderData);

      if (paymentMethod === 'card') {
        const paymentUrl = siteSettings.cardPaymentLink || 'https://stripe.com';
        window.location.href = paymentUrl;
      } else {
        alert('Thank you! Your Pay-on-Delivery order has been logged.');
        cart = [];
        saveCart();
        document.getElementById('checkout-modal').style.display = 'none';
      }
    } catch (err) {
      console.error("Error submitting order:", err);
      alert('Failed to process order. Please try again.');
    }
  });

  // ADMIN: Login Form
  document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-password').value;
    const errText = document.getElementById('login-error');

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      if (errText) errText.textContent = '';
    } catch (err) {
      if (errText) errText.textContent = 'Invalid credentials. Please check login details.';
    }
  });

  // ADMIN: Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => signOut(auth));

  // ADMIN: Category Creation Form
  document.getElementById('category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('new-category-name');
    const name = input.value.trim();
    if (name) {
      await addDoc(collection(db, "categories"), { name });
      input.value = '';
    }
  });

  // ADMIN: Save Full Site Settings Form
  document.getElementById('site-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const settingsData = {
      cardPaymentLink: document.getElementById('setting-card-payment-link').value,
      siteTitle: document.getElementById('setting-site-title').value,
      logoType: document.getElementById('setting-logo-type').value,
      logoUrl: document.getElementById('setting-logo-url').value,
      catalogMode: document.getElementById('setting-catalog-mode').value,
      announcement: document.getElementById('setting-announcement').value,
      navCatalog: document.getElementById('setting-nav-catalog').value,
      navContact: document.getElementById('setting-nav-contact').value,
      heroHeadline: document.getElementById('setting-hero-headline').value,
      heroSubtext: document.getElementById('setting-hero-subtext').value,
      heroBtnText: document.getElementById('setting-hero-btn-text').value,
      catalogHeading: document.getElementById('setting-catalog-heading').value,
      catalogSubheading: document.getElementById('setting-catalog-subheading').value,
      email: document.getElementById('setting-email').value,
      whatsapp: document.getElementById('setting-whatsapp').value,
      footerBrandDesc: document.getElementById('setting-footer-brand-desc').value,
      footerCareTitle: document.getElementById('setting-footer-care-title').value,
      footerText: document.getElementById('setting-footer-text').value
    };

    await setDoc(doc(db, "settings", "site_config"), settingsData, { merge: true });
    alert('Site settings updated successfully!');
  });

  // ADMIN: Save Side Promo Ad
  document.getElementById('promo-ad-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const adData = {
      active: document.getElementById('promo-ad-active').checked,
      title: document.getElementById('promo-ad-title').value,
      desc: document.getElementById('promo-ad-desc').value,
      image: document.getElementById('promo-ad-image').value,
      btnText: document.getElementById('promo-ad-btn-text').value,
      btnLink: document.getElementById('promo-ad-btn-link').value
    };

    await setDoc(doc(db, "settings", "promo_ad"), adData, { merge: true });
    alert('Side Ad banner settings updated!');
  });

  // ADMIN: Product Modal Controls & Submission
  document.getElementById('open-product-modal-btn')?.addEventListener('click', () => {
    document.getElementById('product-form').reset();
    document.getElementById('modal-product-id').value = '';
    document.getElementById('modal-title').textContent = 'Add New Product';
    document.getElementById('product-modal').style.display = 'flex';
  });

  document.getElementById('close-product-modal-btn')?.addEventListener('click', () => {
    document.getElementById('product-modal').style.display = 'none';
  });

  document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('modal-product-id').value;
    const productPayload = {
      title: document.getElementById('modal-product-title').value,
      category: document.getElementById('modal-product-category').value,
      description: document.getElementById('modal-product-desc').value,
      price: parseFloat(document.getElementById('modal-product-price').value),
      stock: parseInt(document.getElementById('modal-product-stock').value, 10),
      image: document.getElementById('modal-product-image').value,
      badge: document.getElementById('modal-product-badge').value || 'In Stock'
    };

    if (id) {
      await updateDoc(doc(db, "products", id), productPayload);
    } else {
      productPayload.order = currentProducts.length;
      await addDoc(collection(db, "products"), productPayload);
    }

    document.getElementById('product-modal').style.display = 'none';
  });
}

// ==========================================
// 6. ADMIN RENDER & ACTIONS
// ==========================================
function renderAdminProducts() {
  const tbody = document.getElementById('admin-product-list');
  if (!tbody) return;

  tbody.innerHTML = currentProducts.map((p, index) => `
    <tr>
      <td>
        <button class="btn btn-outline" style="padding:2px 6px;" onclick="reorderProduct(${index}, -1)" ${index === 0 ? 'disabled' : ''}>▲</button>
        <button class="btn btn-outline" style="padding:2px 6px;" onclick="reorderProduct(${index}, 1)" ${index === currentProducts.length - 1 ? 'disabled' : ''}>▼</button>
      </td>
      <td><img src="${p.image || 'https://via.placeholder.com/40'}" style="width:36px; height:36px; object-fit:cover; border-radius:6px;"></td>
      <td>
        <strong>${p.title}</strong><br>
        <span style="font-size:0.75rem; color:var(--text-muted);">${p.category || 'General'}</span>
      </td>
      <td>$${parseFloat(p.price).toFixed(2)}</td>
      <td>${p.stock ?? 0}</td>
      <td>
        <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

window.reorderProduct = async function(currentIndex, direction) {
  const targetIndex = currentIndex + direction;
  if (targetIndex < 0 || targetIndex >= currentProducts.length) return;

  const itemA = currentProducts[currentIndex];
  const itemB = currentProducts[targetIndex];

  await updateDoc(doc(db, "products", itemA.id), { order: targetIndex });
  await updateDoc(doc(db, "products", itemB.id), { order: currentIndex });
};

window.editProduct = function(id) {
  const product = currentProducts.find(p => p.id === id);
  if (!product) return;

  document.getElementById('modal-product-id').value = product.id;
  document.getElementById('modal-product-title').value = product.title || '';
  document.getElementById('modal-product-category').value = product.category || '';
  document.getElementById('modal-product-desc').value = product.description || '';
  document.getElementById('modal-product-price').value = product.price || '';
  document.getElementById('modal-product-stock').value = product.stock || 0;
  document.getElementById('modal-product-image').value = product.image || '';
  document.getElementById('modal-product-badge').value = product.badge || '';

  document.getElementById('modal-title').textContent = 'Edit Product';
  document.getElementById('product-modal').style.display = 'flex';
};

window.deleteProduct = async function(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    await deleteDoc(doc(db, "products", id));
  }
};

window.deleteCategory = async function(id) {
  if (confirm('Delete this category?')) {
    await deleteDoc(doc(db, "categories", id));
  }
};

function populateSettingsForm() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };

  setVal('setting-card-payment-link', siteSettings.cardPaymentLink || '');
  setVal('setting-site-title', siteSettings.siteTitle || 'Novucart');
  setVal('setting-logo-type', siteSettings.logoType || 'text');
  setVal('setting-logo-url', siteSettings.logoUrl || '');
  setVal('setting-catalog-mode', siteSettings.catalogMode || 'grid');
  setVal('setting-announcement', siteSettings.announcement || '');
  setVal('setting-nav-catalog', siteSettings.navCatalog || '');
  setVal('setting-nav-contact', siteSettings.navContact || '');
  setVal('setting-hero-headline', siteSettings.heroHeadline || '');
  setVal('setting-hero-subtext', siteSettings.heroSubtext || '');
  setVal('setting-hero-btn-text', siteSettings.heroBtnText || '');
  setVal('setting-catalog-heading', siteSettings.catalogHeading || '');
  setVal('setting-catalog-subheading', siteSettings.catalogSubheading || '');
  setVal('setting-email', siteSettings.email || '');
  setVal('setting-whatsapp', siteSettings.whatsapp || '');
  setVal('setting-footer-brand-desc', siteSettings.footerBrandDesc || '');
  setVal('setting-footer-care-title', siteSettings.footerCareTitle || '');
  setVal('setting-footer-text', siteSettings.footerText || '');
}

async function loadAdminOrders() {
  const tbody = document.getElementById('admin-orders-list');
  if (!tbody) return;

  const snapshot = await getDocs(collection(db, "orders"));
  const orders = [];
  snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td>${new Date(o.timestamp).toLocaleDateString()}</td>
      <td><strong>${o.customer?.name || 'N/A'}</strong></td>
      <td>${o.customer?.email || ''}<br>${o.customer?.phone || ''}</td>
      <td>${o.customer?.address || 'N/A'}</td>
      <td>
        <span style="font-weight:700;">${(o.paymentMethod || 'POD').toUpperCase()}</span><br>
        <span style="font-size:0.75rem; color:var(--text-muted);">Promo: ${o.promoCode || 'None'}</span>
      </td>
      <td><strong>$${parseFloat(o.totalAmount || 0).toFixed(2)}</strong></td>
    </tr>
  `).join('');
}
