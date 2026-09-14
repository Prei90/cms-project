const express = require("express");
const prisma = require("../lib/prisma");
const { renderDocument } = require("./render");

const router = express.Router();

async function getSiteByDomain(hostname) {
  return prisma.site.findUnique({ where: { domain: hostname } });
}

async function getActiveTheme(siteId) {
  return prisma.theme.findFirst({ where: { siteId, isActive: true }, include: { templates: true } });
}

async function getSettings(siteId) {
  const setting = await prisma.setting.findUnique({ where: { siteId_key: { siteId, key: "general" } } });
  return { siteName: "Mijn website", logoUrl: null, ...(setting ? setting.value : {}) };
}

async function getPrimaryMenuItems(siteId) {
  const menu = await prisma.menu.findFirst({
    where: { siteId },
    orderBy: { createdAt: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" }, include: { page: true } } },
  });
  if (!menu) return [];
  return menu.items.map((item) => ({
    label: item.label,
    url: item.page ? `/${item.page.slug}` : item.url || "#",
  }));
}

function unknownSiteResponse(res) {
  return res
    .status(404)
    .send("Onbekende website voor dit domein. Controleer of er een site met dit domein is aangemaakt.");
}

function noThemeResponse(res) {
  return res
    .status(503)
    .send("Er is nog geen actief thema geconfigureerd voor deze website.");
}

// Alle publieke routes zoeken eerst de site op aan de hand van het domein waarmee is aangevraagd
router.use(async (req, res, next) => {
  const site = await getSiteByDomain(req.hostname);
  if (!site) return unknownSiteResponse(res);
  req.currentSite = site;
  next();
});

// Homepage: toont de pagina met slug "home", of een simpele welkomstboodschap
router.get("/", async (req, res) => {
  const siteId = req.currentSite.id;
  const theme = await getActiveTheme(siteId);
  if (!theme) return noThemeResponse(res);

  const [settings, menuItems] = await Promise.all([getSettings(siteId), getPrimaryMenuItems(siteId)]);
  const homePage = await prisma.page.findFirst({ where: { siteId, slug: "home" } });
  const pageTemplate = theme.templates.find((t) => t.type === "PAGE");

  if (homePage && homePage.status === "PUBLISHED" && pageTemplate) {
    const html = renderDocument({
      theme,
      templates: theme.templates,
      main: pageTemplate,
      data: {
        title: homePage.title,
        content: (homePage.content && homePage.content.html) || "",
        seoTitle: homePage.seoTitle,
        seoDescription: homePage.seoDescription,
        siteName: settings.siteName,
        logoUrl: settings.logoUrl,
        menuItems,
      },
      extraCss: (homePage.content && homePage.content.css) || "",
    });
    return res.send(html);
  }

  const html = renderDocument({
    theme,
    templates: theme.templates,
    main: pageTemplate || { html: "<h1>{{title}}</h1>{{{content}}}" },
    data: {
      title: "Welkom",
      content: "<p>Er is nog geen homepagina ingesteld.</p>",
      siteName: settings.siteName,
      logoUrl: settings.logoUrl,
      menuItems,
    },
  });
  res.send(html);
});

// Bloglijst
router.get("/blog", async (req, res) => {
  const siteId = req.currentSite.id;
  const theme = await getActiveTheme(siteId);
  if (!theme) return noThemeResponse(res);

  const archiveTemplate = theme.templates.find((t) => t.type === "ARCHIVE");
  if (!archiveTemplate) {
    return res.status(500).send("Het actieve thema heeft geen ARCHIVE-template.");
  }

  const [settings, menuItems, posts] = await Promise.all([
    getSettings(siteId),
    getPrimaryMenuItems(siteId),
    prisma.post.findMany({
      where: { siteId, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
  ]);

  const listHtml = posts
    .map((p) => `<article><a href="/blog/${p.slug}"><h2>${p.title}</h2></a></article>`)
    .join("\n");

  const html = renderDocument({
    theme,
    templates: theme.templates,
    main: archiveTemplate,
    data: {
      title: "Blog",
      content: listHtml || "<p>Nog geen artikelen gepubliceerd.</p>",
      siteName: settings.siteName,
      logoUrl: settings.logoUrl,
      menuItems,
    },
  });
  res.send(html);
});

// Eén blogartikel
router.get("/blog/:slug", async (req, res) => {
  const siteId = req.currentSite.id;
  const theme = await getActiveTheme(siteId);
  if (!theme) return noThemeResponse(res);

  const post = await prisma.post.findFirst({ where: { siteId, slug: req.params.slug } });
  if (!post || post.status !== "PUBLISHED") {
    return res.status(404).send("Artikel niet gevonden.");
  }

  const postTemplate = theme.templates.find((t) => t.type === "POST");
  if (!postTemplate) {
    return res.status(500).send("Het actieve thema heeft geen POST-template.");
  }

  const [settings, menuItems] = await Promise.all([getSettings(siteId), getPrimaryMenuItems(siteId)]);

  const html = renderDocument({
    theme,
    templates: theme.templates,
    main: postTemplate,
    data: {
      title: post.title,
      content: (post.content && post.content.html) || "",
      siteName: settings.siteName,
      logoUrl: settings.logoUrl,
      menuItems,
    },
    extraCss: (post.content && post.content.css) || "",
  });
  res.send(html);
});

// Generieke pagina — moet als laatste staan, want het vangt elke overige /:slug op
router.get("/:slug", async (req, res) => {
  const siteId = req.currentSite.id;
  const theme = await getActiveTheme(siteId);
  if (!theme) return noThemeResponse(res);

  const page = await prisma.page.findFirst({
    where: { siteId, slug: req.params.slug },
    include: { template: true },
  });
  if (!page || page.status !== "PUBLISHED") {
    return res.status(404).send("Pagina niet gevonden.");
  }

  const pageTemplate = page.template || theme.templates.find((t) => t.type === "PAGE");
  if (!pageTemplate) {
    return res.status(500).send("Het actieve thema heeft geen PAGE-template.");
  }

  const [settings, menuItems] = await Promise.all([getSettings(siteId), getPrimaryMenuItems(siteId)]);

  const html = renderDocument({
    theme,
    templates: theme.templates,
    main: pageTemplate,
    data: {
      title: page.title,
      content: (page.content && page.content.html) || "",
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      siteName: settings.siteName,
      logoUrl: settings.logoUrl,
      menuItems,
    },
    extraCss: (page.content && page.content.css) || "",
  });
  res.send(html);
});

module.exports = router;
