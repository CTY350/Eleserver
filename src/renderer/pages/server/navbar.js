const navbar = document.querySelector("#navbar");

const homeBar = document.querySelector("#home");
const consoleBar = document.querySelector("#console");

const homePage = document.querySelector("#home-page");
const consolePage = document.querySelector("#console-page");

function changePage(page) {
    if (page === "home") {
        homePage.style.display = "block";
        consolePage.style.display = "none";
    }
    else if (page === "console") {
        consolePage.style.display = "block";
        homePage.style.display = "none";
    }
    else {
        throw new Error(`Page ${page} not found`);
    }
}

homeBar.addEventListener("click", () => {
    changePage("home");
});
consoleBar.addEventListener("click", () => {
    changePage("console");
});