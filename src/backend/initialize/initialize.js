import fs from 'node:fs';
import {basePaths} from '../paths.js'

export function initialize() {

    fs.mkdirSync(basePaths.base, { recursive: true });
    fs.mkdirSync(basePaths.servers, { recursive: true });
    fs.mkdirSync(basePaths.downloads, { recursive: true });
    fs.mkdirSync(basePaths.java, { recursive: true });
    fs.mkdirSync(basePaths.versions, { recursive: true });
    fs.mkdirSync(basePaths.logs, { recursive: true });
}