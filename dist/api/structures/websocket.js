"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocket = void 0;
const managers_1 = require("../../managers");
const ws_1 = require("ws");
const crypto_1 = require("crypto");
const authManager_1 = require("./authManager");
class WebSocket {
    #listeners = new Map();
    constructor(wss) {
        wss.on("connection", this.#registerListener.bind(this));
        managers_1.emitter.on("websocket", this.#message.bind(this));
    }
    ;
    #message(data) {
        const json = JSON.stringify(data);
        for (const [id, { user, ws }] of this.#listeners) {
            if (ws.readyState == ws_1.WebSocket.OPEN) {
                switch (data.op) {
                    case managers_1.OpCodes.Power:
                        if ((user.permissions & authManager_1.Permissions.ManagePower) == 0)
                            continue;
                        break;
                    case managers_1.OpCodes.Console:
                        if ((user.permissions & authManager_1.Permissions.ManageTerminal) == 0)
                            continue;
                        break;
                    case managers_1.OpCodes.GuildJoin:
                    case managers_1.OpCodes.GuildLeave:
                        if ((user.permissions & authManager_1.Permissions.ManageGuilds) == 0)
                            continue;
                        break;
                    case managers_1.OpCodes.ConfigUpdate:
                        if ((user.permissions & authManager_1.Permissions.ManageBot) == 0)
                            continue;
                        break;
                    case managers_1.OpCodes.CreateCommand:
                    case managers_1.OpCodes.EditCommand:
                    case managers_1.OpCodes.DeleteCommand:
                    case managers_1.OpCodes.DisableCommand:
                    case managers_1.OpCodes.EnableCommand:
                    case managers_1.OpCodes.MoveCommand:
                        if ((user.permissions & authManager_1.Permissions.ManageCommands) == 0)
                            continue;
                        break;
                }
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
    #registerListener(ws, req) {
        const auth = req.headers.authorization;
        if (!auth)
            return ws.close(3000, JSON.stringify({ data: "Unauthorized" }));
        const user = authManager_1.AuthManager.getUserByToken(auth);
        if (!user)
            return ws.close(3000, JSON.stringify({ data: "Unauthorized" }));
        const id = (0, crypto_1.randomUUID)();
        this.#listeners.set(id, { user, ws });
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
