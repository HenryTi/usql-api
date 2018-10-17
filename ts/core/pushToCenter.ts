import {Router, Request, Response, NextFunction} from 'express';
import {Auth, authCheck, AuthUser, debugUnit, debugUser, centerApi} from '.';

export async function pushToCenter(msg:any) {
    try {
        await centerApi.pushTo(msg);
        let s = null;
        console.log('message push to center:', msg);
    }
    catch (e) {
        console.error('ws send message to center:', e);
    }
}
