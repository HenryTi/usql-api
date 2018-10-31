import fetch from 'node-fetch';
import { Runner } from '../../db';
import { centerApi } from '../../core';
import { unpack, packParam } from '../../core/packReturn';
import { Fetch } from '../../core/fetch';
import { actionProcess } from '../actionProcess';

export async function unitxActionProcess(unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any):Promise<any> {
    switch (name) {
        default:
            return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        case 'saveentityoppost':
            return await saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run);
    }
}

const usqHost = 'localhost';
export function urlSetUsqHost(url:string):string {
    return url.replace('://usqhost:', '://'+usqHost+':');
}

async function saveEntityOpPost(unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any) {
    let actionParam = unpack(schema, body.data);
    let {usq, entityName, opName, anyone} = actionParam;
    if (anyone !== 1) anyone = 0;
    let urqUrl = await centerApi.usqUrl(unit, usq);
    let {url, urlDebug} = urqUrl;
    if (urlDebug !== undefined) {
        // 这个地方会有问题，urlDebug也许指向错误
        try {
            urlDebug = urlSetUsqHost(urlDebug);
            let ret = await fetch(urlDebug + 'hello');
            if (ret.status !== 200) throw 'not ok';
            let text = await ret.text();
            url = urlDebug;
        }
        catch (err) {
        }
    }

    // ????????????????????????
    // 这里的问题，记录在ondrive/同花待实现功能点.docx 文件中
    // ????????????????????????
    /*
    if (opName === '$') {
        let users:{to:number}[] = await runner.query(
            'getEntityAccess', unit, user, 
            [usq, entityName, opName]);
        console.log({
            '$': 'saveEntityOpPost',
            '#': 'getEntityAccess',
            unit: unit, 
            user: user,
            usq: usq,
            entityName: entityName,
            opName: opName,
            
            users: users.join(','),
        })
        let usqApi = new UsqApi(url);
        // 设置usq里面entity的access之后，才写unitx中的entity access
        await usqApi.setAccess(unit, entityName, anyone, users.map(v=>v.to).join(','));
    }
    return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
    */

   let ret = await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
   if (opName === '$') {
        let users:{to:number}[] = await runner.query(
            'getEntityAccess', unit, user, 
            [usq, entityName, opName]);
        let usqApi = new UsqApi(url);
        // 设置usq里面entity的access之后，才写unitx中的entity access
        await usqApi.setAccess(unit, entityName, anyone, users.map(v=>v.to).join(','));
    }
    return ret;
}

class UsqApi extends Fetch {
    async setAccess(unit:number, entity:string, anyone:number, users:string) {
        let params = {unit:unit, entity:entity, anyone:anyone, users:users};
        return await this.post('setting/access', params);
    }
}
