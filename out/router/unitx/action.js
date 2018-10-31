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
const packReturn_1 = require("../../core/packReturn");
const fetch_1 = require("../../core/fetch");
const actionProcess_1 = require("../actionProcess");
function unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (name) {
            default:
                return yield actionProcess_1.actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
            case 'saveentityoppost':
                return yield saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run);
        }
    });
}
exports.unitxActionProcess = unitxActionProcess;
const usqHost = 'localhost';
function urlSetUsqHost(url) {
    return url.replace('://usqhost:', '://' + usqHost + ':');
}
exports.urlSetUsqHost = urlSetUsqHost;
function saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        let actionParam = packReturn_1.unpack(schema, body.data);
        let { usq, entityName, opName, anyone } = actionParam;
        if (anyone !== 1)
            anyone = 0;
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
        let ret = yield actionProcess_1.actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        if (opName === '$') {
            let users = yield runner.query('getEntityAccess', unit, user, [usq, entityName, opName]);
            let usqApi = new UsqApi(url);
            // 设置usq里面entity的access之后，才写unitx中的entity access
            yield usqApi.setAccess(unit, entityName, anyone, users.map(v => v.to).join(','));
        }
        return ret;
    });
}
class UsqApi extends fetch_1.Fetch {
    setAccess(unit, entity, anyone, users) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = { unit: unit, entity: entity, anyone: anyone, users: users };
            return yield this.post('setting/access', params);
        });
    }
}
//# sourceMappingURL=action.js.map