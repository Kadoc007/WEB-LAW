import admin from "firebase-admin";

export async function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(403).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = await admin.auth().verifyIdToken(token);

    if (decoded.email !== "nattapat110803@gmail.com") {
      return res.status(403).json({ message: "Not admin" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    res.status(403).json({ message: "Unauthorized" });
  }
}
