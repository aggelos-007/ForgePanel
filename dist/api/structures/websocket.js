"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocket = void 0;
const managers_1 = require("../../managers");
const ws_1 = require("ws");
const crypto_1 = require("crypto");
class WebSocket {
    #listeners = new Map();
    constructor(wss) {
        wss.on("connection", this.#registerListener.bind(this));
        managers_1.emitter.on("websocket", this.#message.bind(this));
    }
    ;
    #message(data) {
        if (data.op == 3)
            return;
        const json = JSON.stringify(data);
        for (const [id, ws] of this.#listeners) {
            if (ws.readyState == ws_1.WebSocket.OPEN) {
                try {
                    ws.send(json);
                }
                catch (_) {
                    this.#listeners.delete(id);
                }
                ;
            }
            else
                this.#listeners.delete(id);
        }
        ;
    }
    ;
    #registerListener(ws) {
        const id = (0, crypto_1.randomUUID)();
        this.#listeners.set(id, ws);
        ws.once("close", () => {
            this.#listeners.delete(id);
        });
        ws.on('error', () => {
            this.#listeners.delete(id);
        });
    }
    ;
}
exports.WebSocket = WebSocket;
;
