import { emitter, TypedEventData } from '../../managers';
import { WebSocket as WS, WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';

export class WebSocket {
    #listeners = new Map<string, WS>();

    constructor(wss: WebSocketServer){
        wss.on("connection", this.#registerListener.bind(this));
        emitter.on("websocket", this.#message.bind(this));
    };

    #message(data: TypedEventData){
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

    #registerListener(ws: WS){
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