const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { uniqueSlug } = require("../lib/uniqueSlug");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const postSchema = z.object({
  title: z.string().min(1, "Titel is verplicht."),
  content: z.any().optional(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  tagIds: z.array(z.string()).optional(),
});

async function slugExists(slug, ignoreId) {
  const existing = await prisma.post.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== ignoreId);
}

function canManage(user, post) {
  return user.role === "ADMIN" || user.role === "EDITOR" || post.authorId === user.id;
}

// GET /api/posts — lijst, optioneel ?status= en ?categoryId=
router.get("/", async (req, res) => {
  const { status, categoryId } = req.query;
  const posts = await prisma.post.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    include: { author: { select: { id: true, name: true, email: true } }, category: true, tags: { include: { tag: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ posts });
});

// GET /api/posts/:id
router.get("/:id", async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { author: { select: { id: true, name: true, email: true } }, category: true, tags: { include: { tag: true } } },
  });
  if (!post) return res.status(404).json({ error: "Post niet gevonden." });
  res.json({ post });
});

// POST /api/posts — elke ingelogde gebruiker mag een eigen post aanmaken
router.post("/", requireAuth, async (req, res) => {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { title, content, categoryId, status, tagIds } = parsed.data;

  const slug = await uniqueSlug(title, slugExists);

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content: content ?? {},
      categoryId: categoryId || null,
      status: status || "DRAFT",
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      authorId: req.user.id,
      tags: tagIds && tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
    include: { tags: { include: { tag: true } } },
  });
  res.status(201).json({ post });
});

// PUT /api/posts/:id — eigenaar of admin/editor
router.put("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Post niet gevonden." });
  if (!canManage(req.user, existing)) {
    return res.status(403).json({ error: "Je mag alleen je eigen posts bewerken." });
  }

  const parsed = postSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { title, content, categoryId, status, tagIds } = parsed.data;

  const data = {};
  if (title) {
    data.title = title;
    if (title !== existing.title) {
      data.slug = await uniqueSlug(title, slugExists, existing.id);
    }
  }
  if (content !== undefined) data.content = content;
  if (categoryId !== undefined) data.categoryId = categoryId || null;
  if (status !== undefined) {
    data.status = status;
    if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      data.publishedAt = new Date();
    }
  }
  if (tagIds !== undefined) {
    await prisma.postTag.deleteMany({ where: { postId: existing.id } });
    data.tags = { create: tagIds.map((tagId) => ({ tagId })) };
  }

  const post = await prisma.post.update({
    where: { id: req.params.id },
    data,
    include: { tags: { include: { tag: true } } },
  });
  res.json({ post });
});

// DELETE /api/posts/:id — eigenaar of admin/editor
router.delete("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Post niet gevonden." });
  if (!canManage(req.user, existing)) {
    return res.status(403).json({ error: "Je mag alleen je eigen posts verwijderen." });
  }

  await prisma.post.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = router;
