const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const templateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  html: z.string().optional(),
  css: z.string().optional(),
});

// PUT /api/templates/:id — html/css van een template bijwerken
// (dit endpoint gebruikt de GrapesJS-editor straks om de visuele wijzigingen op te slaan)
router.put("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = templateUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const existing = await prisma.themeTemplate.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Template niet gevonden." });

  const template = await prisma.themeTemplate.update({
    where: { id: existing.id },
    data: parsed.data,
  });
  res.json({ template });
});

// DELETE /api/templates/:id
router.delete("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const existing = await prisma.themeTemplate.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Template niet gevonden." });
  await prisma.themeTemplate.delete({ where: { id: existing.id } });
  res.status(204).send();
});

module.exports = router;
