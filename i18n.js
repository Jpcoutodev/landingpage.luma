import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptBR from "./locales/pt-BR.json";
import en from "./locales/en.json";
import es from "./locales/es.json";

function getLanguageFromPath() {
    const path = window.location.pathname;
    if (path.startsWith('/br/') || path === '/br') return 'pt-BR';
    if (path.startsWith('/es/') || path === '/es') return 'es';
    return 'en';
}

function updateContent() {
    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.getAttribute("data-i18n");
        if (element.tagName === 'META') {
            if (element.hasAttribute('content')) {
                element.setAttribute('content', i18next.t(key));
            }
        } else {
            element.innerHTML = i18next.t(key);
        }
    });

    // Specific handler for document title
    document.title = i18next.t("meta.title");
    document.documentElement.lang = i18next.resolvedLanguage?.split('-')[0] || 'en';

    // Update the language selector to reflect current language
    const select = document.getElementById("language-select");
    if (select) {
        select.value = getLanguageFromPath();
    }

    // Update new language selector visually
    updateLanguageSelectorUI();
}

// Intercept onclicks if any specific JS translations are needed
// Example: The alert for web version
window.showWebSoonAlert = function () {
    alert(i18next.t('alert.webSoon'));
};

const resources = {
    "pt-BR": { translation: ptBR },
    "pt": { translation: ptBR },
    "en": { translation: en },
    "es": { translation: es }
};

const pathLang = getLanguageFromPath();

i18next
    .use(LanguageDetector)
    .init({
        resources,
        lng: pathLang, // Force the language based on the URL path
        fallbackLng: "en",
        detection: {
            // Only used to detect where to redirect if they land on root '/' without a path
            order: ['localStorage', 'navigator'], 
            caches: ['localStorage'] // Save user preference when they manually switch
        },
        interpolation: {
            escapeValue: false // allow HTML like <span class="gradient-text">
        }
    })
    .then(() => {
        const isRoot = window.location.pathname === '/' || window.location.pathname === '';
        
        // If the user visits the root global page (/), check if we should auto-redirect them 
        // to a local version based on their detected language or previous choice.
        if (isRoot) {
            const detectedLang = i18next.resolvedLanguage || 'en';
            const hash = window.location.hash;
            const search = window.location.search;
            
            if (detectedLang.startsWith('pt')) {
                window.location.replace('/br/' + search + hash);
                return; // Stop execution
            } else if (detectedLang.startsWith('es')) {
                window.location.replace('/es/' + search + hash);
                return; // Stop execution
            }
        }

        updateContent();
    });

// Function to update language selector UI
function updateLanguageSelectorUI() {
    const toggle = document.getElementById("lang-selector-toggle");
    const langFlag = document.getElementById("lang-selector-flag");
    const langCode = document.getElementById("lang-selector-code");
    const items = document.querySelectorAll(".lang-selector-item");

    if (!toggle) return;

    const currentLang = pathLang;
    const langPrefix = currentLang.split('-')[0];

    // Map language codes to display info
    const langMap = {
        'pt': { flag: 'https://flagcdn.com/w40/br.png', code: 'PT', name: 'Português' },
        'en': { flag: 'https://flagcdn.com/w40/us.png', code: 'EN', name: 'English' },
        'es': { flag: 'https://flagcdn.com/w40/es.png', code: 'ES', name: 'Español' }
    };

    const currentLangInfo = langMap[langPrefix] || langMap['en'];

    if (langFlag) langFlag.src = currentLangInfo.flag;
    if (langCode) langCode.textContent = currentLangInfo.code;

    // Update active item
    items.forEach(item => {
        item.classList.remove('active');
        const itemLang = item.getAttribute('data-lang-btn');
        const itemPrefix = itemLang.split('-')[0];
        if (itemPrefix === langPrefix || itemLang === currentLang) {
            item.classList.add('active');
        }
    });
}

// Function to toggle dropdown menu
function toggleLanguageMenu() {
    const toggle = document.getElementById("lang-selector-toggle");
    const menu = document.getElementById("lang-selector-menu");

    if (!toggle || !menu) return;

    toggle.classList.toggle('active');
    menu.classList.toggle('visible');
}

// Function to close dropdown menu
function closeLanguageMenu() {
    const toggle = document.getElementById("lang-selector-toggle");
    const menu = document.getElementById("lang-selector-menu");

    if (toggle) toggle.classList.remove('active');
    if (menu) menu.classList.remove('visible');
}

// Changes the URL path to match the target language
function changeLanguageByPath(targetLang) {
    // save preference natively to bypass browser language if user explicitly chooses
    localStorage.setItem('i18nextLng', targetLang);
    
    // Extract base page name (e.g. /termos.html or just /)
    let pathName = window.location.pathname;
    
    // Strip language prefix from current path if exists
    if (pathName.startsWith('/br/')) pathName = pathName.substring(3);
    else if (pathName === '/br') pathName = '/';
    else if (pathName.startsWith('/es/')) pathName = pathName.substring(3);
    else if (pathName === '/es') pathName = '/';
    
    // Make sure pathName always starts with /
    if (!pathName.startsWith('/')) pathName = '/' + pathName;
    
    // Reconstruct with new language prefix
    let newPrefix = '';
    if (targetLang.startsWith('pt')) newPrefix = '/br';
    else if (targetLang.startsWith('es')) newPrefix = '/es';
    
    let finalPath = newPrefix + pathName;
    
    window.location.href = finalPath + window.location.search + window.location.hash;
}

document.addEventListener("DOMContentLoaded", () => {
    // Initial content update just in case
    updateContent();

    // Bind selector (both old select and new buttons) to redirect instead of loading inline
    const langSelect = document.getElementById("language-select");
    if (langSelect) {
        langSelect.addEventListener("change", (e) => {
            changeLanguageByPath(e.target.value);
        });
    }

    // Language selector toggle button
    const langToggle = document.getElementById("lang-selector-toggle");
    if (langToggle) {
        langToggle.addEventListener("click", toggleLanguageMenu);
    }

    // Bind new language buttons
    const langButtons = document.querySelectorAll("[data-lang-btn]");
    langButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const lang = btn.getAttribute("data-lang-btn");
            changeLanguageByPath(lang);
            closeLanguageMenu();
        });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        const toggle = document.getElementById("lang-selector-toggle");
        const menu = document.getElementById("lang-selector-menu");
        
        if (toggle && menu && !toggle.contains(e.target) && !menu.contains(e.target)) {
            closeLanguageMenu();
        }
    });
});
