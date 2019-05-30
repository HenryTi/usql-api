import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import * as config from 'config';
import {router, settingRouter, openRouter} from './router';
import {router as resRouter, initResPath} from './res/router';
//import {router as jointRouter} from './router/joint';
import {Auth, authCheck, authDebug, authUnitx} from './core';
import { unitxQueueRouter, startSheetQueue, startToUnitxQueue, startUnitxInQueue } from './queue';
import { startSync } from './sync';
import { authJoint } from './core/auth';
import { initResDb } from './res/resDb';
import { Runner, getRunner } from './db';

console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);
(async function () {
    /*
    let db = undefined;
    let entity = '';
    let div = '';
    let schema = {type: 'tuid'};
    let filePath = 'C:/Users/Henry/Desktop/Results.csv';
    await ImportData.exec(db, entity, div, schema, filePath);
    */

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
    app.use(function(err, req, res, next) {
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

    app.use(async (req:express.Request, res:express.Response, next:express.NextFunction) => {
        let s= req.socket;
        let p = '';
        if (req.method !== 'GET') p = JSON.stringify(req.body);
        console.log('%s:%s - %s %s %s', s.remoteAddress, s.remotePort, req.method, req.originalUrl, p);
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
    let uqRouter = express.Router({ mergeParams: true });
    uqRouter.use('/unitx', [authUnitx, unitxQueueRouter]);
    uqRouter.use('/open', [authUnitx, openRouter]);
    uqRouter.use('/tv', [authCheck, router]);
    uqRouter.use('/joint', [authJoint, router]);
    uqRouter.use('/setting', [settingRouter]); // unitx set access

    // debug tonva uq, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
    uqRouter.use('/debug', [authCheck, router]);

    function dbHello(req:Request, res:Response) {
        let db = req.params.db;
        res.json({"hello2": 'uq-api: hello, db is ' + db});
    }
    uqRouter.use('/hello2', dbHello);
    uqRouter.use('/', dbHello);
    function dbHello1(req:Request, res:Response) {
        let db = req.params.db;
        res.json({"hello1": 'uq-api: hello, db is ' + db});
    }
    uqRouter.use('/hello1', dbHello1);

    app.use('/uq/:db/', uqRouter);

    let port = config.get<number>('port');
    console.log('port=', port);

    let redisConfig = config.get<any>('redis');
    let redis = {redis: redisConfig};
    console.log('redis:', redisConfig);

    startSheetQueue(redis);
    startToUnitxQueue(redis);
    startUnitxInQueue(redis);

    app.listen(port, async ()=>{
        startSync();
        await initResDb();
        console.log('UQ-API listening on port ' + port);
        let connection = config.get<any>("connection");
        let {host, user} = connection;
        console.log('process.env.NODE_ENV: %s\nDB host: %s, user: %s',
            process.env.NODE_ENV,
            host,
            user);

        await importData();
    });
})();

async function importData() {
    try {
        let runner = await getRunner('biz_license');
        if (runner === undefined) return;
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
        ]

        for (let f of files) {
            let {entity, filePath} = f;
            if (filePath === undefined) continue;
            await runner.importData(unit, user, source, entity, filePath);
        }
        console.log('files imported!');
    }
    catch (err) {
        console.error(err);
    }
}