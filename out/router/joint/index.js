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
const express_1 = require("express");
const db_1 = require("../../db");
const core_1 = require("../../core");
const processBusMessage_1 = require("../../queue/processBusMessage");
exports.router = express_1.Router({ mergeParams: true });
exports.router.get('/:unit/:jointName', (req, res) => __awaiter(this, void 0, void 0, function* () {
    yield routerProcess(req, res, readBus);
}));
exports.router.post('/:unit/:jointName', (req, res) => __awaiter(this, void 0, void 0, function* () {
    yield routerProcess(req, res, writeBus);
}));
function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress;
}
;
function routerProcess(req, res, action) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let { unit, jointName } = req.params;
            let runner = yield db_1.getRunner(core_1.consts.$unitx);
            let joint = yield getJoint(req, runner, unit, jointName);
            if (joint !== undefined) {
                yield action(req, res, runner, unit, joint);
            }
            else {
                throw 'not accepted ip';
            }
        }
        catch (err) {
            res.end('xx', 'utf-8');
        }
    });
}
var lastJoint;
function getJoint(req, runner, unit, jointName) {
    return __awaiter(this, void 0, void 0, function* () {
        let reqIP = getClientIp(req);
        if (lastJoint !== undefined) {
            let { name, ip } = lastJoint;
            if (name === jointName &&
                (reqIP === '::1' || reqIP === '127.0.0.1' || reqIP === ip)) {
                return lastJoint;
            }
        }
        let jointRet = yield runner.tuidSeach('joint', unit, undefined, undefined, jointName, 0, 1);
        let t0 = jointRet[0];
        if (t0.length === 0)
            throw 'not exist joint ' + jointName;
        let joint = t0[0];
        let { name, ip } = joint;
        if (name === jointName &&
            (reqIP === '::1' || reqIP === '127.0.0.1' || reqIP === ip)) {
            return lastJoint = joint;
        }
    });
}
function readBus(req, res, runner, unit, joint) {
    return __awaiter(this, void 0, void 0, function* () {
        let { name, discription, facesIn, facesOut } = joint;
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8'
        });
        res.write('<h4>joint: ' + name + ' -- ' + discription + '</h4>');
        if (facesIn) {
            res.write('<h5>写入接口</h5>');
            facesIn.split('\n').forEach(v => {
                res.write('<div>' + v + '</div>');
            });
        }
        res.write('<br/>');
        if (facesOut) {
            res.write('<h5>读出接口</h5>');
            facesOut.split('\n').forEach(v => {
                res.write('<div>' + v + '</div>');
            });
        }
        res.write('<br/>');
        res.write('<br/>');
        res.write('<form action="./a" method="post"><button type="submit">submit</button></form>');
        res.end();
    });
}
;
function writeBus(req, res, runner, unit, joint) {
    return __awaiter(this, void 0, void 0, function* () {
        let tickets = req.body;
        if (!tickets) {
            res.json({});
            return;
        }
        tickets = [
            { face: '$$$/test/complex1', queue: 0, data: undefined },
            { face: '$$$/test/complex1', queue: undefined, data: '1\t2\ta38\n3\t2\t1543678133000\t\n\n\n' }
        ];
        /*
        let faces = [
            {id: 1, face: '$$$/test/complex1'}
        ];
        let unitMsgs = [
            {face: 1, unit: unit, msgId: 0}
        ];*/
        let { facesIn, facesOut } = joint;
        let faces = [];
        let unitMsgs = [];
        let seed = 1;
        let dict = {};
        let dictn = {};
        for (let ticket of tickets) {
            let { face, queue, data } = ticket;
            if (face === undefined)
                continue;
            if (data !== undefined) {
                // 写bus
                if (facesIn === null)
                    continue;
                if (facesIn.indexOf(face) < 0)
                    continue;
                yield processBusMessage_1.writeDataToBus(runner, face, unit, data);
            }
            else {
                if (facesOut === null)
                    continue;
                if (facesOut.indexOf(face) < 0)
                    continue;
                let faceId = dict[face];
                if (faceId === undefined) {
                    dict[face] = faceId = seed++;
                    dictn[faceId] = face;
                    faces.push({ id: faceId, face: face });
                }
                unitMsgs.push({ face: faceId, unit: unit, msgId: queue });
            }
        }
        if (seed > 1) {
            let facesText = faces.map(v => v.id + '\t' + v.face).join('\n');
            let faceUnitMessages = unitMsgs.map(v => v.face + '\t' + v.unit + '\t' + v.msgId);
            let ret = yield runner.call(core_1.consts.GetBusMessages, [undefined, undefined, facesText, faceUnitMessages]);
            for (let row of ret) {
                row.face = dictn[row.face];
            }
            res.json(ret);
        }
        else {
            res.json([]);
        }
    });
}
//# sourceMappingURL=index.js.map