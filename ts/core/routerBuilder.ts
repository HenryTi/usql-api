import { Router, Request, Response } from 'express';
import { EntityRunner } from './runner';
import { consts } from "./consts";
import { prodNet, testNet, Net, prodCompileNet, testCompileNet } from './net';

type Processer = (runner:EntityRunner, body:any, urlParams:any, userToken?:User) => Promise<any>;
type EntityProcesser = (unit:number, user:number, name:string, db:string, urlParams:any, 
    runner:EntityRunner, body:any, schema:any, run:any, net?:Net) => Promise<any>;

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
    protected async routerRunner(req:Request):Promise<EntityRunner> {
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
            let userToken:User = (req as any).user;
            let result = await processer(runner, queryOrBody, params, userToken);
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
            let {db, id:userId, unit, roles} = userToken;
            if (db === undefined) db = consts.$unitx;
            let runner = await this.checkRunner(db);
            if (runner === undefined) return;
            let {params} = req;
            let {name} = params;
            let call:any, run:any;
            if (name !== undefined) {
                let schema = runner.getSchema(name);
                if (schema === undefined) {
					return this.unknownEntity(res, name, runner);
				}
                call = schema.call;
                run = schema.run;
                if (this.validEntity(res, call, entityType) === false) return;
            }
            let result: any;
            let modifyMax: any;
            let $uq: any;
            let app = req.header('app');
            let $roles: any;
            if (roles) {
                $roles = await runner.getRoles(unit, app, userId, roles);
            }
            let entityVersion = req.header('en');
            let uqVersion = req.header('uq');
            let eqEntity = entityVersion === undefined || call.version === Number(entityVersion);
            let eqUq = uqVersion === undefined || runner.uqVersion === Number(uqVersion);
            if (eqEntity === true && eqUq === true)
            {
                let body = isGet === true? (req as any).query : (req as any).body;
                result = await processer(unit, userId, name, db, params, runner, body, call, run, this.net);
            }
            else {
                $uq = {};
                if (eqEntity === false) {
                    $uq.entity = call;
                }
                if (eqUq === false) {
                    let access = await runner.getAccesses(unit, userId, undefined);
                    $uq.uq = access;
                }
            }
            modifyMax = await runner.getModifyMax(unit);
            res.json({
                ok: true,
                res: result,
                $modify: modifyMax,
                $uq: $uq,
                $roles: $roles,
            });
        }
        catch (err) {
            console.error(err);
            res.json({error: err});
        }
    }

    private async checkRunner(db:string):Promise<EntityRunner> {
        let runner = await this.net.getRunner(db);
        if (runner !== undefined) return runner;
        throw `Database ${this.net.getDbName(db)} 不存在`;
    }

    async getRunner(name:string):Promise<EntityRunner> {
        return await this.net.getRunner(name);
    }

    async getUnitxRunner():Promise<EntityRunner> {
        return await this.net.getUnitxRunner();
    }

    private unknownEntity(res:Response, name:string, runner: EntityRunner) {
        res.json({error: 'unknown entity: ' + name + ' all entities: ' + runner.getEntityNameList()});
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
    protected async routerRunner(req:Request):Promise<EntityRunner> {
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
