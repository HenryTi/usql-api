import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import * as config from 'config';
import {router, settingRouter, openRouter} from './router';
import {router as imgRouter, initImgPath} from './res/image';
import {router as jointRouter} from './router/joint';
import {Auth, authCheck, authDebug, authUnitx} from './core';
import { unitxQueueRouter, startSheetQueue, startToUnitxQueue, startUnitxInQueue } from './queue';
import { startSync } from './sync';
import { authJoint } from './core/auth';

console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);
(async function () {
    console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);
    
    let connection = config.get<any>("connection");
    if (connection === undefined || connection.host === '0.0.0.0') {
        console.log("mysql connection must defined in config/default.json or config/production.json");
        return;
    }
    initImgPath();
    
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
    usqRouter.use('/unitx', [authUnitx, unitxQueueRouter]);
    usqRouter.use('/open', [authUnitx, openRouter]);
    usqRouter.use('/tv', [authCheck, router]);
    usqRouter.use('/joint', [authJoint, router]);
    usqRouter.use('/setting', [settingRouter]); // unitx set access
    usqRouter.use('/img', imgRouter);

    // debug tonva usql, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
    usqRouter.use('/debug', [authCheck, router]);

    function dbHello(req:Request, res:Response) {
        let db = req.params.db;
        res.json({"hello": 'usql-api: hello, db is ' + db});
    }
    usqRouter.use('/hello', dbHello);
    usqRouter.use('/', dbHello);

    app.use('/usql/:db/', usqRouter);

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
        console.log('USQL-API listening on port ' + port);
        let connection = config.get<any>("connection");
        let {host, user} = connection;
        console.log('process.env.NODE_ENV: %s\nDB host: %s, user: %s',
            process.env.NODE_ENV,
            host,
            user);
    });
})();

// test
