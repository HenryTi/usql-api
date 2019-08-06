"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const start_1 = require("./start");
const core_1 = require("./core");
start_1.start().then(() => {
    console.log('uq-api started!');
    core_1.centerApi.queueOut(0, 100).then(value => {
        console.log(value);
    }).catch(reason => {
        console.error(reason);
    });
});
//# sourceMappingURL=index.js.map