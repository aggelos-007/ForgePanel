import { join } from 'path'
import { Readable } from 'stream';
import { Context, Hono } from 'hono';
import { lstatSync, readdirSync, watch } from 'fs';
import { createServer, IncomingMessage } from 'http';
import { ContentfulStatusCode } from 'hono/utils/http-status';

const isValidFile = (file: string) => file.endsWith('.js')
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RouteOptions<P extends string> {
    url: P;
    method: Lowercase<HTTPMethod> | Lowercase<HTTPMethod>[];
    handler: (c: Context<any, P>, r: {succ: (data?: any) => any; msg: (status: number, message?: any) => any}) => Promise<any>;
};

export function createRoute<T extends string>(input: RouteOptions<T>): RouteOptions<T> { return input; };

export class APIServer {
    app = new Hono();
    server: ReturnType<typeof createServer>;
    #dirs: string[] = [];

    constructor(private dir: string){
        this.server = createServer(async (req, res) => {
            const response = await this.app.fetch(await this.#toRequest(req))
            const body = await response.text()
            res.writeHead(response.status, Object.fromEntries(response.headers));
            res.end(body)
        })

        this.#watcher(dir).then(() => {
            for(const dir of this.#dirs){
                watch(dir, this.load.bind(this));
            }
        })
    }

    async load(){
        const app = new Hono()
        app.notFound(c => c.json({status: 404, message: `${c.req.method.toUpperCase()} ${c.req.path} Not Found`}, 404))

        app.onError((err, c) => {
            console.log(err)
            return c.json({status: 500, message: "Internal Server Error"}, 500);
        })
        this.app = app
        await this.#loader(this.dir);
    };

    async #loader(dir: string) {
        const root = join(__dirname, "..");
        const files = readdirSync(join(root, dir));

        for (const file of files) {
            const path = join(root, dir, file);
            const stat = lstatSync(path);

            if (stat.isDirectory()) {
                await this.#loader(join(dir, file));
            } else if (isValidFile(file)) {
                delete require.cache[require.resolve(path)];
                const route = require(path).data as RouteOptions<string>;
                if (!route) continue;
                this.app.on((Array.isArray(route.method) ? route.method : [route.method]).flatMap(s => s.toUpperCase()), route.url, (c) => {
                    return route.handler(c, {
                        succ: (data?: any) => c.json({status: 200, data}, 200),
                        msg: (status: number, message?: string) => c.json({status, message}, status as ContentfulStatusCode)
                    })
                });
            };
        };
    };

    async #watcher(dir: string){
        const root = join(__dirname, "..");
        const files = readdirSync(join(root, dir));

        for (const file of files) {
            const path = join(root, dir, file);
            const stat = lstatSync(path);

            if(!stat.isDirectory()) continue;
            this.#dirs.push(join(root, dir, file));
            this.#watcher(join(dir, file))
        };
    }

    #toRequest(req: IncomingMessage): Promise<Request> {
        const url = `http://${req.headers.host}${req.url}`;
        const method = req.method || 'GET';
        const headers = new Headers();

        for (const [key, value] of Object.entries(req.headers)) {
            if (Array.isArray(value)) {
                for (const v of value) headers.append(key, v);
            } else if (value !== undefined) {
                headers.set(key, value);
            }
        }

        return Promise.resolve(new Request(url, { method, headers, ...((method !== "GET" && method !== "HEAD") ? {body:  Readable.toWeb(req) as BodyInit, duplex: "half"} : {}) }));
    }

    listen(port: number) {
        return this.server.listen(port);
    };
};