// --- STATE MANAGEMENT ---
let cart = JSON.parse(localStorage.getItem('novucart_cart')) || [];
let products = JSON.parse(localStorage.getItem('novucart_products')) || [
  {
    id: 'prod_1',
    title: 'HP Gaming Monitor',
    price: 100.00,
    stock: 100,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    description: 'High quality item available for immediate order.'
  }
];

// Load Admin Settings
function getSettings() {
  return JSON.parse(localStorage.getItem('novucart_settings')) || {
    siteTitle: 'Novucart',
    announcement: '📢 Welcome to Novucart — Premium Deals Delivered Worldwide!',
    heroTitle: 'Discover Extraordinary Products',
    heroSub: 'Shop curated selections at unbeatable prices on Novucart.',
    cardPaymentUrl: '',
    storeEmail: 'buycheapcarsonline@gmail.com',
    whatsapp: 'https://wa.me/',
    footerText: '© 2026 Novucart Marketplace. All rights reserved.'
  };
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  renderStorefront();
  updateCartUI();
});

function renderStorefront() {
  const settings = getSettings();
  
  // Apply Dynamic Settings
  const brandEl = document.getElementById('brandName');
  if(brandEl) brandEl.textContent = settings.siteTitle || 'Novucart';
  
  const annEl = document.getElementById('announcementBar');
  if(annEl) annEl.textContent = settings.announcement;

  const grid = document.getElementById('productGrid');
  if(!grid) return;

  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.title}" class="product-media">
      <h3>${p.title}</h3>
      <span class="stock-tag">${p.stock} in stock</span>
      <p>${p.description}</p>
      <div class="price">$${parseFloat(p.price).toFixed(2)}</div>
      <button class="btn btn-primary btn-block" onclick="addToCart('${p.id}')">Add to Bag</button>
    </div>
  `).join('');
}

// --- CART FUNCTIONS ---
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if(!product) return;

  const existingItem = cart.find(item => item.id === productId);
  if(existingItem) {
    existingItem.quantity += 1; // Allows adding as many times as requested
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  updateCartUI();
  openCartDrawer();
}

function updateCartQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if(!item) return;

  item.quantity += delta;
  if(item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('novucart_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const countEls = document.querySelectorAll('.cart-count-badge');
  const totalCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  countEls.forEach(el => el.textContent = totalCount);

  const cartList = document.getElementById('cartItemsList');
  const cartTotalEl = document.getElementById('cartTotalAmount');

  if(cartList) {
    if(cart.length === 0) {
      cartList.innerHTML = '<p style="text-align:center; padding: 20px; color: #64748B;">Your bag is empty.</p>';
    } else {
      cartList.innerHTML = cart.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #E2E8F0;">
          <div>
            <strong style="display:block; font-size:0.9rem;">${item.title}</strong>
            <span style="font-size:0.8rem; color:#64748B;">$${parseFloat(item.price).toFixed(2)} x ${item.quantity}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button onclick="updateCartQuantity('${item.id}', -1)" style="padding: 2px 8px;">-</button>
            <span>${item.quantity}</span>
            <button onclick="updateCartQuantity('${item.id}', 1)" style="padding: 2px 8px;">+</button>
          </div>
        </div>
      `).join('');
    }
  }

  if(cartTotalEl) {
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    cartTotalEl.textContent = `$${total.toFixed(2)}`;
  }
}

function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if(drawer) drawer.classList.add('open');
  if(overlay) overlay.style.display = 'block';
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if(drawer) drawer.classList.remove('open');
  if(overlay) overlay.style.display = 'none';
}

// --- CHECKOUT LOGIC ---
function handlePayOnDelivery() {
  if(cart.length === 0) {
    alert('Your bag is empty!');
    return;
  }

  const settings = getSettings();
  const recipientEmail = settings.storeEmail || 'buycheapcarsonline@gmail.com';
  
  const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  let orderSummary = "NEW ORDER REQUEST (Pay on Delivery)\n\n";
  orderSummary += "Items Ordered:\n";
  
  cart.forEach(item => {
    orderSummary += `- ${item.title} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
  });
  
  orderSummary += `\nTotal Amount: $${total.toFixed(2)}\n\n`;
  orderSummary += "Please provide delivery details:\nName:\nPhone:\nAddress:\nCity:";

  const subject = encodeURIComponent(`Pay on Delivery Order - $${total.toFixed(2)}`);
  const body = encodeURIComponent(orderSummary);

  // Directly launches the default mail client without notification prompts
  window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
}

function handleCardPayment() {
  if(cart.length === 0) {
    alert('Your bag is empty!');
    return;
  }
  const settings = getSettings();
  if(settings.cardPaymentUrl && settings.cardPaymentUrl.trim() !== '') {
    window.location.href = settings.cardPaymentUrl;
  } else {
    alert('Card payment system is under maintenance. Please choose Pay on Delivery.');
  }
}
