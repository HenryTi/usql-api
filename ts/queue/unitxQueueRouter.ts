import {Router, Request, Response, NextFunction} from 'express';
import { Message, SheetMessage, consts, Runner, RouterBuilder } from '../core';
//import { queueUnitxIn } from './unitxInQueue';
import { messageProcesser } from './messageProcesser';

//export const unitxQueueRouter: Router = Router();

export function buildUnitxQueueRouter(router:Router, rb:RouterBuilder) {
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
