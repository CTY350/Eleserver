
import {createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {basePaths} from '../paths.js';
import path from 'node:path';
import {mkdir,unlink,readdir} from 'node:fs/promises';
import extract from "extract-zip";
import {logger} from './LogManager.js';

const platforms = {
    win32: "windows",
    linux: "linux",
    darwin: "mac"
}

const architectures = {
    x64: "x64",
    arm64: "aarch64",
    ia32: "x86"
}

const system = {
    platform: platforms[process.platform],
    architecture: architectures[process.arch]
}

const javaExecutable =
    system.platform === "windows"
    ? "java.exe"
    : "java";

export class JavaManager {

    async #installJava(javaVersion){
        logger.info("Installing Java");
        const url = `https://api.adoptium.net/v3/binary/latest/${javaVersion}/ga/${system.platform}/${system.architecture}/jdk/hotspot/normal/eclipse`;
        const response = await fetch(url);
        logger.info("status:",response.status);
        logger.info("type:",response.headers.get("content-type"));
        logger.info("length:", response.headers.get("content-length"));
        if (!response.ok) {
            throw new Error(`Failed to install Java: ${javaVersion}`);
        }
        const dir = path.join(basePaths.java, String(javaVersion));
        await mkdir(dir,{recursive: true});
        const file = createWriteStream(path.join(dir, "java.zip"));
        await pipeline(
            response.body,
            file
        )
        logger.info("Successfully installed Java");

        logger.info("Extracting Java");
        await extract(path.join(dir,"java.zip"),{dir: dir})
        await unlink(path.join(dir,"java.zip"));
        logger.info("Successfully extracted Java");
    }
    async #locateJava(javaVersion) {
        const javaDir = path.join(basePaths.java, String(javaVersion));
        const dirList = await readdir(javaDir);
        if (dirList.length === 0) {
            const error = new Error("Java Not Found");
            error.code = "ENOENT";
            throw error;
        }
        const javaFile = path.join(javaDir, dirList[0],"bin", javaExecutable);

        return javaFile;
    }

    async ensureJava(javaVersion){
        try {
            const javaFile = await this.#locateJava(javaVersion);
            return javaFile;
        }
        catch(error){
            if (error.code === "ENOENT") {
                await this.#installJava(javaVersion);
                const javaFile = await this.#locateJava(javaVersion);
                return javaFile;
            }
            else {
                throw new Error(`JAVAError: ${error.message}`)
            }
        }
    }
}