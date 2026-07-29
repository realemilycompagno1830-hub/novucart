// Default Configuration Schema
const defaultConfig = {
  announcementText: "Free Express Delivery on Luxury Orders Over $200",
  brandName: "Novucart",
  brandLogoUrl: "",
  headerContactText: "Contact Us",
  whatsappNumber: "+1234567890",
  
  heroHeadline: "Welcome to Novucart",
  heroSubtext: "Home of Luxury",
  heroBtnText: "Explore Catalog",
  heroSlides: [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=80"
  ],

  products: [
    { id: "1", name: "Executive Luxury Watch", price: "450", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80", desc: "Handcrafted automatic timepiece." },
    { id: "2", name: "Designer Sunglasses", price: "180", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80", desc: "UV400 polarized luxury eyewear." }
  ],

  footerBrandTitle: "Novucart",
  footerBrandDesc: "Your ultimate destination for luxury items and exclusive deals.",
  footerEmail: "support@novucart.com",
  footerCopyright: "© 2026 Novucart. All rights reserved.",

  promoAdEnabled: true,
  promoAdHeading: "Special Promotional Offer!",
  promoAdImg: "",
  promoAdBody: "Get up to 20% off on exclusive selected luxury goods today.",
  promoAdBtnText: "Claim Offer",
  promoAdBtnLink: "#catalog"
};

// Retrieve Saved State
let siteConfig = JSON.parse(localStorage.getItem('novucart_site_config')) || defaultConfig;

document.addEventListener('DOMContentLoaded', () => {
  // IF ON MAIN STOREFRONT (index.html)
  if (document.getElementById('frontend-product-list')) {
    renderStorefront();
  }

  // IF ON ADMIN PANEL (admin.html)
  if (document.getElementById('save-all-changes-btn')) {
    initAdminPanel();
  }
});

/* --- STOREFRONT ENGINE --- */
function renderStorefront() {
  if (siteConfig.announcementText) document.getElementById('announcement-text').innerText = siteConfig.announcementText;
  if (siteConfig.brandName) document.getElementById('logo-text').innerText = siteConfig.brandName;
  if (siteConfig.brandLogoUrl) {
    const logoImg = document.getElementById('logo-img');
    logoImg.src = siteConfig.brandLogoUrl;
    logoImg.style.display = 'block';
  }
  if (siteConfig.headerContactText) document.getElementById('header-contact-text').innerText = siteConfig.headerContactText;
  if (siteConfig.whatsappNumber) {
    const cleanNum = siteConfig.whatsappNumber.replace(/\D/g,'');
    document.getElementById('header-contact-btn').href = `https://wa.me/${cleanNum}`;
    const ftWa = document.getElementById('footer-whatsapp-link');
    if (ftWa) ftWa.href = `https://wa.me/${cleanNum}`;
  }

  if (siteConfig.heroHeadline) document.getElementById('hero-headline-text').innerText = siteConfig.heroHeadline;
  if (siteConfig.heroSubtext) document.getElementById('hero-subtext').innerText = siteConfig.heroSubtext;
  if (siteConfig.heroBtnText) document.getElementById('hero-btn-text').innerText = siteConfig.heroBtnText;

  // Background Slideshow Render & Rotator
  if (siteConfig.heroSlides && siteConfig.heroSlides.length > 0) {
    const sliderContainer = document.getElementById('hero-bg-slider');
    sliderContainer.innerHTML = '';
    siteConfig.heroSlides.forEach((url, i) => {
      const slide = document.createElement('div');
      slide.className = `hero-bg-slide ${i === 0 ? 'active' : ''}`;
      slide.style.backgroundImage = `url('${url}')`;
      sliderContainer.appendChild(slide);
    });

    const slides = document.querySelectorAll('.hero-bg-slide');
    if (slides.length > 1) {
      let currentSlide = 0;
      setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
      }, 5000);
    }
  }

  // Render Catalog Products
  const prodGrid = document.getElementById('frontend-product-list');
  prodGrid.innerHTML = '';
  siteConfig.products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/300'}" class="product-media" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="price">$${p.price}</div>
      <button class="btn btn-primary btn-block">Add to Bag</button>
    `;
    prodGrid.appendChild(card);
  });

  // Footer & Promo Box
  if (siteConfig.footerBrandTitle) document.getElementById('footer-brand-title').innerText = siteConfig.footerBrandTitle;
  if (siteConfig.footerBrandDesc) document.getElementById('footer-brand-desc').innerText = siteConfig.footerBrandDesc;
  if (siteConfig.footerEmail) document.getElementById('footer-email-text').innerText = siteConfig.footerEmail;
  if (siteConfig.footerCopyright) document.getElementById('footer-copyright-text').innerText = siteConfig.footerCopyright;

  const promoBox = document.getElementById('frontend-promo-ad');
  if (siteConfig.promoAdEnabled) {
    promoBox.style.display = 'block';
    document.getElementById('promo-ad-heading').innerText = siteConfig.promoAdHeading || '';
    document.getElementById('promo-ad-body').innerText = siteConfig.promoAdBody || '';
    const adBtn = document.getElementById('promo-ad-link-btn');
    adBtn.innerText = siteConfig.promoAdBtnText || 'Claim Offer';
    adBtn.href = siteConfig.promoAdBtnLink || '#catalog';
    if (siteConfig.promoAdImg) {
      const adImg = document.getElementById('promo-ad-img');
      adImg.src = siteConfig.promoAdImg;
      adImg.style.display = 'block';
    }
  } else {
    promoBox.style.display = 'none';
  }

  // Close Promo Event
  const closeAd = document.getElementById('close-promo-ad');
  if (closeAd) closeAd.onclick = () => promoBox.style.display = 'none';
}

/* --- ADMIN PANEL ENGINE --- */
function initAdminPanel() {
  setupTabs();
  loadConfigToForm();
  renderHeroSlidesAdmin();
  renderProductsAdmin();

  document.getElementById('add-hero-slide-btn').addEventListener('click', () => {
    siteConfig.heroSlides.push('');
    renderHeroSlidesAdmin();
  });

  document.getElementById('add-new-product-btn').addEventListener('click', () => {
    siteConfig.products.push({ id: Date.now().toString(), name: "New Item", price: "100", image: "", desc: "" });
    renderProductsAdmin();
  });

  document.getElementById('save-all-changes-btn').addEventListener('click', saveAdminForm);
}

function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
      document.getElementById('active-tab-title').innerText = tab.innerText;
    };
  });
}

function loadConfigToForm() {
  document.getElementById('cfg-announcement-text').value = siteConfig.announcementText || '';
  document.getElementById('cfg-brand-name').value = siteConfig.brandName || '';
  document.getElementById('cfg-brand-logo-url').value = siteConfig.brandLogoUrl || '';
  document.getElementById('cfg-header-contact-text').value = siteConfig.headerContactText || '';
  document.getElementById('cfg-whatsapp-number').value = siteConfig.whatsappNumber || '';

  document.getElementById('cfg-hero-headline').value = siteConfig.heroHeadline || '';
  document.getElementById('cfg-hero-subtext').value = siteConfig.heroSubtext || '';
  document.getElementById('cfg-hero-btn-text').value = siteConfig.heroBtnText || '';

  document.getElementById('cfg-footer-brand-title').value = siteConfig.footerBrandTitle || '';
  document.getElementById('cfg-footer-brand-desc').value = siteConfig.footerBrandDesc || '';
  document.getElementById('cfg-footer-email').value = siteConfig.footerEmail || '';
  document.getElementById('cfg-footer-copyright').value = siteConfig.footerCopyright || '';

  document.getElementById('cfg-promo-ad-enable').checked = siteConfig.promoAdEnabled ?? true;
  document.getElementById('cfg-promo-ad-heading').value = siteConfig.promoAdHeading || '';
  document.getElementById('cfg-promo-ad-img').value = siteConfig.promoAdImg || '';
  document.getElementById('cfg-promo-ad-body').value = siteConfig.promoAdBody || '';
  document.getElementById('cfg-promo-ad-btn-text').value = siteConfig.promoAdBtnText || '';
  document.getElementById('cfg-promo-ad-btn-link').value = siteConfig.promoAdBtnLink || '';
}

function renderHeroSlidesAdmin() {
  const container = document.getElementById('hero-slides-container');
  container.innerHTML = '';
  siteConfig.heroSlides.forEach((slideUrl, idx) => {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <input type="text" class="hero-slide-input" value="${slideUrl}" placeholder="Image URL">
      <button class="btn btn-danger" onclick="siteConfig.heroSlides.splice(${idx},1); renderHeroSlidesAdmin();">Remove</button>
    `;
    container.appendChild(row);
  });
}

function renderProductsAdmin() {
  const container = document.getElementById('products-admin-list');
  container.innerHTML = '';
  siteConfig.products.forEach((prod, idx) => {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <input type="text" class="prod-name" value="${prod.name}" placeholder="Name">
      <input type="text" class="prod-price" value="${prod.price}" placeholder="Price" style="width: 90px;">
      <input type="text" class="prod-img" value="${prod.image}" placeholder="Image URL">
      <button class="btn btn-danger" onclick="siteConfig.products.splice(${idx},1); renderProductsAdmin();">Remove</button>
    `;
    container.appendChild(row);
  });
}

function saveAdminForm() {
  siteConfig.announcementText = document.getElementById('cfg-announcement-text').value;
  siteConfig.brandName = document.getElementById('cfg-brand-name').value;
  siteConfig.brandLogoUrl = document.getElementById('cfg-brand-logo-url').value;
  siteConfig.headerContactText = document.getElementById('cfg-header-contact-text').value;
  siteConfig.whatsappNumber = document.getElementById('cfg-whatsapp-number').value;

  siteConfig.heroHeadline = document.getElementById('cfg-hero-headline').value;
  siteConfig.heroSubtext = document.getElementById('cfg-hero-subtext').value;
  siteConfig.heroBtnText = document.getElementById('cfg-hero-btn-text').value;

  const slideInputs = document.querySelectorAll('.hero-slide-input');
  siteConfig.heroSlides = Array.from(slideInputs).map(i => i.value).filter(v => v.trim() !== '');

  const prodRows = document.querySelectorAll('#products-admin-list .item-row');
  siteConfig.products = Array.from(prodRows).map((row, idx) => ({
    id: siteConfig.products[idx]?.id || Date.now().toString() + idx,
    name: row.querySelector('.prod-name').value,
    price: row.querySelector('.prod-price').value,
    image: row.querySelector('.prod-img').value,
    desc: siteConfig.products[idx]?.desc || ""
  }));

  siteConfig.footerBrandTitle = document.getElementById('cfg-footer-brand-title').value;
  siteConfig.footerBrandDesc = document.getElementById('cfg-footer-brand-desc').value;
  siteConfig.footerEmail = document.getElementById('cfg-footer-email').value;
  siteConfig.footerCopyright = document.getElementById('cfg-footer-copyright').value;

  siteConfig.promoAdEnabled = document.getElementById('cfg-promo-ad-enable').checked;
  siteConfig.promoAdHeading = document.getElementById('cfg-promo-ad-heading').value;
  siteConfig.promoAdImg = document.getElementById('cfg-promo-ad-img').value;
  siteConfig.promoAdBody = document.getElementById('cfg-promo-ad-body').value;
  siteConfig.promoAdBtnText = document.getElementById('cfg-promo-ad-btn-text').value;
  siteConfig.promoAdBtnLink = document.getElementById('cfg-promo-ad-btn-link').value;

  localStorage.setItem('novucart_site_config', JSON.stringify(siteConfig));
  alert('All changes saved! Refresh index.html to view updates.');
}
