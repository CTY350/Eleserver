import {writeFile,mkdir,readFile,readdir,rm} from "node:fs/promises";
import {randomBytes} from "node:crypto";
import {VersionManager} from "./versionManager.js";
import {JavaManager} from './JavaManager.js';
import {pipeline} from 'node:stream/promises';
import {createWriteStream} from 'node:fs';
import {basePaths} from '../paths.js'
import path from 'path';
import {spawn} from 'child_process';

const versionManager = new VersionManager();
const javaManager = new JavaManager();

export class ServerManager {

    processes = new Map();

    // ━━━━━━━━━━━━━━━━━━━━━━
    // Private Methods
    // ━━━━━━━━━━━━━━━━━━━━━━

    async #installServer(software, version) {
        const url = await versionManager.getServerDownloadUrl(software, version);
        const response = await fetch(url);
        const dir = path.join(basePaths.downloads, software, String(version));
        await mkdir(dir, {recursive: true});
        const file = createWriteStream(path.join(dir, "server.jar"));
        await pipeline(response.body, file);
    }

    async #locateServer(software, version) {
        const jarPath = path.join(basePaths.downloads, software, String(version));
        const dirList = await readdir(jarPath);
        const jar = dirList.find(file => file.endsWith(".jar"));
        if (!jar) {
            throw new Error("server.jar not found.");
        }
        return path.join(jarPath, jar);
    }

    async #ensureServer(software, version) {
        try {
            return await this.#locateServer(software, version);
        } catch (e) {
            await this.#installServer(software, version);
            return await this.#locateServer(software, version);
        }
    }

    async #getServerInfo(id) {
        const serverFolder = path.join(basePaths.servers, id);
        const content = await readFile(path.join(serverFolder, "eleserver.json"), 'utf8');
        return JSON.parse(content);
    }



    async #startServerInternal(id) {
        const config = await this.#getServerInfo(id);
        const javaPath = await javaManager.ensureJava(await versionManager.getJavaVersion(config.version));
        const serverFolder = path.join(basePaths.servers, id);
        const jar = await this.#ensureServer(config.software,config.version);
        if (!jar) {
            throw new Error("Server.jar not found!");
        }

        const serverProcess = spawn(
            javaPath, [
                `-Xms${config.minRam}`,
                `-Xmx${config.maxRam}`,
                ...config.jvmArguments,
                "-jar",
                jar,
                "nogui"
            ],
            {cwd: serverFolder}
        )
        return serverProcess;
    }

    async #createEleserver(id, name, software, version, minRam, maxRam) {
        const content = {
            "id": id,
            "name": name,
            "software": software,
            "version": version,
            "minRam": minRam,
            "maxRam": maxRam,

            "jvmArguments": []
        }
        await writeFile(path.join(basePaths.servers, id, "eleserver.json"), JSON.stringify(content, null, 4));
    }



    async #getServerProperties(id)  {
        const propertiesPath = path.join(basePaths.servers, id, "server.properties");
        const properties = await readFile(propertiesPath, "utf8");
        const lines = properties.split("\n");
        const propertiesJson = {};

        for (const line of lines) {
            if (!line || line.startsWith("#")) {continue}

            const index = line.indexOf("=");

            const key = line.slice(0, index);

            const value = line.slice(index+1);

            propertiesJson[key] = value;
        }
        return propertiesJson;
    }


    #convertToProperties(properties) {
        let serverProperties = "";
        for (const [key,value] of Object.entries(properties)) {
            const serverProperty = `${key}=${value}`;
            serverProperties += `${serverProperty}\n`;
        }
        return serverProperties;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━
    // Public Methods
    // ━━━━━━━━━━━━━━━━━━━━━━

    async createServer(name, software, version, {acceptEula = false} = {}) {
        const id = randomBytes(8).toString("hex");
        await mkdir(path.join(basePaths.servers, id));
        await this.#createEleserver(id, name, software, version, "2G", "4G");

        const serverProcess = await this.#startServerInternal(id);
        if (!acceptEula) {return}

        serverProcess.on("exit", async () => {
            const eulaPath = path.join(basePaths.servers, id, "eula.txt");
            await writeFile(eulaPath, "eula=true");
        });
    }

    async startServer(id) {
        if (this.processes.has(id)) {
            throw new Error("Server is already running");
        }
        const serverProcess = await this.#startServerInternal(id);

        this.processes.set(id, serverProcess);

        serverProcess.on("exit", () => {
            this.processes.delete(id);
        })
        serverProcess.on("error", (error) => {
            this.processes.delete(id);
        })
        serverProcess.stdout.on("data", data => {
            console.log(data.toString());
        })
    }

    stopServer(id,{force = false} = {}) {
        if (!this.processes.has(id)) {
            throw new Error("Server is not running");
        }

        const serverProcess = this.processes.get(id);

        if (force) {
            serverProcess.kill()
        }
        else {
            serverProcess.stdin.write("stop\n");
        }
    }

    async deleteServer(id) {
        if (this.processes.has(id)) {
            throw new Error("Server cannot be deleted while it's running");
        }

        const serverFolder = path.join(basePaths.servers, id);

        await rm(serverFolder, {recursive: true});
    }

    sendCommand(id, command){
        if (!this.processes.has(id)) {
            throw new Error("Server is not running");
        }
        const serverProcess = this.processes.get(id);
        serverProcess.stdin.write(`${command}\n`);
    }

    async getServers(){
        const serverContent = []
        const serverList = await readdir(basePaths.servers);
        for (const server of serverList) {
            const serverConfig = await this.#getServerInfo(server);
            serverContent.push({
                "id": serverConfig.id,
                "name": serverConfig.name,
                "software": serverConfig.software,
                "version": serverConfig.version,
            });
        }
        return serverContent;
    }


    async saveProperties(id,properties) {
        const propertiesPath = path.join(basePaths.servers, id, "server.properties");
        const serverProperties = this.#convertToProperties(properties);

        await writeFile(propertiesPath , serverProperties);
    }

    async getServerInfo(id) {
        const config = await this.#getServerInfo(id);

        config.properties = await this.#getServerProperties(id);

        return config;
    }

    async saveServerInfo(id, newKey,newValue) {
        const serverInfo = await this.#getServerInfo(id);
        serverInfo[newKey] = newValue;
        await writeFile(path.join(basePaths.servers, id, "eleserver.json"), JSON.stringify(serverInfo, null, 4));
    }
}

