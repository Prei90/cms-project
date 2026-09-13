const express = require("express");
const authRoutes = require("./auth");
const pageRoutes = require("./pages");
const postRoutes = require("./posts");
const categoryRoutes = require("./categories");
const mediaRoutes = require("./media");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/pages", pageRoutes);
router.use("/posts", postRoutes);
router.use("/categories", categoryRoutes);
router.use("/media", mediaRoutes);

// Volgende fase komt hier bij, bijvoorbeeld:
// router.use("/themes", themeRoutes);

module.exports = router;
