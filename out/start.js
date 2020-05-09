"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const express_1 = require("express");
const bodyParser = require("body-parser");
const config = require("config");
const router_1 = require("./router");
const res_1 = require("./res");
const core_1 = require("./core");
const auth_1 = require("./core/auth");
const jobs_1 = require("./jobs");
const { version: uq_api_version } = require('../package.json');
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            try {
                if (!process.env.NODE_ENV) {
                    console.error('NODE_ENV not defined, exit');
                    process.exit();
                }
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
                app.use((err, req, res, next) => {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                });
                /*
                app.use(async (req:Request, res:Response, next:NextFunction) => {
                    let r = req;
                    debugger;
                    next();
                });
                */
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
                    let t = new Date();
                    console.log('%s-%s %s:%s - %s %s %s', t.getMonth() + 1, t.getDate(), t.getHours(), t.getMinutes(), req.method, req.originalUrl, p);
                    try {
                        next();
                    }
                    catch (e) {
                        console.error(e);
                    }
                }));
                app.use('/res', res_1.router);
                app.use('/hello', dbHello);
                app.use('/uq/prod/:db/', buildUqRouter(core_1.uqProdRouterBuilder, core_1.compileProdRouterBuilder));
                app.use('/uq/test/:db/', buildUqRouter(core_1.uqTestRouterBuilder, core_1.compileTestRouterBuilder));
                app.use('/uq/unitx-prod/', router_1.buildUnitxRouter(core_1.unitxProdRouterBuilder));
                app.use('/uq/unitx-test/', router_1.buildUnitxRouter(core_1.unitxTestRouterBuilder));
                let port = config.get('port');
                app.listen(port, () => __awaiter(this, void 0, void 0, function* () {
                    yield res_1.createResDb();
                    yield core_1.create$UqDb();
                    console.log('UQ-API ' + uq_api_version + ' listening on port ' + port);
                    let connection = config.get("connection");
                    let { host, user } = connection;
                    console.log('DB host: %s, user: %s', host, user);
                    resolve();
                }));
            }
            catch (err) {
                console.error(err);
            }
        });
    });
}
exports.init = init;
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        //Jobs.start();
        yield jobs_1.startJobsLoop();
    });
}
exports.start = start;
function dbHello(req, res) {
    let db = req.params.db;
    res.json({ "hello": 'uq-api: hello, db is ' + db });
}
function buildUqRouter(rb, rbCompile) {
    // 正常的tonva uq接口 uqRouter
    let uqRouter = express_1.Router({ mergeParams: true });
    let openRouter = express_1.Router({ mergeParams: true });
    router_1.buildOpenRouter(openRouter, rb);
    uqRouter.use('/open', [core_1.authUnitx, openRouter]);
    let buildRouter = express_1.Router({ mergeParams: true });
    router_1.buildBuildRouter(buildRouter, rbCompile);
    uqRouter.use('/build', [auth_1.authUpBuild, buildRouter]);
    let entityRouter = express_1.Router({ mergeParams: true });
    router_1.buildEntityRouter(entityRouter, rb);
    uqRouter.use('/tv', [core_1.authCheck, entityRouter]);
    uqRouter.use('/debug', [core_1.authCheck, entityRouter]);
    uqRouter.use('/joint', [auth_1.authJoint, entityRouter]);
    uqRouter.use('/', dbHello);
    uqRouter.use('/hello', dbHello);
    return uqRouter;
}
//# sourceMappingURL=start.js.map