const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
const { loadSiteMembership, requireSiteRole } = require("../middleware/site");

const router = express.Router();

const siteSchema = z.object({
  name: z.string().min(1, "Naam is verplicht."),
  domain: z
    .string()
    .min(1, "Domein is verplicht.")
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Vul een geldig domein in, bv. mijnsite.nl (zonder https://)."),
});

const memberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "EDITOR", "AUTHOR"]).default("AUTHOR"),
});

// GET /api/sites — sites waar de gebruiker lid van is (SUPERADMIN ziet alles)
router.get("/", requireAuth, async (req, res) => {
  if (req.user.role === "SUPERADMIN") {
    const sites = await prisma.site.findMany({ orderBy: { createdAt: "desc" } });
    return res.json({ sites: sites.map((s) => ({ ...s, myRole: "ADMIN" })) });
  }

  const memberships = await prisma.siteUser.findMany({
    where: { userId: req.user.id },
    include: { site: true },
    orderBy: { createdAt: "desc" },
  });
  const sites = memberships.map((m) => ({ ...m.site, myRole: m.role }));
  res.json({ sites });
});

// POST /api/sites — nieuwe site aanmaken; de aanmaker wordt automatisch ADMIN van die site
router.post("/", requireAuth, async (req, res) => {
  const parsed = siteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, domain } = parsed.data;

  const existing = await prisma.site.findUnique({ where: { domain } });
  if (existing) {
    return res.status(409).json({ error: "Er bestaat al een website met dit domein." });
  }

  const site = await prisma.site.create({
    data: {
      name,
      domain,
      members: { create: { userId: req.user.id, role: "ADMIN" } },
    },
  });
  res.status(201).json({ site: { ...site, myRole: "ADMIN" } });
});

// GET /api/sites/:siteId — details van één site
router.get("/:siteId", requireAuth, loadSiteMembership, async (req, res) => {
  res.json({ site: { ...req.site, myRole: req.siteRole } });
});

// PUT /api/sites/:siteId — naam/domein bijwerken
router.put(
  "/:siteId",
  requireAuth,
  loadSiteMembership,
  requireSiteRole("ADMIN"),
  async (req, res) => {
    const parsed = siteSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    if (parsed.data.domain && parsed.data.domain !== req.site.domain) {
      const existing = await prisma.site.findUnique({ where: { domain: parsed.data.domain } });
      if (existing) {
        return res.status(409).json({ error: "Er bestaat al een website met dit domein." });
      }
    }
    const site = await prisma.site.update({ where: { id: req.site.id }, data: parsed.data });
    res.json({ site });
  }
);

// DELETE /api/sites/:siteId
router.delete(
  "/:siteId",
  requireAuth,
  loadSiteMembership,
  requireSiteRole("ADMIN"),
  async (req, res) => {
    await prisma.site.delete({ where: { id: req.site.id } });
    res.status(204).send();
  }
);

// GET /api/sites/:siteId/users — leden van deze site
router.get(
  "/:siteId/users",
  requireAuth,
  loadSiteMembership,
  requireSiteRole("ADMIN"),
  async (req, res) => {
    const members = await prisma.siteUser.findMany({
      where: { siteId: req.site.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json({ members });
  }
);

// POST /api/sites/:siteId/users — bestaande gebruiker (op e-mail) toevoegen aan deze site
router.post(
  "/:siteId/users",
  requireAuth,
  loadSiteMembership,
  requireSiteRole("ADMIN"),
  async (req, res) => {
    const parsed = memberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email, role } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        error: "Geen gebruiker gevonden met dit e-mailadres. Diegene moet eerst zelf een account registreren.",
      });
    }

    const existing = await prisma.siteUser.findUnique({
      where: { siteId_userId: { siteId: req.site.id, userId: user.id } },
    });
    if (existing) {
      return res.status(409).json({ error: "Deze gebruiker heeft al toegang tot deze website." });
    }

    const membership = await prisma.siteUser.create({
      data: { siteId: req.site.id, userId: user.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ member: membership });
  }
);

// PUT /api/sites/:siteId/users/:userId — rol van een lid wijzigen
router.put(
  "/:siteId/users/:userId",
  requireAuth,
  loadSiteMembership,
  requireSiteRole("ADMIN"),
  async (req, res) => {
    const parsed = z.object({ role: z.enum(["ADMIN", "EDITOR", "AUTHOR"]) }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const membership = await prisma.siteUser.findUnique({
      where: { siteId_userId: { siteId: req.site.id, userId: req.params.userId } },
    });
    if (!membership) return res.status(404).json({ error: "Lid niet gevonden." });

    const updated = await prisma.siteUser.update({
      where: { id: membership.id },
      data: { role: parsed.data.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ member: updated });
  }
);

// DELETE /api/sites/:siteId/users/:userId — lid verwijderen van deze site
router.delete(
  "/:siteId/users/:userId",
  requireAuth,
  loadSiteMembership,
  requireSiteRole("ADMIN"),
  async (req, res) => {
    const membership = await prisma.siteUser.findUnique({
      where: { siteId_userId: { siteId: req.site.id, userId: req.params.userId } },
    });
    if (!membership) return res.status(404).json({ error: "Lid niet gevonden." });

    if (membership.userId === req.user.id && req.user.role !== "SUPERADMIN") {
      const adminCount = await prisma.siteUser.count({ where: { siteId: req.site.id, role: "ADMIN" } });
      if (membership.role === "ADMIN" && adminCount <= 1) {
        return res.status(400).json({ error: "Je kunt jezelf niet verwijderen als laatste ADMIN van deze website." });
      }
    }

    await prisma.siteUser.delete({ where: { id: membership.id } });
    res.status(204).send();
  }
);

module.exports = router;
