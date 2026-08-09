import path from "node:path";
import os from "node:os";


const basePath = path.join(os.homedir(), ".eleserver");

export const basePaths = {
    base: basePath,
    servers: path.join(basePath, "servers"),
    downloads: path.join(basePath, "downloads"),
    java: path.join(basePath, "java"),
    versions: path.join(basePath, "versions"),
}

const baseVersionPath = path.join(basePath, "versions");

export const versionPaths = {
    vanilla: path.join(baseVersionPath, "vanilla.json"),
    fabric: path.join(baseVersionPath, "fabric.json"),
    paper: path.join(baseVersionPath, "paper.json"),
    purpur: path.join(baseVersionPath, "purpur.json"),
    java: path.join(baseVersionPath, "java.json"),
    neoforge: path.join(baseVersionPath, "neoforge.json"),
    forge: path.join(baseVersionPath, "forge.json"),
}