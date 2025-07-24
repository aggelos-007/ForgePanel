import { WebSocketServer } from "ws";
import { APIServer } from "./apiserver";
import { WebSocket } from "./websocket";
import { AuthManager } from "./authManager";

export class WebServer {
    #api: APIServer;

    constructor(){
        new AuthManager();
        this.#api = new APIServer("./routes");
        new WebSocket(
            new WebSocketServer({
                server: this.#api.server,
            })
        );
    };

    load = () => this.#api.load();

    listen = (port: number) => this.#api.listen(port);
};