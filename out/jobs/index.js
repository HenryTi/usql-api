"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./jobs"), exports);
/*
import { syncDbs } from "../jobs/syncDbs";

export function startSync() {
    let timeout:number = process.env.NODE_ENV === 'development'?
        6000 : 60*1000;
    setTimeout(sync, timeout);
}

async function sync() {
    try {
        console.log('sync at: ' + new Date().toLocaleTimeString());
        await syncDbs();
    }
    catch (err) {
        console.error('sync error: ', err);
    }
    finally {
        setTimeout(sync, 60*1000);
    }
}
*/ 
//# sourceMappingURL=index.js.map