import { Router } from 'express';
import { EntityRunner, busQueueSeed, RouterBuilder, testNet } from '../../core';

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
    async (runner:EntityRunner, body:any, params:any):Promise<any> => {
        return await runner.getEntities(params.unit);
    });

    rb.get(router, '/entity/:entityName',
    async (runner:EntityRunner, body:any, params:any):Promise<any> => {
        return runner.getSchema(params.entityName);
    });

    rb.post(router, '/entities/:unit',
    async (runner:EntityRunner, body:any, params:any):Promise<any> => {
        return await runner.getEntities(params.unit);
    });

    rb.post(router, '/from-entity',
    async (runner:EntityRunner, body:any):Promise<any> => {
        let {unit, entity, key} = body;
        let schema = runner.getSchema(entity);
        let {type} = schema;
        if (type === 'tuid') {
            let tuidRet = await runner.unitUserCall('tv_' + entity, unit, undefined, key);
            return tuidRet;
        }
        if (type === 'map') {
            let keys = key.split('\t');
            let len = keys.length;
            for (let i=0; i<len; i++) {
                if (!key[i]) keys[i] = undefined;
            }
            let {keys:keyFields} = schema.call;
            let fieldsLen = keyFields.length;
            for (let i=len; i<fieldsLen; i++) {
                keys.push(undefined);
            }
            let mapRet = await runner.unitUserCall('tv_' + entity + '$query$', unit, undefined, keys);
            return mapRet;
        }
    });

    rb.post(router, '/queue-modify',
    async (runner:EntityRunner, body:any):Promise<any> => {
        let {unit, start, page, entities} = body;
        let ret = await runner.unitTablesFromProc('tv_$modify_queue', unit, start, page, entities);
        let ret1 = ret[1];
        let modifyMax = ret1.length===0? 0: ret1[0].max;
        runner.setModifyMax(unit, modifyMax);
        return {
            queue: ret[0],
            queueMax: modifyMax
        };
    });

    rb.post(router, '/bus-query',
    async (runner:EntityRunner, body:any):Promise<any> => {
        let {unit, busOwner, busName, face:faceName, params} = body;
        let faceUrl = `${busOwner}/${busName}/${faceName}`;
        let face = runner.buses.coll[faceUrl];
        let {bus} = face;
        let ret = await runner.tablesFromProc(bus + '_' + faceName, [unit, 0, ...params])
        return ret;
    });

    rb.post(router, '/tuid-main/:tuid',
    async (runner:EntityRunner, body:any, params:any):Promise<any> => {
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
    async (runner:EntityRunner, body:any, params:any):Promise<any> => {
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
