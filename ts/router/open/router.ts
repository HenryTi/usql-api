import {Router, Request, Response, static as Static} from 'express';
import { Runner } from '../../db';
import { checkRunner } from '../router';
import { busQueueSeed } from '../../core/busQueueSeed';

export const router: Router = Router({ mergeParams: true });

(function(router:Router) {
    get(router, '/entities/:unit',
    async (runner:Runner, body:any, params:any):Promise<any> => {
        return await runner.getEntities(params.unit);
    });

    get(router, '/entity/:entityName',
    async (runner:Runner, body:any, params:any):Promise<any> => {
        return runner.getSchema(params.entityName);
    });

    post(router, '/entities/:unit',
    async (runner:Runner, body:any, params:any):Promise<any> => {
        return await runner.getEntities(params.unit);
    });

    post(router, '/fresh',
    async (runner:Runner, body:any):Promise<any> => {
        let {unit, stamps} = body;
        // tuidStamps: 'tuid-name'  stamp  id, tab分隔，\n分行
        let stampsText = stamps.map((v:string[]) => v.join('\t')).join('\n');
        try {
            let ret = await runner.call('$$open_fresh', [unit, stampsText]);
            return ret;
        }
        catch (err) {
            console.log(err.message);
        }
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

    post(router, '/tuid-main/:tuid',
    async (runner:Runner, body:any, params:any):Promise<any> => {
        body.$ = 'open/tuid-main/';
        console.log(body);
        let {tuid} = params;
        let {unit, id, all} = body;
        if (runner.isTuidOpen(tuid) === false) return;
        // maps: tab分隔的map名字
        let suffix = (all===true? '$id':'$main');
        let ret = await runner.call(tuid + suffix, [unit, undefined, id]);
        return ret;
    });

    post(router, '/tuid-div/:tuid/:div',
    async (runner:Runner, body:any, params:any):Promise<any> => {
        body.$ = 'open/tuid-div/';
        console.log(body);
        let {tuid, div} = params;
        let {unit, id, ownerId, all} = body;
        if (runner.isTuidOpen(tuid) === false) return;
        // maps: tab分隔的map名字
        let suffix = (all===true? '$id':'$main');
        return await runner.call(`${tuid}_${div}${suffix}`, [unit, undefined, ownerId, id]);
    });

    post(router, '/bus',
    async (runner:Runner, body:any):Promise<any> => {
        let {unit, faces, faceUnitMessages} = body;
        let ret = await runner.call('GetBusMessages', [unit, undefined, faces, faceUnitMessages]);
        console.log('$unitx/open/bus - GetBusMessages - ', ret);
        return ret;
    });

    post(router, '/joint-read-bus',
    async (runner:Runner, body:any):Promise<any> => {
        let {unit, face, queue} = body;
        if (queue === undefined) queue = busQueueSeed();
        let ret = await runner.call('BusMessageFromQueue', [unit, undefined, face, queue]);
        if (ret.length === 0) return;
        return ret[0];
    });

    post(router, '/joint-write-bus',
    async (runner:Runner, body:any):Promise<any> => {
        let {unit, face, from, sourceId, body:message} = body;
        /*
        let data = '';
        if (face !== null && face !== undefined) data += face;
        data += '\t';
        if (from !== null && from !== undefined) data += from;
        data += '\t';
        if (sourceId !== null && sourceId !== undefined) data += sourceId;
        data += '\t';
        data += message + '\n';
        */
        let ret = await runner.call('SaveBusMessage', [unit, undefined, face, from, sourceId, message]);
        //let ret = await runner.call('SaveBusMessage', [unit, undefined, data]);
        return ret;
    });
})(router);

type Processer = (runner:Runner, body:any, params?:any) => Promise<any>;

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
