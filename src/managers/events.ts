import { GuildFeature } from "discord.js";
import EventEmitter from "events";
import { DeepPartial } from "./panel";
import { ConfigSchema } from "../config";
import { IApplicationCommandData, IBaseCommand } from "@tryforge/forgescript";

export enum OpCodes {
    Identify = 0,
    Power = 1,
    Console = 2,
    Usage = 3,
    GuildJoin = 4,
    GuildLeave = 5,
    ConfigUpdate = 6,
    CreateCommand = 7,
    EditCommand = 8,
    DeleteCommand = 9,
    DisableCommand = 10,
    EnableCommand = 11,
    MoveCommand = 12
};

export enum PowerAction {
    Start = "start",
    Stop = "stop"
};

type EventsData = {
    [OpCodes.Identify]: null;
    [OpCodes.Power]: {
        action: PowerAction;
    };
    [OpCodes.Console]: string;
    [OpCodes.Usage]: {
        cpu: number;
        ram: number;
    };
    [OpCodes.GuildJoin]: {
        id: string;
        name: string;
        icon: string | null;
        banner: string | null;
        features: `${GuildFeature}`[];
        members: number | null;
    };
    [OpCodes.GuildLeave]: {
        id: string;
    };
    [OpCodes.ConfigUpdate]: DeepPartial<ConfigSchema["bot"]>;
    [OpCodes.CreateCommand]: {
        id: number;
        type: "commands" | "slashes";
        commandData: IBaseCommand<string> | IApplicationCommandData;
    };
    [OpCodes.EditCommand]: {
        id: number;
        type: "commands" | "slashes";
        oldCommandData: IBaseCommand<string> | IApplicationCommandData;
        newCommandData: IBaseCommand<string> | IApplicationCommandData;
    };
    [OpCodes.DeleteCommand]: {
        id: number;
        type: "commands" | "slashes";
    };
    [OpCodes.DisableCommand]: {
        id: number;
        type: "commands" | "slashes";
    };
    [OpCodes.EnableCommand]: {
        id: number;
        type: "commands" | "slashes";
    };
    [OpCodes.MoveCommand]: {
        id: number;
        type: "commands" | "slashes";
        oldPath: string;
        newPath: string;
    };
};

interface DataObject<T extends OpCodes> {
    op: T;
    data?: EventsData[T];
};

export type TypedEventData = { [K in OpCodes]: DataObject<K> }[OpCodes];

interface Emitter {
    "websocket": TypedEventData;
};

class TypedEmitter extends EventEmitter {
    override on<K extends keyof Emitter>(eventName: K, listener: (data: Emitter[K]) => void): this {
        return super.on(eventName, listener);
    };

    override once<K extends keyof Emitter>(eventName: K, listener: (data: Emitter[K]) => void): this {
        return super.once(eventName, listener);
    };

    override emit<K extends keyof Emitter>(eventName: K, data: Emitter[K]): boolean {
        return super.emit(eventName, data);
    };

    override off<K extends keyof Emitter>(eventName: K, listener: (data: Emitter[K]) => void): this {
        return super.off(eventName, listener);
    };
};

export const emitter = new TypedEmitter();