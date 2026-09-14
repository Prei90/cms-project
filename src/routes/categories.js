const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { uniqueSlug } = require("../lib/uniqueSlug");
const { requireSiteRole } = require("../middleware/site");

const router = express.Router({ mergeParams: true });

const categorySchema = z.object({ name: z.string().min(1, "Naam is verplicht.") });

function slugExistsFactory(siteId) {
  return async (slug, ignoreId) => {
    const existing = await prisma.category.findUnique({ where: { siteId_slug: { siteId, slug } } });
    return Boolean(existing && existing.id !== ignoreId);
  };
}

// GET /api/sites/:siteId/categories
router.get("/", async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { siteId: req.params.siteId },
    orderBy: { name: "asc" },
  });
  res.json({ categories });
});

// POST /api/sites/:siteId/categories
router.post("/", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const slug = await uniqueSlug(parsed.data.name, slugExistsFactory(req.params.siteId));
  const category = await prisma.category.create({
    data: { siteId: req.params.siteId, name: parsed.data.name, slug },
  });
  res.status(201).json({ category });
});

// PUT /api/sites/:siteId/categories/:id
router.put("/:id", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const existing = await prisma.category.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!existing) return res.status(404).json({ error: "Categorie niet gevonden." });

  const data = { ...parsed.data };
  if (data.name && data.name !== existing.name) {
    data.slug = await uniqueSlug(data.name, slugExistsFactory(req.params.siteId), existing.id);
  }
  const category = await prisma.category.update({ where: { id: existing.id }, data });
  res.json({ category });
});

// DELETE /api/sites/:siteId/categories/:id
router.delete("/:id", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const existing = await prisma.category.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!existing) return res.status(404).json({ error: "Categorie niet gevonden." });
  await prisma.category.delete({ where: { id: existing.id } });
  res.status(204).send();
});

module.exports = router;
