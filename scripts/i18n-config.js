/**
 * i18n Configuration
 * Maps languages to file names and provides the base URL for SEO.
 */

const BASE_URL = 'https://dualis.love';

const LANGUAGES = [
    { code: 'pt-BR', prefix: '', label: '🇧🇷 PT', isDefault: true },
    { code: 'en', prefix: 'en', label: '🇺🇸 EN', isDefault: false },
    { code: 'es', prefix: 'es', label: '🇪🇸 ES', isDefault: false },
];

// Maps the PT source filenames to localized filenames per language
const FILE_MAP = {
    'index.html': {
        'pt-BR': 'index.html',
        'en': 'index.html',
        'es': 'index.html',
    },
    'termos.html': {
        'pt-BR': 'termos.html',
        'en': 'terms.html',
        'es': 'terminos.html',
    },
    'privacidade.html': {
        'pt-BR': 'privacidade.html',
        'en': 'privacy.html',
        'es': 'privacidad.html',
    },
    'seguranca.html': {
        'pt-BR': 'seguranca.html',
        'en': 'security.html',
        'es': 'seguridad.html',
    },
    'delete_account.html': {
        'pt-BR': 'delete_account.html',
        'en': 'delete-account.html',
        'es': 'eliminar-cuenta.html',
    },
};

module.exports = { BASE_URL, LANGUAGES, FILE_MAP };
