const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireSiteRole } = require("../middleware/site");

const router = express.Router({ mergeParams: true });

const settingsSchema = z.object({
  siteName: z.string().min(1).optional(),
  logoUrl: z.string().optional().nullable(),
});

const DEFAULTS = { siteName: "Mijn website", logoUrl: null };

// GET /api/sites/:siteId/settings
router.get("/", async (req, res) => {
  const setting = await prisma.setting.findUnique({
    where: { siteId_key: { siteId: req.params.siteId, key: "general" } },
  });
  res.json({ settings: setting ? { ...DEFAULTS, ...setting.value } : DEFAULTS });
});

// PUT /api/sites/:siteId/settings
router.put("/", requireSiteRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const existing = await prisma.setting.findUnique({
    where: { siteId_key: { siteId: req.params.siteId, key: "general" } },
  });
  const newValue = { ...DEFAULTS, ...(existing ? existing.value : {}), ...parsed.data };

  const setting = await prisma.setting.upsert({
    where: { siteId_key: { siteId: req.params.siteId, key: "general" } },
    update: { value: newValue },
    create: { siteId: req.params.siteId, key: "general", value: newValue },
  });
  res.json({ settings: setting.value });
});

module.exports = router;
