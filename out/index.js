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
const express = require("express");
const bodyParser = require("body-parser");
const config = require("config");
const tv_1 = require("./tv");
const unitx_1 = require("./tv/unitx");
//import {wsOnConnected, getWsLogs} from './ws';
const core_1 = require("./core");
(function () {
    let connection = config.get("connection");
    if (connection === undefined || connection.host === '0.0.0.0') {
        console.log("mysql connection must defined in config/default.json or config/production.json");
        return;
    }
    var cors = require('cors');
    let app = express();
    let expressWs = require('express-ws')(app);
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        //res.send(err)
        res.render('error', {
            message: err.message,
            error: err
        });
    });
    app.use(bodyParser.json());
    app.use(cors());
    app.set('json replacer', (key, value) => {
        if (value === null)
            return undefined;
        return value;
    });
    app.use((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        let s = req.socket;
        let p = '';
        if (req.method !== 'GET')
            p = JSON.stringify(req.body);
        console.log('%s:%s - %s %s %s', s.remoteAddress, s.remotePort, req.method, req.originalUrl, p);
        try {
            yield next();
        }
        catch (e) {
            console.error(e);
        }
    }));
    //app.use('/api', routers);
    //app.use('/tuid', tuid);
    // 正常的tonva usql接口
    app.use('/usql/:db/tv/unitx', [core_1.authUnitx, unitx_1.unitxRouter]);
    app.use('/usql/:db/tv', [core_1.authCheck, tv_1.default]);
    //app.use('/usql/:db/log', getWsLogs);
    // debug tonva usql, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
    app.use('/usql/:db/debug', [core_1.authDebug, tv_1.default]);
    app.use('/usql/:db/hello', (req, res) => {
        let db = req.params.db;
        res.json({ "hello": 'usql-api: hello, db is ' + db });
    });
    app.use('/usql/hello', (req, res) => {
        res.json({ "hello": 'usql-api: hello, it\'s good' });
    });
    //(app as any).ws('/usql/:db', wsOnConnected);
    let port = config.get('port');
    app.listen(port, () => __awaiter(this, void 0, void 0, function* () {
        console.log('USQL-API listening on port ' + port);
        console.log('process.env.NODE_ENV: %s, connection: %s', process.env.NODE_ENV, JSON.stringify(config.get("connection")));
        // await startupUsqlApp((text:string) => console.log(text || ''));
    }));
    function tryJobQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let job = yield tv_1.queue.add({ job: undefined });
                try {
                    yield job.remove();
                    console.log('redis server ok!');
                }
                catch (err) {
                    console.log('redis server job.remove error: ' + err);
                }
            }
            catch (reason) {
                console.log('redis server error: ', reason);
            }
            ;
        });
    }
    tryJobQueue();
})();
//# sourceMappingURL=index.js.map