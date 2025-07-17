import { GuildFeature } from "discord.js";
import EventEmitter from "events";

export enum OpCodes {
    Identify = 0,
    Power = 1,
    Console = 2,
    Usage = 3,
    GuildJoin = 4,
    GuildLeave = 5,
    TokeChange = 6,
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
    [OpCodes.TokeChange]: never;
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