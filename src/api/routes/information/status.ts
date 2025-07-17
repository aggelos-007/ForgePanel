import { InstanceManager } from "../../../managers";
import { createRoute } from "../../structures/apiserver";

export const data = createRoute({
    url: "/server/status",
    method: "get",
    async handler(_, send){
        return send.succ(InstanceManager.child ? "running" : "stopped");
    }
});