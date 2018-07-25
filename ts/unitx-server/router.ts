import {Router, Request, Response, NextFunction} from 'express';
import { addUnitxInQueue } from './inQueue';

export const unitxRouter: Router = Router();

unitxRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    let body = req.body;
    let s = null;
    try {
        // service: service uid
        // unit: message unit id
        // bus: bus name, owner/name
        // face: face name
        let msg = req.body;
        //let runner = getRunner('$unitx');
        //await runner.unitxMessage(msg);
        //debugger; // 应该在$unitx数据库中，建立一个action
        // 实际上不入库，只是加入queue
        //(msg as any).job = 'unitx';
        await addUnitxInQueue(msg);
        res.json({
            ok: true,
        });
    }
    catch (e) {
        res.json({
            ok: false,
            error: JSON.stringify(e),
        });
    }
});

