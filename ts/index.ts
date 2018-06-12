import * as express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as bodyParser from 'body-parser';
import * as config from 'config';
import * as multer from 'multer'; 
import tv,{queue} from './tv';
import {unitxRouter} from './tv/unitx';
//import {wsOnConnected, getWsLogs} from './ws';
import {Auth, authCheck, authDebug, authUnitx} from './core';
import { Request, Response, NextFunction } from 'express';

(function() {
    let connection = config.get<any>("connection");
    if (connection === undefined || connection.host === '0.0.0.0') {
        console.log("mysql connection must defined in config/default.json or config/production.json");
        return;
    }
    var cors = require('cors')
    let app = express();
    let expressWs = require('express-ws')(app);

    app.use(function(err, req, res, next) {
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

    //app.use('/api', routers);
    //app.use('/tuid', tuid);

    // 正常的tonva usql接口
    app.use('/usql/:db/tv/unitx', [authUnitx, unitxRouter]);
    app.use('/usql/:db/tv', [authCheck, tv]);
    //app.use('/usql/:db/log', getWsLogs);
    // debug tonva usql, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
    app.use('/usql/:db/debug', [authDebug, tv]);

    app.use('/usql/:db/hello', (req:Request, res:Response) => {
        let db = req.params.db;
        res.json({"hello": 'usql-api: hello, db is ' + db});
    });

    app.use('/usql/hello', (req:Request, res:Response) => {
        res.json({"hello": 'usql-api: hello, it\'s good'});
    });

    //(app as any).ws('/usql/:db', wsOnConnected);

    let port = config.get<number>('port');
    app.listen(port, async ()=>{
        console.log('USQL-API listening on port ' + port);
        console.log('process.env.NODE_ENV: %s, connection: %s',
            process.env.NODE_ENV,
            JSON.stringify(config.get<any>("connection")));
        // await startupUsqlApp((text:string) => console.log(text || ''));
    });

    async function tryJobQueue() {
        try {
            let job = await queue.add({job: undefined});
            try {
                await job.remove();
                console.log('redis server ok!');
            }
            catch (err) {
                console.log('redis server job.remove error: ' + err);
            }
        }
        catch (reason) {
            console.log('redis server error: ', reason);
        };
    }

    tryJobQueue();
})();
