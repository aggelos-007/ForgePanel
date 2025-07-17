import { WebSocketServer } from "ws";
import { APIServer } from "./apiserver";
import { WebSocket } from "./websocket";

export class WebServer {
    #api: APIServer;

    constructor(){
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