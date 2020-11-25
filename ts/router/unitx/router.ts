import { Router, Request, Response, NextFunction } from "express";
import { RouterBuilder, EntityRunner, busQueueSeed, SheetMessage, Message } from "../../core";
import { messageProcesser } from "./messageProcesser";
import { writeDataToBus } from "./processBusMessage";

export function buildUnitxRouter(rb: RouterBuilder):Router {
    let router = Router();

    router.post('/', async (req: Request, res: Response, next: NextFunction) => {
        try {
            let msg:Message = req.body;
            let tos:number[] = undefined;
            let {type} = msg;
            let unitxRunner = await rb.getUnitxRunner();
            if (type === 'sheet') {
                let sheetMessage = msg as SheetMessage;
                let {from} = sheetMessage;
                tos = await getSheetTos(unitxRunner, sheetMessage);
                if (tos === undefined || tos.length === 0) tos = [from];
                sheetMessage.to = tos;
            }
            let mp = messageProcesser(msg);
            await mp(unitxRunner, msg);
            res.json({
                ok: true,
                res: tos,
            });
        }
        catch (e) {
            let err = JSON.stringify(e);
            console.error('unitx-error: ', err);
            res.json({
                ok: false,
                error: err,
            });
        }
    });

    let fetchBus = async (runner:EntityRunner, body:any):Promise<any[][]> => {
        let {unit, msgStart, faces} = body;
        let ret = await runner.unitUserTablesFromProc('tv_GetBusMessages', unit, undefined, msgStart, faces);
        return ret;
    }
    rb.post(router, '/fetch-bus', fetchBus);

    let jointReadBus = async (runner:EntityRunner, body:any):Promise<any> => {
        let {unit, face, queue} = body;
        if (queue === undefined) queue = busQueueSeed();
        let ret = await runner.unitUserCall('tv_BusMessageFromQueue', unit, undefined, face, queue);
        if (ret.length === 0) return;
        return ret[0];
    }
    rb.post(router, '/joint-read-bus',jointReadBus);

    let jointWriteBus = async (runner:EntityRunner, body:any):Promise<any> => {
        let {unit, face, to, from, fromQueueId, version, body:message} = body;
        let ret = await writeDataToBus(runner, face, unit, to, from, fromQueueId, version, message);
		if (ret < 0) {
			console.error('writeDataToBus message duplicated!', body, -ret);
		}
		return ret;
    }
    rb.post(router, '/joint-write-bus', jointWriteBus);
    
    return router;
}

// 之前用 getSheetTo 查询，现在改名为 getEntityAccess
const uqGetSheetTo = 'getEntityAccess';
async function getSheetTos(unitxRunner:EntityRunner, sheetMessage:SheetMessage):Promise<number[]> {
    let {unit, body} = sheetMessage;
    let {state, user, name, no, discription, uq } = body;
    // 新单只能发给做单人
    if (state === '$') return;
    // 上句中的to removed，由下面调用unitx来计算
    let sheetName = name;
    let stateName = state;
    let paramsGetSheetTo:any[] = [uq, sheetName, stateName];
    let tos:{to:number}[] = await unitxRunner.query(uqGetSheetTo, unit, user, paramsGetSheetTo);
    return tos.map(v=>v.to);
}
