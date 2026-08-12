const serverList = document.querySelector(".server-list")


async function loadServers() {
    const servers = await window.server.getServers();
    servers.forEach(server => {
        const card = document.createElement("div");
        card.classList.add("server-card");

        const title = document.createElement("h2");
        title.textContent = server.name;
        card.appendChild(title);

        const version = document.createElement("p");
        version.textContent = `${server.software} · ${server.version}`;

        card.append(title,version);
        serverList.appendChild(card);
    })
}

loadServers();