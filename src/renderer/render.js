const Handlebars = require("handlebars");

const GLOBAL_DEFAULTS = {
  siteName: "Mijn CMS",
};

function compile(template, data) {
  if (!template || !template.html) return "";
  return Handlebars.compile(template.html)(data);
}

/**
 * Bouwt een volledig HTML-document op uit:
 * - de HEADER- en FOOTER-template van het thema (indien aanwezig)
 * - één "hoofd"-template (bv. PAGE, POST of ARCHIVE) met de eigenlijke content
 * - de samengevoegde CSS van alle templates van het thema
 *
 * `data` bevat de variabelen die met {{ }} in de templates gebruikt kunnen worden,
 * zoals title, content, seoTitle, seoDescription.
 */
function renderDocument({ theme, templates, main, data, extraCss = "" }) {
  const mergedData = {
    ...GLOBAL_DEFAULTS,
    year: new Date().getFullYear(),
    ...data,
  };

  const header = templates.find((t) => t.type === "HEADER");
  const footer = templates.find((t) => t.type === "FOOTER");
  const css = [
    templates.map((t) => t.css).filter(Boolean).join("\n"),
    extraCss,
  ]
    .filter(Boolean)
    .join("\n");

  const headerHtml = compile(header, mergedData);
  const footerHtml = compile(footer, mergedData);
  const mainHtml = compile(main, mergedData);

  const pageTitle = mergedData.seoTitle || mergedData.title || theme.name;
  const metaDescription = mergedData.seoDescription
    ? `<meta name="description" content="${escapeAttr(mergedData.seoDescription)}">`
    : "";

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(pageTitle)}</title>
${metaDescription}
<style>${css}</style>
</head>
<body>
${headerHtml}
<main>${mainHtml}</main>
${footerHtml}
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function escapeAttr(str) {
  return escapeHtml(str);
}

module.exports = { renderDocument };
