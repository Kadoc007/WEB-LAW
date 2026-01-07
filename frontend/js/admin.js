const API_URL = "http://localhost:3000/api/laws";
const CARD_API_URL = "http://localhost:3000/api/cards";
let token = "";
let editId = null;
let editCardId = null;

/* ================= LOGIN ================= */
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    }
  );

  const data = await res.json();

  if (!data.idToken) {
    alert("Login ไม่สำเร็จ");
    return;
  }

  token = data.idToken;

  document.getElementById("login-box").style.display = "none";
  document.getElementById("admin-panel").style.display = "block";

  togglePenalty();
  loadAdminLaws();
  loadAdminCards();
}

/* ================= LOGOUT ================= */
function logout() {
  if (!confirm("ต้องการออกจากระบบหรือไม่?")) return;

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

  const res = await fetch(`${API_URL}/${category}`);
  const laws = await res.json();

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
          '${law.section}',
          '${law.title}',
          \`${law.description}\`,
          '${law.penalty || ""}'
        )">✏️</button>

        <button class="danger" onclick="deleteLaw('${law.id}')">🗑</button>
      </div>

    </div>
  `;
  });
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

  const method = editId ? "PUT" : "POST";
  const url = editId
    ? `${API_URL}/${category}/${editId}`
    : `${API_URL}/${category}`;

  await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify(data)
  });

  resetForm();
  loadAdminLaws();
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

  await fetch(`${API_URL}/${category}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token
    }
  });

  loadAdminLaws();
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
    const res = await fetch(CARD_API_URL);
    const cards = await res.json();

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
    pageContent: document.getElementById("card-pageContent").value
  };

  try {
    const method = editCardId ? "PUT" : "POST";
    const url = editCardId ? `${CARD_API_URL}/${editCardId}` : CARD_API_URL;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Error saving card");
    }

    alert(editCardId ? "แก้ไขการ์ดสำเร็จ!" : "เพิ่มการ์ดสำเร็จ!");
    resetCardForm();
    loadAdminCards();
  } catch (err) {
    alert("เกิดข้อผิดพลาด: " + err.message);
  }
}

/* ================= EDIT CARD ================= */
async function editCard(id) {
  try {
    const res = await fetch(`${CARD_API_URL}/${id}`);
    if (!res.ok) throw new Error("ไม่พบการ์ด");

    const card = await res.json();

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
    const res = await fetch(`${CARD_API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) throw new Error("ลบไม่สำเร็จ");

    alert("ลบการ์ดสำเร็จ!");
    loadAdminCards();
  } catch (err) {
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
