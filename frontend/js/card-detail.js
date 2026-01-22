// card-detail.js - แสดงรายละเอียดการ์ด (Firebase Direct Access)

// Category labels mapping
const categoryLabels = {
    help: "ศูนย์ช่วยเหลือ",
    article: "บทความ",
    resource: "แหล่งข้อมูล"
};

// ดึง parameter จาก URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        id: params.get("id"),
        slug: params.get("slug")
    };
}

// โหลดข้อมูลการ์ด
async function loadCardDetail() {
    const { id, slug } = getUrlParams();

    if (!id && !slug) {
        showError("ไม่พบข้อมูลการ์ด");
        return;
    }

    try {
        let card = null;

        if (id) {
            // ดึงการ์ดตาม ID
            const doc = await db.collection("cards").doc(id).get();
            if (!doc.exists) throw new Error("Not found");
            card = { id: doc.id, ...doc.data() };
        } else if (slug) {
            // ดึงการ์ดตาม slug
            const snapshot = await db.collection("cards").where("slug", "==", slug).get();
            if (snapshot.empty) throw new Error("Not found");
            const doc = snapshot.docs[0];
            card = { id: doc.id, ...doc.data() };
        }

        displayCard(card);

    } catch (err) {
        console.error("Error loading card:", err);
        showError("ไม่พบข้อมูลการ์ด หรือเกิดข้อผิดพลาด");
    }
}

// แสดงข้อมูลการ์ด
function displayCard(card) {
    document.title = card.title + " - คลังกฎหมาย IT";

    // Hero section
    const heroImage = document.getElementById("card-image");
    if (heroImage) {
        heroImage.src = card.imageUrl || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900";
        heroImage.alt = card.title;
    }

    const titleEl = document.getElementById("card-title");
    if (titleEl) titleEl.textContent = card.title;

    const subtitleEl = document.getElementById("card-subtitle");
    if (subtitleEl) {
        if (card.subtitle) {
            subtitleEl.textContent = card.subtitle;
            subtitleEl.style.display = "block";
        } else {
            subtitleEl.style.display = "none";
        }
    }

    const categoryBadge = document.getElementById("card-category-badge");
    if (categoryBadge) {
        if (card.category && categoryLabels[card.category]) {
            categoryBadge.textContent = categoryLabels[card.category];
        } else {
            categoryBadge.style.display = "none";
        }
    }

    // Description
    const descEl = document.getElementById("card-description");
    if (descEl) {
        if (card.description) {
            descEl.textContent = card.description;
        } else {
            descEl.style.display = "none";
        }
    }

    // Page Content (HTML)
    const contentEl = document.getElementById("card-content");
    if (contentEl) {
        if (card.pageContent) {
            contentEl.innerHTML = card.pageContent;
        } else {
            contentEl.innerHTML = "<p style='color:#888;text-align:center;'>ไม่มีเนื้อหาเพิ่มเติม</p>";
        }
    }
}

// แสดง error
function showError(message) {
    const hero = document.getElementById("card-hero");
    if (hero) hero.style.display = "none";

    const body = document.querySelector(".card-body");
    if (body) {
        body.innerHTML = `
      <div class="error-message">
        <h2>😕 ไม่พบข้อมูล</h2>
        <p>${message}</p>
        <a href="home.html" class="back-btn" style="margin-top:20px;">← กลับหน้าแรก</a>
      </div>
    `;
    }
}

document.addEventListener("DOMContentLoaded", loadCardDetail);
