export * from './jobs';

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