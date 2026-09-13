/**
 * Maakt een URL-vriendelijke slug van een titel, bv. "Mijn Eerste Pagina!" -> "mijn-eerste-pagina"
 */
function slugify(text) {
  return text
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // accenten verwijderen
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = { slugify };
