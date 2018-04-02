import * as express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as bodyParser from 'body-parser';
import * as config from 'config';
import * as multer from 'multer'; 
import tv,{queue} from './tv';
import {unitxRouter} from './tv/unitx';
import {wsOnConnected} from './ws';
import {Auth} from './core';
import { Request, Response, NextFunction } from 'express';

var cors = require('cors')
let app = express();
let expressWs = require('express-ws')(app);

let authCheck = new Auth(['*']).middleware();
let authDebug = new Auth(['*']).middlewareDebug();
let authUnitx = new Auth(['*']).middlewareUnitx();

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
// debug tonva usql, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
app.use('/usql/:db/debug', [authDebug, tv]);

app.use('/usql/hello', (req:Request, res:Response) => {
  res.json({"hello": 'usql-api - 中文测试'});
});

(app as any).ws('/usql', wsOnConnected);

/*
const uploadPath = config.get<string>("uploadPath");
var upload = multer({ dest: uploadPath });
async function readFileAsync(filename?:string, code?:string) {
  return new Promise<string>(function (resolve, reject) {
      try {
          fs.readFile(filename, code, function(err, buffer){
              if (err) reject(err); else resolve(buffer);
          });
      } catch (err) {
          reject(err);
      }
  });
};
app.use('/upload', (req:Request, res:Response) => {
    upload.any()(req, res, async function(err) {
        if (err) {
          res.json({'error': 'error'});
          return;
        }
        let files = req.files;
        for (let f of files as Express.Multer.File[]) {
          let filename = uploadPath + f.filename;
          let text = await readFileAsync(filename, 'utf8');
          console.log(text);
          fs.unlinkSync(filename);
        }
        res.json({'hello': 'ok'});
    });
});
*/

let port = config.get<number>('port');
app.listen(port, async ()=>{
    console.log('listening on port ' + port);
    // await startupUsqlApp((text:string) => console.log(text || ''));
});

queue.add({job: undefined})
  .then(job => {
    console.log('redis server ok!');
    return job.remove();
  })
  .catch(reason => {
    console.log('redis server error: ', reason);
  });
