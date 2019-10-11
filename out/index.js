"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const start_1 = require("./start");
//import { centerApi } from "./core";
start_1.start().then(() => {
    console.log('uq-api started!');
    /*
    centerApi.queueOut(0, 100).then(value => {
        console.log(value);
    }).catch(reason => {
        console.error(reason);
    });
    */
});
//# sourceMappingURL=index.js.map