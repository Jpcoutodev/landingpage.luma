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
        fallbackLng: "pt-BR",
        interpolation: {
            escapeValue: false // allow HTML like <span class="gradient-text">
        }
    })
    .then(() => {
        updateContent();
    });

i18next.on('languageChanged', () => {
    updateContent();
});

document.addEventListener("DOMContentLoaded", () => {
    // Initial content update just in case
    updateContent();

    // Bind selector
    const langSelect = document.getElementById("language-select");
    if (langSelect) {
        langSelect.addEventListener("change", (e) => {
            i18next.changeLanguage(e.target.value);
        });
    }
});
