import {Router, Request, Response, NextFunction} from 'express';
import { Runner } from '../../db';
import { checkRunner } from '../router';
import { listenerCount } from 'cluster';

export const router: Router = Router({ mergeParams: true });

(function(router:Router) {
    post(router, '/fresh',
    async (runner:Runner, body:any):Promise<any> => {
        body.$ = 'open/fresh';
        console.log(body);
        let {unit, stamps} = body;
        // tuidStamps: 'tuid-name'  stamp  id, tab分隔，\n分行
        await runner.call('$$open_fresh', [unit, stamps]);
    });

    post(router, '/tuid',
    async (runner:Runner, body:any):Promise<any> => {
        body.$ = 'open/tuid';
        console.log(body);
        let {unit, id, tuid, maps} = body;
        if (runner.isTuidOpen(tuid) === false) return;
        // maps: tab分隔的map名字
        let ret:{[key:string]: any} = {};
        let tuidRet = await runner.call(tuid, [unit, undefined, id]);
        ret[tuid] = tuidRet;
        for (let m of maps) {
            let map = runner.getMap(m);
            if (map === undefined) continue;
            let {keys} = map.call;
            let params = [unit, undefined, id]
            for (let i=1;i<keys.length; i++) params.push(undefined);
            let mapRet = await runner.call(m + '$query$', params);
            ret[m] = mapRet;
        }
        return ret;
    });
})(router);

type Processer = (runner:Runner, body:any) => Promise<any>;

function post(router:Router, path:string, processer:Processer) {
    router.post(path, async (req:Request, res:Response) => {
        await process(req, res, processer);
    });
};

function get(router:Router, path:string, processer:Processer) {
    router.get(path, async (req:Request, res:Response) => {
        await process(req, res, processer);
    });
};

function put(router:Router, path:string, processer:Processer) {
    router.put(path, async (req:Request, res:Response) => {
        await process(req, res, processer);
    });
};

async function process(req:Request, res:Response, processer:Processer):Promise<void> {
    try {
        let db = req.params.db;
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        let body = (req as any).body;
        let result = await processer(runner, body);
        res.json({
            ok: true,
            res: result
        });
    }
    catch (err) {
        res.json({error: err});
    }
}
