import {Router, Request, Response, NextFunction} from 'express';
import { post } from '../processRequest';
import { processAction } from '../action';
import { Runner } from '../../db';

export const router: Router = Router();
const actionType = 'action';

export default function(router:Router) {
    post(router, actionType, '/:name', unitxAction);
}

async function unitxAction(unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any):Promise<any> {
    switch (name) {
        default:
            return await processAction(unit, user, name, db, urlParams, runner, body, schema, run);
        case 'a':
            return;
    }
}
