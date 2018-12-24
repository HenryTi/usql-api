import {Router, Request, Response, NextFunction} from 'express';
import {getRunner, Runner} from '../db/runner';

export const router: Router = Router();

export interface User {
    db: string;
    id: number;
    unit: number;
    roles: string;
};

const apiErrors = {
    databaseNotExists: -1,
}

export async function checkRunner(db:string, res:Response):Promise<Runner> {
    let runner = await getRunner(db);
    if (runner !== undefined) return runner;
    res.json({
        error: {
            no: apiErrors.databaseNotExists,
            message: 'Database ' + db + ' 不存在'
        }
    });
}

export function unknownEntity(res:Response, name:string) {
    res.json({error: 'unknown entity: ' + name});
}

export function validEntity(res:Response, schema:any, type:string):boolean {
    if (schema.type === type) return true;
    if (type === 'schema') return true;
    res.json({error: schema.name + ' is not ' + type});
    return false;
}

export function validTuidArr(res:Response, schema:any, arrName:string):any {
    let {name, type, arrs} = schema;
    if (type !== 'tuid') {
        res.json({error: name + ' is not tuid'});
        return;
    }
    let schemaArr = (arrs as any[]).find(v => v.name === arrName);
    if (schemaArr !== undefined) return schemaArr;

    res.json({error: 'validTuidArr: ' + name + ' does not have arr ' + arrName + ' arrs:' + (arrs as any[]).map(v => v.name).join(',')});
    return;
}

export function getTuidArr(schema:any, arrName:string):any {
    let {name, type, arrs} = schema;
    if (type !== 'tuid') throw name + ' is not tuid';
    let an = arrName.toLowerCase();
    let schemaArr = (arrs as any[]).find(v => v.name === an);
    if (schemaArr !== undefined) return schemaArr;
    throw 'getTuidArr: ' + name + ' does not have arr ' + arrName + ' arrs:' + (arrs as any[]).map(v => v.name).join(',');
}
