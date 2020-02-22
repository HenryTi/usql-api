import { Router, Request, Response } from 'express';
import { Runner, RouterBuilder, setUqBuildSecret, Db } from '../../core';

export function buildBuildRouter(router:Router, rb: RouterBuilder) {
    /*
    rb.post(router, '/start',
    async (runner:Runner, body:{enc:string}):Promise<void> => {
        let {enc} = body;
        setUqBuildSecret(enc);
    });
    rb.post(router, '/build-database',
    async (runner:Runner, body:any):Promise<void> => {
        await runner.buildDatabase();
    });
    */
    
    router.post('/start', async (req:Request, res:Response) => {
        try {
            let {enc} = req.body;
            setUqBuildSecret(enc);
            res.json({
                ok: true,
                res: undefined
            });
        }
        catch (err) {
            res.json({error: err});
        }
    });
    router.post('/build-database', async (req:Request, res:Response) => {
        try {
            let dbName:string = req.params.db;
            let db = new Db(rb.getDbName(dbName));
            let runner = new Runner(dbName, db);
            let exists = await runner.buildDatabase();
            res.json({
                ok: true,
                res: {
                    exists: exists,
                }
            });
        }
        catch (err) {
            res.json({error: err});
        }
    });

    rb.post(router, '/finish',
    async (runner:Runner, body:any, params:any):Promise<any> => {
        let {uqId} = runner;
        let {uqId:paramUqId, uqVersion} = body;
        if (!uqId) {
            await Promise.all([
                runner.setSetting(0, 'uqId', String(paramUqId)),
                runner.setSetting(0, 'uqVersion', String(uqVersion))
            ]);
            uqId = paramUqId;
        }
        await runner.initSetting();

        if (String(uqId) !== String(paramUqId)) {
            debugger;
            throw 'error uqId';
        }
        await runner.reset();
    });

    rb.post(router, '/sql',
    async (runner:Runner, body:{sql:string, params:any[]}): Promise<any> => {
        //return this.db.sql(sql, params);
        let {sql, params} = body;
        return await runner.sql(sql, params);
    });

    rb.post(router, '/create-database',
    async (runner:Runner, body:any): Promise<void> => {
        await runner.createDatabase();
    });

    rb.post(router, '/exists-databse',
    async (runner:Runner): Promise<boolean> => {
        return await runner.existsDatabase();
    });

    rb.post(router, '/set-setting',
    async (runner:Runner, body: {[name:string]: any}): Promise<void> => {
        let promises:Promise<any>[] = [];
        for (let i in body) {
            promises.push(runner.setSetting(0, i, body[i]));
        }
        await Promise.all(promises);
    });

    rb.get(router, '/setting',
    async (runner:Runner, body: {name:string}):Promise<string> => {
        //let ret = await this.unitTableFromProc('tv_$get_setting', unit, [name]);
        let ret = await runner.getSetting(0, body.name);
        if (ret.length===0) return undefined;
        return ret[0].value;
    });

    rb.get(router, '/entitys',
    async (runner:Runner, body:{hasSource:string}): Promise<any[][]> => {
        //return await this.db.call('tv_$entitys', [hasSource===true? 1:0]);
        return await runner.loadSchemas(Number(body.hasSource));
    });

    rb.post(router, '/entity',
    async (runner:Runner, body:any):Promise<any> => {
        //let params = [user, id, name, type, schema, run, source, from, open];
        let {id, name, type, schema, run, source, from, open} = body;
        //unit:number, user:number, */id:number, name:string, type:number, schema:string, run:string, source:string, from:string, open:number
        return await runner.saveSchema(0, 0, id, name, type, schema, run, source, from, open);
    });

    rb.get(router, '/const-strs',
    async (runner:Runner, body:any): Promise<{[name:string]:number}[]> => {
        return await runner.loadConstStrs();
    });

    rb.get(router, '/const-str',
    async (runner:Runner, body:{type:string}): Promise<number> => {
        return await runner.saveConstStr(body.type);
    });

    rb.get(router, '/entity-version',
    async (runner:Runner, body: {name:string; version:string}): Promise<string> => {
        let {name, version} = body;
        return await runner.loadSchemaVersion(name, version);
    });

    rb.post(router, '/entity-validate',
    async (runner:Runner, body: {entities:string, valid:number}):Promise<any[]> => {
        let {entities, valid} = body;
        return await runner.setEntityValid(entities, valid);
	});
	
	rb.post(router, '/tag-type', 
    async (runner:Runner, body: {names:string}):Promise<void> => {
        let {names} = body;
        await runner.tagType(names);
	});

	rb.post(router, '/tag-save', 
    async (runner:Runner, body: {data:string}):Promise<void> => {
        let {data} = body;
        await runner.tagSave(0, 1, data);
	});

    /*
    rb.post(router, '/save-face',
    async (runner:Runner, body:{bus:string, busOwner:string, busName:string, faceName:string}) => {
        let {bus, busOwner, busName, faceName} = body;
        await runner.saveFace(bus, busOwner, busName, faceName);
    });
    */
};
