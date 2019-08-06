import { Runner } from "./runner";
import { packParam } from "./packParam";
//import { OpenApi } from "./openApi";
//import { centerApi } from "./centerApi";

interface SchemaField {
    name:string;
    type:string;
    fields:any[];
}

interface InBus {
    bus: any;       // schema
    busOwner: string;
    busName: string;
    face: string;
    param: SchemaField[],
    returns: {fields:SchemaField[]; arrs:{name:string; fields:SchemaField[]}[]},
}

export class Action {
    private action: string;
    private runner: Runner;
    private schema: any;
    private inBuses:InBus[];
    //private urlApis: {[url:string]:OpenApi} = {};

    constructor(action:string, runner:Runner) {
        this.action = action;
        this.runner = runner;
        let schema = this.runner.getSchema(action);
        this.schema = schema.call;
        let {inBuses} = this.schema;
        if (inBuses !== undefined) {
            this.inBuses = (inBuses as string[]).map(v => {
                let parts = v.split('/');
                let schema = this.runner.getSchema(parts[0]);
                if (schema === undefined) return;
                let bus = schema.call;
                let {busOwner, busName} = bus;
                let face = parts[1];
                let {param, returns} = bus.schema[face];
                return {
                    bus: bus,
                    busOwner: busOwner,
                    busName: busName,
                    face: face,
                    param: param,
                    returns: returns,
                }
            });
        }
    }

    async buildData(unit:number, user:number, data:string):Promise<string> {
        if (this.inBuses === undefined) return data;

        let retBusQuery:any[] = [];
        for (let inBus of this.inBuses) {
            let ret = await this.busQuery(inBus, unit, user, data);
            retBusQuery.push(ret);
        }
        return data + retBusQuery.join('\n\n');
    }

    async buildDataFromObj(unit:number, user:number, obj:any):Promise<string> {
        let data = packParam(this.schema, obj);
        return await this.buildData(unit, user, data);
    }

    private async busQuery(inBus:InBus, unit:number, user:number, data:string):Promise<any> {
        let {bus, face, busOwner, busName, param, returns} = inBus;
        //let {busOwner, busName} = bus;
        let openApi = await this.runner.net.openApiUnitFace(unit, busOwner, busName, face);
        if (openApi === undefined) {
            throw 'error on openApiUnitFace';
        }
        let retParam = await this.runner.call(this.action + '$bus$' + face, [unit, user, data]);
        let retMain = retParam[0][0];
        let params:any[] = [];
        if (param !== undefined) {
            let retIndex = 1;
            for (let qp of param) {
                let {name, type, fields} = qp;
                let param:any;
                if (type === 'array') {
                    param = this.buildTextFromRet(fields, retParam[retIndex++]);
                }
                else {
                    param = retMain[name];
                }
                params.push(param);
            }
        }
        let ret = await openApi.busQuery(unit, busOwner, busName, face, params);
        let results:any[] = [];
        let {fields, arrs} = returns;
        let text = this.buildTextFromRet(fields, ret[0]);
        results.push(text);
        let len = arrs.length;
        for (let i=0; i<len; i++) {
            let text = this.buildTextFromRet(arrs[i].fields, ret[i+1]);
            results.push(text);
        }
        return results.join('\n\n');
    }

    private buildTextFromRet(fields:any[], values:any[]):string {
        let ret:string[] = [];
        for (let row of values) {
            let items:any[] = [];
            for (let f of fields) {
                items.push(row[f.name]);
            }
            ret.push(items.join('\t'));
        }
        return ret.join('\n');
    }
}
