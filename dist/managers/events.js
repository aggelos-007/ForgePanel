"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitter = exports.PowerAction = exports.OpCodes = void 0;
const events_1 = __importDefault(require("events"));
var OpCodes;
(function (OpCodes) {
    OpCodes[OpCodes["Identify"] = 0] = "Identify";
    OpCodes[OpCodes["Power"] = 1] = "Power";
    OpCodes[OpCodes["Console"] = 2] = "Console";
    OpCodes[OpCodes["Usage"] = 3] = "Usage";
    OpCodes[OpCodes["GuildJoin"] = 4] = "GuildJoin";
    OpCodes[OpCodes["GuildLeave"] = 5] = "GuildLeave";
    OpCodes[OpCodes["ConfigUpdate"] = 6] = "ConfigUpdate";
    OpCodes[OpCodes["UpdateCommands"] = 7] = "UpdateCommands";
})(OpCodes || (exports.OpCodes = OpCodes = {}));
;
var PowerAction;
(function (PowerAction) {
    PowerAction["Start"] = "start";
    PowerAction["Stop"] = "stop";
})(PowerAction || (exports.PowerAction = PowerAction = {}));
;
;
;
class TypedEmitter extends events_1.default {
    on(eventName, listener) {
        return super.on(eventName, listener);
    }
    ;
    once(eventName, listener) {
        return super.once(eventName, listener);
    }
    ;
    emit(eventName, data) {
        return super.emit(eventName, data);
    }
    ;
    off(eventName, listener) {
        return super.off(eventName, listener);
    }
    ;
}
;
exports.emitter = new TypedEmitter();
