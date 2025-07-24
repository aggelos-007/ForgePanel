import { emitter, TypedEventData } from '../../managers';
import { WebSocket as WS, WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';

export class WebSocket {
    #listeners = new Map<string, WS>();

    constructor(wss: WebSocketServer){
        wss.on("connection", this.#registerListener.bind(this));
        emitter.on("websocket", this.#message.bind(this));
    };

    #message(data: TypedEventData){
        if(data.op == 3) return;
        const json = JSON.stringify(data);
        for(const [id, ws] of this.#listeners){
            if(ws.readyState == WS.OPEN){
                try {
                    ws.send(json);
                } catch(_){
                    this.#listeners.delete(id);
                };
            } else this.#listeners.delete(id);
        };
    };

    #registerListener(ws: WS, req: IncomingMessage){
        const auth = req.headers.authorization;
        if(!auth) return ws.close(3000, JSON.stringify({data: "Unauthorized"}));
        const id = randomUUID();
        this.#listeners.set(id, ws);

        ws.once("close", () => {
            this.#listeners.delete(id);
        });

        ws.on('error', () => {
            this.#listeners.delete(id);
        });
    };
};