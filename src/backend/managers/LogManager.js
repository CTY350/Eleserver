import EventEmitter from "node:events";
import path from 'path';
import {basePaths} from '../paths.js';
import {appendFile} from "node:fs/promises";

const logEvents = new EventEmitter();

class LogManager {

    constructor() {
        this.#flushTimer = setInterval(() => {
            this.#flush();
        }, 15000);
    }

    #logs = [];

    #getCurrentTime() {
        const now = new Date();

        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");

        const time = `${hours}:${minutes}:${seconds}`;
        return time;
    }

    #getCurrentDate() {
        const date = new Date();

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    async #flush() {
        if (this.#logs.length === 0) {return}

        const logs = this.#logs;
        this.#logs = [];

        const logFile = path.join(basePaths.logs, `${this.#getCurrentDate()}.log`);

        await appendFile(logFile, logs.join('\n'));

    }



    #formatLog(level,message) {
        const time = this.#getCurrentTime();
        const log = [];
        log.push(`[${time}]`)
        if (level === "info") {
            log.push("[Eleserver/INFO]:");
        }
        else if (level === "warn") {
            log.push("[Eleserver/WARN]:");
        }
        else if (level === "error") {
            log.push("[Eleserver/ERROR]:");
        }
        else {
            throw new Error("Unknown log level: " + level);
        }

        log.push(message);

        return log.join(" ");
    }


    info(message) {
        const log = this.#formatLog("info",message);
        console.log(log);

        logEvents.emit("log", log);

        this.#logs.push(log);
    }

    warn(message) {
        const log = this.#formatLog("warn",message);
        console.log(log);

        logEvents.emit("log", log);

        this.#logs.push(log);
    }

    error(message) {
        const log = this.#formatLog("error",message);
        console.log(log);

        logEvents.emit("log", log);

        this.#logs.push(log);
    }

    async close() {
        clearInterval(this.#flushTimer);
        await this.#flush();
    }
}