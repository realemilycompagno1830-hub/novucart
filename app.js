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
      document.getElementById('login-error').textContent = "Invalid credentials. Try again.";
    }
  });
}

if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));

// PRODUCTS MANAGEMENT
const productModal = document.getElementById('product-modal');
if (document.getElementById('open-product-modal-btn')) {
  document.getElementById('open-product-modal-btn').addEventListener('click', () => {
    document.getElementById('modal-product-id').value = "";
    document.getElementById('product-form').reset();
    productModal.style.display = 'flex';
  });
}

if (document.getElementById('close-product-modal-btn')) {
  document.getElementById('close-product-modal-btn').addEventListener('click', () => productModal.style.display = 'none');
}

// SAVE SITE SETTINGS & TEXT CUSTOMIZER
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
      alert("Site settings saved successfully!");
    } catch (err) { alert("Failed to save settings."); }
  });
}

// PROMO AD BANNER MANAGER
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
