import { join } from "path";
import { readFile } from "fs/promises";
import { config } from "../../../config";
import { createRoute } from "../../structures/apiserver";

export const data = createRoute({
    url: "/server/console",
    method: "get",
    async handler(_, reply){
        const file = await readFile(join(config.dir, "console.log"), { encoding: "utf-8"}).catch(()=>{});
        if(!file) return reply.msg(500, "An error occured while trying to read console.");
        return reply.succ(file)
    }
});