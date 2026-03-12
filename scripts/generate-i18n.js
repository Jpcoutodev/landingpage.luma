/**
 * generate-i18n.js
 * Post-build script that generates static localized pages for each language.
 *
 * What it does:
 * 1. Reads each HTML from dist/
 * 2. For each non-default language (EN, ES), creates a localized copy
 * 3. Replaces data-i18n content with translated text from JSON files
 * 4. Updates <html lang>, <title>, <meta> tags
 * 5. Injects <link rel="alternate" hreflang="..."> into all pages
 * 6. Renames files to localized names
 * 7. Replaces the JS language selector with static links
 * 8. Generates a multilingual sitemap.xml
 */

const fs = require('fs');
const path = require('path');
const { BASE_URL, LANGUAGES, FILE_MAP } = require('./i18n-config');

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const LOCALES_DIR = path.resolve(__dirname, '..', 'locales');

// Load all translation files
const translations = {};
for (const lang of LANGUAGES) {
    const filePath = path.join(LOCALES_DIR, `${lang.code}.json`);
    if (fs.existsSync(filePath)) {
        translations[lang.code] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
}

/**
 * Resolve a nested key like "meta.title" from a translation object
 */
function t(lang, key) {
    const obj = translations[lang];
    if (!obj) return null;
    const parts = key.split('.');
    let current = obj;
    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            return null;
        }
    }
    return typeof current === 'string' ? current : null;
}

/**
 * Replace all data-i18n attributes with translated content
 */
function replaceDataI18n(html, langCode) {
    // Handle elements with data-i18n attribute
    // Matches: <tag ... data-i18n="key" ...>content</tag>
    // Also handles self-closing-like patterns for meta tags

    // For meta tags with content attribute: <meta ... data-i18n="key" content="...">
    html = html.replace(
        /(<meta\b[^>]*?)data-i18n="([^"]+)"([^>]*?)content="([^"]*)"([^>]*?>)/gi,
        (match, before, key, middle, oldContent, after) => {
            const translated = t(langCode, key);
            if (translated) {
                return `${before}${middle}content="${escapeHtmlAttr(translated)}"${after}`;
            }
            return match.replace(/\s*data-i18n="[^"]*"/, '');
        }
    );

    // Also handle: <meta ... content="..." ... data-i18n="key" ...>
    html = html.replace(
        /(<meta\b[^>]*?)content="([^"]*)"([^>]*?)data-i18n="([^"]+)"([^>]*?>)/gi,
        (match, before, oldContent, middle, key, after) => {
            const translated = t(langCode, key);
            if (translated) {
                return `${before}content="${escapeHtmlAttr(translated)}"${middle}${after}`;
            }
            return match.replace(/\s*data-i18n="[^"]*"/, '');
        }
    );

    // For regular elements: <tag data-i18n="key">content</tag>
    html = html.replace(
        /(<(\w+)\b[^>]*?)data-i18n="([^"]+)"([^>]*?>)([\s\S]*?)(<\/\2>)/gi,
        (match, openStart, tagName, key, openEnd, content, closeTag) => {
            const translated = t(langCode, key);
            if (translated) {
                return `${openStart}${openEnd}${translated}${closeTag}`;
            }
            return `${openStart}${openEnd}${content}${closeTag}`;
        }
    );

    return html;
}

/**
 * Escape HTML attribute value
 */
function escapeHtmlAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Update <html lang="..."> attribute
 */
function updateHtmlLang(html, langCode) {
    return html.replace(/<html\s+lang="[^"]*"/, `<html lang="${langCode}"`);
}

/**
 * Update <title> tag
 */
function updateTitle(html, langCode) {
    const title = t(langCode, 'meta.title');
    if (title) {
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
    }
    return html;
}

/**
 * Build hreflang tags for a given source file
 */
function buildHreflangTags(srcFile) {
    const tags = [];
    for (const lang of LANGUAGES) {
        const localizedName = FILE_MAP[srcFile]?.[lang.code] || srcFile;
        const prefix = lang.prefix ? `${lang.prefix}/` : '';
        const href = `${BASE_URL}/${prefix}${localizedName}`;
        tags.push(`    <link rel="alternate" hreflang="${lang.code}" href="${href}">`);
    }
    // x-default points to default language (root)
    const defaultLangCode = LANGUAGES.find(l => l.isDefault).code;
    const defaultName = FILE_MAP[srcFile]?.[defaultLangCode] || srcFile;
    const defaultPrefix = LANGUAGES.find(l => l.isDefault).prefix ? `${LANGUAGES.find(l => l.isDefault).prefix}/` : '';
    tags.push(`    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/${defaultPrefix}${defaultName}">`);
    return tags.join('\n');
}

/**
 * Inject hreflang tags into <head>
 */
function injectHreflang(html, srcFile) {
    const hreflangBlock = buildHreflangTags(srcFile);
    // Insert right after <head> or after first <meta charset>
    if (html.includes('<meta charset=')) {
        html = html.replace(
            /(<meta\s+charset="[^"]*"\s*>)/i,
            `$1\n${hreflangBlock}`
        );
    } else {
        html = html.replace(/<head>/i, `<head>\n${hreflangBlock}`);
    }
    return html;
}

/**
 * Replace the dynamic language selector with static links
 */
function replaceLangSelector(html, srcFile, currentLangCode) {
    // Build the static links
    const links = LANGUAGES.map(lang => {
        const localizedName = FILE_MAP[srcFile]?.[lang.code] || srcFile;
        const prefix = lang.prefix ? `/${lang.prefix}` : '';
        const href = `${prefix}/${localizedName}`;
        const activeClass = lang.code === currentLangCode ? ' active' : '';
        return `<a href="${href}" class="lang-link${activeClass}">${lang.label}</a>`;
    }).join('\n                    ');

    const staticSelector = `<div class="lang-selector-nav">
                    ${links}
                </div>`;

    // Replace the existing lang-selector-nav block (contains SVG + select)
    html = html.replace(
        /<div class="lang-selector-nav">[\s\S]*?<\/select>\s*<\/div>/gi,
        staticSelector
    );

    return html;
}

/**
 * Update internal links to point to localized versions
 */
function updateInternalLinks(html, langCode) {
    if (langCode === 'pt-BR') return html; // Root pages keep their links

    const prefix = LANGUAGES.find(l => l.code === langCode)?.prefix;
    if (!prefix) return html;

    // Update href links to other pages
    for (const [srcFile, langMap] of Object.entries(FILE_MAP)) {
        const ptName = langMap['pt-BR'];
        const localizedName = langMap[langCode];

        // Replace href="termos.html" with href="/en/terms.html"
        html = html.replace(
            new RegExp(`href="${escapeRegex(ptName)}"`, 'g'),
            `href="/${prefix}/${localizedName}"`
        );

        // Also handle href="index.html" and href="index.html#download"
        if (srcFile === 'index.html') {
            html = html.replace(
                new RegExp(`href="index\\.html(#[^"]*)"`, 'g'),
                `href="/${prefix}/index.html$1"`
            );
        }
    }

    return html;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove the i18n.js script tag (not needed in static pages)
 */
function removeI18nScript(html) {
    html = html.replace(/<script\s+type="module"\s+src="[^"]*i18n[^"]*"\s*>\s*<\/script>\s*/gi, '');
    return html;
}

/**
 * Generate the multilingual sitemap.xml
 */
function generateSitemap() {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

    for (const [srcFile, langMap] of Object.entries(FILE_MAP)) {
        for (const lang of LANGUAGES) {
            const localizedName = langMap[lang.code];
            const prefix = lang.prefix ? `${lang.prefix}/` : '';
            const loc = `${BASE_URL}/${prefix}${localizedName}`;

            // Determine priority
            let priority = '0.5';
            let changefreq = 'yearly';
            if (srcFile === 'index.html') {
                priority = '1.0';
                changefreq = 'weekly';
            } else if (srcFile === 'delete_account.html') {
                priority = '0.3';
            }

            xml += `
  <url>
    <loc>${loc}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>`;

            // Add xhtml:link alternates
            for (const altLang of LANGUAGES) {
                const altName = langMap[altLang.code];
                const altPrefix = altLang.prefix ? `${altLang.prefix}/` : '';
                xml += `
    <xhtml:link rel="alternate" hreflang="${altLang.code}" href="${BASE_URL}/${altPrefix}${altName}"/>`;
            }
            // x-default
            const defaultLangCode = LANGUAGES.find(l => l.isDefault).code;
            const defaultName = langMap[defaultLangCode];
            const defaultPrefix = LANGUAGES.find(l => l.isDefault).prefix ? `${LANGUAGES.find(l => l.isDefault).prefix}/` : '';
            xml += `
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/${defaultPrefix}${defaultName}"/>`;

            xml += `
  </url>`;
        }
    }

    xml += `
</urlset>
`;
    return xml;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

console.log('🌐 Generating i18n static pages...\n');

const sourceFiles = Object.keys(FILE_MAP);

for (const srcFile of sourceFiles) {
    const srcPath = path.join(DIST_DIR, srcFile);
    if (!fs.existsSync(srcPath)) {
        console.warn(`⚠️  Source file not found: ${srcFile}, skipping.`);
        continue;
    }

    let originalHtml = fs.readFileSync(srcPath, 'utf-8');

    // ── Process Default Language (root) ──
    const defaultLang = LANGUAGES.find(l => l.isDefault);
    let rootHtml = originalHtml;
    rootHtml = replaceDataI18n(rootHtml, defaultLang.code);
    rootHtml = updateHtmlLang(rootHtml, defaultLang.code);
    rootHtml = updateTitle(rootHtml, defaultLang.code);
    rootHtml = injectHreflang(rootHtml, srcFile);
    rootHtml = replaceLangSelector(rootHtml, srcFile, defaultLang.code);
    rootHtml = updateInternalLinks(rootHtml, defaultLang.code);
    rootHtml = removeI18nScript(rootHtml);
    fs.writeFileSync(srcPath, rootHtml, 'utf-8');
    console.log(`  ✅ ${defaultLang.code.toUpperCase()}: ${srcFile} (hreflang + static links)`);

    // ── Process other languages ──
    for (const lang of LANGUAGES) {
        if (lang.isDefault) continue;

        const outDir = path.join(DIST_DIR, lang.prefix);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        const localizedFileName = FILE_MAP[srcFile][lang.code];
        const outPath = path.join(outDir, localizedFileName);

        let html = originalHtml;

        // 1. Replace data-i18n with translated content
        html = replaceDataI18n(html, lang.code);

        // 2. Update <html lang>
        html = updateHtmlLang(html, lang.code);

        // 3. Update <title>
        html = updateTitle(html, lang.code);

        // 4. Inject hreflang tags
        html = injectHreflang(html, srcFile);

        // 5. Replace selector with static links
        html = replaceLangSelector(html, srcFile, lang.code);

        // 6. Update internal links
        html = updateInternalLinks(html, lang.code);

        // 7. Remove i18n.js script (static content doesn't need it)
        html = removeI18nScript(html);

        fs.writeFileSync(outPath, html, 'utf-8');
        console.log(`  ✅ ${lang.code.toUpperCase()}: ${lang.prefix}/${localizedFileName}`);
    }
}

// ── Generate sitemap ──
const sitemap = generateSitemap();
fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap, 'utf-8');
console.log('\n📄 Generated multilingual sitemap.xml');

console.log('\n🎉 i18n static generation complete!');
