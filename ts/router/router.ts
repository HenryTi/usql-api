import {Router, Request, Response, NextFunction} from 'express';
import {getRunner, Runner} from '../tv/runner';
import {apiErrors} from '../tv/apiErrors';

export interface User {
    db: string;
    id: number;
    unit: number;
    roles: string;
};

export const router: Router = Router();

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
    res.json({error: schema.name + ' is not ' + type});
    return false;
}

export function validTuidArr(res:Response, schema:any, arrName:string):any {
    let {name, type, arr} = schema;
    if (type !== 'tuid') {
        res.json({error: name + ' is not tuid'});
        return;
    }
    let schemaArr = arr[arrName];
    if (schemaArr !== undefined) return schemaArr;
    res.json({error: name + ' does not have arr ' + arrName });
    return;
}
