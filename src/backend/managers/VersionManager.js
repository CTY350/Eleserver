import {versionPaths} from '../paths.js';
import {writeFile} from 'node:fs/promises';
import {readFile} from 'node:fs/promises';
import {endpoints} from "../endpoints.js";


export class VersionManager {

    async #updateVersionCache(software, newVersions) {
        if (!(software in versionPaths)) {
            throw new Error(`Invalid software in versionPaths`);
        }
        await writeFile(versionPaths[software],JSON.stringify(newVersions, null, 4));
    }

    async #fetchVersions(software) {
        if (!(software in endpoints)) {
            throw new Error(`Invalid software in endpoints`);
        }
        try {
            const response = await fetch(endpoints[software]);
            if (!response.ok) {
                throw new Error(`Failed to fetch versions for: ${software}`);
            }
            const data = await response.json();
            await this.#updateVersionCache(software, data);
            return data;
        }
        catch (error) {
            try {
                const cache = await readFile(versionPaths[software], 'utf8');
                return JSON.parse(cache);
            }
            catch (error) {
                console.error(error);
                throw new Error(`No cached versions found for ${software} Error: ${error.message}`);
            }
        }
    }


    async getVanillaVersions() {
        const response = await this.#fetchVersions("vanilla");
        const result = []
        for (const version of response.versions) {
            result.push({
                version: version.id,
                stable: version.type === "release"
            });
        };
        return result;
    }

    async getFabricVersions() {
        const response = await this.#fetchVersions("fabric");
        return response;
    }

    async getPaperVersions() {
        const response = await this.#fetchVersions("paper");
        const result = [];
        for (const versions of Object.values(response.versions)) {
            for (const version of versions) {
                result.push({
                    version: version,
                    stable: !(version.includes("rc") || version.includes("pre")),
                });
            };
        };
        return result;
    }
    async getPurpurVersions() {
        const response = await this.#fetchVersions("purpur");
        response.versions.reverse();
        const result = [];
        for (const version of response.versions) {
            result.push({
                version: version,
                stable: true
            });
        };
        return result;
    }

    async updateJavaCache(version,javaVersion)  {

        const cache = JSON.parse(await readFile(versionPaths["java"], "utf8"));
        cache[version] = javaVersion;
        await writeFile(versionPaths["java"], JSON.stringify(cache, null, 4));
    }

    async getJavaVersion(version) {
        const javaPath = versionPaths.java;
        let cache;
        try {
            cache = await readFile(javaPath, "utf8");
            if (!cache) {throw new Error("JSON is not exist");}
        }
        catch (error) {
            await writeFile(javaPath, JSON.stringify({},null, 4));
            cache = await readFile(javaPath, "utf8");
        }

        const javaVersions = JSON.parse(cache);

        if (version in javaVersions) {
            return javaVersions[version];
        }
        const response = await this.#fetchVersions("vanilla");
        for (const versionInfo of response.versions) {
            if (versionInfo.id === version) {
                const urlResult = await fetch(versionInfo.url);
                const versionData = await urlResult.json();
                const javaVersion = versionData.javaVersion.majorVersion;
                await this.updateJavaCache(version, javaVersion);
                return javaVersion;
            }
        }
        throw new Error("Invalid javaVersion");
    }
    async getServerDownloadUrl(software,version) {
        switch (software) {
            case "vanilla": {
                const response = await this.#fetchVersions("vanilla");
                for (const versionInfo of response.versions) {
                    if (versionInfo.id === version) {
                        const urlResult = await fetch(versionInfo.url);
                        const versionData = await urlResult.json();
                        return versionData.downloads.server.url;
                    }
                }
                break;
            }
            case "fabric": {
                const loader = await fetch("https://meta.fabricmc.net/v2/versions/loader");
                const installer = await fetch("https://meta.fabricmc.net/v2/versions/installer")
                const loaderData = await loader.json()
                const installerData = await installer.json();

                let loaderVersion;
                let installerVersion;

                for (const loaderInfo of loaderData) {
                    if (loaderInfo.stable === true) {
                        loaderVersion = loaderInfo.version;
                        break;
                    }
                }
                if (!loaderVersion) {loaderVersion = loaderData[0].version}

                for (const installerInfo of await installerData) {
                    if (installerInfo.stable === true) {
                        installerVersion = installerInfo.version;
                        break;
                    }
                }
                if (!installerVersion) {installerVersion = installerData[0].version}
                return `https://meta.fabricmc.net/v2/versions/loader/${version}/${loaderVersion}/${installerVersion}/server/jar`
            }
            case "paper": {
                const builds = await fetch(`https://fill.papermc.io/v3/projects/paper/versions/${version}/builds`);
                const buildData = await builds.json();
                for (const buildInfo of buildData) {
                    if (buildInfo.channel === "STABLE") {
                        return buildInfo.downloads["server:default"].url
                    }
                }
                return buildData[0].downloads["server:default"].url
            }
            case "purpur": {
                return `https://api.purpurmc.org/v2/purpur/${version}/latest/download`;
            }
        }
    }
}