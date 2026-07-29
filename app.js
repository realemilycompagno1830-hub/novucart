import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, deleteDoc, setDoc, updateDoc, getDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCvwAg_i3wnfrKdbegLLh7-tPJE44COYoI",
  authDomain: "novucart-5d9a3.firebaseapp.com",
  projectId: "novucart-5d9a3",
  storageBucket: "novucart-5d9a3.appspot.com",
  messagingSenderId: "102938475610",
  appId: "1:102938475610:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentProductsList = [];
let categoriesList = ["Men's Clothing", "Electronics", "Women's Wear"];
let activeCategoryFilter = "All";
let cart = [];
let cardPaymentLink = "";
let storeEmail = "";

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('frontend-product-list')) {
    loadCategories();
    loadFrontendProducts();
    loadFrontendSettings();
    loadFrontendPromoAd();
    setupCartAndCheckout();
  }
});

// AUTHENTICATION
const loginForm = document.getElementById('admin-login-form');
const logoutBtn = document.getElementById('logout-btn');

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (document.getElementById('login-section')) document.getElementById('login-section').style.display = 'none';
    if (document.getElementById('dashboard-section')) document.getElementById('dashboard-section').style.display = 'block';
    loadCategories();
    loadAdminProducts();
    loadAdminOrders();
    loadSiteSettings();
    loadPromoAdSettings();
  } else {
    if (document.getElementById('login-section')) document.getElementById('login-section').style.display = 'flex';
    if (document.getElementById('dashboard-section')) document.getElementById('dashboard-section').style.display = 'none';
  }
});

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, document.getElementById('admin-email').value, document.getElementById('admin-password').value);
    } catch (err) {
      if (document.getElementById('login-error')) document.getElementById('login-error').textContent = "Invalid credentials.";
    }
  });
}

if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));

// CATEGORY MANAGEMENT
async function loadCategories() {
  try {
    const docSnap = await getDoc(doc(db, "settings", "categories"));
    if (docSnap.exists() && docSnap.data().list) {
      categoriesList = docSnap.data().list;
    }
  } catch(e) {}
  renderCategoryTabs();
  renderCategorySelectOptions();
  renderAdminCategoryTable();
}

function renderCategoryTabs() {
  const bar = document.getElementById('category-filter-bar');
  if (!bar) return;
  bar.innerHTML = `<button class="cat-btn ${activeCategoryFilter === 'All' ? 'active' : ''}" onclick="filterCategory('All')">All</button>`;
  categoriesList.forEach(cat => {
    bar.innerHTML += `<button class="cat-btn ${activeCategoryFilter === cat ? 'active' : ''}" onclick="filterCategory('${cat}')">${cat}</button>`;
  });
}

function renderCategorySelectOptions() {
  const select = document.getElementById('modal-product-category');
  if (!select) return;
  select.innerHTML = `<option value="Uncategorized">Uncategorized</option>`;
  categoriesList.forEach(cat => {
    select.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

function renderAdminCategoryTable() {
  const tbody = document.getElementById('admin-categories-list');
  if (!tbody) return;
  tbody.innerHTML = "";
  categoriesList.forEach((cat, idx) => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${cat}</strong></td>
        <td><button class="btn btn-outline" style="color:red; padding:4px 8px;" onclick="deleteCategory(${idx})">Delete</button></td>
      </tr>
    `;
  });
}

window.filterCategory = (cat) => {
  activeCategoryFilter = cat;
  renderCategoryTabs();
  loadFrontendProducts();
};

window.deleteCategory = async (idx) => {
  categoriesList.splice(idx, 1);
  await setDoc(doc(db, "settings", "categories"), { list: categoriesList });
  loadCategories();
};

const categoryForm = document.getElementById('category-form');
if (categoryForm) {
  categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-category-name').value.trim();
    if (name && !categoriesList.includes(name)) {
      categoriesList.push(name);
      await setDoc(doc(db, "settings", "categories"), { list: categoriesList });
      document.getElementById('new-category-name').value = "";
      loadCategories();
    }
  });
}

// ADD / EDIT PRODUCT MODAL
const productModal = document.getElementById('product-modal');
const openModalBtn = document.getElementById('open-product-modal-btn');
const closeModalBtn = document.getElementById('close-product-modal-btn');
const productForm = document.getElementById('product-form');

if (openModalBtn) {
  openModalBtn.addEventListener('click', () => {
    if (document.getElementById('modal-title')) document.getElementById('modal-title').textContent = "Add New Product";
    if (document.getElementById('modal-product-id')) document.getElementById('modal-product-id').value = "";
    if (productForm) productForm.reset();
    renderCategorySelectOptions();
    if (productModal) productModal.style.display = 'flex';
  });
}

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => { if (productModal) productModal.style.display = 'none'; });
}

if (productForm) {
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('modal-product-id').value;
    const title = document.getElementById('modal-product-title').value.trim();
    const category = document.getElementById('modal-product-category').value;
    const desc = document.getElementById('modal-product-desc').value.trim();
    const price = parseFloat(document.getElementById('modal-product-price').value);
    const stock = parseInt(document.getElementById('modal-product-stock').value) || 0;
    const image = document.getElementById('modal-product-image').value.trim();
    const badge = document.getElementById('modal-product-badge').value.trim() || 'In Stock';

    try {
      if (id) {
        await updateDoc(doc(db, "products", id), { title, category, desc, price, stock, image, badge });
      } else {
        const newDocRef = doc(collection(db, "products"));
        await setDoc(newDocRef, { title, category, desc, price, stock, image, badge, order: currentProductsList.length + 1 });
      }
      if (productModal) productModal.style.display = 'none';
      productForm.reset();
      loadAdminProducts();
    } catch (err) { alert("Failed to save product."); }
  });
}

// FRONTEND FUNCTIONS
async function loadFrontendProducts() {
  const container = document.getElementById('frontend-product-list');
  if (!container) return;

  try {
    const snapshot = await getDocs(collection(db, "products"));
    container.innerHTML = "";
    let products = [];
    snapshot.forEach(d => products.push({ id: d.id, ...d.data() }));
    products.sort((a,b) => (a.order || 0) - (b.order || 0));

    if (activeCategoryFilter !== "All") {
      products = products.filter(p => p.category === activeCategoryFilter);
    }

    if (products.length === 0) {
      container.innerHTML = "<p style='grid-column:1/-1; text-align:center;'>No items available in this view.</p>";
      return;
    }

    products.forEach(p => {
      const card = document.createElement('div');
      card.className = "product-card";
      const isVideo = p.image && (p.image.toLowerCase().endsWith('.mp4') || p.image.toLowerCase().includes('video'));

      const mediaHtml = isVideo 
        ? `<video src="${p.image}" class="product-media" controls autoplay muted loop></video>`
        : `<img src="${p.image || 'https://via.placeholder.com/250'}" class="product-media" alt="${p.title}">`;

      card.innerHTML = `
        ${mediaHtml}
        <h3>${p.title}</h3>
        <span class="stock-tag">${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span>
        <p>${p.desc || 'High quality item available for immediate order.'}</p>
        <div class="price">$${parseFloat(p.price).toFixed(2)}</div>
        <button class="btn btn-primary btn-block" onclick="addToCart('${p.id}', '${p.title}', ${p.price}, '${p.image}')">Add to Bag</button>
      `;
      container.appendChild(card);
    });
  } catch (err) { container.innerHTML = "<p>Error loading catalog.</p>"; }
}

function applyFrontendSettingsDOM(data) {
  cardPaymentLink = data.cardPaymentLink || "";
  storeEmail = data.email || "support@novucart.com";

  if (data.catalogMode === 'slider') {
    const catContainer = document.getElementById('frontend-product-list');
    if (catContainer) {
      catContainer.classList.remove('product-grid');
      catContainer.classList.add('product-slider-container');
    }
  }

  // Logo rendering
  if (data.logoType === 'image' && data.logoUrl) {
    if (document.getElementById('logo-img')) {
      document.getElementById('logo-img').src = data.logoUrl;
      document.getElementById('logo-img').style.display = 'inline-block';
    }
    if (document.getElementById('logo-text')) document.getElementById('logo-text').style.display = 'none';
  } else if (data.siteTitle && document.getElementById('logo-text')) {
    document.getElementById('logo-text').textContent = data.siteTitle;
    document.getElementById('logo-text').style.display = 'inline-block';
    if (document.getElementById('logo-img')) document.getElementById('logo-img').style.display = 'none';
  }

  if (data.siteTitle && document.getElementById('site-title-tag')) document.getElementById('site-title-tag').textContent = data.siteTitle;
  if (data.siteTitle && document.getElementById('footer-brand-title')) document.getElementById('footer-brand-title').textContent = data.siteTitle;
  if (data.announcement && document.getElementById('announcement-text')) document.getElementById('announcement-text').textContent = data.announcement;
  if (data.navCatalog && document.getElementById('nav-catalog-text')) document.getElementById('nav-catalog-text').textContent = data.navCatalog;
  if (data.navContact && document.getElementById('header-contact-text')) document.getElementById('header-contact-text').textContent = data.navContact;
  if (data.heroHeadline && document.getElementById('hero-headline-text')) document.getElementById('hero-headline-text').textContent = data.heroHeadline;
  if (data.heroSubtext && document.getElementById('hero-subtext')) document.getElementById('hero-subtext').textContent = data.heroSubtext;
  if (data.heroBtnText && document.getElementById('hero-btn-text')) document.getElementById('hero-btn-text').textContent = data.heroBtnText;
  if (data.catalogHeading && document.getElementById('catalog-heading-text')) document.getElementById('catalog-heading-text').textContent = data.catalogHeading;
  if (data.catalogSubheading && document.getElementById('catalog-subheading-text')) document.getElementById('catalog-subheading-text').textContent = data.catalogSubheading;
  
  if (data.whatsapp) {
    if (document.getElementById('header-contact-btn')) document.getElementById('header-contact-btn').href = data.whatsapp;
    if (document.getElementById('footer-whatsapp-link')) document.getElementById('footer-whatsapp-link').href = data.whatsapp;
  }
  if (data.email && document.getElementById('footer-email-text')) document.getElementById('footer-email-text').textContent = data.email;
  if (data.footerBrandDesc && document.getElementById('footer-brand-desc')) document.getElementById('footer-brand-desc').textContent = data.footerBrandDesc;
  if (data.footerCareTitle && document.getElementById('footer-care-title')) document.getElementById('footer-care-title').textContent = data.footerCareTitle;
  if (data.footerText && document.getElementById('footer-copyright-text')) document.getElementById('footer-copyright-text').textContent = data.footerText;
}

async function loadFrontendSettings() {
  // 1. Instant load from local storage cache (0ms delay)
  const cached = localStorage.getItem('novucart_frontend_settings');
  if (cached) {
    try {
      applyFrontendSettingsDOM(JSON.parse(cached));
    } catch(e) {}
  }

  // 2. Fetch fresh from Firebase in background
  try {
    const docSnap = await getDoc(doc(db, "settings", "general"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      applyFrontendSettingsDOM(data);
      localStorage.setItem('novucart_frontend_settings', JSON.stringify(data));
    }
  } catch(e) {}
}

async function loadFrontendPromoAd() {
  try {
    const docSnap = await getDoc(doc(db, "settings", "promoAd"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.active) {
        const adBox = document.getElementById('frontend-promo-ad');
        if (document.getElementById('promo-ad-heading')) document.getElementById('promo-ad-heading').textContent = data.title || '';
        if (document.getElementById('promo-ad-body')) document.getElementById('promo-ad-body').textContent = data.desc || '';
        if (data.image) {
          const img = document.getElementById('promo-ad-img');
          if (img) { img.src = data.image; img.style.display = 'block'; }
        }
        if (data.btnText && document.getElementById('promo-ad-link-btn')) document.getElementById('promo-ad-link-btn').textContent = data.btnText;
        if (data.btnLink && document.getElementById('promo-ad-link-btn')) document.getElementById('promo-ad-link-btn').href = data.btnLink;
        
        if (adBox) adBox.style.display = 'block';
        if (document.getElementById('close-promo-ad')) document.getElementById('close-promo-ad').onclick = () => adBox.style.display = 'none';
      }
    }
  } catch(e) {}
}

// CART & CHECKOUT SETUP
function setupCartAndCheckout() {
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const checkoutModal = document.getElementById('checkout-modal');
  
  if (document.getElementById('open-cart-btn')) {
    document.getElementById('open-cart-btn').onclick = () => {
      if (cartDrawer) cartDrawer.classList.add('open');
      if (cartOverlay) cartOverlay.style.display = 'block';
    };
  }

  const closeCart = () => {
    if (cartDrawer) cartDrawer.classList.remove('open');
    if (cartOverlay) cartOverlay.style.display = 'none';
  };

  if (document.getElementById('close-cart-btn')) document.getElementById('close-cart-btn').onclick = closeCart;
  if (cartOverlay) cartOverlay.onclick = closeCart;

  if (document.getElementById('checkout-btn')) {
    document.getElementById('checkout-btn').onclick = () => {
      if (cart.length === 0) { alert("Your cart is empty!"); return; }
      closeCart();
      if (checkoutModal) checkoutModal.style.display = 'flex';
    };
  }

  if (document.getElementById('close-checkout-modal-btn')) {
    document.getElementById('close-checkout-modal-btn').onclick = () => {
      if (checkoutModal) checkoutModal.style.display = 'none';
    };
  }

  // CHECKOUT SUBMISSION LOGIC
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('cust-name').value;
      const email = document.getElementById('cust-email').value;
      const phone = document.getElementById('cust-phone').value;
      const address = document.getElementById('cust-address').value;
      const altContact = document.getElementById('cust-alt-contact').value || 'N/A';
      const promoCode = document.getElementById('cust-promo-code').value || 'None';
      const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

      let total = cart.reduce((acc, i) => acc + (parseFloat(i.price) * i.qty), 0);
      let itemsListStr = cart.map(i => `- ${i.title} (x${i.qty}) - $${(i.price * i.qty).toFixed(2)}`).join('\n');

      try {
        await addDoc(collection(db, "orders"), {
          name, email, phone, address, altContact, promoCode,
          paymentMethod: paymentMethod === 'card' ? 'Pay via Card' : 'Pay on Delivery',
          total: total.toFixed(2), items: cart, date: new Date().toLocaleDateString()
        });

        if (paymentMethod === 'card') {
          if (!cardPaymentLink) {
            alert("Card payment link has not been configured in the admin dashboard yet.");
            return;
          }
          window.location.href = cardPaymentLink;
        } else {
          // PAY ON DELIVERY: Direct email launch with zero popup blocks
          const subject = encodeURIComponent(`New Pay on Delivery Order from ${name}`);
          const body = encodeURIComponent(`Customer Order Details:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nDelivery Address: ${address}\nAlt Contact: ${altContact}\nPromo Code: ${promoCode}\n\nItems Ordered:\n${itemsListStr}\n\nTotal Amount: $${total.toFixed(2)}`);
          
          window.location.href = `mailto:${storeEmail}?subject=${subject}&body=${body}`;
        }

        cart = [];
        updateCartUI();
        if (checkoutModal) checkoutModal.style.display = 'none';
        checkoutForm.reset();
      } catch(err) { alert("Error placing order."); }
    });
  }
}

// MULTI-QUANTITY CART SUPPORT
window.addToCart = (id, title, price, image) => {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, title, price: parseFloat(price), image, qty: 1 });
  }
  updateCartUI();
  if (document.getElementById('cart-drawer')) document.getElementById('cart-drawer').classList.add('open');
  if (document.getElementById('cart-overlay')) document.getElementById('cart-overlay').style.display = 'block';
};

window.changeQty = (idx, delta) => {
  if (cart[idx]) {
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
  }
  updateCartUI();
};

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  if (document.getElementById('cart-count')) document.getElementById('cart-count').textContent = totalCount;
  const container = document.getElementById('cart-items-container');
  let total = 0;
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-cart-msg">Your bag is empty.</p>`;
    if (document.getElementById('cart-total-price')) document.getElementById('cart-total-price').textContent = "$0.00";
    return;
  }

  container.innerHTML = "";
  cart.forEach((item, idx) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    const div = document.createElement('div');
    div.style.cssText = "display:flex; align-items:center; justify-style:space-between; margin-bottom:12px; gap:8px;";
    div.innerHTML = `
      <img src="${item.image}" width="40" height="40" style="border-radius:6px; object-fit:cover;">
      <div style="flex:1;">
        <strong style="font-size:0.85rem; display:block;">${item.title}</strong>
        <span style="font-size:0.8rem; color:#64748B;">$${item.price.toFixed(2)}</span>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <button class="qty-btn" onclick="changeQty(${idx}, -1)">-</button>
        <span style="font-size:0.85rem; font-weight:bold;">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
      </div>
    `;
    container.appendChild(div);
  });

  if (document.getElementById('cart-total-price')) document.getElementById('cart-total-price').textContent = `$${total.toFixed(2)}`;
}

// ADMIN DATA LOADERS
async function loadAdminProducts() {
  const container = document.getElementById('admin-product-list');
  if (!container) return;

  try {
    const snapshot = await getDocs(collection(db, "products"));
    container.innerHTML = "";
    currentProductsList = [];
    snapshot.forEach(d => currentProductsList.push({ id: d.id, ...d.data() }));
    currentProductsList.sort((a,b) => (a.order || 0) - (b.order || 0));

    if (currentProductsList.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="text-secondary">No products found. Add your first item!</td></tr>`;
      return;
    }

    currentProductsList.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <button class="btn btn-outline" style="padding:2px 6px;" onclick="moveProduct('${item.id}', 'up')" ${index===0?'disabled':''}>▲</button>
          <button class="btn btn-outline" style="padding:2px 6px;" onclick="moveProduct('${item.id}', 'down')" ${index===currentProductsList.length-1?'disabled':''}>▼</button>
        </td>
        <td><img src="${item.image}" width="35" height="35" style="border-radius:6px; object-fit:cover;"></td>
        <td><strong>${item.title}</strong><br><small style="color:#64748B;">Cat: ${item.category || 'Uncategorized'}</small></td>
        <td>$${item.price}</td>
        <td>${item.stock || 0}</td>
        <td>
          <button class="btn btn-outline" style="padding:4px 8px;" onclick="editProduct('${item.id}')">Edit</button>
          <button class="btn btn-outline" style="padding:4px 8px; color:red;" onclick="deleteProduct('${item.id}')">Delete</button>
        </td>
      `;
      container.appendChild(tr);
    });
  } catch(e) {}
}

window.editProduct = (id) => {
  const product = currentProductsList.find(p => p.id === id);
  if (!product) return;

  renderCategorySelectOptions();
  if (document.getElementById('modal-title')) document.getElementById('modal-title').textContent = "Edit Product";
  if (document.getElementById('modal-product-id')) document.getElementById('modal-product-id').value = product.id;
  if (document.getElementById('modal-product-title')) document.getElementById('modal-product-title').value = product.title || '';
  if (document.getElementById('modal-product-category')) document.getElementById('modal-product-category').value = product.category || 'Uncategorized';
  if (document.getElementById('modal-product-desc')) document.getElementById('modal-product-desc').value = product.desc || '';
  if (document.getElementById('modal-product-price')) document.getElementById('modal-product-price').value = product.price || '';
  if (document.getElementById('modal-product-stock')) document.getElementById('modal-product-stock').value = product.stock || '';
  if (document.getElementById('modal-product-image')) document.getElementById('modal-product-image').value = product.image || '';
  if (document.getElementById('modal-product-badge')) document.getElementById('modal-product-badge').value = product.badge || '';

  if (productModal) productModal.style.display = 'flex';
};

window.moveProduct = async (id, direction) => {
  const idx = currentProductsList.findIndex(p => p.id === id);
  if (idx === -1) return;
  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= currentProductsList.length) return;

  const a = currentProductsList[idx];
  const b = currentProductsList[targetIdx];

  await updateDoc(doc(db, "products", a.id), { order: targetIdx + 1 });
  await updateDoc(doc(db, "products", b.id), { order: idx + 1 });
  loadAdminProducts();
  loadFrontendProducts();
};

window.deleteProduct = async (id) => {
  if (confirm("Delete this product?")) {
    await deleteDoc(doc(db, "products", id));
    loadAdminProducts();
  }
};

const settingsForm = document.getElementById('site-settings-form');
if (settingsForm) {
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      let rawPayLink = document.getElementById('setting-card-payment-link').value.trim();
      if (rawPayLink && !rawPayLink.startsWith('http://') && !rawPayLink.startsWith('https://')) {
        rawPayLink = 'https://' + rawPayLink;
      }

      let rawLogoUrl = document.getElementById('setting-logo-url').value.trim();
      if (rawLogoUrl.includes('src=')) {
        const match = rawLogoUrl.match(/src=['"]([^'"]+)['"]/);
        if (match && match[1]) rawLogoUrl = match[1];
      }

      const updatedData = {
        cardPaymentLink: rawPayLink,
        siteTitle: document.getElementById('setting-site-title').value,
        logoType: document.getElementById('setting-logo-type').value,
        logoUrl: rawLogoUrl,
        catalogMode: document.getElementById('setting-catalog-mode').value,
        announcement: document.getElementById('setting-announcement').value,
        navCatalog: document.getElementById('setting-nav-catalog').value,
        navContact: document.getElementById('setting-nav-contact').value,
        heroHeadline: document.getElementById('setting-hero-headline').value,
        heroSubtext: document.getElementById('setting-hero-subtext').value,
        heroBtnText: document.getElementById('setting-hero-btn-text').value,
        catalogHeading: document.getElementById('setting-catalog-heading').value,
        catalogSubheading: document.getElementById('setting-catalog-subheading').value,
        whatsapp: document.getElementById('setting-whatsapp').value,
        email: document.getElementById('setting-email').value,
        footerBrandDesc: document.getElementById('setting-footer-brand-desc').value,
        footerCareTitle: document.getElementById('setting-footer-care-title').value,
        footerText: document.getElementById('setting-footer-text').value
      };

      await setDoc(doc(db, "settings", "general"), updatedData, { merge: true });
      localStorage.setItem('novucart_frontend_settings', JSON.stringify(updatedData));
      alert("Settings and Payment Link updated successfully!");
    } catch (err) { alert("Failed to save settings: " + err.message); }
  });
}

const promoForm = document.getElementById('promo-ad-form');
if (promoForm) {
  promoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "promoAd"), {
        active: document.getElementById('promo-ad-active').checked,
        title: document.getElementById('promo-ad-title').value,
        desc: document.getElementById('promo-ad-desc').value,
        image: document.getElementById('promo-ad-image').value,
        btnText: document.getElementById('promo-ad-btn-text').value,
        btnLink: document.getElementById('promo-ad-btn-link').value
      });
      alert("Side Ad settings updated!");
    } catch (err) { alert("Failed to update Ad."); }
  });
}

async function loadPromoAdSettings() {
  try {
    const docSnap = await getDoc(doc(db, "settings", "promoAd"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (document.getElementById('promo-ad-active')) document.getElementById('promo-ad-active').checked = data.active || false;
      if (document.getElementById('promo-ad-title')) document.getElementById('promo-ad-title').value = data.title || '';
      if (document.getElementById('promo-ad-desc')) document.getElementById('promo-ad-desc').value = data.desc || '';
      if (document.getElementById('promo-ad-image')) document.getElementById('promo-ad-image').value = data.image || '';
      if (document.getElementById('promo-ad-btn-text')) document.getElementById('promo-ad-btn-text').value = data.btnText || '';
      if (document.getElementById('promo-ad-btn-link')) document.getElementById('promo-ad-btn-link').value = data.btnLink || '';
    }
  } catch(e) {}
}

async function loadSiteSettings() {
  try {
    const docSnap = await getDoc(doc(db, "settings", "general"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (document.getElementById('setting-card-payment-link')) document.getElementById('setting-card-payment-link').value = data.cardPaymentLink || '';
      if (document.getElementById('setting-site-title')) document.getElementById('setting-site-title').value = data.siteTitle || '';
      if (document.getElementById('setting-logo-type')) document.getElementById('setting-logo-type').value = data.logoType || 'text';
      if (document.getElementById('setting-logo-url')) document.getElementById('setting-logo-url').value = data.logoUrl || '';
      if (document.getElementById('setting-catalog-mode')) document.getElementById('setting-catalog-mode').value = data.catalogMode || 'grid';
      if (document.getElementById('setting-announcement')) document.getElementById('setting-announcement').value = data.announcement || '';
      if (document.getElementById('setting-nav-catalog')) document.getElementById('setting-nav-catalog').value = data.navCatalog || '';
      if (document.getElementById('setting-nav-contact')) document.getElementById('setting-nav-contact').value = data.navContact || '';
      if (document.getElementById('setting-hero-headline')) document.getElementById('setting-hero-headline').value = data.heroHeadline || '';
      if (document.getElementById('setting-hero-subtext')) document.getElementById('setting-hero-subtext').value = data.heroSubtext || '';
      if (document.getElementById('setting-hero-btn-text')) document.getElementById('setting-hero-btn-text').value = data.heroBtnText || '';
      if (document.getElementById('setting-catalog-heading')) document.getElementById('setting-catalog-heading').value = data.catalogHeading || '';
      if (document.getElementById('setting-catalog-subheading')) document.getElementById('setting-catalog-subheading').value = data.catalogSubheading || '';
      if (document.getElementById('setting-whatsapp')) document.getElementById('setting-whatsapp').value = data.whatsapp || '';
      if (document.getElementById('setting-email')) document.getElementById('setting-email').value = data.email || '';
      if (document.getElementById('setting-footer-brand-desc')) document.getElementById('setting-footer-brand-desc').value = data.footerBrandDesc || '';
      if (document.getElementById('setting-footer-care-title')) document.getElementById('setting-footer-care-title').value = data.footerCareTitle || '';
      if (document.getElementById('setting-footer-text')) document.getElementById('setting-footer-text').value = data.footerText || '';
    }
  } catch(e) {}
}

async function loadAdminOrders() {
  const container = document.getElementById('admin-orders-list');
  if (!container) return;
  try {
    const snapshot = await getDocs(collection(db, "orders"));
    container.innerHTML = "";
    if (snapshot.empty) {
      container.innerHTML = `<tr><td colspan="6">No orders placed yet.</td></tr>`;
      return;
    }
    snapshot.forEach(docSnap => {
      const o = docSnap.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${o.date || 'N/A'}</td>
        <td><strong>${o.name || 'N/A'}</strong></td>
        <td>${o.email || 'N/A'}<br><small>${o.phone || ''}</small></td>
        <td>${o.address || 'N/A'}</td>
        <td>${o.paymentMethod || 'N/A'}<br><small>Promo: ${o.promoCode || 'None'}</small></td>
        <td>$${o.total || '0.00'}</td>
      `;
      container.appendChild(tr);
    });
  } catch(e) {}
}
