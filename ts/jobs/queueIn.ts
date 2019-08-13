import { Net, Runner } from "../core";
import { Finish } from "./finish";

export async function queueIn(runner: Runner,  net: Net) {
    let start = 0;
    let {buses} = runner;
    let {hasError} = buses;
    while (hasError === false) {
        try {
            let queueInArr:any[] = await runner.call('$queue_in_get',[start]);
            if (queueInArr.length === 0) break;
            for (let queueIn of queueInArr) {
                let {bus, faceName, id, unit, data, tries, update_time, now} = queueIn;
                start = id;
                if (!unit) unit = runner.uniqueUnit;
                if (tries > 0) {
                    // 上次尝试之后十分钟内不尝试
                    if (now - update_time < tries * 10 * 60) continue;
                }
                let finish:Finish;
                try {
                    await runner.bus(bus, faceName, unit, id, data);
                    finish = Finish.done;
                }
                catch (err) {
                    if (tries < 5) {
                        finish = Finish.retry; // retry
                    }
                    else {
                        finish = Finish.bad;  // fail
                    }
                    let errSubject = `error on ${bus}/${faceName}:${id}`;
                    let error = typeof(err)==='object'?
                        err.message : err;
                    await runner.log(unit, errSubject, error);
                }
                if (finish !== Finish.done) {
                    // 操作错误，retry++ or bad
                    await runner.call('$queue_in_set', [id, finish]); 
                }
            }
        }
        catch (err) {
            hasError = buses.hasError = true;
            console.error(err);
            break;
        }
    }
}
