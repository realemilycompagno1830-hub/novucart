import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, deleteDoc, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let cart = [];

// INITIALIZE SITE OR ADMIN ON PAGE LOAD
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('frontend-product-list')) {
    loadFrontendProducts();
    loadFrontendSettings();
    loadFrontendPromoAd();
    setupCartControls();
  }
});

// AUTHENTICATION (ADMIN)
const loginForm = document.getElementById('admin-login-form');
const logoutBtn = document.getElementById('logout-btn');

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (document.getElementById('login-section')) document.getElementById('login-section').style.display = 'none';
    if (document.getElementById('dashboard-section')) document.getElementById('dashboard-section').style.display = 'block';
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
      if (document.getElementById('login-error')) document.getElementById('login-error').textContent = "Invalid credentials. Try again.";
    }
  });
}

if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));

// FRONTEND DYNAMIC LOADERS
async function loadFrontendProducts() {
  const container = document.getElementById('frontend-product-list');
  if (!container) return;

  try {
    const snapshot = await getDocs(collection(db, "products"));
    container.innerHTML = "";
    let products = [];
    snapshot.forEach(d => products.push({ id: d.id, ...d.data() }));
    products.sort((a,b) => (a.order || 0) - (b.order || 0));

    if (products.length === 0) {
      container.innerHTML = "<p>No products available yet.</p>";
      return;
    }

    products.forEach(p => {
      const card = document.createElement('div');
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image}" alt="${p.title}">
        <h3>${p.title}</h3>
        <div class="price">$${parseFloat(p.price).toFixed(2)}</div>
        <button class="btn btn-primary btn-block" onclick="addToCart('${p.id}', '${p.title}', ${p.price}, '${p.image}')">Add to Cart</button>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = "<p>Error loading products.</p>";
  }
}

async function loadFrontendSettings() {
  try {
    const docSnap = await getDoc(doc(db, "settings", "general"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.siteTitle) document.getElementById('site-title-tag').textContent = data.siteTitle;
      if (data.announcement) document.getElementById('announcement-text').textContent = data.announcement;
      if (data.heroHeadline) document.getElementById('hero-headline-text').textContent = data.heroHeadline;
      if (data.whatsappText) {
        document.getElementById('header-contact-text').textContent = data.whatsappText;
        document.getElementById('footer-whatsapp-text').textContent = data.whatsappText;
      }
      if (data.whatsapp) {
        document.getElementById('header-contact-btn').href = data.whatsapp;
        document.getElementById('footer-whatsapp-link').href = data.whatsapp;
      }
      if (data.email) document.getElementById('footer-email-text').textContent = data.email;
      if (data.footerText) document.getElementById('footer-copyright-text').textContent = data.footerText;
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
        document.getElementById('promo-ad-heading').textContent = data.title || '';
        document.getElementById('promo-ad-body').textContent = data.desc || '';
        if (data.image) {
          const img = document.getElementById('promo-ad-img');
          img.src = data.image;
          img.style.display = 'block';
        }
        if (data.btnText) document.getElementById('promo-ad-link-btn').textContent = data.btnText;
        if (data.btnLink) document.getElementById('promo-ad-link-btn').href = data.btnLink;
        
        adBox.style.display = 'block';
        document.getElementById('close-promo-ad').onclick = () => adBox.style.display = 'none';
      }
    }
  } catch(e) {}
}

// CART DRAWER LOGIC
function setupCartControls() {
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  
  document.getElementById('open-cart-btn').onclick = () => {
    cartDrawer.classList.add('open');
    cartOverlay.style.display = 'block';
  };

  const closeCart = () => {
    cartDrawer.classList.remove('open');
    cartOverlay.style.display = 'none';
  };

  document.getElementById('close-cart-btn').onclick = closeCart;
  cartOverlay.onclick = closeCart;
}

window.addToCart = (id, title, price, image) => {
  cart.push({ id, title, price, image });
  updateCartUI();
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').style.display = 'block';
};

function updateCartUI() {
  document.getElementById('cart-count').textContent = cart.length;
  const container = document.getElementById('cart-items-container');
  let total = 0;

  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-cart-msg">Your bag is empty.</p>`;
    document.getElementById('cart-total-price').textContent = "$0.00";
    return;
  }

  container.innerHTML = "";
  cart.forEach((item, idx) => {
    total += parseFloat(item.price);
    const div = document.createElement('div');
    div.style.cssText = "display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;";
    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <img src="${item.image}" width="40" height="40" style="border-radius:6px; object-fit:cover;">
        <div>
          <strong style="font-size:0.85rem; display:block;">${item.title}</strong>
          <span style="font-size:0.8rem; color:#64748B;">$${item.price.toFixed(2)}</span>
        </div>
      </div>
      <button style="background:none; border:none; color:red; cursor:pointer;" onclick="removeFromCart(${idx})">✕</button>
    `;
    container.appendChild(div);
  });

  document.getElementById('cart-total-price').textContent = `$${total.toFixed(2)}`;
}

window.removeFromCart = (idx) => {
  cart.splice(idx, 1);
  updateCartUI();
};

// ADMIN FUNCTIONS
async function loadAdminProducts() {
  const container = document.getElementById('admin-product-list');
  if (!container) return;
  const snapshot = await getDocs(collection(db, "products"));
  container.innerHTML = "";
  currentProductsList = [];
  snapshot.forEach(d => currentProductsList.push({ id: d.id, ...d.data() }));
  currentProductsList.sort((a,b) => (a.order || 0) - (b.order || 0));

  currentProductsList.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <button class="btn btn-outline" style="padding:2px 6px;" onclick="moveProduct('${item.id}', 'up')" ${index===0?'disabled':''}>▲</button>
        <button class="btn btn-outline" style="padding:2px 6px;" onclick="moveProduct('${item.id}', 'down')" ${index===currentProductsList.length-1?'disabled':''}>▼</button>
      </td>
      <td><img src="${item.image}" width="35" height="35" style="border-radius:6px; object-fit:cover;"></td>
      <td><strong>${item.title}</strong></td>
      <td>$${item.price}</td>
      <td>${item.badge || 'In Stock'}</td>
      <td>
        <button class="btn btn-outline" style="padding:4px 8px;" onclick="editProduct('${item.id}')">Edit</button>
        <button class="btn btn-outline" style="padding:4px 8px; color:red;" onclick="deleteProduct('${item.id}')">Delete</button>
      </td>
    `;
    container.appendChild(tr);
  });
}

const settingsForm = document.getElementById('site-settings-form');
if (settingsForm) {
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "general"), {
        siteTitle: document.getElementById('setting-site-title').value,
        logoUrl: document.getElementById('setting-logo-url').value,
        announcement: document.getElementById('setting-announcement').value,
        heroHeadline: document.getElementById('setting-hero-headline').value,
        whatsappText: document.getElementById('setting-whatsapp-text').value,
        whatsapp: document.getElementById('setting-whatsapp').value,
        email: document.getElementById('setting-email').value,
        footerText: document.getElementById('setting-footer-text').value
      }, { merge: true });
      alert("Settings saved successfully!");
    } catch (err) { alert("Failed to save settings."); }
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
      alert("Pop-up Ad settings updated!");
    } catch (err) { alert("Failed to update Ad."); }
  });
}

async function loadPromoAdSettings() {
  try {
    const docSnap = await getDoc(doc(db, "settings", "promoAd"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('promo-ad-active').checked = data.active || false;
      document.getElementById('promo-ad-title').value = data.title || '';
      document.getElementById('promo-ad-desc').value = data.desc || '';
      document.getElementById('promo-ad-image').value = data.image || '';
      document.getElementById('promo-ad-btn-text').value = data.btnText || '';
      document.getElementById('promo-ad-btn-link').value = data.btnLink || '';
    }
  } catch(e) {}
}

async function loadSiteSettings() {
  const docSnap = await getDoc(doc(db, "settings", "general"));
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (document.getElementById('setting-site-title')) document.getElementById('setting-site-title').value = data.siteTitle || '';
    if (document.getElementById('setting-logo-url')) document.getElementById('setting-logo-url').value = data.logoUrl || '';
    if (document.getElementById('setting-announcement')) document.getElementById('setting-announcement').value = data.announcement || '';
    if (document.getElementById('setting-hero-headline')) document.getElementById('setting-hero-headline').value = data.heroHeadline || '';
    if (document.getElementById('setting-whatsapp-text')) document.getElementById('setting-whatsapp-text').value = data.whatsappText || '';
    if (document.getElementById('setting-whatsapp')) document.getElementById('setting-whatsapp').value = data.whatsapp || '';
    if (document.getElementById('setting-email')) document.getElementById('setting-email').value = data.email || '';
    if (document.getElementById('setting-footer-text')) document.getElementById('setting-footer-text').value = data.footerText || '';
  }
}

async function loadAdminOrders() {
  const container = document.getElementById('admin-orders-list');
  if (!container) return;
  const snapshot = await getDocs(collection(db, "orders"));
  container.innerHTML = snapshot.empty ? `<tr><td colspan="7">No orders yet.</td></tr>` : "";
}

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
};

window.deleteProduct = async (id) => {
  if (confirm("Delete this product?")) {
    await deleteDoc(doc(db, "products", id));
    loadAdminProducts();
  }
};
