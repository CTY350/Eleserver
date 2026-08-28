const {contextBridge,ipcRenderer} = require("electron");




ipcRenderer.on("log", (_,type,data) => {
    if (type === "info") {
        console.log(data);
    }
    else if (type === "warn") {
        console.warn(data);
    }
    else if (type === "error") {
        console.error(data);
    }
});

contextBridge.exposeInMainWorld("electron", {
    showMessage: ({type,title,message,buttons}) => {
        return ipcRenderer.invoke("electron:showMessage", type,title,message,buttons);
    },
    openPath: ({path}) => {
        return ipcRenderer.invoke("electron:openPath", path);
    },
    choosePath: ({properties, title,filters}) => {
        return ipcRenderer.invoke("electron:choosePath", properties, title,filters);
    }
});

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
    },
    on: (event,callback) => {

        switch (event) {
            case "start": {
                ipcRenderer.on("server-started", (_,id) => {callback(id);});
                break;
            }
            case "close": {
                ipcRenderer.on("server-closed", (_,id) => {callback(id)});
                break;
            }
            case "error": {
                ipcRenderer.on("server-error", (_,id,error) => {callback(id,error)});
                break;
            }
            case "data": {
                ipcRenderer.on("server-log", (_,id,data) => {callback(id,data)});
                break;
            }
            default: {
                throw new Error(`Unknown event: ${event}`);
            }
        }
    },
    serverRunning: (id) => {
        return ipcRenderer.invoke("server:serverRunning",id);
    },
    serverPath: (id) => {
        return ipcRenderer.invoke("server:serverPath",id);
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
    },
    getLocalIp: () => {
        return ipcRenderer.invoke("network:getLocalIp");
    }
});