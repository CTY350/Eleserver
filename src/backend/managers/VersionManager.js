import {versionPaths} from '../paths.js';
import {writeFile} from 'node:fs/promises';
import {readFile} from 'node:fs/promises';
import {endpoints} from "../endpoints.js";
import {XMLParser} from "fast-xml-parser";


export class VersionManager {

    static DownloadTypes = Object.freeze({
        SERVER: "server",
        INSTALLER: "installer"
    })

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

            let data;
            if (software === "neoforge") {
                const parser = new XMLParser();
                data = parser.parse(await response.text());
            } else {
                data = await response.json()
            };

            await this.#updateVersionCache(software, data);
            return data;
        }
        catch (error) {
            console.error(error);
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



    async #getNeoForgeBuilds(version) {
        const response = await this.#fetchVersions("neoforge");
        const neoVersion = version.split(".");
        const builds = [];

        for (const build of response.metadata.versioning.versions.version) {
            const neoBuild = build.split(".");

            if (parseInt(neoBuild[0]) < 26) {
                if (neoVersion[1] === neoBuild[0] && neoVersion[2] === neoBuild[1]) {
                    builds.push(build);
                }
            }
            else {
                if (neoVersion[0] === neoBuild[0] && neoVersion[1] === neoBuild[1] && neoVersion[2] === neoBuild[2]) {
                    builds.push(build);
                }
            }

        }
        return builds;
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

    async getNeoForgeVersions() {
        const response = await this.#fetchVersions("neoforge");
        const versions = new Set();

        for (const version of response.metadata.versioning.versions.version) {
            const neoVersion = version.split(".");
            if (neoVersion[0] === "0") {
                neoVersion.shift();
                neoVersion.pop();
                versions.add(neoVersion.join("."));
                continue;
            }

            const neoVersionInt = neoVersion.map(Number);

            if (neoVersionInt[0] < 26) {
                neoVersionInt.unshift(1);
            }

            neoVersionInt.pop();

            if (neoVersionInt.length > 3) {neoVersionInt.pop()}

            versions.add(neoVersionInt.join("."));
        }
        return [...versions];
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
                        return {
                            "downloadUrl": versionData.downloads.server.url,
                            "downloadType": VersionManager.DownloadTypes.SERVER
                        };
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
                return {
                    "downloadUrl":`https://meta.fabricmc.net/v2/versions/loader/${version}/${loaderVersion}/${installerVersion}/server/jar`,
                    "downloadType": VersionManager.DownloadTypes.SERVER
                }
            }
            case "paper": {
                const builds = await fetch(`https://fill.papermc.io/v3/projects/paper/versions/${version}/builds`);
                const buildData = await builds.json();
                for (const buildInfo of buildData) {
                    if (buildInfo.channel === "STABLE") {
                        return buildInfo.downloads["server:default"].url
                    }
                }
                return {
                    "downloadUrl": buildData[0].downloads["server:default"].url,
                    "downloadType": VersionManager.DownloadTypes.SERVER
                }
            }
            case "purpur": {
                return {
                    "downloadUrl": `https://api.purpurmc.org/v2/purpur/${version}/latest/download`,
                    "downloadType": VersionManager.DownloadTypes.SERVER
                };
            }
        }
    }
}