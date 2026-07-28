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
  doc, 
  deleteDoc, 
  getDoc, 
  setDoc,
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
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

// ==========================================
// 2. AUTHENTICATION (ADMIN LOGIN & LOGOUT)
// ==========================================
const loginForm = document.getElementById('admin-login-form');
const logoutBtn = document.getElementById('logout-btn');
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginError = document.getElementById('login-error');

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
// 3. PRODUCT MANAGEMENT (ADD / EDIT / REORDER)
// ==========================================
const productModal = document.getElementById('product-modal');
const openModalBtn = document.getElementById('open-product-modal-btn');
const closeModalBtn = document.getElementById('close-product-modal-btn');
const productForm = document.getElementById('product-form');

// Open Modal for New Product
if (openModalBtn) {
  openModalBtn.addEventListener('click', () => {
    document.getElementById('modal-title').textContent = "Add New Product";
    document.getElementById('modal-product-id').value = "";
    productForm.reset();
    productModal.style.display = 'flex';
  });
}

// Close Modal
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    productModal.style.display = 'none';
  });
}

// Add or Update Product
if (productForm) {
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('modal-product-id').value;
    const title = document.getElementById('modal-product-title').value.trim();
    const price = parseFloat(document.getElementById('modal-product-price').value);
    const image = document.getElementById('modal-product-image').value.trim();
    const badge = document.getElementById('modal-product-badge').value.trim() || 'In Stock';

    try {
      if (id) {
        // Edit existing product
        await updateDoc(doc(db, "products", id), { title, price, image, badge });
      } else {
        // Add new product with high order number so it displays last by default
        const newDocRef = doc(collection(db, "products"));
        await setDoc(newDocRef, {
          title,
          price,
          image,
          badge,
          order: currentProductsList.length + 1
        });
      }
      
      productModal.style.display = 'none';
      productForm.reset();
      loadAdminProducts();
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Failed to save product.");
    }
  });
}

// Load Products Table
async function loadAdminProducts() {
  const listContainer = document.getElementById('admin-product-list');
  if (!listContainer) return;

  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    listContainer.innerHTML = "";
    currentProductsList = [];

    querySnapshot.forEach((docSnap) => {
      currentProductsList.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort products by order number
    currentProductsList.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (currentProductsList.length === 0) {
      listContainer.innerHTML = `<tr><td colspan="6" class="text-secondary">No products found. Add your first item!</td></tr>`;
      return;
    }

    currentProductsList.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <button class="btn btn-outline" style="padding: 2px 8px;" onclick="moveProduct('${item.id}', 'up')" ${index === 0 ? 'disabled' : ''}>▲</button>
          <button class="btn btn-outline" style="padding: 2px 8px;" onclick="moveProduct('${item.id}', 'down')" ${index === currentProductsList.length - 1 ? 'disabled' : ''}>▼</button>
        </td>
        <td><img src="${item.image || 'https://via.placeholder.com/50'}" width="40" height="40" style="object-fit:cover; border-radius:6px;"></td>
        <td><strong>${item.title || 'Untitled'}</strong></td>
        <td>$${item.price ? item.price.toFixed(2) : '0.00'}</td>
        <td><span class="stock-tag">${item.badge || 'In Stock'}</span></td>
        <td>
          <button class="btn btn-outline" style="padding:4px 10px; font-size:0.8rem; margin-right: 4px;" onclick="editProduct('${item.id}')">Edit</button>
          <button class="btn btn-outline" style="padding:4px 10px; font-size:0.8rem; color:red;" onclick="deleteProduct('${item.id}')">Delete</button>
        </td>
      `;
      listContainer.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// Open Edit Modal with Pre-filled Data
window.editProduct = (id) => {
  const product = currentProductsList.find(p => p.id === id);
  if (!product) return;

  document.getElementById('modal-title').textContent = "Edit Product";
  document.getElementById('modal-product-id').value = product.id;
  document.getElementById('modal-product-title').value = product.title || '';
  document.getElementById('modal-product-price').value = product.price || '';
  document.getElementById('modal-product-image').value = product.image || '';
  document.getElementById('modal-product-badge').value = product.badge || '';

  productModal.style.display = 'flex';
};

// Reorder Product (Up or Down)
window.moveProduct = async (id, direction) => {
  const index = currentProductsList.findIndex(p => p.id === id);
  if (index === -1) return;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= currentProductsList.length) return;

  // Swap order numbers
  const itemA = currentProductsList[index];
  const itemB = currentProductsList[targetIndex];

  try {
    await updateDoc(doc(db, "products", itemA.id), { order: targetIndex + 1 });
    await updateDoc(doc(db, "products", itemB.id), { order: index + 1 });
    loadAdminProducts();
  } catch (err) {
    console.error("Reorder Error:", err);
  }
};

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

// ==========================================
// 4. ORDERS & SITE SETTINGS
// ==========================================
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
