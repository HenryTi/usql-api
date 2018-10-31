import { Router } from 'express';
import { queueSheet, queueToUnitx, SheetMessage } from '../queue';
import { entityPost, entityPut, entityGet } from './entityProcess';
import { Runner } from '../db';

const sheetType = 'sheet';

export default function(router:Router) {
    entityPost(router, sheetType, '/:name', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {app, discription, data} = body;
        let result = await runner.sheetSave(name, unit, user, app, discription, data);
        let sheetRet = result[0];
        if (sheetRet !== undefined) {
            let sheetMsg:SheetMessage = {
                unit: unit,
                type: sheetType,
                from: user,
                db: db,
                body: sheetRet,
                to: [user],
            };
            await queueToUnitx(sheetMsg);
        }
        return sheetRet;
    });
        
    entityPut(router, sheetType, '/:name', 
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

    entityPost(router, sheetType, '/:name/states', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {state, pageStart, pageSize} = body;
        let result = await runner.sheetStates(name, state, unit, user, pageStart, pageSize);
        return result;
    });

    entityGet(router, sheetType, '/:name/statecount',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let result = await runner.sheetStateCount(name, unit, user);
        return result;
    });

    entityGet(router, sheetType, '/:name/get/:id', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {id} = urlParams;
        let result = await runner.getSheet(name, unit, user, id as any);
        return result;
    });

    entityPost(router, sheetType, '/:name/archives',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {pageStart, pageSize} = body;
        let result = await runner.sheetArchives(name, unit, user, pageStart, pageSize);
        return result;
    });

    entityGet(router, sheetType, '/:name/archive/:id', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {id} = urlParams;
        let result = await runner.sheetArchive(unit, user, name, id as any);
        return result;
    });
}
