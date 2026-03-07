import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptBR from "./locales/pt-BR.json";
import en from "./locales/en.json";
import es from "./locales/es.json";

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
    document.documentElement.lang = i18next.resolvedLanguage?.split('-')[0] || 'pt';

    // Update the language selector to reflect current language
    const select = document.getElementById("language-select");
    if (select) {
        const langPrefix = i18next.resolvedLanguage?.split('-')[0] || 'pt';
        if (i18next.resolvedLanguage === 'pt-BR' || langPrefix === 'pt') {
            select.value = 'pt-BR';
        } else if (langPrefix === 'en') {
            select.value = 'en';
        } else if (langPrefix === 'es') {
            select.value = 'es';
        }
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

i18next
    .use(LanguageDetector)
    .init({
        resources,
        fallbackLng: "en",
        detection: {
            order: ['localStorage', 'sessionStorage', 'navigator'],
            caches: ['localStorage', 'sessionStorage']
        },
        interpolation: {
            escapeValue: false // allow HTML like <span class="gradient-text">
        }
    })
    .then(() => {
        updateContent();
    });

i18next.on('languageChanged', (lng) => {
    // Save language choice to localStorage
    localStorage.setItem('i18nextLng', lng);
    updateContent();
});

// Function to update language selector UI
function updateLanguageSelectorUI() {
    const toggle = document.getElementById("lang-selector-toggle");
    const langFlag = document.getElementById("lang-selector-flag");
    const langCode = document.getElementById("lang-selector-code");
    const items = document.querySelectorAll(".lang-selector-item");

    if (!toggle) return;

    const currentLang = i18next.resolvedLanguage || 'pt-BR';
    const langPrefix = currentLang.split('-')[0];

    // Map language codes to display info
    const langMap = {
        'pt': { flag: 'https://flagcdn.com/w40/br.png', code: 'PT', name: 'Português' },
        'en': { flag: 'https://flagcdn.com/w40/us.png', code: 'EN', name: 'English' },
        'es': { flag: 'https://flagcdn.com/w40/es.png', code: 'ES', name: 'Español' }
    };

    const currentLangInfo = langMap[langPrefix] || langMap['pt'];

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

document.addEventListener("DOMContentLoaded", () => {
    // Initial content update just in case
    updateContent();

    // Bind selector (both old select and new buttons)
    const langSelect = document.getElementById("language-select");
    if (langSelect) {
        langSelect.addEventListener("change", (e) => {
            i18next.changeLanguage(e.target.value);
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
            i18next.changeLanguage(lang);
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
