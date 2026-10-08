const header = document.querySelector("header");

window.addEventListener("scroll", function() {
    header.classList.toggle("sticky", this.window.scrollY > 120);
});

let menu = document.querySelector("#menu-icon");
let navlist = document.querySelector(".navlist");

menu.onclick = () => {
    menu.classList.toggle("bx-x");
    navlist.classList.toggle("active");
};

window.onscroll = () => {
    menu.classList.remove("bx-x");
    navlist.classList.remove("active");
};

/* ===== Centered status popup (loading / success / error) ===== */
let sending = false;
let statusTimer = 0;

function getOverlay() {
    let o = document.getElementById("status-overlay");
    if (!o) {
        o = document.createElement("div");
        o.id = "status-overlay";
        o.setAttribute("role", "alertdialog");
        o.setAttribute("aria-live", "assertive");
        o.innerHTML = `
            <div class="status-box">
                <div class="status-icon"></div>
                <h3 class="status-title"></h3>
                <p class="status-text"></p>
                <button type="button" class="btn status-ok">OK</button>
            </div>`;
        document.body.appendChild(o);
        o.querySelector(".status-ok").onclick = hideStatus;
        // click outside the box closes it, except while sending
        o.addEventListener("click", e => { if (e.target === o && !sending) hideStatus(); });
    }
    return o;
}

function hideStatus() {
    clearTimeout(statusTimer);
    getOverlay().classList.remove("show");
}

function showStatus(state, title, text = "") {
    clearTimeout(statusTimer);
    const o = getOverlay();
    const box = o.querySelector(".status-box");
    box.className = "status-box " + state;
    box.querySelector(".status-icon").innerHTML =
        state === "loading" ? '<div class="spinner"></div>'
        : state === "success" ? '<i class="fa-solid fa-circle-check"></i>'
        : '<i class="fa-solid fa-circle-xmark"></i>';
    box.querySelector(".status-title").textContent = title;
    box.querySelector(".status-text").textContent = text;
    o.classList.add("show");
    if (state === "success") statusTimer = setTimeout(hideStatus, 4000);
}

function sendEmail(params, onSuccess) {
    if (sending) return;
    sending = true;
    showStatus("loading", "Sending...", "Please wait, don't close this page.");

    emailjs.send("service_ipg7vda", "template_2r4ca7b", params)
        .then(response => {
            console.log("SUCCESS!", response.status, response.text);
            if (onSuccess) onSuccess();
            showStatus("success", "Message Sent!", "Thank you. I'll get back to you soon.");
        })
        .catch(error => {
            console.error("FAILED...", error.status, error.text);
            showStatus("error", "Sending Failed", "Something went wrong. Please try again.");
        })
        .finally(() => { sending = false; });
}

/* ===== Contact form ===== */
function sendMail(event) {
    event.preventDefault();
    const form = event.target;
    sendEmail({
        from_name: document.getElementById("name").value,
        from_email: document.getElementById("email").value,
        message: document.getElementById("message").value
    }, () => form.reset());
}

/* ===== CV request modal ===== */
const cvModal = document.getElementById("cv-modal");
const toggleCv = open => cvModal.classList.toggle("show", open);

document.getElementById("cv-open").onclick = () => toggleCv(true);
document.getElementById("cv-close").onclick = () => toggleCv(false);
cvModal.addEventListener("click", e => { if (e.target === cvModal) toggleCv(false); });

document.getElementById("cv-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (document.getElementById("cv-website").value) return; // bot

    const org = document.getElementById("cv-org").value;
    const purpose = document.getElementById("cv-purpose").value;

    sendEmail({
        from_name: document.getElementById("cv-name").value,
        from_email: document.getElementById("cv-email").value,
        message: `[CV REQUEST]\nOrganisation: ${org}\nPurpose: ${purpose}`
    }, () => { this.reset(); toggleCv(false); });
});

/* ===== Theme toggle ===== */
const root = document.documentElement;
const themeBtn = document.getElementById("theme-toggle");
const themeIcon = themeBtn.querySelector("i");

function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    themeIcon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
}

applyTheme(root.getAttribute("data-theme"));
themeBtn.onclick = () => applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");

/* ===== Skills: bento cards ===== */
document.querySelectorAll(".techskills .category").forEach(cat => {
  const skills = cat.nextElementSibling;
  const [icon, ...rest] = cat.textContent.trim().split(/\s+/);
  const card = document.createElement("div");
  card.className = "skill-card";
  card.innerHTML = `
    <div class="skill-head">
      <span class="skill-ico">${icon}</span>
      <h3 class="skill-title">${rest.join(" ")}</h3>
      <span class="skill-count">${skills.children.length}</span>
    </div>`;
  cat.before(card);
  card.append(skills);
  cat.remove();
});

/* ===== Certificates: accordion ===== */
document.querySelectorAll(".certificates-content > h3").forEach((h, i) => {
  const list = h.nextElementSibling;
  const [icon, ...rest] = h.textContent.trim().split(/\s+/);
  const card = document.createElement("details");
  card.className = "cert-card";
  if (i === 0) card.open = true;
  card.innerHTML = `
    <summary>
      <span class="cert-ico">${icon}</span>
      <span class="cert-title">${rest.join(" ")}</span>
      <span class="cert-count">${list.children.length}</span>
      <i class="fa-solid fa-chevron-down cert-chev"></i>
    </summary>`;
  h.before(card);
  card.append(list);
  h.remove();
});