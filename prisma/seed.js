const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const theme = await prisma.theme.upsert({
    where: { slug: "basis-thema" },
    update: {},
    create: {
      name: "Basis thema",
      slug: "basis-thema",
      isActive: true,
      config: {},
    },
  });

  // Zorg dat dit het enige actieve thema is
  await prisma.theme.updateMany({ where: { id: { not: theme.id } }, data: { isActive: false } });
  if (!theme.isActive) {
    await prisma.theme.update({ where: { id: theme.id }, data: { isActive: true } });
  }

  const templates = [
    {
      type: "HEADER",
      name: "Standaard header",
      html: `<header><h1>{{siteName}}</h1><nav><a href="/">Home</a> · <a href="/blog">Blog</a></nav></header>`,
      css: "header{padding:1.5rem;background:#111827;color:#fff;font-family:sans-serif;} header a{color:#fff;text-decoration:none;margin-right:0.5rem;} header h1{margin:0 0 0.5rem 0;font-size:1.5rem;}",
    },
    {
      type: "FOOTER",
      name: "Standaard footer",
      html: `<footer><p>&copy; {{year}} {{siteName}}</p></footer>`,
      css: "footer{padding:1.5rem;text-align:center;color:#6b7280;font-family:sans-serif;font-size:0.9rem;}",
    },
    {
      type: "PAGE",
      name: "Standaard pagina",
      html: `<article><h1>{{title}}</h1>{{{content}}}</article>`,
      css: "article{max-width:700px;margin:2rem auto;padding:0 1rem;font-family:sans-serif;line-height:1.6;color:#111827;}",
    },
    {
      type: "POST",
      name: "Standaard artikel",
      html: `<article><h1>{{title}}</h1>{{{content}}}</article>`,
      css: "article{max-width:700px;margin:2rem auto;padding:0 1rem;font-family:sans-serif;line-height:1.6;color:#111827;}",
    },
    {
      type: "ARCHIVE",
      name: "Standaard blogoverzicht",
      html: `<section><h1>{{title}}</h1>{{{content}}}</section>`,
      css: "section{max-width:700px;margin:2rem auto;padding:0 1rem;font-family:sans-serif;} section article{margin-bottom:1.5rem;} section a{color:#111827;}",
    },
  ];

  for (const t of templates) {
    const existing = await prisma.themeTemplate.findFirst({ where: { themeId: theme.id, type: t.type } });
    if (!existing) {
      await prisma.themeTemplate.create({ data: { ...t, themeId: theme.id } });
    }
  }

  const homePage = await prisma.page.upsert({
    where: { slug: "home" },
    update: {},
    create: {
      title: "Welkom",
      slug: "home",
      themeId: theme.id,
      content: { html: "<p>Dit is je eerste pagina. Pas deze aan via de API, of straks via de WYSIWYG-editor.</p>" },
      status: "PUBLISHED",
    },
  });

  console.log("Seed voltooid:", { theme: theme.slug, homePage: homePage.slug });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
