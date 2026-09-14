const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireSiteRole } = require("../middleware/site");

const router = express.Router({ mergeParams: true });

const templateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  html: z.string().optional(),
  css: z.string().optional(),
});

async function findSiteTemplate(siteId, templateId) {
  const template = await prisma.themeTemplate.findUnique({
    where: { id: templateId },
    include: { theme: true },
  });
  if (!template || template.theme.siteId !== siteId) return null;
  return template;
}

// GET /api/sites/:siteId/templates/:id — één template ophalen (voor de editor)
router.get("/:id", async (req, res) => {
  const template = await findSiteTemplate(req.params.siteId, req.params.id);
  if (!template) return res.status(404).json({ error: "Template niet gevonden." });
  res.json({ template });
});

// PUT /api/sites/:siteId/templates/:id — html/css bijwerken (GrapesJS-editor slaat hier op)
router.put("/:id", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = templateUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const existing = await findSiteTemplate(req.params.siteId, req.params.id);
  if (!existing) return res.status(404).json({ error: "Template niet gevonden." });

  const template = await prisma.themeTemplate.update({ where: { id: existing.id }, data: parsed.data });
  res.json({ template });
});

// DELETE /api/sites/:siteId/templates/:id
router.delete("/:id", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const existing = await findSiteTemplate(req.params.siteId, req.params.id);
  if (!existing) return res.status(404).json({ error: "Template niet gevonden." });
  await prisma.themeTemplate.delete({ where: { id: existing.id } });
  res.status(204).send();
});

module.exports = router;
