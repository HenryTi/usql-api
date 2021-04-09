//import {Router, Request, Response, NextFunction} from 'express';
//import { Message, SheetMessage, consts, Runner, RouterBuilder, busQueueSeed } from '../core';
//import { queueUnitxIn } from './unitxInQueue';
//import { messageProcesser } from './messageProcesser';
//export const unitxQueueRouter: Router = Router();
/*export*/
/*
function buildUnitxQueueRouter(router:Router, rb:RouterBuilder) {
    router.post('/', async (req: Request, res: Response, next: NextFunction) => {
        try {
            let msg:Message = req.body;
            let tos:number[] = undefined;
            let {type} = msg;
            let unitxRunner = await rb.getRunner(consts.$unitx);
            if (type === 'sheet') {
                let sheetMessage = msg as SheetMessage;
                let {from} = sheetMessage;
                tos = await getSheetTos(unitxRunner, sheetMessage);
                if (tos === undefined || tos.length === 0) tos = [from];
                sheetMessage.to = tos;
            }
            //await queueUnitxIn(msg);
            let mp = messageProcesser(msg);
            await mp(unitxRunner, msg);
            console.log('await queueUnitxIn(msg)', msg);
            res.json({
                ok: true,
                res: tos,
            });
        }
        catch (e) {
            res.json({
                ok: false,
                error: JSON.stringify(e),
            });
        }
    });
    
    rb.post(router, '/bus',
    async (runner:Runner, body:any):Promise<any[][]> => {
        let {unit, msgStart, faces} = body;
        let ret = await runner.unitUserTablesFromProc('tv_GetBusMessages', unit, undefined, msgStart, faces);
        console.log(`$unitx/open/bus - GetBusMessages - ${ret}`);
        return ret;
    });

    rb.post(router, '/joint-read-bus',
    async (runner:Runner, body:any):Promise<any> => {
        let {unit, face, queue} = body;
        if (queue === undefined) queue = busQueueSeed();
        let ret = await runner.unitUserCall('tv_BusMessageFromQueue', unit, undefined, face, queue);
        if (ret.length === 0) return;
        return ret[0];
    });

    rb.post(router, '/joint-write-bus',
    async (runner:Runner, body:any):Promise<any> => {
        let {unit, face, from, sourceId, body:message} = body;
        let ret = await runner.unitUserCall('tv_SaveBusMessage', unit, undefined, face, from, sourceId, message);
        return ret;
    });
}

// 之前用 getSheetTo 查询，现在改名为 getEntityAccess
const uqGetSheetTo = 'getEntityAccess';
async function getSheetTos(unitxRunner:Runner, sheetMessage:SheetMessage):Promise<number[]> {
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
*/ 
//# sourceMappingURL=unitxQueueRouter.js.map