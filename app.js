import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Config (Updated API Key)
const firebaseConfig = {
  apiKey: "AIzaSyCvwAg_i3wnfrKdbegLLh7-tPJE44COYoI",
  authDomain: "novucart-5d9a3.firebaseapp.com",
  projectId: "novucart-5d9a3",
  storageBucket: "novucart-5d9a3.firebasestorage.app",
  messagingSenderId: "804299070006",
  appId: "1:804299070006:web:4424945e4684cdb0d29697",
  measurementId: "G-930DM2B0V0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global State
let cart = [];
let siteSettings = {};

const DEFAULT_LOGO = "https://googleusercontent.com/image_generation_content/416";

// Keyboard shortcut (Ctrl + Shift + A) to access Admin login
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
    e.preventDefault();
    window.location.href = 'admin.html';
  }
});

// STOREFRONT LOGIC
if (document.getElementById('catalog')) {
  
  // Load Dynamic Site Settings
  onSnapshot(doc(db, "settings", "global"), (docSnap) => {
    if (docSnap.exists()) {
      siteSettings = docSnap.data();
      applySettingsToUI(siteSettings);
    }
  });

  // Load Product Catalog
  onSnapshot(collection(db, "products"), (snapshot) => {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    if (snapshot.empty) {
      grid.innerHTML = '<p class="empty-msg">No products added yet. Add them in your admin dashboard!</p>';
      return;
    }

    snapshot.forEach((docItem) => {
      const p = { id: docItem.id, ...docItem.data() };
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${p.imageUrl}" alt="${p.title}" class="product-image">
        <div class="product-info">
          ${p.stockTag ? `<span class="stock-tag">${p.stockTag}</span>` : ''}
          <h3 class="product-title">${p.title}</h3>
          <div class="product-price">$${parseFloat(p.price).toFixed(2)}</div>
          <div class="quantity-picker">
            <label>Qty:</label>
            <button onclick="adjustQty('${p.id}', -1)">-</button>
            <span id="qty-${p.id}">1</span>
            <button onclick="adjustQty('${p.id}', 1)">+</button>
          </div>
          <button class="btn btn-gold btn-block" onclick="addToCart('${p.id}', '${p.title}', ${p.price})">
            Add to Bag
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  });

  setupCartLogic();
}

function applySettingsToUI(s) {
  if (s.siteTitle) document.title = s.siteTitle;
  
  const navImg = document.getElementById('navLogoImg');
  const footerImg = document.getElementById('footerLogoImg');
  const logoSrc = s.logoUrl || DEFAULT_LOGO;

  if (navImg) navImg.src = logoSrc;
  if (footerImg) footerImg.src = logoSrc;

  if (s.announcement) document.getElementById('announcementText').innerHTML = `<i class="fa-solid fa-bullhorn"></i> ${s.announcement}`;
  if (s.heroHeadline) document.getElementById('heroHeadline').innerText = s.heroHeadline;
  if (s.heroSubtitle) document.getElementById('heroSubtitle').innerText = s.heroSubtitle;
  if (s.heroCta) document.getElementById('heroCtaBtn').innerText = s.heroCta;
  
  if (s.whatsappLink) {
    const topWa = document.getElementById('topWhatsappLink');
    const footWa = document.getElementById('footerWhatsappLink');
    if (topWa) topWa.href = s.whatsappLink;
    if (footWa) footWa.href = s.whatsappLink;
  }

  if (s.contactEmail) {
    const topEmail = document.getElementById('topEmailLink');
    const footEmail = document.getElementById('footerEmailLink');
    const topEmailTxt = document.getElementById('topEmailText');
    const footEmailTxt = document.getElementById('footerEmailText');

    if (topEmail) topEmail.href = `mailto:${s.contactEmail}`;
    if (footEmail) footEmail.href = `mailto:${s.contactEmail}`;
    if (topEmailTxt) topEmailTxt.innerText = s.contactEmail;
    if (footEmailTxt) footEmailTxt.innerText = s.contactEmail;
  }

  if (s.cardRedirectUrl) {
    const cardLink = document.getElementById('payViaCardRedirectLink');
    if (cardLink) cardLink.href = s.cardRedirectUrl;
  }

  if (s.footerCopyright) {
    document.getElementById('copyrightText').innerText = s.footerCopyright;
  }
}

window.adjustQty = (id, delta) => {
  const el = document.getElementById(`qty-${id}`);
  let current = parseInt(el.innerText);
  current = Math.max(1, current + delta);
  el.innerText = current;
};

window.addToCart = (id, title, price) => {
  const qtyEl = document.getElementById(`qty-${id}`);
  const qty = parseInt(qtyEl ? qtyEl.innerText : 1);
  
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ id, title, price, quantity: qty });
  }

  updateCartUI();
  document.getElementById('cartOverlay').classList.add('active');
};

function setupCartLogic() {
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartOverlay = document.getElementById('cartOverlay');
  const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');

  openCartBtn.addEventListener('click', () => cartOverlay.classList.add('active'));
  closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('active'));

  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckoutModal = document.getElementById('closeCheckoutModal');
  const selectPodBtn = document.getElementById('selectPayOnDeliveryBtn');
  const podModal = document.getElementById('podFormModal');
  const closePodModal = document.getElementById('closePodFormModal');

  proceedCheckoutBtn.addEventListener('click', () => {
    cartOverlay.classList.remove('active');
    checkoutModal.classList.add('active');
  });

  closeCheckoutModal.addEventListener('click', () => checkoutModal.classList.remove('active'));

  selectPodBtn.addEventListener('click', () => {
    checkoutModal.classList.remove('active');
    renderPodOrderSummary();
    podModal.classList.add('active');
  });

  closePodModal.addEventListener('click', () => podModal.classList.remove('active'));

  document.getElementById('podSubmitForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const email = document.getElementById('custEmail').value;
    const address = document.getElementById('custAddress').value;
    const promoCode = document.getElementById('custPromoCode').value || "None";

    const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {
      customerName: name,
      phone: phone,
      email: email,
      address: address,
      promoCode: promoCode,
      items: cart,
      totalAmount: orderTotal,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "orders"), orderData);

      const recipient = siteSettings.contactEmail || "buycheapcarsonline@gmail.com";
      const subject = encodeURIComponent(`Novucart Order - ${name}`);
      
      let itemDetails = cart.map(i => `- ${i.title} (x${i.quantity}) @ $${i.price}`).join('\n');
      
      const bodyText = `NOVUCART ORDER DETAILS:\n` +
        `-------------------------\n` +
        `Customer Name: ${name}\n` +
        `Phone Number: ${phone}\n` +
        `Email: ${email}\n` +
        `Delivery Address: ${address}\n` +
        `Promo / Referral Code: ${promoCode}\n\n` +
        `ITEMS ORDERED:\n${itemDetails}\n\n` +
        `TOTAL AMOUNT: $${orderTotal.toFixed(2)}`;

      const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;

      cart = [];
      updateCartUI();
      podModal.classList.remove('active');
      
      window.location.href = mailtoUrl;

    } catch (err) {
      alert("Error saving order: " + err.message);
    }
  });
}

function updateCartUI() {
  const badge = document.getElementById('cartCount');
  const itemsContainer = document.getElementById('cartItemsList');
  const totalDisplay = document.getElementById('cartTotalDisplay');
  const proceedBtn = document.getElementById('proceedCheckoutBtn');

  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  badge.innerText = totalQty;
  totalDisplay.innerText = `$${totalPrice.toFixed(2)}`;

  if (cart.length === 0) {
    itemsContainer.innerHTML = '<p class="empty-cart-msg">Your bag is empty.</p>';
    proceedBtn.disabled = true;
    return;
  }

  proceedBtn.disabled = false;
  itemsContainer.innerHTML = cart.map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <div>
        <strong>${item.title}</strong><br>
        <small>$${item.price} x ${item.quantity}</small>
      </div>
      <span>$${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');
}

function renderPodOrderSummary() {
  const summaryBox = document.getElementById('podOrderSummary');
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  summaryBox.innerHTML = `
    <h4>Order Summary</h4>
    <p>${cart.length} item(s) selected.</p>
    <strong>Total Due: $${totalPrice.toFixed(2)}</strong>
  `;
}

// ADMIN DASHBOARD LOGIC
if (document.getElementById('adminAuthContainer')) {
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      document.getElementById('adminAuthContainer').classList.add('hidden');
      document.getElementById('adminDashboard').classList.remove('hidden');
      initAdminPanel();
    } else {
      document.getElementById('adminAuthContainer').classList.remove('hidden');
      document.getElementById('adminDashboard').classList.add('hidden');
    }
  });

  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPassword').value;
    const errEl = document.getElementById('loginErrorMsg');
    
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      errEl.innerText = "Invalid credentials or account issue. Check Firebase Auth.";
    }
  });

  document.getElementById('adminLogoutBtn').addEventListener('click', () => signOut(auth));
}

function initAdminPanel() {
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  loadAdminProducts();
  loadAdminSettings();
  loadAdminOrders();
}

function loadAdminProducts() {
  onSnapshot(collection(db, "products"), (snapshot) => {
    const tbody = document.getElementById('adminProductTableBody');
    tbody.innerHTML = '';
    snapshot.forEach((docItem) => {
      const p = { id: docItem.id, ...docItem.data() };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${p.imageUrl}" width="40" height="40" style="object-fit:cover; border-radius:4px;"></td>
        <td>${p.title}</td>
        <td>$${p.price}</td>
        <td>${p.stockTag || '-'}</td>
        <td>
          <button onclick="deleteProduct('${p.id}')" style="color:#ef4444; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i> Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });

  const prodModal = document.getElementById('productModal');
  document.getElementById('openAddProductModal').onclick = () => prodModal.classList.add('active');
  document.getElementById('closeProductModal').onclick = () => prodModal.classList.remove('active');

  document.getElementById('productForm').onsubmit = async (e) => {
    e.preventDefault();
    const newProd = {
      title: document.getElementById('prodTitle').value,
      price: parseFloat(document.getElementById('prodPrice').value),
      imageUrl: document.getElementById('prodImageUrl').value,
      stockTag: document.getElementById('prodStockTag').value
    };
    await addDoc(collection(db, "products"), newProd);
    prodModal.classList.remove('active');
  };
}

window.deleteProduct = async (id) => {
  if (confirm("Are you sure you want to delete this product?")) {
    await deleteDoc(doc(db, "products", id));
  }
};

function loadAdminSettings() {
  const settingsDocRef = doc(db, "settings", "global");
  
  getDoc(settingsDocRef).then((docSnap) => {
    if (docSnap.exists()) {
      const s = docSnap.data();
      document.getElementById('setSiteTitle').value = s.siteTitle || 'Novucart | Exclusive Marketplace';
      document.getElementById('setLogoUrl').value = s.logoUrl || DEFAULT_LOGO;
      document.getElementById('setAnnouncement').value = s.announcement || '';
      document.getElementById('setHeroHeadline').value = s.heroHeadline || '';
      document.getElementById('setHeroSubtitle').value = s.heroSubtitle || '';
      document.getElementById('setHeroCta').value = s.heroCta || '';
      document.getElementById('setWhatsappLink').value = s.whatsappLink || '';
      document.getElementById('setContactEmail').value = s.contactEmail || 'buycheapcarsonline@gmail.com';
      document.getElementById('setCardRedirectUrl').value = s.cardRedirectUrl || '';
      document.getElementById('setFooterCopyright').value = s.footerCopyright || '';
    }
  });

  document.getElementById('siteSettingsForm').onsubmit = async (e) => {
    e.preventDefault();
    const updatedSettings = {
      siteTitle: document.getElementById('setSiteTitle').value,
      logoUrl: document.getElementById('setLogoUrl').value,
      announcement: document.getElementById('setAnnouncement').value,
      heroHeadline: document.getElementById('setHeroHeadline').value,
      heroSubtitle: document.getElementById('setHeroSubtitle').value,
      heroCta: document.getElementById('setHeroCta').value,
      whatsappLink: document.getElementById('setWhatsappLink').value,
      contactEmail: document.getElementById('setContactEmail').value,
      cardRedirectUrl: document.getElementById('setCardRedirectUrl').value,
      footerCopyright: document.getElementById('setFooterCopyright').value
    };

    await setDoc(settingsDocRef, updatedSettings);
    document.getElementById('settingsSaveStatus').innerText = "Settings updated live!";
    setTimeout(() => document.getElementById('settingsSaveStatus').innerText = "", 3000);
  };
}

function loadAdminOrders() {
  onSnapshot(collection(db, "orders"), (snapshot) => {
    const tbody = document.getElementById('adminOrdersTableBody');
    tbody.innerHTML = '';
    snapshot.forEach((docItem) => {
      const o = docItem.data();
      const dateStr = new Date(o.createdAt).toLocaleDateString();
      const cleanPhone = o.phone.replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${cleanPhone}`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dateStr}</td>
        <td><strong>${o.customerName}</strong></td>
        <td>${o.phone}</td>
        <td>${o.email}<br><small>${o.address}</small></td>
        <td><span style="color:#D4AF37; font-weight:bold;">${o.promoCode}</span></td>
        <td>$${o.totalAmount.toFixed(2)} (${o.items.length} items)</td>
        <td>
          <a href="${waUrl}" target="_blank" class="btn btn-gold" style="padding:4px 8px; font-size:0.75rem;">
            <i class="fa-brands fa-whatsapp"></i> Chat
          </a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}
