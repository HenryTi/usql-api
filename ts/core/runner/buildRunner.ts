import * as _ from 'lodash';
import { Db } from '../db';

export class BuildRunner {
	private readonly db:Db;
    private readonly setting: {[name:string]: any} = {};

    constructor(db:Db) {
        this.db = db;
    }

    getDb():string {return this.db.getDbName()}

    async initSetting():Promise<void> {
        await this.db.call('tv_$init_setting', []);
    }
    async setSetting(unit:number, name: string, value: string): Promise<void> {
        name = name.toLowerCase();
        await this.unitCall('tv_$set_setting', unit, name, value);
        if (unit === 0) {
            let n = Number(value);
            this.setting[name] = n === NaN? value : n;
        }
    }
    async getSetting(unit:number, name: string):Promise<any> {
        name = name.toLowerCase();
        let ret = await this.unitTableFromProc('tv_$get_setting', unit, name);
        if (ret.length===0) return undefined;
        let v = ret[0].value;
        if (unit === 0) {
            let n = Number(v);
            v = this.setting[name] = isNaN(n)===true? v : n;
        }
        return v;
	}
	async setUnitAdmin(unitAdmin:{unit:number, admin:number}[]) {
		for (let ua of unitAdmin) {
			let {unit, admin} = ua;
			await this.db.call('tv_$set_unit_admin', [unit, admin]);
		}
	}

    async sql(sql:string, params:any[]): Promise<any> {
        try {
            return await this.db.sql(sql, params || []);
        }
        catch (err) {
            debugger;
            throw err;
        }
    }
    async procSql(procName:string, procSql:string): Promise<any> {
        try {
            return await this.db.sqlProc(procName, procSql);
        }
        catch (err) {
            debugger;
            throw err;
        }
    }
    async procCoreSql(procName:string, procSql:string): Promise<any> {
        try {
			await this.db.sqlProc(procName, procSql);
			await this.db.buildProc(procName, procSql);
        }
        catch (err) {
            debugger;
            throw err;
        }
	}
	async buildProc(proc:string):Promise<any> {
		await this.db.buildRealProcFrom$ProcTable(proc);
	}
    async procCall(proc:string, params:any[]): Promise<any> {
        return await this.db.call(proc, params);
    }
    async call(proc:string, params:any[]): Promise<any> {
        return await this.db.call('tv_' + proc, params);
	}
	
    async buildDatabase(): Promise<boolean> {
		let ret = await this.db.buildDatabase();
		await this.db.createProcObjs();
		return ret;
    }
    async createDatabase(): Promise<void> {
		let ret = await this.db.createDatabase();
		await this.db.createProcObjs();
		return ret;
	}
    async existsDatabase(): Promise<boolean> {
        return await this.db.exists();
    }
    async buildTuidAutoId(): Promise<void> {
        await this.db.buildTuidAutoId();
    }
    async tableFromProc(proc:string, params:any[]): Promise<any[]> {
        return await this.db.tableFromProc('tv_' + proc, params);
    }
    async tablesFromProc(proc:string, params:any[]): Promise<any[][]> {
        let ret = await this.db.tablesFromProc('tv_' + proc, params);
        let len = ret.length;
        if (len === 0) return ret;
        let pl = ret[len-1];
        if (Array.isArray(pl) === false) ret.pop();
        return ret;
    }
    async unitCall(proc:string, unit:number, ...params:any[]): Promise<any> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined) p.push(...params);
        return await this.db.call(proc, p);
    }
    async unitUserCall(proc:string, unit:number, user:number, ...params:any[]): Promise<any> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        return await this.db.call(proc, p);
    }

	private async unitUserCallEx(proc:string, unit:number, user:number, ...params:any[]): Promise<any> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        return await this.db.callEx(proc, p);
    }

    async unitTableFromProc(proc:string, unit:number, ...params:any[]):Promise<any[]> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined) p.push(...params);
        let ret = await this.db.tableFromProc(proc, p);
        return ret;
    }
    async unitUserTableFromProc(proc:string, unit:number, user:number, ...params:any[]):Promise<any[]> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        let ret = await this.db.tableFromProc(proc, p);
        return ret;
    }

    async unitTablesFromProc(proc:string, unit:number, ...params:any[]):Promise<any[][]> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined) p.push(...params);
        let ret = await this.db.tablesFromProc(proc, p);
        return ret;
    }
    async unitUserTablesFromProc(proc:string, unit:number, user:number, ...params:any[]):Promise<any[][]> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        let ret = await this.db.tablesFromProc(proc, p);
        return ret;
    }

    async start(unit:number, user:number): Promise<void> {
        return await this.unitUserCall('tv_$start', unit, user);
    }
    async createResDb(resDbName:string): Promise<void> {
        await this.db.createResDb(resDbName);
    }
    async create$UqDb(): Promise<void> {
        await this.db.create$UqDb();
    }
}
