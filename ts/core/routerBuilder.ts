import { Router, Request, Response } from 'express';
import { Runner } from './runner';
import { consts } from "./consts";
import { prodNet, testNet, Net, prodCompileNet, testCompileNet } from './net';

type Processer = (runner:Runner, body:any, params?:any) => Promise<any>;
type EntityProcesser = (unit:number, user:number, name:string, db:string, urlParams:any, 
    runner:Runner, body:any, schema:any, run:any, net?:Net) => Promise<any>;

/*
const apiErrors = {
    databaseNotExists: -1,
}
*/

export interface User {
    db: string;
    id: number;
    unit: number;
    roles: string;
};

export class RouterBuilder {
    protected net: Net;
    constructor(net: Net) {
        this.net = net;
    }

    post(router:Router, path:string, processer:Processer) {
        router.post(path, async (req:Request, res:Response) => {
            await this.process(req, res, processer, (req as any).body, req.params);
        });
    };

    get(router:Router, path:string, processer:Processer) {
        router.get(path, async (req:Request, res:Response) => {
            await this.process(req, res, processer, req.query, req.params);
        });
    };

    put(router:Router, path:string, processer:Processer) {
        router.put(path, async (req:Request, res:Response) => {
            await this.process(req, res, processer, (req as any).body, req.params);
        });
    };
    getDbName(name:string):string {return this.net.getDbName(name);}
    protected async routerRunner(req:Request):Promise<Runner> {
        let db:string = req.params.db;
        let runner = await this.checkRunner(db);
        let uqVersion = req.header('tonva-uq-version');
        if (uqVersion !== undefined) {
            let n = Number(uqVersion);
            if (n !== NaN) {
                runner.checkUqVersion(n);
            }
        }
        return runner;
    }

    private process = async (req:Request, res:Response, processer:Processer, queryOrBody:any, params:any):Promise<void> => {
        try {
            let runner = await this.routerRunner(req);
            if (runner === undefined) return;
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

    entityPost(router:Router, entityType:string, path:string, processer:EntityProcesser) {
        router.post(`/${entityType}${path}`, async (req:Request, res:Response) => {
            await this.entityProcess(req, res, entityType, processer, false);
        });
    };
    
    entityGet(router:Router, entityType:string, path:string, processer:EntityProcesser) {
        router.get(`/${entityType}${path}`, async (req:Request, res:Response) => {
            await this.entityProcess(req, res, entityType, processer, true);
        });
    };
    
    entityPut(router:Router, entityType:string, path:string, processer:EntityProcesser) {
        router.put(`/${entityType}${path}`, async (req:Request, res:Response) => {
            await this.entityProcess(req, res, entityType, processer, false);
        });
    };
    
    private entityProcess = async (req:Request, res:Response, entityType:string, processer:EntityProcesser, isGet:boolean):Promise<void> => {
        try {
            let userToken:User = (req as any).user;
            let {db, id:userId, unit} = userToken;
            if (db === undefined) db = consts.$unitx;
            let runner = await this.checkRunner(db);
            if (runner === undefined) return;
            let {params} = req;
            let {name} = params;
            let call:any, run:any;
            if (name !== undefined) {
                let schema = runner.getSchema(name);
                if (schema === undefined) return this.unknownEntity(res, name);
                call = schema.call;
                run = schema.run;
                if (this.validEntity(res, call, entityType) === false) return;
            }
            let body = isGet === true? (req as any).query : (req as any).body;
            let result = await processer(unit, userId, name, db, params, runner, body, call, run, this.net);
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({error: err});
        }
    }

    private async checkRunner(db:string):Promise<Runner> {
        let runner = await this.net.getRunner(db);
        if (runner !== undefined) return runner;
        throw `Database ${this.net.getDbName(db)} 不存在`;
    }

    async getRunner(name:string):Promise<Runner> {
        return await this.net.getRunner(name);
    }

    async getUnitxRunner():Promise<Runner> {
        return await this.net.getUnitxRunner();
    }

    /*
    private runners: {[name:string]: Runner} = {};

    async getRunner(name:string):Promise<Runner> {
        name = name.toLowerCase();
        let runner = this.runners[name];
        if (runner === null) return;
        if (runner === undefined) {
            let db = getDb(name);
            let isExists = await db.exists();
            if (isExists === false) {
                this.runners[name] = null;
                return;
            }
            runner = new Runner(db);
            this.runners[name] = runner;
        }
        await runner.init();
        return runner;
    }
    */

    private unknownEntity(res:Response, name:string) {
        res.json({error: 'unknown entity: ' + name});
    }
    
    private validEntity(res:Response, schema:any, type:string):boolean {
        if (schema.type === type) return true;
        if (type === 'schema') return true;
        res.json({error: schema.name + ' is not ' + type});
        return false;
    }
    
}

export class CompileRouterBuilder extends RouterBuilder {
}

class UnitxRouterBuilder extends RouterBuilder {
    protected async routerRunner(req:Request):Promise<Runner> {
        let runner = await this.net.getUnitxRunner();
        if (runner !== undefined) return runner;
        throw `Database ${this.net.getDbName('$unitx')} 不存在`;
    }
}

export const uqProdRouterBuilder = new RouterBuilder(prodNet);
export const uqTestRouterBuilder = new RouterBuilder(testNet);
export const unitxProdRouterBuilder = new UnitxRouterBuilder(prodNet);
export const unitxTestRouterBuilder = new UnitxRouterBuilder(testNet);


export const compileProdRouterBuilder = new CompileRouterBuilder(prodCompileNet);
export const compileTestRouterBuilder = new CompileRouterBuilder(testCompileNet);
