/*
import {Router, Request, Response, NextFunction} from 'express';
import { queueUnitx } from './unitxQueue';
import { processSheetMessage } from './processSheetMessage';

export const unitxRouter: Router = Router();

unitxRouter.post('/sheet', async (req: Request, res: Response, next: NextFunction) => {
    try {
        let msg = req.body;
        let {$unit} = msg;
        let tos:number[] = await processSheetMessage($unit, msg);
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

unitxRouter.post('/bus', async (req: Request, res: Response, next: NextFunction) => {
    try {
        let msg = req.body;
        await queueUnitx(msg);
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
*/