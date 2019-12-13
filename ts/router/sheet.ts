import { Router } from 'express';
//import { /*queueSheet, queueToUnitx, */SheetMessage } from '../queue';
//import { entityPost, entityPut, entityGet } from './entityProcess';
import { Runner, unpack, RouterBuilder, SheetQueueData } from '../core';

const constSheet = 'sheet';

export function buildSheetRouter(router:Router, rb:RouterBuilder) {
    async function queueSheet(runner: Runner, unit:number, name:string, sheetId: number, content: SheetQueueData): Promise<boolean> {
        let ret = await runner.unitTableFromProc('tv_$sheet_to_queue', unit, name, sheetId, JSON.stringify(content));
        return (ret[0].ret === 1);
    }

    rb.entityPost(router, constSheet, '/:name', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {app, discription, data} = body;
        try {
            let verify = await runner.sheetVerify(name, unit, user, data);
            if (verify!==undefined) {
                return verify;
            }
            let result = await runner.sheetSave(name, unit, user, app, discription, data);
            let sheetRet = result[0];
            if (sheetRet !== undefined) {
                let states:any[] = schema.states;
                let startState = states.find(v => v.name === '$');
                if (startState !== undefined) {
                    let actions:any[] = startState.actions;
                    if (actions !== undefined) {
                        let $onsave = actions.find(v => v.name === '$onsave');
                        if ($onsave !== undefined) {
                            let {id, flow} = sheetRet;
                            let retQueue = await queueSheet(runner, unit, name, id, {
                                sheet: name,
                                state: '$',
                                action: '$onsave',
                                unit: unit,
                                user: user,
                                id: id,
                                flow: flow,
                            });
                        }
                    }
                }
            }
            return sheetRet;
        }
        catch (err) {
            await runner.log(unit, 'sheet save ' + name, data);
        }
    });
        
    rb.entityPut(router, constSheet, '/:name', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {state, action, id, flow} = body;
        let retQueue = await queueSheet(runner, unit, name, id, {
            sheet: name,
            state: state,
            action: action,
            unit: unit,
            user: user,
            id: id,
            flow: flow,
        });
        // 这个地方以后需要更多的判断和返回。提供给界面操作
        if (retQueue === false) throw {
            type: 'sheet-processing',
            message: '不可以同时操作单据'
        };
        /*
        await runner.sheetProcessing(id);
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
        */
        return {msg: 'add to queue'};
    });

    rb.entityPost(router, constSheet, '/:name/states', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {state, pageStart, pageSize} = body;
        let result = await runner.sheetStates(name, state, unit, user, pageStart, pageSize);
        return result;
    });

    rb.entityGet(router, constSheet, '/:name/statecount',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let result = await runner.sheetStateCount(name, unit, user);
        return result;
    });

    rb.entityPost(router, constSheet, '/:name/user-sheets', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {state, user:sheetUser, pageStart, pageSize} = body;
        let result = await runner.userSheets(name, state, unit, user, sheetUser, pageStart, pageSize);
        return result;
    });

    rb.entityPost(router, constSheet, '/:name/my-sheets', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {state, pageStart, pageSize} = body;
        let result = await runner.mySheets(name, state, unit, user, pageStart, pageSize);
        return result;
    });

    rb.entityGet(router, constSheet, '-scan/:name/:id',
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

    rb.entityGet(router, constSheet, '/:name/get/:id', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {id} = urlParams;
        let result = await runner.getSheet(name, unit, user, id as any);
        return result;
    });

    rb.entityPost(router, constSheet, '/:name/archives',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {pageStart, pageSize} = body;
        let result = await runner.sheetArchives(name, unit, user, pageStart, pageSize);
        return result;
    });

    rb.entityGet(router, constSheet, '/:name/archive/:id', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let {id} = urlParams;
        let result = await runner.sheetArchive(unit, user, name, id as any);
        return result;
    });
}
