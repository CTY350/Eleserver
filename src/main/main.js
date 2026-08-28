import {BrowserWindow,app,ipcMain,Menu,dialog,shell} from "electron";
import {initialize} from "../backend/initialize/initialize.js";

import {ServerManager} from "../backend/managers/ServerManager.js";
import {VersionManager} from "../backend/managers/VersionManager.js";
import {NetworkManager} from "../backend/managers/NetworkManager.js";

import {logger,logEvents} from '../backend/managers/LogManager.js';

import {serverEvents} from "../backend/managers/ServerManager.js";

import path from "node:path";
import {fileURLToPath} from "node:url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;

function startApp() {
    initialize();
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        minHeight: 700,
        minWidth: 1000,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            devTools: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });
    // Menu.setApplicationMenu(null);
    win.loadFile("src/renderer/pages/home/index.html");
}

const serverManager = new ServerManager();
const versionManager = new VersionManager();
const networkManager = new NetworkManager();



app.whenReady().then(() => startApp());

app.on("will-quit", () => {
    networkManager.close();
});

serverEvents.on("server-started", (id) => {
    win.webContents.send("server-started",id);
});

serverEvents.on("server-closed", (id) => {
    win.webContents.send("server-closed",id);
});

serverEvents.on("server-error", (id,error) => {
    win.webContents.send("server-error",id,error);
});

serverEvents.on("server-log", (id,data) => {
    win.webContents.send("server-log",id,data);
});

logEvents.on("log", (type,data) => {
    win.webContents.send("log",type,data);
});



function handleIpc(channel,handler) {
    ipcMain.handle(channel, async (event,...args) => {
        try {
            return await handler(event,...args);
        }
        catch(err) {
            logger.error(err);
            throw err;
        }
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━

handleIpc("electron:showMessage", async (_, type,title,message, buttons) => {
    const result = await dialog.showMessageBox({
        type: type,
        title: title,
        message: message,
        buttons: buttons,
    });
    return result.response;
});

handleIpc("electron:openPath", async (_, path) => {
    const result = await shell.openPath(path);
    return result;
})
handleIpc("electron:choosePath", async (_,properties,title,filters) => {
    const result = await dialog.showOpenDialog({
        properties: [properties],
        title: title,
        filters: filters
    });
    return result;
})

// ━━━━━━━━━━━━━━━━━━━━━━

handleIpc("server:create",(_,name,software,version,{acceptEula = false} = {}) => {
    return serverManager.createServer(name, software, version , {acceptEula});
});

handleIpc("server:start",(_,id) => {
    return serverManager.startServer(id);
});

handleIpc("server:stop",(_,id,{force = false} = {}) => {
    return serverManager.stopServer(id,{force});
});

handleIpc("server:delete",(_,id) => {
    return serverManager.deleteServer(id);
});

handleIpc("server:sendCommand",(_,id,command) => {
    return serverManager.sendCommand(id,command);
});

handleIpc("server:getServers",(_) => {
    return serverManager.getServers();
});

handleIpc("server:saveProperties",(_,id,properties) => {
    return serverManager.saveProperties(id,properties);
});

handleIpc("server:getServerInfo",(_,id) => {
    return serverManager.getServerInfo(id);
});

handleIpc("server:saveServerInfo",(_,id,newKey,newValue) => {
    return serverManager.saveServerInfo(id,newKey,newValue);
});

handleIpc("server:setLogo",(_,id,pngPath) => {
    return serverManager.setServerLogo(id,pngPath);
});

handleIpc("server:getLogo",(_,id) => {
    return serverManager.getServerLogo(id);
});
handleIpc("server:serverRunning",(_,id) => {
    return serverManager.serverRunning(id);
});

handleIpc("server:serverPath",(_,id) => {
    return serverManager.serverPath(id);
})

// ━━━━━━━━━━━━━━━━━━━━━━

handleIpc("version:getVanilla" ,(_) => {
    return versionManager.getVanillaVersions();
});

handleIpc("version:getFabric",(_) => {
    return versionManager.getFabricVersions();
});

handleIpc("version:getPaper", (_) => {
    return versionManager.getPaperVersions();
});

handleIpc("version:getPurpur",(_) => {
    return versionManager.getPurpurVersions();
});

handleIpc("version:getForge", (_) => {
    return versionManager.getForgeVersions();
})

// ━━━━━━━━━━━━━━━━━━━━━━

handleIpc("network:getPublicIp", (_) => {
    return networkManager.getPublicIp();
});

handleIpc("network:openPort", (_,port,{timeout = 0,ignoreCGNat = false} = {}) => {
    return networkManager.openPort(port,{timeout,ignoreCGNat});
});

handleIpc("network:closePort",(_,port) => {
    return networkManager.closePort(port);
});

handleIpc("network:getPortMappings", (_) => {
    return networkManager.getPortMappings();
});

handleIpc("network:getLocalIp",(_) => {
    return networkManager.getLocalIp();
});