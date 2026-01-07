// backend/routes/cardRoutes.js
import express from "express";
import { db } from "../firebaseAdmin.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// GET /api/cards               -> ดึงทุก card (optionally by category)
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let q = db.collection("cards").orderBy("createdAt", "desc");
    if (category) q = q.where("category", "==", category);
    const snap = await q.get();
    const cards = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cards/:id
router.get("/:id", async (req, res) => {
  try {
    const doc = await db.collection("cards").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ message: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cards  (admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const { title, subtitle, description, imageUrl, slug, pageContent, category } = req.body;
    if (!title) return res.status(400).json({ message: "title required" });
    const now = new Date();
    const data = { title, subtitle: subtitle || "", description: description || "", imageUrl: imageUrl || "", slug: slug || "", pageContent: pageContent || "", category: category || "", createdAt: now, updatedAt: now };
    const docRef = await db.collection("cards").add(data);
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/cards/:id (admin only)
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const { title, subtitle, description, imageUrl, slug, pageContent, category } = req.body;
    const id = req.params.id;
    const docRef = db.collection("cards").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: "Not found" });
    const data = {};
    if (title !== undefined) data.title = title;
    if (subtitle !== undefined) data.subtitle = subtitle;
    if (description !== undefined) data.description = description;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (slug !== undefined) data.slug = slug;
    if (pageContent !== undefined) data.pageContent = pageContent;
    if (category !== undefined) data.category = category;
    data.updatedAt = new Date();
    await docRef.update(data);
    res.json({ message: "updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cards/:id (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const docRef = db.collection("cards").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: "Not found" });
    await docRef.delete();
    res.json({ message: "deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
