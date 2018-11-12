"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const core_1 = require("../../core");
const actionProcess_1 = require("../actionProcess");
function unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (name) {
            case 'saveentityoppost':
                return yield saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run);
            case 'saveentityopforall':
                yield setAccessEntity(unit, body, schema);
                break;
            case 'entityOpUserFully$add$':
                yield entityOpUserFully$add$(unit, body, schema);
                break;
            case 'entityOpUserFully$del$':
                yield entityOpUserFully$del$(unit, body, schema);
                break;
        }
        return yield actionProcess_1.actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
    });
}
exports.unitxActionProcess = unitxActionProcess;
const usqHost = 'localhost';
function urlSetUsqHost(url) {
    return url.replace('://usqhost:', '://' + usqHost + ':');
}
exports.urlSetUsqHost = urlSetUsqHost;
function usqUrl(unit, usq) {
    return __awaiter(this, void 0, void 0, function* () {
        let urqUrl = yield core_1.centerApi.usqUrl(unit, usq);
        let { url, urlDebug } = urqUrl;
        if (urlDebug !== undefined) {
            // 这个地方会有问题，urlDebug也许指向错误
            try {
                urlDebug = urlSetUsqHost(urlDebug);
                let ret = yield node_fetch_1.default(urlDebug + 'hello');
                if (ret.status !== 200)
                    throw 'not ok';
                let text = yield ret.text();
                url = urlDebug;
            }
            catch (err) {
            }
        }
        return url;
    });
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
function saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        let actionParam = core_1.unpack(schema, body.data);
        let { usq, entityName, opName } = actionParam;
        let url = yield usqUrl(unit, usq);
        let ret = yield actionProcess_1.actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        if (opName === '$') {
            let users = yield runner.query('getEntityAccess', unit, user, [usq, entityName, opName]);
            let usqApi = new UsqApi(url);
            // 设置usq里面entity的access之后，才写unitx中的entity access
            yield usqApi.setAccessUser(unit, entityName, users.map(v => v.to).join(','));
        }
        return ret;
    });
}
function buildUsqApi(unit, usq) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = yield usqUrl(unit, usq);
        let usqApi = new UsqApi(url);
        return usqApi;
    });
}
function setAccessFully(unit, body, schema, flag) {
    return __awaiter(this, void 0, void 0, function* () {
        let actionParam = core_1.unpack(schema, body.data);
        let { _usq, arr1 } = actionParam;
        let usqApi = yield buildUsqApi(unit, _usq);
        for (let arr of arr1) {
            let { _user } = arr;
            yield usqApi.setAccessFully(unit, _user, flag);
        }
    });
}
function entityOpUserFully$add$(unit, body, schema) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setAccessFully(unit, body, schema, 1);
    });
}
function entityOpUserFully$del$(unit, body, schema) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setAccessFully(unit, body, schema, 0);
    });
}
function setAccessEntity(unit, body, schema) {
    return __awaiter(this, void 0, void 0, function* () {
        let actionParam = core_1.unpack(schema, body.data);
        let { usq, entities } = actionParam;
        let entityNames = entities.map(v => v.entity).join(',');
        let usqApi = yield buildUsqApi(unit, usq);
        yield usqApi.setAccessEntity(unit, entityNames);
    });
}
class UsqApi extends core_1.Fetch {
    setAccessUser(unit, entity, users) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = { unit: unit, entity: entity, users: users };
            return yield this.post('setting/access-user', params);
        });
    }
    setAccessEntity(unit, entities) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = { unit: unit, entities: entities };
            return yield this.post('setting/access-entity', params);
        });
    }
    setAccessFully(unit, user, flag) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = { unit: unit, user: user, flag: flag };
            return yield this.post('setting/access-fully', params);
        });
    }
}
//# sourceMappingURL=action.js.map