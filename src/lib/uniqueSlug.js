const { slugify } = require("./slugify");

/**
 * Genereert een unieke slug voor een gegeven titel.
 * `checkExists(slug)` moet true/false (of een Promise daarvan) teruggeven.
 * Bij een botsing wordt er "-2", "-3", etc. achter geplakt.
 */
async function uniqueSlug(title, checkExists, ignoreId = null) {
  const base = slugify(title) || "item";
  let slug = base;
  let counter = 2;

  // eslint-disable-next-line no-await-in-loop
  while (await checkExists(slug, ignoreId)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

module.exports = { uniqueSlug };
