import { Runner } from "../db";
import { Router, Request, Response } from "express";
import { checkRunner, User, unknownEntity, validEntity } from "./router";

export type Processer = (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => Promise<any>;

export function post(router:Router, entityType:string, path:string, processer:Processer) {
    router.post(`/${entityType}${path}`, async (req:Request, res:Response) => {
        await process(req, res, entityType, processer);
    });
};

export function get(router:Router, entityType:string, path:string, processer:Processer) {
    router.post(`/${entityType}${path}`, async (req:Request, res:Response) => {
        await process(req, res, entityType, processer);
    });
};

export function put(router:Router, entityType:string, path:string, processer:Processer) {
    router.post(`/${entityType}${path}`, async (req:Request, res:Response) => {
        await process(req, res, entityType, processer);
    });
};

async function process(req:Request, res:Response, entityType:string, processer:Processer):Promise<void> {
    try {
        let userToken:User = (req as any).user;
        let {db, id:userId, unit} = userToken;
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        let {params} = req;
        let {name} = params;
        let schema = runner.getSchema(name);
        if (schema === undefined) return unknownEntity(res, name);
        if (validEntity(res, schema, entityType) === false) return;
        let result = await processer(unit, userId, name, db, params, runner, (req as any).body, schema);
        res.json({
            ok: true,
            res: result
        });
    }
    catch (err) {
        res.json({error: err});
    }
}
