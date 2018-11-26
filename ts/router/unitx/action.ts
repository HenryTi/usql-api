import fetch from 'node-fetch';
import { Runner } from '../../db';
import { centerApi, unpack, packParam, Fetch, urlSetUsqHost } from '../../core';
import { actionProcess } from '../actionProcess';

export async function unitxActionProcess(unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any):Promise<any> {
    switch (name) {
        case 'saveentityoppost':
            return await saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run);
        case 'saveentityopforall':
            await setAccessEntity(unit, body, schema);
            break;
        case 'entityOpUserFully$add$':
            await entityOpUserFully$add$(unit, body, schema);
            break;
        case 'entityOpUserFully$del$':
            await entityOpUserFully$del$(unit, body, schema);
            break;
    }
    return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
}

async function usqUrl(unit:number, usq:number):Promise<string> {
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
    return url;
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

async function saveEntityOpPost(unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any) {
    let actionParam = unpack(schema, body.data);
    let {usq, entityName, opName} = actionParam;

    let url = await usqUrl(unit, usq);
    let ret = await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
    if (opName === '$') {
        let users:{to:number}[] = await runner.query(
            'getEntityAccess', unit, user, 
            [usq, entityName, opName]);
        let usqApi = new UsqApi(url);
        // 设置usq里面entity的access之后，才写unitx中的entity access
        await usqApi.setAccessUser(unit, entityName, users.map(v=>v.to).join(','));
    }
    return ret;
}

async function buildUsqApi(unit:number, usq:number):Promise<UsqApi> {
    let url = await usqUrl(unit, usq);
    let usqApi = new UsqApi(url);
    return usqApi;
}

async function setAccessFully(unit:number, body:any, schema:any, flag:number) {
    let actionParam = unpack(schema, body.data);
    let {_usq, arr1} = actionParam;
    let usqApi = await buildUsqApi(unit, _usq);
    for (let arr of arr1) {
        let {_user} = arr;
        await usqApi.setAccessFully(unit, _user, flag);
    }
}

async function entityOpUserFully$add$(unit:number, body:any, schema:any) {
    await setAccessFully(unit, body, schema, 1);
}

async function entityOpUserFully$del$(unit:number, body:any, schema:any) {
    await setAccessFully(unit, body, schema, 0);
}

async function setAccessEntity(unit:number, body:any, schema:any) {
    let actionParam = unpack(schema, body.data);
    let {usq, entities} = actionParam;
    let entityNames:string = (entities as {entity:number}[]).map(v=>v.entity).join(',');
    let usqApi = await buildUsqApi(unit, usq);
    await usqApi.setAccessEntity(unit, entityNames);
}

class UsqApi extends Fetch {
    async setAccessUser(unit:number, entity:string, users:string) {
        let params = {unit:unit, entity:entity, users:users};
        return await this.post('setting/access-user', params);
    }
    async setAccessEntity(unit:number, entities:string) {
        let params = {unit:unit, entities:entities};
        return await this.post('setting/access-entity', params);
    }
    async setAccessFully(unit:number, user:number, flag:number) {
        let params = {unit:unit, user:user, flag:flag};
        return await this.post('setting/access-fully', params);
    }
}
