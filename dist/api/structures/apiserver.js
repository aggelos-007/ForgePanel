"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIServer = void 0;
exports.createRoute = createRoute;
const path_1 = require("path");
const stream_1 = require("stream");
const hono_1 = require("hono");
const fs_1 = require("fs");
const http_1 = require("http");
const authManager_1 = require("../structures/authManager");
const isValidFile = (file) => file.endsWith('.js');
;
function createRoute(input) { return input; }
;
class APIServer {
    dir;
    app = new hono_1.Hono();
    server;
    #dirs = [];
    constructor(dir) {
        this.dir = dir;
        this.server = (0, http_1.createServer)(async (req, res) => {
            const response = await this.app.fetch(await this.#toRequest(req));
            const body = await response.text();
            res.writeHead(response.status, Object.fromEntries(response.headers));
            res.end(body);
        });
        this.#watcher(dir).then(() => {
            for (const dir of this.#dirs) {
                (0, fs_1.watch)(dir, this.load.bind(this));
            }
        });
    }
    async load() {
        const app = new hono_1.Hono();
        app.notFound(c => c.json({ status: 404, message: `${c.req.method.toUpperCase()} ${c.req.path} Not Found` }, 404));
        app.onError((err, c) => {
            console.log(err);
            return c.json({ status: 500, message: "Internal Server Error" }, 500);
        });
        app.use(async (c, next) => {
            const auth = c.req.header("Authorization");
            if (!auth)
                return c.json({ status: 401, message: "Unauthorized" }, 401);
            const data = authManager_1.AuthManager.getUserByToken(auth);
            if (!data)
                return c.json({ status: 401, message: "Unauthorized" }, 401);
            c.set("user", data);
            return next();
        });
        this.app = app;
        await this.#loader(this.dir);
    }
    ;
    async #loader(dir) {
        const root = (0, path_1.join)(__dirname, "..");
        const files = (0, fs_1.readdirSync)((0, path_1.join)(root, dir));
        for (const file of files) {
            const path = (0, path_1.join)(root, dir, file);
            const stat = (0, fs_1.lstatSync)(path);
            if (stat.isDirectory()) {
                await this.#loader((0, path_1.join)(dir, file));
            }
            else if (isValidFile(file)) {
                delete require.cache[require.resolve(path)];
                const route = require(path).data;
                if (!route)
                    continue;
                this.app.on((Array.isArray(route.method) ? route.method : [route.method]).flatMap(s => s.toUpperCase()), route.url, (c) => {
                    if (route.auth) {
                        if (route.auth.methods.includes(c.req.method.toLowerCase()) && (route.auth.permissions & c.get("user").permissions) == 0)
                            return c.json({ status: 403, message: "Access Forbidden" }, 403);
                    }
                    return route.handler(c, {
                        succ: (data) => c.json({ status: 200, data }, 200),
                        msg: (status, message) => c.json({ status, message }, status)
                    });
                });
            }
            ;
        }
        ;
    }
    ;
    async #watcher(dir) {
        const root = (0, path_1.join)(__dirname, "..");
        const files = (0, fs_1.readdirSync)((0, path_1.join)(root, dir));
        for (const file of files) {
            const path = (0, path_1.join)(root, dir, file);
            const stat = (0, fs_1.lstatSync)(path);
            if (!stat.isDirectory())
                continue;
            this.#dirs.push((0, path_1.join)(root, dir, file));
            this.#watcher((0, path_1.join)(dir, file));
        }
        ;
    }
    #toRequest(req) {
        const url = `http://${req.headers.host}${req.url}`;
        const method = req.method || 'GET';
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
            if (Array.isArray(value)) {
                for (const v of value)
                    headers.append(key, v);
            }
            else if (value !== undefined) {
                headers.set(key, value);
            }
        }
        return Promise.resolve(new Request(url, { method, headers, ...((method !== "GET" && method !== "HEAD") ? { body: stream_1.Readable.toWeb(req), duplex: "half" } : {}) }));
    }
    listen(port) {
        return this.server.listen(port);
    }
    ;
}
exports.APIServer = APIServer;
;
