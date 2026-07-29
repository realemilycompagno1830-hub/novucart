// FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCvwAg_i3wnfrKdbegLLh7-tPJE44COYoI",
  authDomain: "novucart-5d9a3.firebaseapp.com",
  projectId: "novucart-5d9a3",
  storageBucket: "novucart-5d9a3.appspot.com",
  messagingSenderId: "102938475610",
  appId: "1:102938475610:web:abc123def456"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth ? firebase.auth() : null;

let globalCheckoutUrl = "#";

// STOREFRONT LOGIC
function initStorefront() {
  loadSiteSettings();
  loadPublicProducts();
}

function loadSiteSettings() {
  db.collection('settings').doc('site').get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (data.siteTitle) {
        document.getElementById('pageTitle').innerText = data.siteTitle;
        document.getElementById('siteLogo').innerText = data.siteTitle;
      }
      if (data.announcement) document.getElementById('topAnnouncement').innerText = data.announcement;
      if (data.heroTitle) document.getElementById('heroHeadline').innerText = data.heroTitle;
      if (data.cardPaymentUrl) globalCheckoutUrl = data.cardPaymentUrl;

      if (data.whatsapp) {
        const waLink = document.getElementById('whatsappLink');
        waLink.href = data.whatsapp;
        waLink.style.display = 'inline';
      }

      // Banner Logic
      if (data.bannerEnabled) {
        document.getElementById('bannerTitleText').innerText = data.bannerTitle || "Special Offer";
        document.getElementById('bannerDescText').innerText = data.bannerDesc || "";
        const bBtn = document.getElementById('bannerBtnLink');
        bBtn.innerText = data.bannerBtnText || "Learn More";
        bBtn.href = data.bannerLink || "#";
        document.getElementById('promoBanner').style.display = 'block';
      }
    }
  });
}

function loadPublicProducts() {
  const grid = document.getElementById('publicProductGrid');
  db.collection('products').get().then(snapshot => {
    if (snapshot.empty) {
      grid.innerHTML = '<p style="text-align:center; color:#86868b; grid-column:1/-1;">No products available.</p>';
      return;
    }
    grid.innerHTML = '';
    snapshot.forEach(doc => {
      const p = doc.data();
      grid.innerHTML += `
        <div class="product-card">
          <div>
            <img src="${p.image || 'https://via.placeholder.com/300'}" class="product-image" alt="${p.title}">
            <div class="product-title">${p.title}</div>
            <div class="product-desc">${p.description || ''}</div>
            <div class="product-price">$${parseFloat(p.price).toFixed(2)}</div>
          </div>
          <div>
            <a href="${globalCheckoutUrl}" target="_blank" style="text-decoration:none;">
              <button class="btn-primary">Pay with Card</button>
            </a>
            <button class="btn-secondary" onclick="openPodModal('${p.title}', '${p.price}')">Pay on Delivery</button>
          </div>
        </div>
      `;
    });
  });
}

// MODAL CONTROLS
function openPodModal(title, price) {
  document.getElementById('podItemTitle').value = title;
  document.getElementById('podItemPrice').value = price;
  document.getElementById('podModal').style.display = 'flex';
}

function closePodModal() {
  document.getElementById('podModal').style.display = 'none';
}

function closeBanner() {
  document.getElementById('promoBanner').style.display = 'none';
}

function handlePodSubmit(e) {
  e.preventDefault();
  const order = {
    item: document.getElementById('podItemTitle').value,
    price: document.getElementById('podItemPrice').value,
    name: document.getElementById('custName').value,
    phone: document.getElementById('custPhone').value,
    address: document.getElementById('custAddress').value,
    createdAt: new Date().toISOString()
  };

  db.collection('orders').add(order).then(() => {
    alert('Thank you! Your Pay-on-Delivery order has been placed.');
    closePodModal();
    document.getElementById('podForm').reset();
  });
}

// ADMIN PANEL LOGIC
function initAdminPanel() {
  if (!auth) return;
  auth.onAuthStateChanged(user => {
    if (user) {
      document.getElementById('loginSection').style.display = 'none';
      document.getElementById('dashboardSection').style.display = 'block';
      loadAdminProducts();
      loadAdminSettings();
      loadAdminOrders();
    } else {
      document.getElementById('loginSection').style.display = 'block';
      document.getElementById('dashboardSection').style.display = 'none';
    }
  });
}

function attemptLogin() {
  const email = document.getElementById('adminEmail').value;
  const pass = document.getElementById('adminPassword').value;
  auth.signInWithEmailAndPassword(email, pass).catch(err => alert("Login Error: " + err.message));
}

function logout() {
  auth.signOut();
}

function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
}

function loadAdminProducts() {
  const tbody = document.getElementById('adminProductTable');
  db.collection('products').get().then(snapshot => {
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No products found.</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    snapshot.forEach(doc => {
      const p = doc.data();
      tbody.innerHTML += `
        <tr>
          <td><strong>${p.title}</strong></td>
          <td>$${parseFloat(p.price).toFixed(2)}</td>
          <td>${p.stock || 0}</td>
          <td><button onclick="deleteProduct('${doc.id}')" style="color:red; background:none; border:none; cursor:pointer;">Delete</button></td>
        </tr>
      `;
    });
  });
}

function saveProduct() {
  const title = document.getElementById('pTitle').value;
  const price = document.getElementById('pPrice').value;
  const stock = document.getElementById('pStock').value;
  const image = document.getElementById('pImage').value;
  const video = document.getElementById('pVideo').value;
  const description = document.getElementById('pDesc').value;

  if (!title || !price) { alert("Title and Price are required."); return; }

  db.collection('products').add({
    title, price: parseFloat(price), stock: parseInt(stock) || 0, image, video, description, createdAt: new Date().toISOString()
  }).then(() => {
    document.getElementById('productForm').reset();
    loadAdminProducts();
    alert("Product saved!");
  });
}

function deleteProduct(id) {
  db.collection('products').doc(id).delete().then(() => loadAdminProducts());
}

function loadAdminSettings() {
  db.collection('settings').doc('site').get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      document.getElementById('cfgSiteTitle').value = data.siteTitle || "";
      document.getElementById('cfgAnnouncement').value = data.announcement || "";
      document.getElementById('cfgHero').value = data.heroTitle || "";
      document.getElementById('cfgCardUrl').value = data.cardPaymentUrl || "";
      document.getElementById('cfgStoreEmail').value = data.storeEmail || "buycheapcarsonline@gmail.com";
      document.getElementById('cfgWhatsapp').value = data.whatsapp || "";

      document.getElementById('cfgBannerEnabled').checked = data.bannerEnabled || false;
      document.getElementById('cfgBannerTitle').value = data.bannerTitle || "";
      document.getElementById('cfgBannerDesc').value = data.bannerDesc || "";
      document.getElementById('cfgBannerBtnText').value = data.bannerBtnText || "";
      document.getElementById('cfgBannerLink').value = data.bannerLink || "";
    }
  });
}

function saveStoreSettings() {
  const data = {
    siteTitle: document.getElementById('cfgSiteTitle').value,
    announcement: document.getElementById('cfgAnnouncement').value,
    heroTitle: document.getElementById('cfgHero').value,
    cardPaymentUrl: document.getElementById('cfgCardUrl').value,
    storeEmail: document.getElementById('cfgStoreEmail').value,
    whatsapp: document.getElementById('cfgWhatsapp').value,
    bannerEnabled: document.getElementById('cfgBannerEnabled').checked,
    bannerTitle: document.getElementById('cfgBannerTitle').value,
    bannerDesc: document.getElementById('cfgBannerDesc').value,
    bannerBtnText: document.getElementById('cfgBannerBtnText').value,
    bannerLink: document.getElementById('cfgBannerLink').value
  };

  db.collection('settings').doc('site').set(data, { merge: true }).then(() => alert("Settings saved successfully!"));
}

function loadAdminOrders() {
  const tbody = document.getElementById('adminOrdersTable');
  db.collection('orders').get().then(snapshot => {
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No orders placed yet.</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    snapshot.forEach(doc => {
      const o = doc.data();
      tbody.innerHTML += `
        <tr>
          <td><strong>${o.name}</strong></td>
          <td>${o.phone}</td>
          <td>${o.item} ($${o.price})</td>
          <td>${o.address}</td>
        </tr>
      `;
    });
  });
}
