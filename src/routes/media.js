const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const prisma = require("../lib/prisma");

const router = express.Router({ mergeParams: true });

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Bestandstype niet toegestaan."));
    }
    cb(null, true);
  },
});

// POST /api/sites/:siteId/media/upload
router.post("/upload", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Geen bestand meegestuurd (veldnaam 'file')." });
    }

    const media = await prisma.media.create({
      data: {
        siteId: req.params.siteId,
        filename: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        uploadedById: req.user.id,
      },
    });
    res.status(201).json({ media });
  });
});

// GET /api/sites/:siteId/media
router.get("/", async (req, res) => {
  const media = await prisma.media.findMany({
    where: { siteId: req.params.siteId },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  });
  res.json({ media });
});

// DELETE /api/sites/:siteId/media/:id — eigenaar of site-ADMIN
router.delete("/:id", async (req, res) => {
  const existing = await prisma.media.findFirst({ where: { id: req.params.id, siteId: req.params.siteId } });
  if (!existing) return res.status(404).json({ error: "Bestand niet gevonden." });

  if (req.siteRole !== "ADMIN" && existing.uploadedById !== req.user.id) {
    return res.status(403).json({ error: "Je mag alleen je eigen bestanden verwijderen." });
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(existing.path));
  fs.unlink(filePath, () => {});

  await prisma.media.delete({ where: { id: existing.id } });
  res.status(204).send();
});

module.exports = router;
