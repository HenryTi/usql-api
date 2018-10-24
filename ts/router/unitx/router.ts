import {Router, Request, Response, NextFunction} from 'express';
import { post } from '../processRequest';
import { processAction } from '../action';
import { Runner } from '../../db';

export const router: Router = Router();
const actionType = 'action';

export default function(router:Router) {
    post(router, actionType, '/:name', unitxAction);
}

async function unitxAction(unit:number, user:number, db:string, runner:Runner, params:any, body:any, schema:any):Promise<any> {
    let {name} = params;
    switch (name) {
        default:
            return await processAction(unit, user, db, runner, params, body, schema);
        case 'a':
            return;
    }
}
