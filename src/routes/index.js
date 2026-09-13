const express = require("express");
const authRoutes = require("./auth");
const pageRoutes = require("./pages");
const postRoutes = require("./posts");
const categoryRoutes = require("./categories");
const mediaRoutes = require("./media");
const themeRoutes = require("./themes");
const templateRoutes = require("./templates");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/pages", pageRoutes);
router.use("/posts", postRoutes);
router.use("/categories", categoryRoutes);
router.use("/media", mediaRoutes);
router.use("/themes", themeRoutes);
router.use("/templates", templateRoutes);

module.exports = router;
