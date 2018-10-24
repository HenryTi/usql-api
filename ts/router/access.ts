import {Router, Request, Response, NextFunction} from 'express';
import { get } from './processRequest';
import { Runner } from '../db';

const accessType = 'access';

export default function(router:Router) {
    get(router, accessType, '', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        //let {acc} = '*'; //(req as any).query;
        let {acc} = body;
        let accs:string[] = undefined;
        if (acc !== undefined) {
            accs = acc.split('|');
            if (accs.length === 1 && accs[0].trim().length === 0) accs = undefined;
        }
        let access = await runner.getAccesses(accs);
        return access;
    });
}
