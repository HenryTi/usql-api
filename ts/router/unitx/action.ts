import fetch from 'node-fetch';
import { Runner, centerApi, unpack, packParam, Fetch, Net } from '../../core';
import { actionProcess } from '../actionProcess';

export async function unitxActionProcess(unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any, net:Net):Promise<any> {
    switch (name) {
        case 'saveentityoppost':
            return await saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run, net);
        case 'saveentityopforall':
            await setAccessEntity(net, unit, body, schema);
            break;
        case 'entityOpUserFully$add$':
            await entityOpUserFully$add$(net, unit, body, schema);
            break;
        case 'entityOpUserFully$del$':
            await entityOpUserFully$del$(net, unit, body, schema);
            break;
    }
    return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
}

// ????????????????????????
// 这里的问题，记录在ondrive/同花待实现功能点.docx 文件中
// ????????????????????????
/*
if (opName === '$') {
    let users:{to:number}[] = await runner.query(
        'getEntityAccess', unit, user, 
        [uq, entityName, opName]);
    console.log({
        '$': 'saveEntityOpPost',
        '#': 'getEntityAccess',
        unit: unit, 
        user: user,
        uq: uq,
        entityName: entityName,
        opName: opName,
        
        users: users.join(','),
    })
    let uqApi = new UqApi(url);
    // 设置uq里面entity的access之后，才写unitx中的entity access
    await uqApi.setAccess(unit, entityName, anyone, users.map(v=>v.to).join(','));
}
return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
*/

async function saveEntityOpPost(unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any, net:Net) {
    let actionParam = unpack(schema, body.data);
    let {uq, entityName, opName} = actionParam;

    let url = await net.uqUrl(unit, uq);
    let ret = await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
    if (opName === '$') {
        let users:{to:number}[] = await runner.query(
            'getEntityAccess', unit, user, 
            [uq, entityName, opName]);
        let uqApi = new UqApi(url);
        // 设置uq里面entity的access之后，才写unitx中的entity access
        await uqApi.setAccessUser(unit, entityName, users.map(v=>v.to).join(','));
    }
    return ret;
}

async function buildUqApi(net:Net, unit:number, uq:number):Promise<UqApi> {
    let url = await net.uqUrl(unit, uq);
    let uqApi = new UqApi(url);
    return uqApi;
}

async function setAccessFully(net:Net, unit:number, body:any, schema:any, flag:number) {
    let actionParam = unpack(schema, body.data);
    let {_uq, arr1} = actionParam;
    let uqApi = await buildUqApi(net, unit, _uq);
    for (let arr of arr1) {
        let {_user} = arr;
        await uqApi.setAccessFully(unit, _user, flag);
    }
}

async function entityOpUserFully$add$(net:Net, unit:number, body:any, schema:any) {
    await setAccessFully(net, unit, body, schema, 1);
}

async function entityOpUserFully$del$(net:Net, unit:number, body:any, schema:any) {
    await setAccessFully(net, unit, body, schema, 0);
}

async function setAccessEntity(net:Net, unit:number, body:any, schema:any) {
    let actionParam = unpack(schema, body.data);
    let {uq, entities} = actionParam;
    let entityNames:string = (entities as {entity:number}[]).map(v=>v.entity).join(',');
    let uqApi = await buildUqApi(net, unit, uq);
    await uqApi.setAccessEntity(unit, entityNames);
}

class UqApi extends Fetch {
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
