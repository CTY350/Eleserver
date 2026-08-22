import {BrowserWindow,app,ipcMain,Menu,dialog} from "electron";
import {initialize} from "../backend/initialize/initialize.js";

import {ServerManager} from "../backend/managers/ServerManager.js";
import {VersionManager} from "../backend/managers/VersionManager.js";
import {NetworkManager} from "../backend/managers/NetworkManager.js";

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


// ━━━━━━━━━━━━━━━━━━━━━━

ipcMain.handle("electron:showMessage", async (_, type,title,message, buttons) => {
    const result = await dialog.showMessageBox({
        type: type,
        title: title,
        message: message,
        buttons: buttons,
    });
    return result.response;
});

// ━━━━━━━━━━━━━━━━━━━━━━

ipcMain.handle("server:create",(_,name,software,version,{acceptEula = false} = {}) => {
    return serverManager.createServer(name, software, version , {acceptEula});
});

ipcMain.handle("server:start",(_,id) => {
    return serverManager.startServer(id);
});

ipcMain.handle("server:stop",(_,id,{force = false} = {}) => {
    return serverManager.stopServer(id,{force});
});

ipcMain.handle("server:delete",(_,id) => {
    return serverManager.deleteServer(id);
});

ipcMain.handle("server:sendCommand",(_,id,command) => {
    return serverManager.sendCommand(id,command);
});

ipcMain.handle("server:getServers",(_) => {
    return serverManager.getServers();
});

ipcMain.handle("server:saveProperties",(_,id,properties) => {
    return serverManager.saveProperties(id,properties);
});

ipcMain.handle("server:getServerInfo",(_,id) => {
    return serverManager.getServerInfo(id);
});

ipcMain.handle("server:saveServerInfo",(_,id,newKey,newValue) => {
    return serverManager.saveServerInfo(id,newKey,newValue);
});

ipcMain.handle("server:setLogo",(_,id,pngPath) => {
    return serverManager.setServerLogo(id,pngPath);
});

ipcMain.handle("server:getLogo",(_,id) => {
    return serverManager.getServerLogo(id);
});
ipcMain.handle("server:serverRunning",(_,id) => {
    return serverManager.serverRunning(id);
})

// ━━━━━━━━━━━━━━━━━━━━━━

ipcMain.handle("version:getVanilla" ,(_) => {
    return versionManager.getVanillaVersions();
});

ipcMain.handle("version:getFabric",(_) => {
    return versionManager.getFabricVersions();
});

ipcMain.handle("version:getPaper", (_) => {
    return versionManager.getPaperVersions();
});

ipcMain.handle("version:getPurpur",(_) => {
    return versionManager.getPurpurVersions();
});

ipcMain.handle("version:getForge", (_) => {
    return versionManager.getForgeVersions();
})

// ━━━━━━━━━━━━━━━━━━━━━━

ipcMain.handle("network:getPublicIp", (_) => {
    return networkManager.getPublicIp();
});

ipcMain.handle("network:openPort", (_,port,{timeout = 0,ignoreCGNat = false} = {}) => {
    return networkManager.openPort(port,{timeout,ignoreCGNat});
});

ipcMain.handle("network:closePort",(_,port) => {
    return networkManager.closePort(port);
});

ipcMain.handle("network:getPortMappings", (_) => {
    return networkManager.getPortMappings();
});

ipcMain.handle("network:getLocalIp",(_) => {
    return networkManager.getLocalIp();
});