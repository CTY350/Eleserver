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






loadServers();