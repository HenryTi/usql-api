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
const res_1 = require("./res");
const core_1 = require("./core");
const queue_1 = require("./queue");
const auth_1 = require("./core/auth");
const jobs_1 = require("./jobs");
//import { importData } from './import';
function start() {
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
        res_1.initResPath();
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
        app.use('/res', res_1.router);
        app.use('/hello', dbHello);
        // 正常的tonva uq接口 uqRouter
        //let uqRouter = express.Router({ mergeParams: true });
        /*
        uqRouter.use('/', dbHello);
        uqRouter.use('/hello', dbHello);
        uqRouter.use('/unitx', [authUnitx, unitxQueueRouter]);
        uqRouter.use('/open', [authUnitx, openRouter]);
        uqRouter.use('/tv', [authCheck, router]);
        //uqRouter.use('/joint', [authJoint, router]);
        uqRouter.use('/setting', [settingRouter]); // unitx set access
        // debug tonva uq, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
        uqRouter.use('/debug', [authCheck, router]);
        */
        app.use('/uq/:db/', buildUqRouter(core_1.prodRouterBuilder));
        app.use('/uq-test/:db/', buildUqRouter(core_1.testRouterBuilder));
        let port = config.get('port');
        console.log('port=', port);
        //let redisConfig = config.get<any>('redis');
        //let redis = {redis: redisConfig};
        //console.log('redis:', redisConfig);
        //startSheetQueue(redis);
        //startToUnitxQueue(redis);
        //startUnitxInQueue(redis);
        app.listen(port, () => __awaiter(this, void 0, void 0, function* () {
            yield res_1.initResDb();
            console.log('UQ-API listening on port ' + port);
            let connection = config.get("connection");
            let { host, user } = connection;
            console.log('process.env.NODE_ENV: %s\nDB host: %s, user: %s', process.env.NODE_ENV, host, user);
            //await importData();
            jobs_1.Jobs.start();
        }));
    });
}
exports.start = start;
function dbHello(req, res) {
    let db = req.params.db;
    res.json({ "hello": 'uq-api: hello, db is ' + db });
}
function buildUqRouter(rb) {
    // 正常的tonva uq接口 uqRouter
    let uqRouter = express.Router({ mergeParams: true });
    let openRouter = express.Router({ mergeParams: true });
    router_1.buildOpenRouter(openRouter, rb);
    uqRouter.use('/open', [core_1.authUnitx, openRouter]);
    let settingRouter = express.Router({ mergeParams: true });
    router_1.buildSettingRouter(settingRouter, rb);
    uqRouter.use('/setting', [settingRouter]); // unitx set access
    let unitxQueueRouter = express.Router({ mergeParams: true });
    queue_1.buildUnitxQueueRouter(unitxQueueRouter, rb);
    uqRouter.use('/unitx', [core_1.authUnitx, unitxQueueRouter]);
    let router = express.Router({ mergeParams: true });
    router_1.buildEntityRouter(router, rb);
    uqRouter.use('/tv', [core_1.authCheck, router]);
    uqRouter.use('/joint', [auth_1.authJoint, router]);
    // debug tonva uq, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
    uqRouter.use('/debug', [core_1.authCheck, router]);
    uqRouter.use('/', dbHello);
    uqRouter.use('/hello', dbHello);
    return uqRouter;
}
//# sourceMappingURL=start.js.map