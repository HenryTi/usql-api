import { Router } from 'express';
import { queueSheet, queueToUnitx, SheetMessage } from '../queue';
import { entityPost, entityPut, entityGet } from './entityProcess';
import { Runner } from '../db';
import { unpack } from '../core';

const constSheet = 'sheet';

export default function(router:Router) {
    entityPost(router, constSheet, '/:name', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {app, discription, data} = body;
        let verify = await runner.sheetVerify(name, unit, user, data);
        if (verify!==undefined) {
            return verify;
        }
        let result = await runner.sheetSave(name, unit, user, app, discription, data);
        let sheetRet = result[0];
        if (sheetRet !== undefined) {
            let sheetMsg:SheetMessage = {
                unit: unit,
                type: constSheet,
                from: user,
                db: db,
                body: sheetRet,
                to: [user],
                subject: discription
            };
            await queueToUnitx(sheetMsg);
            let {id, flow} = sheetRet;
            await runner.sheetProcessing(id);
            await queueSheet({
                db: db,
                from: user,
                sheetHead: {
                    sheet: name,
                    state: '$',
                    action: '$onsave',
                    unit: unit,
                    user: user,
                    id: id,
                    flow: flow,
                }
            });
        }
        return sheetRet;
    });
        
    entityPut(router, constSheet, '/:name', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        await runner.sheetProcessing(body.id);
        let {state, action, id, flow} = body;
        await queueSheet({
            db: db,
            from: user,
            sheetHead: {
                sheet: name,
                state: state,
                action: action,
                unit: unit,
                user: user,
                id: id,
                flow: flow,
            }
        });
        return {msg: 'add to queue'};
    });

    entityPost(router, constSheet, '/:name/states', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {state, pageStart, pageSize} = body;
        let result = await runner.sheetStates(name, state, unit, user, pageStart, pageSize);
        return result;
    });

    entityGet(router, constSheet, '/:name/statecount',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let result = await runner.sheetStateCount(name, unit, user);
        return result;
    });

    entityPost(router, constSheet, '/:name/my-sheets', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {state, pageStart, pageSize} = body;
        let result = await runner.mySheets(name, state, unit, user, pageStart, pageSize);
        return result;
    });

    entityGet(router, constSheet, '-scan/:name/:id',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {id} = urlParams;
        let result = await runner.sheetScan(name, unit, user, id as any);
        let main = result[0];
        if (main === undefined) return;
        let data = main.data;
        let json = unpack(schema, data);
        main.data = json;
        return main;
    });

    entityGet(router, constSheet, '/:name/get/:id', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {id} = urlParams;
        let result = await runner.getSheet(name, unit, user, id as any);
        return result;
    });

    entityPost(router, constSheet, '/:name/archives',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {pageStart, pageSize} = body;
        let result = await runner.sheetArchives(name, unit, user, pageStart, pageSize);
        return result;
    });

    entityGet(router, constSheet, '/:name/archive/:id', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {id} = urlParams;
        let result = await runner.sheetArchive(unit, user, name, id as any);
        return result;
    });
}
