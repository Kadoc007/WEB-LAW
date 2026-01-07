import express from "express";
import { db } from "../firebaseAdmin.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

/**
 * GET /api/laws/:category
 * ดูกฎหมายตามหมวด
 */
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const snapshot = await db
      .collection("law")
      .doc(category)
      .collection("items")
      .orderBy("section")
      .get();

    const laws = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(laws);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/laws/:category/:id
 * ดูกฎหมายรายตัว
 */
router.get("/:category/:id", async (req, res) => {
  try {
    const { category, id } = req.params;

    const docRef = db
      .collection("law")
      .doc(category)
      .collection("items")
      .doc(id);

    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: "ไม่พบข้อมูลกฎหมาย" });
    }

    res.json({
      id: docSnap.id,
      ...docSnap.data()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/laws/:category
 * เพิ่มข้อมูล (admin เท่านั้น)
 */
router.post("/:category", adminAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const { section, title, description, penalty } = req.body;

    // ตรวจข้อมูลพื้นฐาน
    if (!section || !title || !description) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    // หมวดอื่นที่ไม่ใช่ privacy ต้องมี penalty
    if (category !== "privacy" && !penalty) {
      return res.status(400).json({ message: "กรุณากรอกโทษ" });
    }

    const data = {
      section,
      title,
      description
    };

    // เพิ่ม penalty เฉพาะหมวดที่มี
    if (category !== "privacy") {
      data.penalty = penalty;
    }

    await db
      .collection("law")
      .doc(category)
      .collection("items")
      .add(data);

    res.status(201).json({ message: "เพิ่มข้อมูลกฎหมายสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/laws/:category/:id
 * แก้ไขข้อมูล (admin เท่านั้น)
 */
router.put("/:category/:id", adminAuth, async (req, res) => {
  try {
    const { category, id } = req.params;
    const { section, title, description, penalty } = req.body;

    if (!section || !title || !description) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    if (category !== "privacy" && !penalty) {
      return res.status(400).json({ message: "กรุณากรอกโทษ" });
    }

    const docRef = db
      .collection("law")
      .doc(category)
      .collection("items")
      .doc(id);

    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: "ไม่พบข้อมูลกฎหมาย" });
    }

    const data = {
      section,
      title,
      description
    };

    if (category !== "privacy") {
      data.penalty = penalty;
    }

    await docRef.update(data);

    res.json({ message: "แก้ไขข้อมูลกฎหมายสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/laws/:category/:id
 * ลบข้อมูล (admin เท่านั้น)
 */
router.delete("/:category/:id", adminAuth, async (req, res) => {
  try {
    const { category, id } = req.params;

    const docRef = db
      .collection("law")
      .doc(category)
      .collection("items")
      .doc(id);

    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: "ไม่พบข้อมูลกฎหมาย" });
    }

    await docRef.delete();

    res.json({ message: "ลบข้อมูลกฎหมายสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
