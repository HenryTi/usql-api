import { Runner } from "./runner";
import { packParam } from "./packParam";

interface SchemaField {
    name:string;
    type:string;
    fields:any[];
}

interface ParamBus {
    bus: any;       // schema
    busOwner: string;
    busName: string;
    face: string;
    param: SchemaField[],
    returns: {fields:SchemaField[]; arrs:{name:string; fields:SchemaField[]}[]},
}

export abstract class ParametersBus {
    protected runner: Runner;
    protected entityName: string;
    protected schema: any;
    private paramBuses:ParamBus[];

    constructor(runner:Runner, entityName:string) {
        this.runner = runner;
        this.entityName = entityName;
    }

    init() {
        this.initSchema();
        this.initInBuses();
    }

    protected abstract initSchema():void;
    protected getQueryProc(bus:string, face:string):string {
        return `${this.entityName}$bus$${bus}_${face}`;
    }

    private initInBuses() {
        let {inBuses} = this.schema;
        if (inBuses === undefined) return;
        this.paramBuses = (inBuses as string[]).map(v => {
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

    async buildData(unit:number, user:number, data:string):Promise<string> {
        if (this.paramBuses === undefined) return data;

        let retBusQuery:any[] = [];
        for (let inBus of this.paramBuses) {
            let ret = await this.busQuery(inBus, unit, user, data);
            retBusQuery.push(ret);
        }
        let ret = data + retBusQuery.join('\n\n') + '\n\n';
        return ret;
    }

    async buildDataFromObj(unit:number, user:number, obj:any):Promise<string> {
        let data = packParam(this.schema, obj);
        return await this.buildData(unit, user, data);
    }

    private async busQuery(inBus:ParamBus, unit:number, user:number, data:string):Promise<any> {
        let {bus, face, busOwner, busName, param, returns} = inBus;
        //let {busOwner, busName} = bus;
        let openApi = await this.runner.net.openApiUnitFace(unit, busOwner, busName, face);
        if (openApi === undefined) {
            throw 'error on openApiUnitFace';
        }
        let params:any[] = [];
        let proc = this.getQueryProc(bus.name, face);
        try {
            let retParam = await this.runner.tablesFromProc(proc, [unit, user, data]);
            let retParamMain = retParam[0][0];
            //let retParamMain = Array.isArray(ret0)===true? ret0[0] : ret0;
            if (param !== undefined) {
                let retIndex = 1;
                for (let qp of param) {
                    let {name, type, fields} = qp;
                    let value:any;
                    if (type === 'array') {
                        value = this.buildTextFromRet(fields, retParam[retIndex++]);
                    }
                    else {
                        value = retParamMain[name];
                    }
                    params.push(value);
                }
            }
        }
        catch (err) {
            throw 'error in ' + proc + ':' + err;
        }
        try {
            let ret = await openApi.busQuery(unit, busOwner, busName, face, params);
            let results:any[] = [];
            let {fields, arrs} = returns;
            let retMain:any[] = ret[0];
            //let retMain:any[] = arrs === undefined? ret : ret[0];
            let text = this.buildTextFromRet(fields, retMain);
            results.push(text);
            if (arrs !== undefined) {
                let len = arrs.length;
                for (let i=0; i<len; i++) {
                    let text = this.buildTextFromRet(arrs[i].fields, ret[i+1]);
                    results.push(text);
                }
            }
            return results.join('\n\n');
        }
        catch (err) {
            throw 'error in let ret = await openApi.busQuery(unit, busOwner, busName, face, params); ' + err;
        }
    }

    private buildTextFromRet(fields:any[], values:any[]):string {
        let ret:string[] = [];
        for (let row of values) {
            let items:any[] = [];
            for (let f of fields) {
                let fn = f.name;
                let v = row[fn];
                items.push(v);
            }
            ret.push(items.join('\t'));
        }
        return ret.join('\n');
    }
}

export class ActionParametersBus extends ParametersBus {
    protected initSchema():void {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call;
    }
}

export class AcceptParametersBus extends ParametersBus {
    private faceName:string;
    constructor(runner:Runner, busName:string, faceName:string) {
        super(runner, busName);
        this.faceName = faceName;
    }
    protected getQueryProc(busName:string, face:string):string {
        let ret = `${this.entityName}_${this.faceName}$bus$${busName}_${face}`
        return ret;
    }
    protected initSchema():void {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call.schema[this.faceName];
        let {accept} = this.schema;
        this.schema.inBuses = accept.inBuses;
    }
}

export class SheetVerifyParametersBus extends ParametersBus {
    protected initSchema():void {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call.verify;
    }
    protected getQueryProc(bus:string, face:string):string {return `${this.entityName}$verify$bus$${bus}_${face}`}
}

export class SheetActionParametersBus extends ParametersBus {
    private actionName:string;
    constructor(runner:Runner, sheetName:string, actionName:string) {
        super(runner, sheetName);
        this.actionName = actionName;
    }

    protected initSchema():void {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call;
    }
    protected getQueryProc(bus:string, face:string):string {return `${this.entityName}_${this.actionName}$bus$${bus}_${face}`}
}
