const {contextBridge,ipcRenderer} = require("electron");


contextBridge.exposeInMainWorld("server", {
    createServer: (name,software,version,{acceptEula = false} = {}) => {
        return ipcRenderer.invoke("server:create",name,software,version,{acceptEula});
    },
    startServer: (id) => {
        return ipcRenderer.invoke("server:start",id);
    },
    stopServer: (id,{force = false} = {}) => {
        return ipcRenderer.invoke("server:stop",id,{force});
    },
    deleteServer: (id) => {
        return ipcRenderer.invoke("server:delete",id);
    },
    sendCommand: (id,command) => {
        return ipcRenderer.invoke("server:sendCommand",id,command);
    },
    getServers: () => {
        return ipcRenderer.invoke("server:getServers");
    },
    saveProperties: (id,properties) => {
        return ipcRenderer.invoke("server:saveProperties",id,properties);
    },
    getServerInfo: (id) => {
        return ipcRenderer.invoke("server:getServerInfo",id)
    },
    saveServerInfo: (id,newKey,newValue) => {
        return ipcRenderer.invoke("server:saveServerInfo",id,newKey,newValue);
    },
    setServerLogo: (id,pngPath) => {
        return ipcRenderer.invoke("server:setLogo",id,pngPath);
    },
    getServerLogo: (id) => {
        return ipcRenderer.invoke("server:getLogo",id);
    }
});

contextBridge.exposeInMainWorld("version", {
    getVanillaVersions: () => {
        return ipcRenderer.invoke("version:getVanilla");
    },
    getFabricVersions: () => {
        return ipcRenderer.invoke("version:getFabric");
    },
    getPaperVersions: () => {
        return ipcRenderer.invoke("version:getPaper");
    },
    getPurpurVersions: () => {
        return ipcRenderer.invoke("version:getPurpur");
    },
    getForgeVersions: () => {
        return ipcRenderer.invoke("version:getForge");
    }
});

contextBridge.exposeInMainWorld("network", {
    getPublicIp: () => {
        return ipcRenderer.invoke("network:getPublicIp");
    },
    openPort: (port,{timeout = 0, ignoreCGNat = false} = {}) => {
        return ipcRenderer.invoke("network:openPort",port,{timeout, ignoreCGNat});
    },
    closePort: (port) => {
        return ipcRenderer.invoke("network:closePort",port);
    },
    getPortMappings: () => {
        return ipcRenderer.invoke("network:getPortMappings");
    }
})