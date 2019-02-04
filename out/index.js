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
const image_1 = require("./res/image");
const core_1 = require("./core");
const queue_1 = require("./queue");
const sync_1 = require("./sync");
const auth_1 = require("./core/auth");
console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);
        let connection = config.get("connection");
        if (connection === undefined || connection.host === '0.0.0.0') {
            console.log("mysql connection must defined in config/default.json or config/production.json");
            return;
        }
        image_1.initImgPath();
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
        /*
        // 正常的tonva usql接口
        app.use('/usql/:db/unitx/', [authUnitx, unitxQueueRouter]);
        app.use('/usql/:db/open/', [authUnitx, openRouter]);
        app.use('/usql/:db/tv/', [authCheck, router]);
        app.use('/usql/:db/joint/', [authJoint, router]);
        app.use('/usql/:db/setting/', [settingRouter]); // unitx set access
    
        // debug tonva usql, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
        app.use('/usql/:db/debug', [authCheck, router]);
    
        function dbHello(req:Request, res:Response) {
            let db = req.params.db;
            res.json({"hello": 'usql-api: hello, db is ' + db});
        }
        app.use('/usql/:db/hello', dbHello);
        app.use('/usql/:db/', dbHello);
        app.use('/usql/hello', (req:Request, res:Response) => {
            res.json({"hello": 'usql-api: hello, it\'s good'});
        });
        app.use('/joint', jointRouter);
        */
        // 正常的tonva usql接口 usqRouter
        let usqRouter = express.Router({ mergeParams: true });
        usqRouter.use('/unitx', [core_1.authUnitx, queue_1.unitxQueueRouter]);
        usqRouter.use('/open', [core_1.authUnitx, router_1.openRouter]);
        usqRouter.use('/tv', [core_1.authCheck, router_1.router]);
        usqRouter.use('/joint', [auth_1.authJoint, router_1.router]);
        usqRouter.use('/setting', [router_1.settingRouter]); // unitx set access
        usqRouter.use('/img', image_1.router);
        // debug tonva usql, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
        usqRouter.use('/debug', [core_1.authCheck, router_1.router]);
        function dbHello(req, res) {
            let db = req.params.db;
            res.json({ "hello": 'usql-api: hello, db is ' + db });
        }
        usqRouter.use('/hello', dbHello);
        usqRouter.use('/', dbHello);
        function dbHello1(req, res) {
            let db = req.params.db;
            res.json({ "hello1": 'usql-api: hello, db is ' + db });
        }
        usqRouter.use('/hello1', dbHello1);
        app.use('/usql/:db/', usqRouter);
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
            console.log('USQL-API listening on port ' + port);
            let connection = config.get("connection");
            let { host, user } = connection;
            console.log('process.env.NODE_ENV: %s\nDB host: %s, user: %s', process.env.NODE_ENV, host, user);
        }));
    });
})();
// test
//# sourceMappingURL=index.js.map