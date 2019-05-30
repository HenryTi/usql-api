import { Router } from 'express';
import * as _ from 'lodash';
import { getTuidArr } from './router';
import { entityGet, entityPost } from './entityProcess';
import { Runner } from '../db';
import { packArr } from '../core/packReturn';

const tuidType = 'tuid';

export default function(router: Router) {
    entityGet(router, tuidType, '/:name/:id', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {id} = urlParams;
        let result = await runner.tuidGet(name, unit, user, id);
        let arr0 = result[0];
        let value = undefined;
        if (arr0.length > 0) {
            value = arr0[0]; 
            let {arrs} = schema;
            if (arrs !== undefined) {
                let len = arrs.length;
                for (let i=0;i<len;i++) {
                    value[arrs[i].name] = result[i+1];
                }
            }
        }
        return value;
    });


    entityGet(router, tuidType, '-arr/:name/:owner/:arr/:id/', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {id, owner, arr} = urlParams;
        let schemaArr = getTuidArr(schema, arr);
        let result = await runner.tuidArrGet(name, arr, unit, user, owner, id);
        let row = result[0];
        return row;
    });

    entityGet(router, tuidType, '-all/:name/',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let result = await runner.tuidGetAll(name, unit, user);
        return result;
    });

    entityGet(router, tuidType, '-vid/:name/',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {u} = body;
        let result = await runner.tuidVid(name, unit, u);
        return result[0].id;
    });

    entityGet(router, tuidType, '-arr-vid/:name/:arr',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {u} = body;
        let result = await runner.tuidArrVid(name, urlParams.arr, unit, u);
        return result[0].id;
    });

    entityGet(router, tuidType, '-arr-all/:name/:owner/:arr/', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {owner, arr} = urlParams;
        let schemaArr = getTuidArr(schema, arr);
        let result = await runner.tuidGetArrAll(name, arr, unit, user, owner);
        return result;
    });

    entityGet(router, tuidType, '-proxy/:name/:type/:id',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {id, type} = urlParams;
        let result = await runner.tuidProxyGet(name, unit, user, id, type);
        let row = result[0];
        return row;
    });

    entityPost(router, tuidType, '/:name', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let id = body["$id"];
        let dbParams:any[] = [id];
        let fields = schema.fields;
        let len = fields.length;
        for (let i=0; i<len; i++) {
            dbParams.push(body[fields[i].name]);
        }
        let result = await runner.tuidSave(name, unit, user, dbParams);
        let row = result[0];
        if (!id) id = row.id;
        if (id < 0) id = -id;
        if (id>0) {
            let {arrs} = schema;
            if (arrs !== undefined) {
                for (let arr of arrs) {
                    let arrName = arr.name;
                    let fields = arr.fields;
                    let arrValues = body[arrName];
                    if (arrValues === undefined) continue;
                    for (let arrValue of arrValues) {
                        let arrParams:any[] = [id, arrValue[arr.id]];
                        let len = fields.length;
                        for (let i=0;i<len;i++) {
                            arrParams.push(arrValue[fields[i].name]);
                        }
                        await runner.tuidArrSave(name, arrName, unit, user, arrParams);
                    }
                }
            }
        }
        return row;
    });

    entityPost(router, tuidType, '-arr/:name/:owner/:arr/', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {owner, arr} = urlParams;
        let schemaArr = getTuidArr(schema, arr);
        let id = body["$id"];
        let dbParams:any[] = [owner, id];
        let fields = schemaArr.fields;
        let len = fields.length;
        for (let i=0; i<len; i++) {
            dbParams.push(body[fields[i].name]);
        }
        let result = await runner.tuidArrSave(name, arr, unit, user, dbParams);
        let row = result[0];
        return row;
    });

    entityPost(router, tuidType, '-arr-pos/:name/:owner/:arr/', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {owner, arr} = urlParams;
        let {$id, $order} = body;
        let dbParams:any[] = [owner, $id, $order];
        let result = await runner.tuidArrPos(name, arr, unit, user, dbParams);
        return undefined;
    });

    entityPost(router, tuidType, 'ids/:name/:arr', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {arr} = urlParams;
        let ids = (body as number[]).join(',');
        let result = await runner.tuidIds(name, arr, unit, user, ids);
        if (arr === '$') {
            let {mainFields} = schema;
            if (mainFields !== undefined) {
                let ret:string[] = [];
                packArr(ret, mainFields, result);
                return ret.join('');
            }
        }
        else {
            let {arrs} = schema;
            let arrSchema = arrs.find(v => v.name === arr);
            let {mainFields} = arrSchema;
            if (mainFields !== undefined) {
                let ret:string[] = [];
                packArr(ret, mainFields, result);
                return ret.join('');
            }
        }
        return result;
    });

    entityPost(router, tuidType, 's/:name', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {arr, owner, key, pageStart, pageSize} = body;
        let result = arr === undefined?
            await runner.tuidSeach(name, unit, user, arr, key, pageStart, pageSize)
            :
            await runner.tuidArrSeach(name, unit, user, arr, owner, key, pageStart, pageSize);

        let rows = result[0];
        return rows;
    });

    entityPost(router, tuidType, 'import/:name/:arr',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {arr} = urlParams;
        let entity = arr !== undefined? name + '.' + arr : name;
        let filePath = 'C:/Users/Henry/Desktop/Results.csv';
        await runner.importData(unit, user, body.source, entity, filePath);
        return;
    });
};
