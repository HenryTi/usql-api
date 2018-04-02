import {Router, Request, Response, NextFunction} from 'express';
import {getRunner, Runner, resetRunner} from '../usql/runner';
import { centerApi, UnitxApi } from "../core/centerApi";

const unitxColl: {[id:number]: string} = {};

export async function sendtoUnitx(jobData: {unit:number, busOwner:string, bus:string, face:string, data:any}):Promise<void> {
    try {
        let {unit, busOwner, bus, face, data} = jobData;
        let unitxUrl = await getUnitxUrl(unit);
        if (unitxUrl === null) {
            console.log('unit %s not have unitx', unit);
            return;
        }
        let unitx = new UnitxApi(unitxUrl);
        await unitx.send(jobData);
        console.log(JSON.stringify(data));
    }
    catch (e) {
        console.error(e);
    }
}

async function getUnitxUrl(unit:number):Promise<string> {
    let unitxUrl = unitxColl[unit];
    if (unitxUrl !== undefined) return unitxUrl;
    let unitx = await centerApi.unitx(unit);
    if (unitx === undefined) return unitxColl[unit] = null;
    return unitxColl[unit] = unitx.url;
}

export const unitxRouter: Router = Router();

unitxRouter.post('/post', async (req:Request, res:Response) => {
    try {
        console.log('/unitx/post %s', JSON.stringify(req.body));
        let user = (req as any).user;
        let {db} = user;
        let runner = await getRunner(db);
        if (runner === undefined) {
            res.json({
                ok: false,
                error: 'Database ' + db + ' 不存在'
            });
            return;
        }
        await runner.unitxPost(req.body);
        res.json({
            ok:true,
        });
    }
    catch (e) {
        res.json({
            ok: false,
            error: e,
        });
    }
});
