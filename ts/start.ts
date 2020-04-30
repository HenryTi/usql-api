import * as express from 'express';
import { Request, Response, NextFunction, Router } from 'express';
import * as bodyParser from 'body-parser';
import * as config from 'config';
import {buildOpenRouter, buildEntityRouter, buildUnitxRouter, buildBuildRouter} from './router';
import {createResDb, router as resRouter, initResPath} from './res';
import {authCheck, authUnitx, RouterBuilder, 
	uqProdRouterBuilder, uqTestRouterBuilder, 
	unitxTestRouterBuilder, unitxProdRouterBuilder, 
	compileProdRouterBuilder, compileTestRouterBuilder, CompileRouterBuilder, 
	create$UqDb} from './core';
import { authJoint, authUpBuild } from './core/auth';
import { startJobsLoop } from './jobs';

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
            /*
            app.use(async (req:Request, res:Response, next:NextFunction) => {
                let r = req;
                debugger;
                next();
            });
            */
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
                console.log('%s-%s %s:%s - %s %s %s', 
                    t.getMonth()+1, t.getDate(), t.getHours(), t.getMinutes(), req.method, req.originalUrl, p);
                try {
                    next();
                }
                catch (e) {
                    console.error(e);
                }
            });

            app.use('/res', resRouter);
            app.use('/hello', dbHello);

            app.use('/uq/prod/:db/', buildUqRouter(uqProdRouterBuilder, compileProdRouterBuilder));
            app.use('/uq/test/:db/', buildUqRouter(uqTestRouterBuilder, compileTestRouterBuilder));
            app.use('/uq/unitx-prod/', buildUnitxRouter(unitxProdRouterBuilder));
            app.use('/uq/unitx-test/', buildUnitxRouter(unitxTestRouterBuilder));

            let port = config.get<number>('port');
            console.log('port=', port);

            app.listen(port, async ()=>{
                await createResDb();
                await create$UqDb();
                console.log('UQ-API listening on port ' + port);
                let connection = config.get<any>("connection");
                let {host, user} = connection;
                console.log('process.env.NODE_ENV: %s\nDB host: %s, user: %s',
                    process.env.NODE_ENV,
                    host,
                    user);

                resolve();
            });
        }
        catch (err) {
            console.error(err);
        }
    });
}

export async function start() {
    await init();
    //Jobs.start();
    await startJobsLoop();
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

    let entityRouter = Router({ mergeParams: true });
    buildEntityRouter(entityRouter, rb);
    uqRouter.use('/tv', [authCheck, entityRouter]);
    uqRouter.use('/debug', [authCheck, entityRouter]);
    uqRouter.use('/joint', [authJoint, entityRouter]);

    uqRouter.use('/', dbHello);
    uqRouter.use('/hello', dbHello);

    return uqRouter;
}
