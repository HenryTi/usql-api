import * as express from 'express';
import { Request, Response, NextFunction, Router } from 'express';
import * as bodyParser from 'body-parser';
import * as config from 'config';
import {buildSettingRouter, buildOpenRouter, buildEntityRouter, buildUnitxRouter, buildBuildRouter} from './router';
import {initResDb, router as resRouter, initResPath} from './res';
import {Auth, authCheck, authDebug, authUnitx, RouterBuilder, uqProdRouterBuilder, uqTestRouterBuilder, unitxTestRouterBuilder, unitxProdRouterBuilder, compileProdRouterBuilder, compileTestRouterBuilder, CompileRouterBuilder} from './core';
//import { /*buildUnitxQueueRouter, startSheetQueue, startToUnitxQueue, startUnitxInQueue*/ } from './queue';
import { authJoint, authUpBuild } from './core/auth';
import { Jobs } from './jobs';
import { init$UqDb } from './$uq';
//import { importData } from './import';

export async function init():Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);
            
            let connection = config.get<any>("connection");
            if (connection === undefined || connection.host === '0.0.0.0') {
                console.log("mysql connection must defined in config/default.json or config/production.json");
                return;
            }
            initResPath();
            
            var cors = require('cors')
            let app = express();
            app.use(express.static('public'));
            app.use((err: any, req: Request, res: Response, next: NextFunction) => {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
            app.use(bodyParser.json());
            app.use(cors());
            app.set('json replacer', (key:any, value:any) => {
                if (value === null) return undefined;
                return value;
            });

            app.use(async (req:Request, res:Response, next:NextFunction) => {
                let s= req.socket;
                let p = '';
                if (req.method !== 'GET') p = JSON.stringify(req.body);
                let t = new Date();
                console.log('%s:%s %s:%s - %s %s %s', 
                    t.getMonth(), t.getDate(), t.getHours(), t.getMinutes(), req.method, req.originalUrl, p);
                try {
                    await next();
                }
                catch (e) {
                    console.error(e);
                }
            });

            app.use('/res', resRouter);
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
            app.use('/uq/prod/:db/', buildUqRouter(uqProdRouterBuilder, compileProdRouterBuilder));
            app.use('/uq/test/:db/', buildUqRouter(uqTestRouterBuilder, compileTestRouterBuilder));
            app.use('/uq/unitx-prod/', buildUnitxRouter(unitxProdRouterBuilder));
            app.use('/uq/unitx-test/', buildUnitxRouter(unitxTestRouterBuilder));

            let port = config.get<number>('port');
            console.log('port=', port);

            //let redisConfig = config.get<any>('redis');
            //let redis = {redis: redisConfig};
            //console.log('redis:', redisConfig);

            //startSheetQueue(redis);
            //startToUnitxQueue(redis);
            //startUnitxInQueue(redis);

            app.listen(port, async ()=>{
                await initResDb();
                await init$UqDb();
                console.log('UQ-API listening on port ' + port);
                let connection = config.get<any>("connection");
                let {host, user} = connection;
                console.log('process.env.NODE_ENV: %s\nDB host: %s, user: %s',
                    process.env.NODE_ENV,
                    host,
                    user);

                //await importData();
                resolve();
                //if (startJobs === true) Jobs.start();
                // **
                // **
            });
        }
        catch (err) {
            console.error(err);
        }
    });
}

export async function start() {
    await init();
    Jobs.start();
}

function dbHello(req:Request, res:Response) {
    let db = req.params.db;
    res.json({"hello": 'uq-api: hello, db is ' + db});
}

function buildUqRouter(rb: RouterBuilder, rbCompile: CompileRouterBuilder): Router {
    // 正常的tonva uq接口 uqRouter
    let uqRouter = Router({ mergeParams: true });

    let openRouter = Router({ mergeParams: true });
    buildOpenRouter(openRouter, rb);
    uqRouter.use('/open', [authUnitx, openRouter]);

    let buildRouter = Router({ mergeParams: true });
    buildBuildRouter(buildRouter, rbCompile);
    uqRouter.use('/build', [authUpBuild, buildRouter]);

    // 这个是不是也要放到只有unitx里面
    let settingRouter = Router({ mergeParams: true });
    buildSettingRouter(settingRouter, rb);
    uqRouter.use('/setting', [settingRouter]); // unitx set access

    /* 直接放到/unitx名下了
    let unitxQueueRouter = Router({ mergeParams: true });
    buildUnitxQueueRouter(unitxQueueRouter, rb);
    uqRouter.use('/unitx', [authUnitx, unitxQueueRouter]);
    */

    let entityRouter = Router({ mergeParams: true });
    buildEntityRouter(entityRouter, rb);
    uqRouter.use('/tv', [authCheck, entityRouter]);
    uqRouter.use('/debug', [authCheck, entityRouter]);
    uqRouter.use('/joint', [authJoint, entityRouter]);

    uqRouter.use('/', dbHello);
    uqRouter.use('/hello', dbHello);

    return uqRouter;
}
