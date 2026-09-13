const jwt = require("jsonwebtoken");

/**
 * Verifieert het JWT uit de Authorization-header ("Bearer <token>").
 * Zet bij succes `req.user = { id, role }`.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Geen token meegestuurd." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Ongeldig of verlopen token." });
  }
}

/**
 * Maakt een middleware die alleen de opgegeven rollen toelaat.
 * Gebruik: requireRole("ADMIN"), requireRole("ADMIN", "EDITOR")
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Niet ingelogd." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Geen toestemming voor deze actie." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
