// admin.js - Admin Panel (Firebase Direct Access)

let token = "";
let editId = null;
let editCardId = null;

/* ================= LOGIN ================= */
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    // ใช้ Firebase Auth SDK โดยตรง
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    token = await userCredential.user.getIdToken();

    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";

    togglePenalty();
    loadAdminLaws();
    loadAdminCards();
  } catch (err) {
    console.error("Login error:", err);
    alert("Login ไม่สำเร็จ: " + err.message);
  }
}

/* ================= LOGOUT ================= */
function logout() {
  if (!confirm("ต้องการออกจากระบบหรือไม่?")) return;

  auth.signOut();
  token = "";
  editId = null;
  editCardId = null;

  document.getElementById("admin-panel").style.display = "none";
  document.getElementById("login-box").style.display = "block";
  document.getElementById("admin-laws").innerHTML = "";
  document.getElementById("admin-cards").innerHTML = "";

  resetForm();
  resetCardForm();
}

/* ================= TABS ================= */
function showTab(tabName) {
  // อัพเดท buttons
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("active");
    if (btn.textContent.toLowerCase().includes(tabName === "laws" ? "กฎหมาย" : "การ์ด")) {
      btn.classList.add("active");
    }
  });

  // อัพเดท contents
  document.querySelectorAll(".tab-content").forEach(content => {
    content.classList.remove("active");
  });
  document.getElementById(`tab-${tabName}`).classList.add("active");

  // โหลดข้อมูลตาม tab
  if (tabName === "laws") {
    loadAdminLaws();
  } else if (tabName === "cards") {
    loadAdminCards();
  }
}

/* ================= TOGGLE PENALTY ================= */
function togglePenalty() {
  const category = document.getElementById("category").value;
  const penaltyInput = document.getElementById("penalty");

  if (category === "privacy") {
    penaltyInput.style.display = "none";
    penaltyInput.value = "";
  } else {
    penaltyInput.style.display = "block";
  }
}

/* ================= LOAD LAWS ================= */
async function loadAdminLaws() {
  const category = document.getElementById("category").value;

  togglePenalty();

  try {
    // เรียก Firebase Firestore โดยตรง
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

    const div = document.getElementById("admin-laws");
    div.innerHTML = "";

    laws.forEach(law => {
      div.innerHTML += `
      <div class="law-item">

        <div class="law-text">
          <b>${law.section}</b> - ${law.title}
        </div>

        <div class="action-buttons">
          <button class="edit-btn" onclick="editLaw(
            '${law.id}',
            '${escapeForOnClick(law.section)}',
            '${escapeForOnClick(law.title)}',
            '${escapeForOnClick(law.description)}',
            '${escapeForOnClick(law.penalty || "")}'
          )">✏️</button>

          <button class="danger" onclick="deleteLaw('${law.id}')">🗑</button>
        </div>

      </div>
    `;
    });

    if (laws.length === 0) {
      div.innerHTML = "<p style='text-align:center; color:#888;'>ยังไม่มีข้อมูลกฎหมาย</p>";
    }
  } catch (err) {
    console.error("Error loading laws:", err);
  }
}

// Helper function to escape strings for onclick
function escapeForOnClick(str) {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

/* ================= ADD / EDIT LAW ================= */
async function saveLaw() {
  if (!token) {
    alert("กรุณา Login ก่อน");
    return;
  }

  const category = document.getElementById("category").value;

  const data = {
    section: section.value,
    title: title.value,
    description: description.value
  };

  // ส่ง penalty เฉพาะหมวดที่มีโทษ
  if (category !== "privacy") {
    data.penalty = penalty.value;
  }

  try {
    const collectionRef = db.collection("law").doc(category).collection("items");

    if (editId) {
      // แก้ไข
      await collectionRef.doc(editId).update(data);
      alert("แก้ไขข้อมูลสำเร็จ!");
    } else {
      // เพิ่มใหม่
      await collectionRef.add(data);
      alert("เพิ่มข้อมูลสำเร็จ!");
    }

    resetForm();
    loadAdminLaws();
  } catch (err) {
    console.error("Error saving law:", err);
    alert("เกิดข้อผิดพลาด: " + err.message);
  }
}

/* ================= EDIT LAW ================= */
function editLaw(id, sec, titleVal, desc, pen) {
  editId = id;
  section.value = sec;
  title.value = titleVal;
  description.value = desc;
  penalty.value = pen || "";
  saveBtn.innerText = "บันทึกการแก้ไข";

  togglePenalty();
}

/* ================= DELETE LAW ================= */
async function deleteLaw(id) {
  if (!token) return;
  if (!confirm("ยืนยันการลบ?")) return;

  const category = document.getElementById("category").value;

  try {
    await db.collection("law").doc(category).collection("items").doc(id).delete();
    alert("ลบข้อมูลสำเร็จ!");
    loadAdminLaws();
  } catch (err) {
    console.error("Error deleting law:", err);
    alert("เกิดข้อผิดพลาด: " + err.message);
  }
}

/* ================= RESET LAW FORM ================= */
function resetForm() {
  editId = null;
  section.value = "";
  title.value = "";
  description.value = "";
  penalty.value = "";
  saveBtn.innerText = "เพิ่มข้อมูล";

  togglePenalty();
}

/* ===================================================================== */
/*                           CARD MANAGEMENT                              */
/* ===================================================================== */

/* ================= LOAD CARDS ================= */
async function loadAdminCards() {
  try {
    // เรียก Firebase Firestore โดยตรง
    const snapshot = await db.collection("cards").orderBy("createdAt", "desc").get();
    const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const container = document.getElementById("admin-cards");
    container.innerHTML = "";

    if (cards.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:#888;">ยังไม่มีการ์ด</p>`;
      return;
    }

    cards.forEach(card => {
      const imgSrc = card.imageUrl || "https://via.placeholder.com/80x60?text=No+Image";
      const categoryBadge = card.category ? `<span class="card-item-category">${getCategoryLabel(card.category)}</span>` : "";

      container.innerHTML += `
        <div class="card-item">
          <img class="card-item-image" src="${imgSrc}" alt="${card.title}" onerror="this.src='https://via.placeholder.com/80x60?text=No+Image'">
          <div class="card-item-info">
            <div class="card-item-title">${card.title}</div>
            <div class="card-item-subtitle">${card.subtitle || card.description || "-"}</div>
            ${categoryBadge}
          </div>
          <div class="action-buttons">
            <button class="edit-btn" onclick="editCard('${card.id}')">✏️</button>
            <button class="danger" onclick="deleteCard('${card.id}')">🗑</button>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error loading cards:", err);
  }
}

/* ================= HELPER: Category Label ================= */
function getCategoryLabel(category) {
  const labels = {
    help: "ศูนย์ช่วยเหลือ",
    article: "บทความ",
    resource: "แหล่งข้อมูล"
  };
  return labels[category] || category;
}

/* ================= SAVE CARD ================= */
async function saveCard() {
  if (!token) {
    alert("กรุณา Login ก่อน");
    return;
  }

  const titleVal = document.getElementById("card-title").value.trim();
  if (!titleVal) {
    alert("กรุณากรอกหัวข้อ");
    return;
  }

  const data = {
    title: titleVal,
    subtitle: document.getElementById("card-subtitle").value.trim(),
    description: document.getElementById("card-description").value.trim(),
    imageUrl: document.getElementById("card-imageUrl").value.trim(),
    slug: document.getElementById("card-slug").value.trim(),
    category: document.getElementById("card-category").value,
    pageContent: document.getElementById("card-pageContent").value,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    if (editCardId) {
      // แก้ไข
      await db.collection("cards").doc(editCardId).update(data);
      alert("แก้ไขการ์ดสำเร็จ!");
    } else {
      // เพิ่มใหม่
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("cards").add(data);
      alert("เพิ่มการ์ดสำเร็จ!");
    }

    resetCardForm();
    loadAdminCards();
  } catch (err) {
    console.error("Error saving card:", err);
    alert("เกิดข้อผิดพลาด: " + err.message);
  }
}

/* ================= EDIT CARD ================= */
async function editCard(id) {
  try {
    const doc = await db.collection("cards").doc(id).get();
    if (!doc.exists) throw new Error("ไม่พบการ์ด");

    const card = doc.data();

    editCardId = id;
    document.getElementById("card-title").value = card.title || "";
    document.getElementById("card-subtitle").value = card.subtitle || "";
    document.getElementById("card-description").value = card.description || "";
    document.getElementById("card-imageUrl").value = card.imageUrl || "";
    document.getElementById("card-slug").value = card.slug || "";
    document.getElementById("card-category").value = card.category || "";
    document.getElementById("card-pageContent").value = card.pageContent || "";

    document.getElementById("saveCardBtn").innerText = "💾 บันทึกการแก้ไข";
    document.getElementById("cancelCardBtn").style.display = "inline-block";

    // แสดง preview
    previewImage();

    // เลื่อนขึ้นไปที่ form
    document.getElementById("tab-cards").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    alert("เกิดข้อผิดพลาด: " + err.message);
  }
}

/* ================= DELETE CARD ================= */
async function deleteCard(id) {
  if (!token) return;
  if (!confirm("ยืนยันการลบการ์ดนี้?")) return;

  try {
    await db.collection("cards").doc(id).delete();
    alert("ลบการ์ดสำเร็จ!");
    loadAdminCards();
  } catch (err) {
    console.error("Error deleting card:", err);
    alert("เกิดข้อผิดพลาด: " + err.message);
  }
}

/* ================= RESET CARD FORM ================= */
function resetCardForm() {
  editCardId = null;
  document.getElementById("card-title").value = "";
  document.getElementById("card-subtitle").value = "";
  document.getElementById("card-description").value = "";
  document.getElementById("card-imageUrl").value = "";
  document.getElementById("card-slug").value = "";
  document.getElementById("card-category").value = "";
  document.getElementById("card-pageContent").value = "";

  document.getElementById("saveCardBtn").innerText = "➕ เพิ่มการ์ด";
  document.getElementById("cancelCardBtn").style.display = "none";
  document.getElementById("image-preview").innerHTML = "";
}

/* ================= IMAGE PREVIEW ================= */
function previewImage() {
  const url = document.getElementById("card-imageUrl").value.trim();
  const preview = document.getElementById("image-preview");

  if (url) {
    preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.style.display='none'">`;
  } else {
    preview.innerHTML = "";
  }
}

// เพิ่ม event listener สำหรับ preview รูปภาพ
document.addEventListener("DOMContentLoaded", () => {
  const imageInput = document.getElementById("card-imageUrl");
  if (imageInput) {
    imageInput.addEventListener("blur", previewImage);
  }
});
