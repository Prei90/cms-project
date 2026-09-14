const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { uniqueSlug } = require("../lib/uniqueSlug");
const { requireSiteRole } = require("../middleware/site");

const router = express.Router({ mergeParams: true });

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

function slugExistsFactory(siteId) {
  return async (slug, ignoreId) => {
    const existing = await prisma.theme.findUnique({ where: { siteId_slug: { siteId, slug } } });
    return Boolean(existing && existing.id !== ignoreId);
  };
}

// GET /api/sites/:siteId/themes
router.get("/", async (req, res) => {
  const themes = await prisma.theme.findMany({
    where: { siteId: req.params.siteId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ themes });
});

// GET /api/sites/:siteId/themes/:id
router.get("/:id", async (req, res) => {
  const theme = await prisma.theme.findFirst({
    where: { id: req.params.id, siteId: req.params.siteId },
    include: { templates: true },
  });
  if (!theme) return res.status(404).json({ error: "Thema niet gevonden." });
  res.json({ theme });
});

// POST /api/sites/:siteId/themes
router.post("/", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = themeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, isActive, config } = parsed.data;
  const slug = await uniqueSlug(name, slugExistsFactory(req.params.siteId));

  const theme = await prisma.$transaction(async (tx) => {
    if (isActive) {
      await tx.theme.updateMany({ where: { siteId: req.params.siteId }, data: { isActive: false } });
    }
    return tx.theme.create({
      data: { siteId: req.params.siteId, name, slug, isActive: Boolean(isActive), config: config ?? {} },
    });
  });
  res.status(201).json({ theme });
});

// PUT /api/sites/:siteId/themes/:id
router.put("/:id", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = themeSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const existing = await prisma.theme.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!existing) return res.status(404).json({ error: "Thema niet gevonden." });

  const data = { ...parsed.data };
  if (data.name && data.name !== existing.name) {
    data.slug = await uniqueSlug(data.name, slugExistsFactory(req.params.siteId), existing.id);
  }

  const theme = await prisma.$transaction(async (tx) => {
    if (data.isActive) {
      await tx.theme.updateMany({
        where: { siteId: req.params.siteId, id: { not: existing.id } },
        data: { isActive: false },
      });
    }
    return tx.theme.update({ where: { id: existing.id }, data });
  });
  res.json({ theme });
});

// POST /api/sites/:siteId/themes/:id/activate
router.post("/:id/activate", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const existing = await prisma.theme.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!existing) return res.status(404).json({ error: "Thema niet gevonden." });

  const theme = await prisma.$transaction(async (tx) => {
    await tx.theme.updateMany({ where: { siteId: req.params.siteId }, data: { isActive: false } });
    return tx.theme.update({ where: { id: existing.id }, data: { isActive: true } });
  });
  res.json({ theme });
});

// DELETE /api/sites/:siteId/themes/:id
router.delete("/:id", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const existing = await prisma.theme.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!existing) return res.status(404).json({ error: "Thema niet gevonden." });
  await prisma.theme.delete({ where: { id: existing.id } });
  res.status(204).send();
});

// GET /api/sites/:siteId/themes/:id/templates
router.get("/:id/templates", async (req, res) => {
  const theme = await prisma.theme.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!theme) return res.status(404).json({ error: "Thema niet gevonden." });
  const templates = await prisma.themeTemplate.findMany({ where: { themeId: theme.id } });
  res.json({ templates });
});

// POST /api/sites/:siteId/themes/:id/templates
router.post("/:id/templates", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const theme = await prisma.theme.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!theme) return res.status(404).json({ error: "Thema niet gevonden." });

  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const template = await prisma.themeTemplate.create({ data: { ...parsed.data, themeId: theme.id } });
  res.status(201).json({ template });
});

module.exports = router;
