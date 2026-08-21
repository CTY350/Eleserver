const id = sessionStorage.getItem("serverId");

const serverName = document.querySelector("#server-name");
const serverVersion = document.querySelector("#server-version");

const statusBar = document.querySelector("#server-status");
const statusText = document.querySelector("#server-status-text");
const statusIcon = document.querySelector("#server-status-icon");

const startButton  = document.querySelector("#start-button");
const buttonIcon = document.querySelector("#button-icon");
const buttonText = document.querySelector("#button-text");

function setStatus(status) {
    if (status === "offline") {
        statusBar.classList.remove("online", "loading");
        statusBar.classList.add("offline");

        statusText.innerText = "Offline";
        statusIcon.src = "../../assets/status-icons/offline.svg";
    }
    else if (status === "online") {
        statusBar.classList.remove("offline", "loading");
        statusBar.classList.add("online");

        statusText.innerText = "Online";
        statusIcon.src = "../../assets/status-icons/online.svg";
    }
    else if (status === "loading") {
        statusBar.classList.remove("online", "offline");

        statusBar.classList.add("loading");

        statusText.innerText = "Starting...";
        statusIcon.src = "";
    }
}
function setButton(status) {
    if (status === "start") {
        startButton.classList.remove("stop");
        startButton.classList.add("start");

        buttonText.innerText = "Start";
        buttonIcon.src = "../../assets/status-icons/online.svg";
    }
    else if (status === "stop") {
        startButton.classList.remove("start");
        startButton.classList.add("stop");

        buttonText.innerText = "Stop";
        buttonIcon.src = "../../assets/status-icons/offline.svg";
    }
}

async function loadPage() {
    const serverInfo = await window.server.getServerInfo(id);

    serverName.textContent = serverInfo.name;
    serverVersion.textContent = `${serverInfo.software} · ${serverInfo.version}`;

    setStatus("offline");
    setButton("start");

}

startButton.addEventListener("click", async () => {
    startButton.disabled = true;
    setStatus("loading");
    window.server.on("start", () => {
        console.log("renderer:server started");
        setStatus("online");
        setButton("stop");
        startButton.disabled = false;
    });

    await window.server.startServer(id);


})


loadPage();