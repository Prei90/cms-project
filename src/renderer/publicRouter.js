const express = require("express");
const prisma = require("../lib/prisma");
const { renderDocument } = require("./render");

const router = express.Router();

async function getActiveTheme() {
  return prisma.theme.findFirst({ where: { isActive: true }, include: { templates: true } });
}

function noThemeResponse(res) {
  return res
    .status(503)
    .send("Er is nog geen actief thema geconfigureerd. Maak een thema aan en activeer het via /api/themes.");
}

// Homepage: toont de pagina met slug "home", of een simpele welkomstboodschap
router.get("/", async (req, res) => {
  const theme = await getActiveTheme();
  if (!theme) return noThemeResponse(res);

  const homePage = await prisma.page.findUnique({ where: { slug: "home" } });
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
      },
      extraCss: (homePage.content && homePage.content.css) || "",
    });
    return res.send(html);
  }

  const html = renderDocument({
    theme,
    templates: theme.templates,
    main: pageTemplate || { html: "<h1>{{title}}</h1>{{{content}}}" },
    data: { title: "Welkom", content: "<p>Er is nog geen homepagina ingesteld.</p>" },
  });
  res.send(html);
});

// Bloglijst
router.get("/blog", async (req, res) => {
  const theme = await getActiveTheme();
  if (!theme) return noThemeResponse(res);

  const archiveTemplate = theme.templates.find((t) => t.type === "ARCHIVE");
  if (!archiveTemplate) {
    return res.status(500).send("Het actieve thema heeft geen ARCHIVE-template.");
  }

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  const listHtml = posts
    .map((p) => `<article><a href="/blog/${p.slug}"><h2>${p.title}</h2></a></article>`)
    .join("\n");

  const html = renderDocument({
    theme,
    templates: theme.templates,
    main: archiveTemplate,
    data: { title: "Blog", content: listHtml || "<p>Nog geen artikelen gepubliceerd.</p>" },
  });
  res.send(html);
});

// Eén blogartikel
router.get("/blog/:slug", async (req, res) => {
  const theme = await getActiveTheme();
  if (!theme) return noThemeResponse(res);

  const post = await prisma.post.findUnique({ where: { slug: req.params.slug } });
  if (!post || post.status !== "PUBLISHED") {
    return res.status(404).send("Artikel niet gevonden.");
  }

  const postTemplate = theme.templates.find((t) => t.type === "POST");
  if (!postTemplate) {
    return res.status(500).send("Het actieve thema heeft geen POST-template.");
  }

  const html = renderDocument({
    theme,
    templates: theme.templates,
    main: postTemplate,
    data: { title: post.title, content: (post.content && post.content.html) || "" },
    extraCss: (post.content && post.content.css) || "",
  });
  res.send(html);
});

// Generieke pagina — dit moet als laatste staan, want het vangt elke overige /:slug op
router.get("/:slug", async (req, res) => {
  const theme = await getActiveTheme();
  if (!theme) return noThemeResponse(res);

  const page = await prisma.page.findUnique({
    where: { slug: req.params.slug },
    include: { template: true },
  });
  if (!page || page.status !== "PUBLISHED") {
    return res.status(404).send("Pagina niet gevonden.");
  }

  const pageTemplate = page.template || theme.templates.find((t) => t.type === "PAGE");
  if (!pageTemplate) {
    return res.status(500).send("Het actieve thema heeft geen PAGE-template.");
  }

  const html = renderDocument({
    theme,
    templates: theme.templates,
    main: pageTemplate,
    data: {
      title: page.title,
      content: (page.content && page.content.html) || "",
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
    },
    extraCss: (page.content && page.content.css) || "",
  });
  res.send(html);
});

module.exports = router;
