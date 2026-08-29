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

const localIpText = document.querySelector("#local-ip");
const publicIpText = document.querySelector("#public-ip");
const portButton = document.querySelector("#port-button");

const overlay = document.querySelector(".overlay");

const backButton = document.querySelector("#back-button");

let loading = false;
let serverInfo;

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
    let serverInfo;
    try {
        serverInfo = await window.server.getServerInfo(id);
    }
    catch (error) {
        window.location.href = "../error/index.html";
    }

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

    const localIP = await window.network.getLocalIp();
    const publicIp = await window.network.getPublicIp();

    const port = serverInfo.properties["server-port"];
    console.log(port);


    localIpText.innerText = `${localIP}:${port}`;
    publicIpText.innerText = `${publicIp}:${port}`;

}

connectButton.addEventListener("click", () => {
    overlay.style.display = "flex";
});

overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
        overlay.style.display = "none";
    }
})


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
    window.server.on("close", () => {
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

});
portButton.addEventListener("click", async () => {
    try {
        await window.network.openPort(serverInfo.properties["server-port"]);
        portButton.innerText = "Port Opened";
        await window.server.on("close", async () => {
            await window.network.closePort(serverInfo.properties["server-port"]);
            portButton.innerText = "Open Port";
        });
        portButton.disabled = true;
    }
    catch (e) {
        if (e.message.includes("CGNAT_DETECTED")) {
            const result = await window.electron.showMessage({
                type: "error",
                title: "Public Connection Unavailable",
                message: "Your network appears to be behind CGNAT, so Eleserver cannot make this server publicly accessible through port forwarding\nYou can still connect through your local network, or use a tunneling service to make your server public",
                buttons: ["Open it Anyway", "Cancel"]
            })
            if (result === 0) {
                await window.network.openPort(serverInfo.properties["server-port"], {ignoreCGNat: true});
                portButton.innerText = "Port Opened";
                await window.server.on("close", async () => {
                    await window.network.closePort(serverInfo.properties["server-port"]);
                    portButton.innerText = "Open Port";
                    portButton.disabled = false;
                });
                portButton.disabled = true;
            }
        }
        else if (e.message.includes("UPNP_NOT_AVAILABLE")) {
            await window.electron.showMessage({
                type: "error",
                title: "Port Forwarding Unavailable",
                message: "Automatic port forwarding is unavailable because UPnP is not supported or enabled on your network.\nYou can still connect locally or configure port forwarding manually through your router."
            });
        }
    }
});

serverName.addEventListener("click", async () => {
    const result = await window.electron.openPath({path: await window.server.serverPath(id)});
    if (result) {
        throw new Error(result);
    }
});

backButton.addEventListener("click", () => {
    window.location.href = "../home/index.html";
})


loadPage();