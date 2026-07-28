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
let cart = [];
let cardPaymentLink = "";
let storeEmail = "";

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('frontend-product-list')) {
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
    const desc = document.getElementById('modal-product-desc').value.trim();
    const price = parseFloat(document.getElementById('modal-product-price').value);
    const stock = parseInt(document.getElementById('modal-product-stock').value) || 0;
    const image = document.getElementById('modal-product-image').value.trim();
    const badge = document.getElementById('modal-product-badge').value.trim() || 'In Stock';

    try {
      if (id) {
        await updateDoc(doc(db, "products", id), { title, desc, price, stock, image, badge });
      } else {
        const newDocRef = doc(collection(db, "products"));
        await setDoc(newDocRef, { title, desc, price, stock, image, badge, order: currentProductsList.length + 1 });
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

    if (products.length === 0) {
      container.innerHTML = "<p>No catalog items available right now.</p>";
      return;
    }

    products.forEach(p => {
      const card = document.createElement('div');
      card.className = "product-card";
      const isVideo = p.image && p.image.toLowerCase().endsWith('.mp4');

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

async function loadFrontendSettings() {
  try {
    const docSnap = await getDoc(doc(db, "settings", "general"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      cardPaymentLink = data.cardPaymentLink || "";
      storeEmail = data.email || "support@novucart.com";

      if (data.siteTitle && document.getElementById('site-title-tag')) document.getElementById('site-title-tag').textContent = data.siteTitle;
      if (data.announcement && document.getElementById('announcement-text')) document.getElementById('announcement-text').textContent = data.announcement;
      if (data.heroHeadline && document.getElementById('hero-headline-text')) document.getElementById('hero-headline-text').textContent = data.heroHeadline;
      if (data.whatsapp) {
        if (document.getElementById('header-contact-btn')) document.getElementById('header-contact-btn').href = data.whatsapp;
        if (document.getElementById('footer-whatsapp-link')) document.getElementById('footer-whatsapp-link').href = data.whatsapp;
      }
      if (data.email && document.getElementById('footer-email-text')) document.getElementById('footer-email-text').textContent = data.email;
      if (data.footerText && document.getElementById('footer-copyright-text')) document.getElementById('footer-copyright-text').textContent = data.footerText;
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
      const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

      let total = cart.reduce((acc, i) => acc + parseFloat(i.price), 0);
      let itemsListStr = cart.map(i => `- ${i.title} ($${i.price})`).join('\n');

      try {
        // Save order to Firebase
        await addDoc(collection(db, "orders"), {
          name, email, phone, address, altContact,
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
          // Pay on Delivery: Launch default mail client
          const subject = encodeURIComponent(`New Pay on Delivery Order from ${name}`);
          const body = encodeURIComponent(`Customer Order Details:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nDelivery Address: ${address}\nAlt Contact: ${altContact}\n\nItems Ordered:\n${itemsListStr}\n\nTotal Amount: $${total.toFixed(2)}`);
          
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

window.addToCart = (id, title, price, image) => {
  cart.push({ id, title, price, image });
  updateCartUI();
  if (document.getElementById('cart-drawer')) document.getElementById('cart-drawer').classList.add('open');
  if (document.getElementById('cart-overlay')) document.getElementById('cart-overlay').style.display = 'block';
};

function updateCartUI() {
  if (document.getElementById('cart-count')) document.getElementById('cart-count').textContent = cart.length;
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

  if (document.getElementById('cart-total-price')) document.getElementById('cart-total-price').textContent = `$${total.toFixed(2)}`;
}

window.removeFromCart = (idx) => {
  cart.splice(idx, 1);
  updateCartUI();
};

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
        <td><strong>${item.title}</strong><br><small style="color:#64748B;">${item.desc || 'No description'}</small></td>
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

  if (document.getElementById('modal-title')) document.getElementById('modal-title').textContent = "Edit Product";
  if (document.getElementById('modal-product-id')) document.getElementById('modal-product-id').value = product.id;
  if (document.getElementById('modal-product-title')) document.getElementById('modal-product-title').value = product.title || '';
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
      await setDoc(doc(db, "settings", "general"), {
        cardPaymentLink: document.getElementById('setting-card-payment-link').value,
        siteTitle: document.getElementById('setting-site-title').value,
        logoUrl: document.getElementById('setting-logo-url').value,
        announcement: document.getElementById('setting-announcement').value,
        heroHeadline: document.getElementById('setting-hero-headline').value,
        whatsapp: document.getElementById('setting-whatsapp').value,
        email: document.getElementById('setting-email').value,
        footerText: document.getElementById('setting-footer-text').value
      }, { merge: true });
      alert("Settings and Payment Link updated successfully!");
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
      if (document.getElementById('setting-logo-url')) document.getElementById('setting-logo-url').value = data.logoUrl || '';
      if (document.getElementById('setting-announcement')) document.getElementById('setting-announcement').value = data.announcement || '';
      if (document.getElementById('setting-hero-headline')) document.getElementById('setting-hero-headline').value = data.heroHeadline || '';
      if (document.getElementById('setting-whatsapp')) document.getElementById('setting-whatsapp').value = data.whatsapp || '';
      if (document.getElementById('setting-email')) document.getElementById('setting-email').value = data.email || '';
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
        <td>${o.paymentMethod || 'N/A'}</td>
        <td>$${o.total || '0.00'}</td>
      `;
      container.appendChild(tr);
    });
  } catch(e) {}
}
