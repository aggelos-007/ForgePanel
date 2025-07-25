"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitter = exports.PowerAction = exports.OpCodes = void 0;
const events_1 = __importDefault(require("events"));
var OpCodes;
(function (OpCodes) {
    OpCodes[OpCodes["Power"] = 0] = "Power";
    OpCodes[OpCodes["Console"] = 1] = "Console";
    OpCodes[OpCodes["Usage"] = 2] = "Usage";
    OpCodes[OpCodes["GuildJoin"] = 3] = "GuildJoin";
    OpCodes[OpCodes["GuildLeave"] = 4] = "GuildLeave";
    OpCodes[OpCodes["ConfigUpdate"] = 5] = "ConfigUpdate";
    OpCodes[OpCodes["CreateCommand"] = 6] = "CreateCommand";
    OpCodes[OpCodes["EditCommand"] = 7] = "EditCommand";
    OpCodes[OpCodes["DeleteCommand"] = 8] = "DeleteCommand";
    OpCodes[OpCodes["DisableCommand"] = 9] = "DisableCommand";
    OpCodes[OpCodes["EnableCommand"] = 10] = "EnableCommand";
    OpCodes[OpCodes["MoveCommand"] = 11] = "MoveCommand";
    OpCodes[OpCodes["MemberCreate"] = 12] = "MemberCreate";
    OpCodes[OpCodes["MemberUpdate"] = 13] = "MemberUpdate";
    OpCodes[OpCodes["MemberDelete"] = 14] = "MemberDelete";
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
