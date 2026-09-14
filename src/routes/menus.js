const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireSiteRole } = require("../middleware/site");

const router = express.Router({ mergeParams: true });

const menuSchema = z.object({ name: z.string().min(1, "Naam is verplicht.") });
const itemSchema = z.object({
  label: z.string().min(1, "Label is verplicht."),
  url: z.string().optional().nullable(),
  pageId: z.string().optional().nullable(),
});

// GET /api/sites/:siteId/menus
router.get("/", async (req, res) => {
  const menus = await prisma.menu.findMany({
    where: { siteId: req.params.siteId },
    include: { items: { orderBy: { sortOrder: "asc" }, include: { page: true } } },
    orderBy: { name: "asc" },
  });
  res.json({ menus });
});

// GET /api/sites/:siteId/menus/:id
router.get("/:id", async (req, res) => {
  const menu = await prisma.menu.findFirst({
    where: { id: req.params.id, siteId: req.params.siteId },
    include: { items: { orderBy: { sortOrder: "asc" }, include: { page: true } } },
  });
  if (!menu) return res.status(404).json({ error: "Menu niet gevonden." });
  res.json({ menu });
});

// POST /api/sites/:siteId/menus
router.post("/", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = menuSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const menu = await prisma.menu.create({ data: { siteId: req.params.siteId, name: parsed.data.name } });
  res.status(201).json({ menu });
});

// PUT /api/sites/:siteId/menus/:id
router.put("/:id", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = menuSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const existing = await prisma.menu.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!existing) return res.status(404).json({ error: "Menu niet gevonden." });
  const menu = await prisma.menu.update({ where: { id: existing.id }, data: parsed.data });
  res.json({ menu });
});

// DELETE /api/sites/:siteId/menus/:id
router.delete("/:id", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const existing = await prisma.menu.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!existing) return res.status(404).json({ error: "Menu niet gevonden." });
  await prisma.menu.delete({ where: { id: existing.id } });
  res.status(204).send();
});

// POST /api/sites/:siteId/menus/:id/items — item toevoegen (komt onderaan te staan)
router.post("/:id/items", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const menu = await prisma.menu.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!menu) return res.status(404).json({ error: "Menu niet gevonden." });

  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const maxOrder = await prisma.menuItem.aggregate({
    where: { menuId: menu.id },
    _max: { sortOrder: true },
  });

  const item = await prisma.menuItem.create({
    data: {
      menuId: menu.id,
      label: parsed.data.label,
      url: parsed.data.pageId ? null : parsed.data.url || null,
      pageId: parsed.data.pageId || null,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  res.status(201).json({ item });
});

// PUT /api/sites/:siteId/menus/:menuId/items/:itemId
router.put("/:menuId/items/:itemId", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const menu = await prisma.menu.findFirst({ where: { id: req.params.menuId, siteId: req.params.siteId } });
  if (!menu) return res.status(404).json({ error: "Menu niet gevonden." });
  const existing = await prisma.menuItem.findFirst({ where: { id: req.params.itemId, menuId: menu.id } });
  if (!existing) return res.status(404).json({ error: "Menu-item niet gevonden." });

  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = { ...parsed.data };
  if (data.pageId) data.url = null;

  const item = await prisma.menuItem.update({ where: { id: existing.id }, data });
  res.json({ item });
});

// DELETE /api/sites/:siteId/menus/:menuId/items/:itemId
router.delete("/:menuId/items/:itemId", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const menu = await prisma.menu.findFirst({ where: { id: req.params.menuId, siteId: req.params.siteId } });
  if (!menu) return res.status(404).json({ error: "Menu niet gevonden." });
  const existing = await prisma.menuItem.findFirst({ where: { id: req.params.itemId, menuId: menu.id } });
  if (!existing) return res.status(404).json({ error: "Menu-item niet gevonden." });
  await prisma.menuItem.delete({ where: { id: existing.id } });
  res.status(204).send();
});

// POST /api/sites/:siteId/menus/:menuId/items/:itemId/move
// Wisselt de volgorde van dit item met de buur erboven ("up") of eronder ("down"),
// zodat je zonder losse drag-and-drop-library toch kunt herordenen.
router.post("/:menuId/items/:itemId/move", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const direction = req.body.direction;
  if (!["up", "down"].includes(direction)) {
    return res.status(400).json({ error: "direction moet 'up' of 'down' zijn." });
  }
  const menu = await prisma.menu.findFirst({ where: { id: req.params.menuId, siteId: req.params.siteId } });
  if (!menu) return res.status(404).json({ error: "Menu niet gevonden." });

  const items = await prisma.menuItem.findMany({ where: { menuId: menu.id }, orderBy: { sortOrder: "asc" } });
  const index = items.findIndex((i) => i.id === req.params.itemId);
  if (index === -1) return res.status(404).json({ error: "Menu-item niet gevonden." });

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= items.length) {
    return res.json({ items }); // al aan het begin/einde
  }

  const a = items[index];
  const b = items[swapIndex];
  await prisma.$transaction([
    prisma.menuItem.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.menuItem.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);

  const updated = await prisma.menuItem.findMany({ where: { menuId: menu.id }, orderBy: { sortOrder: "asc" } });
  res.json({ items: updated });
});

module.exports = router;
