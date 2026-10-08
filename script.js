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
    menu.classList.remove("bx-x");  // Fixed this line
    navlist.classList.remove("active");  // Fixed this line
};


function sendMail(event) {
    event.preventDefault(); // Prevent form submission refresh

    let params = {
        from_name: document.getElementById("name").value,  // Match ID in HTML
        from_email: document.getElementById("email").value, // Match ID in HTML
        message: document.getElementById("message").value
    };

    emailjs.send("service_ipg7vda", "template_2r4ca7b", params)
        .then(function(response) {
            alert("Email Sent Successfully!");
            console.log("SUCCESS!", response.status, response.text);
        })
        .catch(function(error) {
            alert("Email failed to send.");
            console.error("FAILED...", error);
        });
}

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

    emailjs.send("service_ipg7vda", "template_2r4ca7b", {
        from_name: document.getElementById("cv-name").value,
        from_email: document.getElementById("cv-email").value,
        message: `[CV REQUEST]\nOrganisation: ${org}\nPurpose: ${purpose}`
    })
    .then(() => { alert("Request sent. I'll get back to you by email."); this.reset(); toggleCv(false); })
    .catch(err => { alert("Could not send the request. Please try again."); console.error(err); });
});
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