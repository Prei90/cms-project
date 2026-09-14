const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { uniqueSlug } = require("../lib/uniqueSlug");
const { requireSiteRole } = require("../middleware/site");

const router = express.Router({ mergeParams: true });

const pageSchema = z.object({
  title: z.string().min(1, "Titel is verplicht."),
  themeId: z.string().optional().nullable(),
  templateId: z.string().optional().nullable(),
  content: z.any().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

function slugExistsFactory(siteId) {
  return async (slug, ignoreId) => {
    const existing = await prisma.page.findUnique({ where: { siteId_slug: { siteId, slug } } });
    return Boolean(existing && existing.id !== ignoreId);
  };
}

// GET /api/sites/:siteId/pages
router.get("/", async (req, res) => {
  const { status } = req.query;
  const pages = await prisma.page.findMany({
    where: { siteId: req.params.siteId, ...(status ? { status } : {}) },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ pages });
});

// GET /api/sites/:siteId/pages/:id
router.get("/:id", async (req, res) => {
  const page = await prisma.page.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!page) return res.status(404).json({ error: "Pagina niet gevonden." });
  res.json({ page });
});

// POST /api/sites/:siteId/pages — ADMIN/EDITOR van deze site
router.post("/", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = pageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { title, themeId, templateId, content, status, seoTitle, seoDescription } = parsed.data;
  const slug = await uniqueSlug(title, slugExistsFactory(req.params.siteId));

  const page = await prisma.page.create({
    data: {
      siteId: req.params.siteId,
      title,
      slug,
      themeId: themeId || null,
      templateId: templateId || null,
      content: content ?? {},
      status: status || "DRAFT",
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
    },
  });
  res.status(201).json({ page });
});

// PUT /api/sites/:siteId/pages/:id
router.put("/:id", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = pageSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const existing = await prisma.page.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!existing) return res.status(404).json({ error: "Pagina niet gevonden." });

  const data = { ...parsed.data };
  if (data.title && data.title !== existing.title) {
    data.slug = await uniqueSlug(data.title, slugExistsFactory(req.params.siteId), existing.id);
  }

  const page = await prisma.page.update({ where: { id: existing.id }, data });
  res.json({ page });
});

// DELETE /api/sites/:siteId/pages/:id
router.delete("/:id", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const existing = await prisma.page.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!existing) return res.status(404).json({ error: "Pagina niet gevonden." });
  await prisma.page.delete({ where: { id: existing.id } });
  res.status(204).send();
});

module.exports = router;
