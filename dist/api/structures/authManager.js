"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = exports.Permissions = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const crypto_1 = require("crypto");
const fs_1 = require("fs");
var Permissions;
(function (Permissions) {
    Permissions[Permissions["ManageMembers"] = 2] = "ManageMembers";
    Permissions[Permissions["ManageBot"] = 4] = "ManageBot";
    Permissions[Permissions["ManageGuilds"] = 8] = "ManageGuilds";
    Permissions[Permissions["ManageDataBase"] = 32] = "ManageDataBase";
    Permissions[Permissions["ManagePower"] = 64] = "ManagePower";
    Permissions[Permissions["ManageTerminal"] = 128] = "ManageTerminal";
    Permissions[Permissions["ManageCommands"] = 256] = "ManageCommands";
})(Permissions || (exports.Permissions = Permissions = {}));
class AuthManager {
    static db;
    static isReady = false;
    static initToken = null;
    constructor(dir) {
        if (!(0, fs_1.existsSync)(dir))
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        const db = new better_sqlite3_1.default(`${dir}/auth.db`);
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                token TEXT,
                permissions NUMBER
            )
        `);
        AuthManager.db = db;
        AuthManager.init();
    }
    static init() {
        this.isReady = this.db.prepare("SELECT * FROM users").all().length > 0;
        ;
        if (this.isReady)
            return;
        this.initToken = this.generateToken();
    }
    static generateToken() {
        const secret = (0, crypto_1.randomBytes)(4).toString("hex");
        const data = Buffer.from(JSON.stringify({
            random: (0, crypto_1.randomBytes)(4).toString("hex")
        })).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        const signature = (0, crypto_1.createHmac)("sha256", secret).update(data).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        return `${data}.${signature}`;
    }
    static setUser(data) {
        let token;
        if (!this.isReady) {
            this.isReady = true;
            this.initToken = null;
        }
        ;
        const exists = this.db.prepare("SELECT * FROM users WHERE id = ?").get(data.id);
        if (exists) {
            token = exists.token;
            this.db.prepare(`UPDATE users SET token = ?, permissions = ? WHERE id = ?`).run(token, data.permissions, data.id);
        }
        else {
            token = this.generateToken();
            this.db.prepare(`INSERT INTO users (id, token, permissions) VALUES (?, ?, ?)`).run(data.id, token, data.permissions);
        }
        ;
        return token;
    }
    static getUser(id) {
        return this.db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    }
    static getUserByToken(token) {
        return this.db.prepare("SELECT * FROM users WHERE token = ?").get(token);
    }
    static deleteToken(id) {
        return Boolean(this.db.prepare("DELETE FROM users WHERE id = ?").run(id).changes);
    }
    static getUsers() {
        return this.db.prepare("SELECT * FROM users").all();
    }
}
exports.AuthManager = AuthManager;
