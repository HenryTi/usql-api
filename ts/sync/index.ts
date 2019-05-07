import { syncDbs } from "./open";

let isRunning = false;

async function sync() {
    if (isRunning === true) return;
    isRunning = true;
    console.log('sync start at ', new Date().toLocaleTimeString());
    await syncDbs();
    isRunning = false;
}

export function startSync() {
    if (process.env.NODE_ENV === 'development') {
        //setTimeout(sync, 3000);
    }
    else {
        setInterval(sync, 60000);
    }
}
