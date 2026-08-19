const id = sessionStorage.getItem("serverId");
const serverName = document.querySelector("#server-name");
const serverVersion = document.querySelector("#server-version");



async function loadInfos() {
    const serverInfo = await window.server.getServerInfo(id);

    serverName.textContent = serverInfo.name;
    serverVersion.textContent = `${serverInfo.software}· ${serverInfo.version}`;

}


loadInfos();