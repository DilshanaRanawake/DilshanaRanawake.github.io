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

