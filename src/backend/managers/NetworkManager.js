import natUpnp  from 'nat-upnp';
import os from 'node:os'


export class NetworkManager {
    #client;
    constructor() {
        this.#client = natUpnp.createClient();
    }

    // ━━━━━━━━━━━━━━━━━━━━━━
    // Private Methods
    // ━━━━━━━━━━━━━━━━━━━━━━

    async #getWanIp(){
        return new Promise((resolve,reject) => {
            this.#client.externalIp((err, ip) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(ip);
            });
        });
    }
    async #getPublicIp(){
        const res = await fetch("https://api.ipify.org/?format=json");
        if (!res.ok) {
            throw new Error("Public IP could not be found");
        }
        const data = await res.json();

        return data.ip;
    }


    async #hasUpnpGateway(){
        try {
            await this.#getWanIp();
            return true;
        }
        catch {
            return false;
        }
    }

    async #isBehindCGNAT() {
        const wanIp = await this.#getWanIp();
        const publicIp = await this.#getPublicIp();

        return wanIp !== publicIp;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━
    // Public Methods
    // ━━━━━━━━━━━━━━━━━━━━━━

    async getPublicIp() {
        return await this.#getPublicIp();
    }

    async openPort(port,{timeout = 0, ignoreCGNat = false} = {}) {

        if (!(await this.#hasUpnpGateway())) {
            const upnperr = new Error("UPNP Gateway is not supported");
            upnperr.code = "UPNP_NOT_AVAILABLE";
            throw upnperr;
        }

        if (await this.#isBehindCGNAT()  && !ignoreCGNat) {
            const cgnaterr = new Error("CGNAT Detected");
            cgnaterr.code = "CGNAT_DETECTED";
            throw cgnaterr;
        }

        return new Promise((resolve,reject) => {
            this.#client.portMapping({
                public: port,
                private: port,
                protocol: "TCP",
                ttl: timeout,
                description: "Java Minecraft Server hosted by Eleserver"
            }, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    async closePort(port) {
        return new Promise((resolve,reject) => {
            this.#client.portUnmapping({
                public: port
            }, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    async getPortMappings() {
        return new Promise((resolve,reject) => {
            this.#client.getMappings({local: true}, (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(results);

            })
        })
    }

    close() {
        this.#client.close();
    }
}