const navbar = document.querySelector("#navbar");

const homeBar = document.querySelector("#home-bar");
const consoleBar = document.querySelector("#console-bar");

const homePage = document.querySelector("#home-page");
const consolePage = document.querySelector("#console-page");

function changePage(page) {
    if (page === "home") {
        homePage.style.display = "flex";
        consolePage.style.display = "none";
    }
    else if (page === "console") {
        consolePage.style.display = "flex";
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