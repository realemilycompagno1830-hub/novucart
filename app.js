import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  deleteDoc, 
  getDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyD-YOUR_ACTUAL_KEY_HERE", // Replace with full key if needed
  authDomain: "novucart.firebaseapp.com",
  projectId: "novucart",
  storageBucket: "novucart.appspot.com",
  messagingSenderId: "102938475610",
  appId: "1:102938475610:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 2. AUTHENTICATION (ADMIN LOGIN & LOGOUT)
// ==========================================
const loginForm = document.getElementById('admin-login-form');
const logoutBtn = document.getElementById('logout-btn');
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginError = document.getElementById('login-error');

// Monitor Login State
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    loadAdminProducts();
    loadAdminOrders();
    loadSiteSettings();
  } else {
    if (loginSection) loginSection.style.display = 'flex';
    if (dashboardSection) dashboardSection.style.display = 'none';
  }
});

// Handle Login Form Submission
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (loginError) loginError.textContent = '';

    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value.trim();

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login Failed:", error.message);
      if (loginError) {
        loginError.textContent = "Invalid email or password. Please try again.";
      }
    }
  });
}

// Handle Logout Button
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  });
}

// ==========================================
// 3. ADMIN DASHBOARD FUNCTIONS
// ==========================================

// Load Product List into Admin Table
async function loadAdminProducts() {
  const listContainer = document.getElementById('admin-product-list');
  if (!listContainer) return;

  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    listContainer.innerHTML = "";

    if (querySnapshot.empty) {
      listContainer.innerHTML = `<tr><td colspan="5" class="text-secondary">No products found. Add your first item!</td></tr>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${data.image || 'https://via.placeholder.com/50'}" width="40" height="40" style="object-fit:cover; border-radius:6px;"></td>
        <td><strong>${data.title || 'Untitled Product'}</strong></td>
        <td>$${data.price || '0.00'}</td>
        <td><span class="stock-tag">${data.badge || 'In Stock'}</span></td>
        <td>
          <button class="btn btn-outline" style="padding:4px 10px; font-size:0.8rem;" onclick="deleteProduct('${docSnap.id}')">Delete</button>
        </td>
      `;
      listContainer.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// Delete Product
window.deleteProduct = async (id) => {
  if (confirm("Are you sure you want to delete this product?")) {
    try {
      await deleteDoc(doc(db, "products", id));
      loadAdminProducts();
    } catch (err) {
      console.error("Delete Error:", err);
    }
  }
};

// Load Customer Orders
async function loadAdminOrders() {
  const ordersContainer = document.getElementById('admin-orders-list');
  if (!ordersContainer) return;

  try {
    const querySnapshot = await getDocs(collection(db, "orders"));
    ordersContainer.innerHTML = "";

    if (querySnapshot.empty) {
      ordersContainer.innerHTML = `<tr><td colspan="7" class="text-secondary">No customer orders placed yet.</td></tr>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const order = docSnap.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${order.date || 'N/A'}</td>
        <td><strong>${order.name || 'N/A'}</strong></td>
        <td>${order.phone || 'N/A'}</td>
        <td>${order.address || 'N/A'}</td>
        <td>${order.promo || 'None'}</td>
        <td>$${order.total || '0.00'}</td>
        <td><button class="btn btn-outline" style="padding:4px 10px; font-size:0.8rem;">View</button></td>
      `;
      ordersContainer.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading orders:", err);
  }
}

// Load Site Customizer Settings
async function loadSiteSettings() {
  const settingsForm = document.getElementById('site-settings-form');
  if (!settingsForm) return;

  try {
    const docRef = doc(db, "settings", "general");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (document.getElementById('setting-site-title')) document.getElementById('setting-site-title').value = data.siteTitle || '';
      if (document.getElementById('setting-logo-url')) document.getElementById('setting-logo-url').value = data.logoUrl || '';
      if (document.getElementById('setting-announcement')) document.getElementById('setting-announcement').value = data.announcement || '';
      if (document.getElementById('setting-hero-headline')) document.getElementById('setting-hero-headline').value = data.heroHeadline || '';
      if (document.getElementById('setting-whatsapp')) document.getElementById('setting-whatsapp').value = data.whatsapp || '';
      if (document.getElementById('setting-email')) document.getElementById('setting-email').value = data.email || '';
      if (document.getElementById('setting-footer-text')) document.getElementById('setting-footer-text').value = data.footerText || '';
    }
  } catch (err) {
    console.error("Error loading settings:", err);
  }
}

// Save Site Settings
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
        whatsapp: document.getElementById('setting-whatsapp').value,
        email: document.getElementById('setting-email').value,
        footerText: document.getElementById('setting-footer-text').value,
      }, { merge: true });

      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Failed to save settings.");
    }
  });
}
