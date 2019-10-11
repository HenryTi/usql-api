"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
//import { post } from '../process';
//export const router: Router = Router({ mergeParams: true });
function buildSettingRouter(router, rb) {
    rb.post(router, '/access-user', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'seting/access-user';
        console.log(body);
        let { unit, entity, users } = body;
        yield runner.unitCall('$set_access_user', unit, entity, users, undefined);
    }));
    rb.post(router, '/access-entity', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'seting/access-entity';
        console.log(body);
        let { unit, entities } = body;
        yield runner.unitCall('$set_access_entity', unit, entities);
    }));
    rb.post(router, '/access-fully', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'seting/access-fully *** ---';
        console.log(body);
        let { unit, user, flag } = body;
        yield runner.unitUserCall('$set_access_fully', unit, user, flag);
    }));
}
exports.buildSettingRouter = buildSettingRouter;
;
/*
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
        //let userToken:User = (req as any).user;
        //let {db, id:userId, unit} = userToken;
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
*/ 
//# sourceMappingURL=router.js.map