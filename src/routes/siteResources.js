const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { loadSiteMembership } = require("../middleware/site");
const pageRoutes = require("./pages");
const postRoutes = require("./posts");
const categoryRoutes = require("./categories");
const mediaRoutes = require("./media");
const themeRoutes = require("./themes");
const templateRoutes = require("./templates");
const menuRoutes = require("./menus");
const settingsRoutes = require("./settings");

const router = express.Router({ mergeParams: true });

// Elke aanvraag onder /api/sites/:siteId/... vereist een ingelogde gebruiker
// die lid is van die site. Individuele routes checken daarna zelf hun rol.
router.use(requireAuth, loadSiteMembership);

router.use("/pages", pageRoutes);
router.use("/posts", postRoutes);
router.use("/categories", categoryRoutes);
router.use("/media", mediaRoutes);
router.use("/themes", themeRoutes);
router.use("/templates", templateRoutes);
router.use("/menus", menuRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
