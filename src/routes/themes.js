const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { uniqueSlug } = require("../lib/uniqueSlug");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const themeSchema = z.object({
  name: z.string().min(1, "Naam is verplicht."),
  isActive: z.boolean().optional(),
  config: z.any().optional(),
});

const templateSchema = z.object({
  type: z.enum(["HEADER", "FOOTER", "PAGE", "POST", "ARCHIVE"]),
  name: z.string().min(1, "Naam is verplicht."),
  html: z.string().optional(),
  css: z.string().optional(),
});

async function slugExists(slug, ignoreId) {
  const existing = await prisma.theme.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== ignoreId);
}

// GET /api/themes
router.get("/", async (req, res) => {
  const themes = await prisma.theme.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ themes });
});

// GET /api/themes/:id — inclusief templates
router.get("/:id", async (req, res) => {
  const theme = await prisma.theme.findUnique({
    where: { id: req.params.id },
    include: { templates: true },
  });
  if (!theme) return res.status(404).json({ error: "Thema niet gevonden." });
  res.json({ theme });
});

// POST /api/themes — alleen admin/editor
router.post("/", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = themeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, isActive, config } = parsed.data;
  const slug = await uniqueSlug(name, slugExists);

  const theme = await prisma.$transaction(async (tx) => {
    if (isActive) {
      await tx.theme.updateMany({ data: { isActive: false } });
    }
    return tx.theme.create({
      data: { name, slug, isActive: Boolean(isActive), config: config ?? {} },
    });
  });
  res.status(201).json({ theme });
});

// PUT /api/themes/:id — alleen admin/editor
router.put("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = themeSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const existing = await prisma.theme.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Thema niet gevonden." });

  const data = { ...parsed.data };
  if (data.name && data.name !== existing.name) {
    data.slug = await uniqueSlug(data.name, slugExists, existing.id);
  }

  const theme = await prisma.$transaction(async (tx) => {
    if (data.isActive) {
      await tx.theme.updateMany({ where: { id: { not: existing.id } }, data: { isActive: false } });
    }
    return tx.theme.update({ where: { id: existing.id }, data });
  });
  res.json({ theme });
});

// POST /api/themes/:id/activate — dit thema actief maken, alle andere deactiveren
router.post("/:id/activate", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const existing = await prisma.theme.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Thema niet gevonden." });

  const theme = await prisma.$transaction(async (tx) => {
    await tx.theme.updateMany({ data: { isActive: false } });
    return tx.theme.update({ where: { id: existing.id }, data: { isActive: true } });
  });
  res.json({ theme });
});

// DELETE /api/themes/:id — alleen admin/editor
router.delete("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const existing = await prisma.theme.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Thema niet gevonden." });
  await prisma.theme.delete({ where: { id: existing.id } });
  res.status(204).send();
});

// GET /api/themes/:id/templates
router.get("/:id/templates", async (req, res) => {
  const templates = await prisma.themeTemplate.findMany({ where: { themeId: req.params.id } });
  res.json({ templates });
});

// POST /api/themes/:id/templates — nieuwe template toevoegen aan dit thema
router.post("/:id/templates", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const theme = await prisma.theme.findUnique({ where: { id: req.params.id } });
  if (!theme) return res.status(404).json({ error: "Thema niet gevonden." });

  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const template = await prisma.themeTemplate.create({
    data: { ...parsed.data, themeId: theme.id },
  });
  res.status(201).json({ template });
});

module.exports = router;
