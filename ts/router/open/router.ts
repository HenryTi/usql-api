import { Router } from 'express';
import { logger } from '../../tool';
import { EntityRunner, RouterBuilder } from '../../core';

export function buildOpenRouter(router:Router, rb: RouterBuilder) {    
    rb.get(router, '/entities/:unit',
    async (runner:EntityRunner, body:any, params:any):Promise<any> => {
        return await runner.getEntities(params.unit);
    });

    rb.get(router, '/entity/:entityName',
    async (runner:EntityRunner, body:any, params:any):Promise<any> => {
        return runner.getSchema(params.entityName);
    });

    rb.post(router, '/entities/:unit',
    async (runner:EntityRunner, body:any, params:any):Promise<any> => {
        return await runner.getEntities(params.unit);
    });

    rb.post(router, '/from-entity',
    async (runner:EntityRunner, body:any):Promise<any> => {
        let {unit, entity, key} = body;
        let schema = runner.getSchema(entity);
        let {type} = schema;
        if (type === 'tuid') {
            let tuidRet = await runner.unitUserCall('tv_' + entity, unit, undefined, key);
            return tuidRet;
        }
        if (type === 'map') {
            let keys = key.split('\t');
            let len = keys.length;
            for (let i=0; i<len; i++) {
                if (!key[i]) keys[i] = undefined;
            }
            let {keys:keyFields} = schema.call;
            let fieldsLen = keyFields.length;
            for (let i=len; i<fieldsLen; i++) {
                keys.push(undefined);
            }
            let mapRet = await runner.unitUserCall('tv_' + entity + '$query$', unit, undefined, keys);
            return mapRet;
        }
    });

    rb.post(router, '/queue-modify',
    async (runner:EntityRunner, body:any):Promise<any> => {
        let {unit, start, page, entities} = body;
        let ret = await runner.unitTablesFromProc('tv_$modify_queue', unit, start, page, entities);
        let ret1 = ret[1];
        let modifyMax = ret1.length===0? 0: ret1[0].max;
        runner.setModifyMax(unit, modifyMax);
        return {
            queue: ret[0],
            queueMax: modifyMax
        };
    });

    rb.post(router, '/bus-query',
    async (runner:EntityRunner, body:any):Promise<any> => {
        let {unit, busOwner, busName, face:faceName, params} = body;
        let faceUrl = `${busOwner}/${busName}/${faceName}`;
        let face = runner.buses.coll[faceUrl];
        let {bus} = face;
        let ret = await runner.tablesFromProc(bus + '_' + faceName, [unit, 0, ...params])
        return ret;
    });

    rb.post(router, '/tuid-main/:tuid',
    async (runner:EntityRunner, body:any, params:any):Promise<any> => {
        body.$ = 'open/tuid-main/';
        logger.log(body);
        let {tuid} = params;
        let {unit, id, all} = body;
        if (runner.isTuidOpen(tuid) === false) return;
        // maps: tab分隔的map名字
        let suffix = (all===true? '$id':'$main');
        let ret = await runner.unitUserCall('tv_' + tuid + suffix, unit, undefined, id);
        return ret;
    });

    rb.post(router, '/tuid-div/:tuid/:div',
    async (runner:EntityRunner, body:any, params:any):Promise<any> => {
        body.$ = 'open/tuid-div/';
        logger.log(body);
        let {tuid, div} = params;
        let {unit, id, ownerId, all} = body;
        if (runner.isTuidOpen(tuid) === false) return;
        // maps: tab分隔的map名字
        let suffix = (all===true? '$id':'$main');
        return await runner.unitUserCall(`tv_${tuid}_${div}${suffix}`, unit, undefined, ownerId, id);
	});
	
	rb.get(router, '/proc/:name',
    async (runner:EntityRunner, body:any, params:any):Promise<any> => {
        let {name} = params;
        return await runner.buildProc(name);
    });

	rb.post(router, '/action/:action', 
    async (runner:EntityRunner, body:any, params:any):Promise<any> => {
        let {action} = params;
		if (runner.isActionOpen(action) === false) return;
        let {unit, id, data} = body;
        return await runner.actionDirect(action, unit, id, data);
    });
};
