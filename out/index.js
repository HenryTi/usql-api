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
const router_1 = require("./router");
const router_2 = require("./res/router");
//import {router as jointRouter} from './router/joint';
const core_1 = require("./core");
const queue_1 = require("./queue");
const sync_1 = require("./sync");
const auth_1 = require("./core/auth");
const resDb_1 = require("./res/resDb");
const db_1 = require("./db");
console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        /*
        let db = undefined;
        let entity = '';
        let div = '';
        let schema = {type: 'tuid'};
        let filePath = 'C:/Users/Henry/Desktop/Results.csv';
        await ImportData.exec(db, entity, div, schema, filePath);
        */
        console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);
        let connection = config.get("connection");
        if (connection === undefined || connection.host === '0.0.0.0') {
            console.log("mysql connection must defined in config/default.json or config/production.json");
            return;
        }
        router_2.initResPath();
        var cors = require('cors');
        let app = express();
        app.use(express.static('public'));
        app.use(function (err, req, res, next) {
            res.status(err.status || 500);
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
        app.use('/res', router_2.router);
        app.use('/hello', dbHello);
        // 正常的tonva uq接口 uqRouter
        let uqRouter = express.Router({ mergeParams: true });
        uqRouter.use('/unitx', [core_1.authUnitx, queue_1.unitxQueueRouter]);
        uqRouter.use('/open', [core_1.authUnitx, router_1.openRouter]);
        uqRouter.use('/tv', [core_1.authCheck, router_1.router]);
        uqRouter.use('/joint', [auth_1.authJoint, router_1.router]);
        uqRouter.use('/setting', [router_1.settingRouter]); // unitx set access
        // debug tonva uq, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
        uqRouter.use('/debug', [core_1.authCheck, router_1.router]);
        function dbHello(req, res) {
            let db = req.params.db;
            res.json({ "hello2": 'uq-api: hello, db is ' + db });
        }
        uqRouter.use('/hello2', dbHello);
        uqRouter.use('/', dbHello);
        function dbHello1(req, res) {
            let db = req.params.db;
            res.json({ "hello1": 'uq-api: hello, db is ' + db });
        }
        uqRouter.use('/hello1', dbHello1);
        app.use('/uq/:db/', uqRouter);
        let port = config.get('port');
        console.log('port=', port);
        let redisConfig = config.get('redis');
        let redis = { redis: redisConfig };
        console.log('redis:', redisConfig);
        queue_1.startSheetQueue(redis);
        queue_1.startToUnitxQueue(redis);
        queue_1.startUnitxInQueue(redis);
        app.listen(port, () => __awaiter(this, void 0, void 0, function* () {
            sync_1.startSync();
            yield resDb_1.initResDb();
            console.log('UQ-API listening on port ' + port);
            let connection = config.get("connection");
            let { host, user } = connection;
            console.log('process.env.NODE_ENV: %s\nDB host: %s, user: %s', process.env.NODE_ENV, host, user);
            yield importData();
        }));
    });
})();
function importData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let runner = yield db_1.getRunner('biz_license');
            if (runner === undefined)
                return;
            let unit = 99;
            let user = 99;
            let source = '#';
            let files = [
                {
                    entity: 'vendor',
                    filePath: 'C:/Users/Henry/Desktop/Results.csv',
                },
                {
                    entity: 'vendorPercentage',
                    filePath: 'C:/Users/Henry/Desktop/map.csv',
                }
            ];
            for (let f of files) {
                let { entity, filePath } = f;
                if (filePath === undefined)
                    continue;
                yield runner.importData(unit, user, source, entity, filePath);
            }
            console.log('files imported!');
        }
        catch (err) {
            console.error(err);
        }
    });
}
//# sourceMappingURL=index.js.map