import { Runner } from "../db";
import { Router, Request, Response } from "express";
import { checkRunner, User, unknownEntity, validEntity } from "./router";

type Processer = (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any) => Promise<any>;

export function entityPost(router:Router, entityType:string, path:string, processer:Processer) {
    router.post(`/${entityType}${path}`, async (req:Request, res:Response) => {
        await entityProcess(req, res, entityType, processer, false);
    });
};

export function entityGet(router:Router, entityType:string, path:string, processer:Processer) {
    router.get(`/${entityType}${path}`, async (req:Request, res:Response) => {
        await entityProcess(req, res, entityType, processer, true);
    });
};

export function entityPut(router:Router, entityType:string, path:string, processer:Processer) {
    router.put(`/${entityType}${path}`, async (req:Request, res:Response) => {
        await entityProcess(req, res, entityType, processer, false);
    });
};

async function entityProcess(req:Request, res:Response, entityType:string, processer:Processer, isGet:boolean):Promise<void> {
    try {
        let userToken:User = (req as any).user;
        let {db, id:userId, unit} = userToken;
        if (db === undefined) db = '$unitx';
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        let {params} = req;
        let {name} = params;
        let call, run;
        if (name !== undefined) {
            let schema = runner.getSchema(name);
            if (schema === undefined) return unknownEntity(res, name);
            call = schema.call;
            run = schema.run;
            if (validEntity(res, call, entityType) === false) return;
        }
        let body = isGet === true? (req as any).query : (req as any).body;
        let result = await processer(unit, userId, name, db, params, runner, body, call, run);
        res.json({
            ok: true,
            res: result
        });
    }
    catch (err) {
        res.json({error: err});
    }
}
