const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { uniqueSlug } = require("../lib/uniqueSlug");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const pageSchema = z.object({
  title: z.string().min(1, "Titel is verplicht."),
  themeId: z.string().optional().nullable(),
  templateId: z.string().optional().nullable(),
  content: z.any().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

async function slugExists(slug, ignoreId) {
  const existing = await prisma.page.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== ignoreId);
}

// GET /api/pages — lijst, met optioneel ?status=DRAFT|PUBLISHED
router.get("/", async (req, res) => {
  const { status } = req.query;
  const pages = await prisma.page.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: "desc" },
  });
  res.json({ pages });
});

// GET /api/pages/:id
router.get("/:id", async (req, res) => {
  const page = await prisma.page.findUnique({ where: { id: req.params.id } });
  if (!page) return res.status(404).json({ error: "Pagina niet gevonden." });
  res.json({ page });
});

// POST /api/pages — alleen admin/editor
router.post("/", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = pageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { title, themeId, templateId, content, status, seoTitle, seoDescription } = parsed.data;

  const slug = await uniqueSlug(title, slugExists);

  const page = await prisma.page.create({
    data: {
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

// PUT /api/pages/:id — alleen admin/editor
router.put("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = pageSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const existing = await prisma.page.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Pagina niet gevonden." });

  const data = { ...parsed.data };
  if (data.title && data.title !== existing.title) {
    data.slug = await uniqueSlug(data.title, slugExists, existing.id);
  }

  const page = await prisma.page.update({ where: { id: req.params.id }, data });
  res.json({ page });
});

// DELETE /api/pages/:id — alleen admin/editor
router.delete("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const existing = await prisma.page.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Pagina niet gevonden." });

  await prisma.page.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = router;
