import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import * as config from 'config';
import tv, { startOutQueue, startSheetQueue } from './tv';
//import {sendToBusRouter} from './tv/toUnitx';
import {Auth, authCheck, authDebug, authUnitx} from './core';
import { unitxRouter, startUnitxInQueue } from './unitx-server';

(function() {
    let connection = config.get<any>("connection");
    if (connection === undefined || connection.host === '0.0.0.0') {
        console.log("mysql connection must defined in config/default.json or config/production.json");
        return;
    }
    var cors = require('cors')
    let app = express();
    //let expressWs = require('express-ws')(app);

    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
    app.use(bodyParser.json());
    app.use(cors());
    app.set('json replacer', (key, value) => {
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

    // 正常的tonva usql接口
    //app.use('/usql/:db/bus/', [authUnitx, sendToBusRouter]);
    app.use('/usql/:db/unitx/', [authUnitx, unitxRouter]);
    app.use('/usql/:db/tv/', [authCheck, tv]);

    //app.use('/usql/:db/log', getWsLogs);
    // debug tonva usql, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
    //app.use('/usql/:db/debug', [authDebug, tv]);
    app.use('/usql/:db/debug', [authCheck, tv]);

    function dbHello(req:Request, res:Response) {
        let db = req.params.db;
        res.json({"hello": 'usql-api: hello, db is ' + db});
    }
    app.use('/usql/:db/hello', dbHello);
    app.use('/usql/:db/', dbHello);
    app.use('/usql/hello', (req:Request, res:Response) => {
        res.json({"hello": 'usql-api: hello, it\'s good'});
    });

    let port = config.get<number>('port');
    console.log('port=', port);

    let redisConfig = config.get<any>('redis');
    let redis = {redis: redisConfig};
    console.log('redis:', redis);

    startOutQueue(redis);
    startSheetQueue(redis);
    startUnitxInQueue(redis);

    app.listen(port, async ()=>{
        console.log('USQL-API listening on port ' + port);
        let connection = config.get<any>("connection");
        let {host, user} = connection;
        console.log('process.env.NODE_ENV: %s, host: %s, user: %s',
            process.env.NODE_ENV,
            host,
            user);
        //await tryoutQueue();
    });
})();
