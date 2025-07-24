import { join } from "path";
import { CommandManager } from "../../../managers/commands";
import { createRoute } from "../../structures/apiserver";
import { config } from "../../../config";
import { Permissions } from "../../structures/authManager";

export const data = createRoute({
    url: "/commands/:id?",
    method: "get",
    auth: {
        methods: ["get"],
        permissions: Permissions.ManageCommands
    },
    async handler(c, reply){
        const id = Number(c.req.param("id"));
        const type = c.req.query("type") as "commands" | "slashes" | undefined;
        if(!type) return reply.msg(400, "Invalid type");
        if(type !== "commands" && type !== "slashes") return reply.msg(400, "Invalid type");
        if(isNaN(id)){
            const data: ({path: string; id: number; disabled: boolean})[] = []
            for(let i = 0; i < CommandManager[`${type}Path`].length; i++){
                let path = CommandManager[`${type}Path`][i];
                if(!path) continue;
                path = path.replace(join(CommandManager.dir, config.commands[type == "commands" ? "base" : "slashes"]), "");
                data.push({ path, id: i, disabled: path.endsWith(".disabled") })
            }
            return reply.succ(data);
        };
        if(CommandManager[`${type}Path`][id] == null) return reply.msg(400, "Invalid ID");
        return reply.succ(CommandManager[`${type}Map`].get(CommandManager[`${type}Path`][id]!))
    }
})