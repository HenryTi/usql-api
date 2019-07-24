import { Router } from 'express';
import { Runner, busQueueSeed, RouterBuilder } from '../../core';

//type Processer = (runner:Runner, body:any, params?:any) => Promise<any>;

export function buildOpenRouter(router:Router, rb: RouterBuilder) {
    /*
    function post(router:Router, path:string, processer:Processer) {
        router.post(path, async (req:Request, res:Response) => {
            await process(req, res, processer, (req as any).body, req.params);
        });
    };
    
    function get(router:Router, path:string, processer:Processer) {
        router.get(path, async (req:Request, res:Response) => {
            await process(req, res, processer, req.query, req.params);
        });
    };
    
    function put(router:Router, path:string, processer:Processer) {
        router.put(path, async (req:Request, res:Response) => {
            await process(req, res, processer, (req as any).body, req.params);
        });
    };
    
    async function process(req:Request, res:Response, processer:Processer, queryOrBody:any, params:any):Promise<void> {
        try {
            let db = req.params.db;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            //let body = (req as any).body;
            let result = await processer(runner, queryOrBody, params);
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({error: err});
        }
    }
    */
    
    rb.get(router, '/entities/:unit',
    async (runner:Runner, body:any, params:any):Promise<any> => {
        return await runner.getEntities(params.unit);
    });

    rb.get(router, '/entity/:entityName',
    async (runner:Runner, body:any, params:any):Promise<any> => {
        return runner.getSchema(params.entityName);
    });

    rb.post(router, '/entities/:unit',
    async (runner:Runner, body:any, params:any):Promise<any> => {
        return await runner.getEntities(params.unit);
    });

    rb.post(router, '/fresh',
    async (runner:Runner, body:any):Promise<any> => {
        let {unit, stamps} = body;
        // tuidStamps: 'tuid-name'  stamp  id, tab分隔，\n分行
        let stampsText = stamps.map((v:string[]) => v.join('\t')).join('\n');
        try {
            let ret = await runner.$$openFresh(unit, stampsText);
            return ret;
        }
        catch (err) {
            console.log(err.message);
        }
    });

    rb.post(router, '/tuid',
    async (runner:Runner, body:any):Promise<any> => {
        body.$ = 'open/tuid';
        console.log(body);
        let {unit, id, tuid, maps} = body;
        if (runner.isTuidOpen(tuid) === false) return;
        // maps: tab分隔的map名字
        let ret:{[key:string]: any} = {};
        let tuidRet = await runner.unitUserCall(tuid, unit, undefined, id);
        ret[tuid] = tuidRet;
        if (maps !== undefined) {
            for (let m of maps) {
                let map = runner.getMap(m);
                if (map === undefined) continue;
                let {keys} = map.call;
                let params = [unit, undefined, id]
                for (let i=1;i<keys.length; i++) params.push(undefined);
                let mapRet = await runner.call(m + '$query$', params);
                ret[m] = mapRet;
            }
        }
        return ret;
    });

    rb.post(router, '/tuid-main/:tuid',
    async (runner:Runner, body:any, params:any):Promise<any> => {
        body.$ = 'open/tuid-main/';
        console.log(body);
        let {tuid} = params;
        let {unit, id, all} = body;
        if (runner.isTuidOpen(tuid) === false) return;
        // maps: tab分隔的map名字
        let suffix = (all===true? '$id':'$main');
        let ret = await runner.unitUserCall('tv_' + tuid + suffix, unit, undefined, id);
        return ret;
    });

    rb.post(router, '/tuid-div/:tuid/:div',
    async (runner:Runner, body:any, params:any):Promise<any> => {
        body.$ = 'open/tuid-div/';
        console.log(body);
        let {tuid, div} = params;
        let {unit, id, ownerId, all} = body;
        if (runner.isTuidOpen(tuid) === false) return;
        // maps: tab分隔的map名字
        let suffix = (all===true? '$id':'$main');
        return await runner.unitUserCall(`tv_${tuid}_${div}${suffix}`, unit, undefined, ownerId, id);
    });
};
