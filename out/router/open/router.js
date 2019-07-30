"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
//type Processer = (runner:Runner, body:any, params?:any) => Promise<any>;
function buildOpenRouter(router, rb) {
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
    rb.get(router, '/entities/:unit', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.getEntities(params.unit);
    }));
    rb.get(router, '/entity/:entityName', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        return runner.getSchema(params.entityName);
    }));
    rb.post(router, '/entities/:unit', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.getEntities(params.unit);
    }));
    rb.post(router, '/fresh', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, stamps } = body;
        // tuidStamps: 'tuid-name'  stamp  id, tab分隔，\n分行
        let stampsText = stamps.map((v) => v.join('\t')).join('\n');
        try {
            let ret = yield runner.$$openFresh(unit, stampsText);
            return ret;
        }
        catch (err) {
            console.log(err.message);
        }
    }));
    rb.post(router, '/from-entity', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        //body.$ = 'open/tuid';
        console.log(body);
        let { unit, entity, key } = body;
        let schema = runner.getSchema(entity);
        let { type } = schema;
        if (type === 'tuid') {
            let tuidRet = yield runner.unitUserCall('tv_' + entity, unit, undefined, key);
            return tuidRet;
        }
        if (type === 'map') {
            let mapRet = yield runner.unitUserCall('tv_' + entity + '$query$', unit, undefined, key.split('\t'));
            return mapRet;
        }
    }));
    rb.post(router, '/queue-modify', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, start, page, entities } = body;
        let ret = yield runner.unitTablesFromProc('tv_$modify_queue', unit, start, page, entities);
        let ret1 = ret[1];
        return {
            queue: ret[0],
            queueMax: ret1.length === 0 ? 0 : ret1[0].max
        };
    }));
    rb.post(router, '/tuid-main/:tuid', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'open/tuid-main/';
        console.log(body);
        let { tuid } = params;
        let { unit, id, all } = body;
        if (runner.isTuidOpen(tuid) === false)
            return;
        // maps: tab分隔的map名字
        let suffix = (all === true ? '$id' : '$main');
        let ret = yield runner.unitUserCall('tv_' + tuid + suffix, unit, undefined, id);
        return ret;
    }));
    rb.post(router, '/tuid-div/:tuid/:div', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'open/tuid-div/';
        console.log(body);
        let { tuid, div } = params;
        let { unit, id, ownerId, all } = body;
        if (runner.isTuidOpen(tuid) === false)
            return;
        // maps: tab分隔的map名字
        let suffix = (all === true ? '$id' : '$main');
        return yield runner.unitUserCall(`tv_${tuid}_${div}${suffix}`, unit, undefined, ownerId, id);
    }));
}
exports.buildOpenRouter = buildOpenRouter;
;
//# sourceMappingURL=router.js.map