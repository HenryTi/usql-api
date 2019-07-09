"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./jobs"));
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