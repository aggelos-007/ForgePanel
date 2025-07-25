import { execSync } from "child_process";
import { createRoute } from "../../structures/apiserver";
import { Panel } from "../../../managers";
import { Permissions } from "../../structures/authManager";

export const data = createRoute({
    url: "/server/packages",
    method: ["get", "post", "delete"],
    auth: {
        methods: ["post", "delete"],
        permissions: Permissions.ManageTerminal
    },
    async handler(c, reply){
        const body = await c.req.json().catch(()=>null) as { name: string };
        switch(c.req.method.toLowerCase()){
            case "get":
                delete require.cache[require.resolve(`${Panel.dir}/package.json`)];
                const json = require(`${Panel.dir}/package.json`);
                return reply.succ(json.dependencies)
            case "post":
                if(!body) return reply.msg(400, "Invalid body");
                try {
                    const pkgManager = Panel.config.panel.pkgManager;
                    execSync(`${pkgManager} ${pkgManager == "npm" ? "install" : "add"} ${body.name}`)
                    return reply.succ()
                } catch {
                    return reply.msg(500, "Failed to install package")
                }
            case "delete":
                if(!body) return reply.msg(400, "Invalid body");
                try {
                    const pkgManager = Panel.config.panel.pkgManager;
                    execSync(`${pkgManager} ${pkgManager == "npm" ? "uninstall" : "remove"} ${body.name}`)
                    return reply.succ()
                } catch {
                    return reply.msg(500, "Failed to uninstall package")
                }
        };
    }
})