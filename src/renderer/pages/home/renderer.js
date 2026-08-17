const serverList = document.querySelector(".server-list")


async function loadServers() {
    serverList.replaceChildren();
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




async function updateVersions() {
    const software = softwareSelect.value;
    let versions;
    switch (software) {
        case "vanilla": {
            versions = await window.version.getVanillaVersions();
            break;
        }
        case "fabric": {
            versions = await window.version.getFabricVersions();
            break;
        }
        case "paper": {
            versions = await window.version.getPurpurVersions();
            break;
        }
        case "purpur": {
            versions = await window.version.getPurpurVersions();
            break;
        }
        case "forge": {
            versions = await window.version.getForgeVersions();
            break;
        }
    }
    versionSelect.replaceChildren();
    for (const version of versions) {
        const option = document.createElement("option");
        option.textContent = version.version;
        option.value = version.version;
        versionSelect.appendChild(option);
    }
}

softwareSelect.addEventListener("change", async () => {
    updateVersions();

})


form.addEventListener("submit", async (event) => {
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

    const data = new FormData(event.target);

    nameInput.disabled = true;
    softwareSelect.disabled = true;
    versionSelect.disabled = true;


    await window.server.createServer(data.get("serverName").trim(),data.get("serverSoftware"),data.get("serverVersion"),{acceptEula: true});

    loadServers();
    overlay.style.display = "none";

    nameInput.disabled = false;
    softwareSelect.disabled = false;
    versionSelect.disabled = false;

    createButton.disabled = false;

    clearInterval(interval);

    normalText.style.display = "inline";
    loader.style.display = "none";
    form.reset();
});


updateVersions();
loadServers();