const id = sessionStorage.getItem("serverId");
const consoleDiv = document.querySelector('#console');
const consoleInput = document.querySelector('#input');

const consoleForm = document.querySelector('#console-form');


function parseLog(element,log) {
    if (log.includes("/INFO")) {
        element.style.color = "white";
    }
    else if (log.includes("/WARN")) {
        element.style.color = "#facc15";
    }
    else if (log.includes("/ERROR")) {
        element.style.color = "red";
    }
    else if (log.includes("/DEBUG")) {
        element.style.color = "#a78bfa";
    }
    else {
        element.style.color = "white";
    }
}

async function loadConsole() {
    if (!(await window.server.serverRunning(id))) {
        consoleInput.disabled = true;
        window.server.on("start" ,(serverId) => {
            if (serverId !== id) {return}
            consoleInput.disabled = false;
        })
    }
    window.server.on("close", (serverId) => {
        if (serverId !== id) {return}
        consoleInput.disabled = true;
    })
    window.server.on("data", (serverId,data) => {
        const isAtBottom = consoleDiv.scrollTop + consoleDiv.clientHeight  >= consoleDiv.scrollHeight - 45;
        if (serverId !== id) {return}

        const content = document.createElement("p");
        parseLog(content,data);
        content.textContent = data;
        consoleDiv.appendChild(content);
        if (isAtBottom) {
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
        }
    })
}

consoleForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = consoleInput.value.trim();
    if (data === "") {return}

    const content = document.createElement("p");
    content.textContent = `> ${data}`;
    content.style.color = "#38bdf8";
    consoleDiv.appendChild(content);
    window.server.sendCommand(id, data);
    consoleForm.reset();
});
loadConsole();