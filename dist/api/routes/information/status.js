"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const managers_1 = require("../../../managers");
const apiserver_1 = require("../../structures/apiserver");
exports.data = (0, apiserver_1.createRoute)({
    url: "/server/status",
    method: "get",
    async handler(_, send) {
        return send.succ(managers_1.InstanceManager.child ? "running" : "stopped");
    }
});
