const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { uniqueSlug } = require("../lib/uniqueSlug");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const categorySchema = z.object({
  name: z.string().min(1, "Naam is verplicht."),
});

async function slugExists(slug, ignoreId) {
  const existing = await prisma.category.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== ignoreId);
}

// GET /api/categories
router.get("/", async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json({ categories });
});

// POST /api/categories — alleen admin/editor
router.post("/", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const slug = await uniqueSlug(parsed.data.name, slugExists);
  const category = await prisma.category.create({ data: { name: parsed.data.name, slug } });
  res.status(201).json({ category });
});

// PUT /api/categories/:id — alleen admin/editor
router.put("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Categorie niet gevonden." });

  const data = { ...parsed.data };
  if (data.name && data.name !== existing.name) {
    data.slug = await uniqueSlug(data.name, slugExists, existing.id);
  }
  const category = await prisma.category.update({ where: { id: req.params.id }, data });
  res.json({ category });
});

// DELETE /api/categories/:id — alleen admin/editor
router.delete("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Categorie niet gevonden." });

  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = router;
