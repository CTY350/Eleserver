const serverList = document.querySelector(".server-list")


async function loadServers() {
    const servers = await window.server.getServers();
    if (servers.length === 0) {
        const placeholder = document.createElement("p");

        placeholder.textContent = "You don't have any servers yet";
        placeholder.classList.add("placeholder");
        serverList.appendChild(placeholder);
    }
    for (const server of servers) {
        const card = document.createElement("div");
        const serverInfo = document.createElement("div");
        const serverIcon = document.createElement("div");
        card.classList.add("server-card");

        const title = document.createElement("h1");
        title.textContent = server.name;
        card.appendChild(title);

        const id = document.createElement("p");
        id.textContent = `#${server.id}`;
        id.classList.add("server-id")

        const version = document.createElement("div");
        const versionImage = document.createElement("img");
        const text = document.createElement("p");
        text.textContent = `${server.software} · ${server.version}`;
        versionImage.src = `../../assets/software-icons/${server.software}.png`
        versionImage.classList.add("version-icon");
        version.append(versionImage,text);

        version.classList.add("server-version");

        const image = document.createElement("img");
        let logo;
        try {
            logo = await window.server.getServerLogo(server.id)
        }
        catch (e) {
            logo = "../../assets/server-icon.png";
        }
        image.src = logo;
        serverIcon.classList.add("server-icon");
        image.classList.add("server-img");
        serverInfo.classList.add("server-info");

        serverInfo.append(title,id,version);
        serverIcon.append(image);

        card.appendChild(serverIcon);
        card.appendChild(serverInfo);
        serverList.appendChild(card);
    }
}



const overlay = document.querySelector(".overlay");
const createButton = document.querySelector(".create-button");

overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
        overlay.style.display = "none";
    }
});
createButton.addEventListener("click", () => {
    overlay.style.display = "flex";
})



const nameInput = document.querySelector("#server-name");
const softwareSelect = document.querySelector("#server-software");
const versionSelect = document.querySelector("#server-version");
const form = document.querySelector("#server-form");

nameInput.addEventListener("input", (e) => {
    if (nameInput.value === "") {
        nameInput.setCustomValidity("required");
    }
    else if (nameInput.value.length < 3) {
        nameInput.setCustomValidity("Server name must be at least 3 characters");
    } else {
        nameInput.setCustomValidity("");
    }
})



form.addEventListener("submit", (event) => {
    event.preventDefault();

    const loader = document.querySelector("#loader");
    const normalText = document.querySelector("#normal-text");
    const createButton = document.querySelector("#create-button");
    normalText.style.display = "none";
    loader.style.display = "block";
    createButton.disabled = true;
    let dots = 0;

    const interval = setInterval(() => {
        if (dots === 3) {
            dots = 0;
        }
        dots++;


        loader.textContent = "Creating " + ".".repeat(dots);
    },400);
})



loadServers();