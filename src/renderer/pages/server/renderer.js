const id = sessionStorage.getItem("serverId");

const serverName = document.querySelector("#server-name");
const serverVersion = document.querySelector("#server-version");

const statusBar = document.querySelector("#server-status");
const statusText = document.querySelector("#server-status-text");
const statusIcon = document.querySelector("#server-status-icon");

const startButton  = document.querySelector("#start-button");
const buttonIcon = document.querySelector("#button-icon");
const buttonText = document.querySelector("#button-text");

const connectButton = document.querySelector("#connect-button");

let loading = false;

function setStatus(status) {
    statusIcon.style.display = "block";
    statusText.innerText = "";
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

        window.server.on("data", (serverId,data) => {
            if (!loading) {return}
            if (serverId !== id) {return}


            statusText.innerText = data;
        })
        statusIcon.style.display = "none";
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

    let serverRunning = await window.server.serverRunning(id);

    if (serverRunning) {
        setStatus("online");
        setButton("stop");
    } else {
        setButton("start");
        setStatus("offline");
    }


}

startButton.addEventListener("click", async () => {
    startButton.disabled = true;
    let serverRunning = await window.server.serverRunning(id);
    console.log("server:",serverRunning);
    loading = true;
    setStatus("loading");

    window.server.on("start", () => {
        setStatus("online");
        setButton("stop");
        startButton.disabled = false;
    });
    window.server.on("close", async () => {
        setStatus("offline");
        setButton("start");
        startButton.disabled = false;
    });

    if (serverRunning) {
        await window.server.stopServer(id);
    } else {
        await window.server.startServer(id);
    }

    loading = false;

})


loadPage();