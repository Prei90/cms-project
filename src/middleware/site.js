const prisma = require("../lib/prisma");

/**
 * Vereist dat de gebruiker lid is van de site uit de URL (:siteId).
 * SUPERADMIN heeft altijd toegang, met effectieve rol ADMIN.
 * Zet bij succes `req.site` en `req.siteRole`.
 */
async function loadSiteMembership(req, res, next) {
  const { siteId } = req.params;
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) {
    return res.status(404).json({ error: "Website niet gevonden." });
  }
  req.site = site;

  if (req.user.role === "SUPERADMIN") {
    req.siteRole = "ADMIN";
    return next();
  }

  const membership = await prisma.siteUser.findUnique({
    where: { siteId_userId: { siteId, userId: req.user.id } },
  });
  if (!membership) {
    return res.status(403).json({ error: "Je hebt geen toegang tot deze website." });
  }
  req.siteRole = membership.role;
  next();
}

/**
 * Maakt een middleware die alleen bepaalde site-rollen toelaat.
 * Gebruik ná loadSiteMembership: requireSiteRole("ADMIN"), requireSiteRole("ADMIN","EDITOR")
 */
function requireSiteRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.siteRole || !allowedRoles.includes(req.siteRole)) {
      return res.status(403).json({ error: "Onvoldoende rechten voor deze actie op deze website." });
    }
    next();
  };
}

module.exports = { loadSiteMembership, requireSiteRole };
