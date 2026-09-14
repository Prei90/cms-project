const express = require("express");
const authRoutes = require("./auth");
const sitesRoutes = require("./sites");
const siteResourcesRoutes = require("./siteResources");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/sites", sitesRoutes);
router.use("/sites/:siteId", siteResourcesRoutes);

module.exports = router;
