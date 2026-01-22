// viewer.js - ดูกฎหมายตามหมวด (Firebase Direct Access)

// ดึง category จาก query string
const params = new URLSearchParams(window.location.search);
const category = params.get("category");

if (!category) {
  document.getElementById("law-list").innerHTML =
    "<p>ไม่พบหมวดกฎหมาย</p>";
  throw new Error("No category");
}

// เปลี่ยนชื่อหัวข้อ
const titles = {
  computer: "กฎหมายคอมพิวเตอร์",
  privacy: "กฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA)",
  copyright: "กฎหมายลิขสิทธิ์"
};

document.getElementById("law-title").innerText =
  titles[category] || "กฎหมาย";

async function loadLaws() {
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

    const container = document.getElementById("law-list");
    container.innerHTML = "";

    laws.forEach(law => {
      const div = document.createElement("div");
      div.className = "law-card";

      let penaltyHTML = "";
      if (law.penalty && law.penalty.trim() !== "") {
        penaltyHTML = `<div class="penalty">โทษ: ${law.penalty}</div>`;
      }

      div.innerHTML = `
        <h3>${law.section} : ${law.title}</h3>
        <p>${law.description}</p>
        ${penaltyHTML}
      `;

      container.appendChild(div);
    });

    if (laws.length === 0) {
      container.innerHTML = "<p>ไม่มีข้อมูลกฎหมายในหมวดนี้</p>";
    }

  } catch (err) {
    console.error("Error loading laws:", err);
    document.getElementById("law-list").innerHTML =
      "<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>";
  }
}

loadLaws();
