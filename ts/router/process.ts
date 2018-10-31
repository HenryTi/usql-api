import { Runner } from "../db";
import { Router, Request, Response } from "express";
import { checkRunner, User, unknownEntity, validEntity } from "./router";

type Processer = (unit:number, user:number, urlParams:any, runner:Runner, body:any) => Promise<any>;

export function post(router:Router, path:string, processer:Processer) {
    router.post(path, async (req:Request, res:Response) => {
        await process(req, res, processer);
    });
};

export function get(router:Router, path:string, processer:Processer) {
    router.get(path, async (req:Request, res:Response) => {
        await process(req, res, processer);
    });
};

export function put(router:Router, path:string, processer:Processer) {
    router.put(path, async (req:Request, res:Response) => {
        await process(req, res, processer);
    });
};

async function process(req:Request, res:Response, processer:Processer):Promise<void> {
    try {
        let userToken:User = (req as any).user;
        let {db, id:userId, unit} = userToken;
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        let body = (req as any).body;
        let result = await processer(unit, userId, req.params, runner, body);
        res.json({
            ok: true,
            res: result
        });
    }
    catch (err) {
        res.json({error: err});
    }
}
