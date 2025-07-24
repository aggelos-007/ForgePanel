"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebServer = void 0;
const ws_1 = require("ws");
const apiserver_1 = require("./apiserver");
const websocket_1 = require("./websocket");
const authManager_1 = require("./authManager");
class WebServer {
    #api;
    constructor() {
        new authManager_1.AuthManager();
        this.#api = new apiserver_1.APIServer("./routes");
        new websocket_1.WebSocket(new ws_1.WebSocketServer({
            server: this.#api.server,
        }));
    }
    ;
    load = () => this.#api.load();
    listen = (port) => this.#api.listen(port);
}
exports.WebServer = WebServer;
;
