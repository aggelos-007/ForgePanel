import Database from "better-sqlite3";
import { createHmac, randomBytes } from "crypto";
import { mkdirSync, existsSync } from "fs";

export interface UserSchema {
    id: string;
    token: string;
    permissions: number;
}

export enum Permissions {
    ManageMembers = 1 << 1,
    ManageBot = 1 << 2,
    ManageGuilds = 1 << 3,
    ManageDataBase = 1 << 5,
    ManagePower = 1 << 6,
    ManageTerminal = 1 << 7,
    ManageCommands = 1 << 8
}

export class AuthManager {
    static db: Database.Database;
    static isReady = false;
    static initToken: string | null = null;

    constructor(dir: string){
        if(!existsSync(dir)) mkdirSync(dir, { recursive: true });
        const db = new Database(`${dir}/auth.db`);

        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                token TEXT,
                permissions NUMBER
            )
        `);

        AuthManager.db = db;
        AuthManager.init()
    }

    static init(){
        this.isReady = this.db.prepare("SELECT * FROM users").all().length > 0;;
        if(this.isReady) return;
        this.initToken = this.generateToken();
    }

    static generateToken(){
        const secret = randomBytes(4).toString("hex")

        const data = Buffer.from(JSON.stringify({
            random: randomBytes(4).toString("hex")
        })).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
        const signature = createHmac("sha256", secret).update(data).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")

        return `${data}.${signature}`
    }

    static setUser(data: {id: string, permissions: number}){
        let token: string;
        if(!this.isReady) {
            this.isReady = true;
            this.initToken = null;
        };

        const exists = this.db.prepare("SELECT * FROM users WHERE id = ?").get(data.id) as UserSchema | undefined;
        if(exists){
            token = exists.token;
            this.db.prepare(`UPDATE users SET token = ?, permissions = ? WHERE id = ?`).run(token, data.permissions, data.id);
        } else {
            token = this.generateToken();
            this.db.prepare(`INSERT INTO users (id, token, permissions) VALUES (?, ?, ?)`).run(data.id, token, data.permissions);
        };
        return token;
    }

    static getUser(id: string){
        return this.db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserSchema | undefined;
    }

    static getUserByToken(token: string){
        return this.db.prepare("SELECT * FROM users WHERE token = ?").get(token) as UserSchema | undefined;
    }

    static deleteToken(id: string){
        return Boolean(this.db.prepare("DELETE FROM users WHERE id = ?").run(id).changes);
    }

    static getUsers(){
        return this.db.prepare("SELECT * FROM users").all() as UserSchema[];
    }
}