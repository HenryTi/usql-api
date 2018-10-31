import {Router, Request, Response, NextFunction} from 'express';
import { Runner } from '../../db';
import { checkRunner } from '../router';
//import { post } from '../process';

export const router: Router = Router({ mergeParams: true });

(function(router:Router) {
    post(router, '/access',
    async (runner:Runner, body:any):Promise<any> => {
        body.$ = 'seting/access';
        console.log(body);
        let {unit, entity, anyone, users} = body;
        await runner.call('$set_access', [unit, entity, anyone, users, undefined]);
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
