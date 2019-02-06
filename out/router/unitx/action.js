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
function uqUrl(unit, uq) {
    return __awaiter(this, void 0, void 0, function* () {
        let urqUrl = yield core_1.centerApi.uqUrl(unit, uq);
        let { url, urlDebug } = urqUrl;
        if (urlDebug !== undefined) {
            // 这个地方会有问题，urlDebug也许指向错误
            try {
                urlDebug = core_1.urlSetUqHost(urlDebug);
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
function saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        let actionParam = core_1.unpack(schema, body.data);
        let { uq, entityName, opName } = actionParam;
        let url = yield uqUrl(unit, uq);
        let ret = yield actionProcess_1.actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        if (opName === '$') {
            let users = yield runner.query('getEntityAccess', unit, user, [uq, entityName, opName]);
            let uqApi = new UqApi(url);
            // 设置uq里面entity的access之后，才写unitx中的entity access
            yield uqApi.setAccessUser(unit, entityName, users.map(v => v.to).join(','));
        }
        return ret;
    });
}
function buildUqApi(unit, uq) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = yield uqUrl(unit, uq);
        let uqApi = new UqApi(url);
        return uqApi;
    });
}
function setAccessFully(unit, body, schema, flag) {
    return __awaiter(this, void 0, void 0, function* () {
        let actionParam = core_1.unpack(schema, body.data);
        let { _uq, arr1 } = actionParam;
        let uqApi = yield buildUqApi(unit, _uq);
        for (let arr of arr1) {
            let { _user } = arr;
            yield uqApi.setAccessFully(unit, _user, flag);
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
        let { uq, entities } = actionParam;
        let entityNames = entities.map(v => v.entity).join(',');
        let uqApi = yield buildUqApi(unit, uq);
        yield uqApi.setAccessEntity(unit, entityNames);
    });
}
class UqApi extends core_1.Fetch {
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