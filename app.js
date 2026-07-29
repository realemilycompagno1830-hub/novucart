import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Main function to load and apply site settings instantly
async function initSiteSettings() {
  // 1. Load instantly from browser cache to eliminate flash/FOUC
  const cachedSettings = localStorage.getItem('novucart_site_settings');
  if (cachedSettings) {
    try {
      renderSettingsToDOM(JSON.parse(cachedSettings));
    } catch (e) {
      console.warn("Cache parse error", e);
    }
  }

  // 2. Fetch fresh settings from Firebase Firestore in the background
  try {
    const docRef = doc(db, "settings", "general");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const liveData = docSnap.data();
      // Render live settings
      renderSettingsToDOM(liveData);
      // Save to cache for instant future page loads
      localStorage.setItem('novucart_site_settings', JSON.stringify(liveData));
    }
  } catch (err) {
    console.error("Error fetching live settings from Firebase:", err);
  }
}

// Helper to safely map text & values into HTML elements
function renderSettingsToDOM(data) {
  const updateText = (id, text) => {
    const el = document.getElementById(id);
    if (el && text !== undefined) {
      el.textContent = text;
      el.classList.add('loaded'); // Trigger smooth fade in
    }
  };

  // Map database properties to DOM elements
  updateText('nav-catalog-link', data.navCatalog);
  updateText('nav-contact-link', data.navContact);
  updateText('hero-headline', data.heroHeadline);
  updateText('hero-subtext', data.heroSubtext);
  updateText('hero-btn', data.heroBtnText);
  updateText('catalog-heading', data.catalogHeading);
  updateText('catalog-subheading', data.catalogSubheading);
  updateText('top-announcement-bar', data.announcement);
  updateText('footer-brand-desc', data.footerBrandDesc);
  updateText('footer-care-title', data.footerCareTitle);
  updateText('footer-copyright', data.footerText);

  // Dynamic Site Title
  if (data.siteTitle) {
    document.title = data.siteTitle;
  }

  // Dynamic Logo (PNG / Image / SVG)
  const logoImg = document.getElementById('site-logo-img');
  if (logoImg && data.logoUrl) {
    logoImg.src = data.logoUrl;
    logoImg.style.display = 'inline-block';
  }
}

// Call on startup when page DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initSiteSettings();
});
