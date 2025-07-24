import { emitter, OpCodes, TypedEventData } from '../../managers';
import { WebSocket as WS, WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import { AuthManager, Permissions, UserSchema } from './authManager';

export class WebSocket {
    #listeners = new Map<string, {user: UserSchema, ws: WS}>();

    constructor(wss: WebSocketServer){
        wss.on("connection", this.#registerListener.bind(this));
        emitter.on("websocket", this.#message.bind(this));
    };

    #message(data: TypedEventData){
        const json = JSON.stringify(data);
        for(const [id, {user, ws}] of this.#listeners){
            if(ws.readyState == WS.OPEN){
                switch(data.op){
                    case OpCodes.Power:
                        if((user.permissions & Permissions.ManagePower) == 0) continue;
                    break;
                    case OpCodes.Console:
                        if((user.permissions & Permissions.ManageTerminal) == 0) continue;
                    break;
                    case OpCodes.GuildJoin:
                    case OpCodes.GuildLeave:
                        if((user.permissions & Permissions.ManageGuilds) == 0) continue;
                    break;
                    case OpCodes.ConfigUpdate:
                        if((user.permissions & Permissions.ManageBot) == 0) continue;
                    break;
                    case OpCodes.CreateCommand:
                    case OpCodes.EditCommand:
                    case OpCodes.DeleteCommand:
                    case OpCodes.DisableCommand:
                    case OpCodes.EnableCommand:
                    case OpCodes.MoveCommand:
                        if((user.permissions & Permissions.ManageCommands) == 0) continue;
                    break;
                }
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
        const user = AuthManager.getUserByToken(auth)
        if(!user) return ws.close(3000, JSON.stringify({data: "Unauthorized"}));

        const id = randomUUID();
        this.#listeners.set(id, {user, ws});

        ws.once("close", () => {
            this.#listeners.delete(id);
        });

        ws.on('error', () => {
            this.#listeners.delete(id);
        });
    };
};