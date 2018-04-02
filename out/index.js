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
const tv_1 = require("./tv");
const unitx_1 = require("./tv/unitx");
const ws_1 = require("./ws");
const core_1 = require("./core");
var cors = require('cors');
let app = express();
let expressWs = require('express-ws')(app);
let authCheck = new core_1.Auth(['*']).middleware();
let authDebug = new core_1.Auth(['*']).middlewareDebug();
let authUnitx = new core_1.Auth(['*']).middlewareUnitx();
app.use(function (err, req, res, next) {
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
//app.use('/api', routers);
//app.use('/tuid', tuid);
// 正常的tonva usql接口
app.use('/usql/:db/tv/unitx', [authUnitx, unitx_1.unitxRouter]);
app.use('/usql/:db/tv', [authCheck, tv_1.default]);
// debug tonva usql, 默认 unit=-99, user=-99, 以后甚至可以加访问次数，超过1000次，关闭这个接口
app.use('/usql/:db/debug', [authDebug, tv_1.default]);
app.use('/usql/hello', (req, res) => {
    res.json({ "hello": 'usql-api - 中文测试' });
});
app.ws('/usql', ws_1.wsOnConnected);
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
let port = config.get('port');
app.listen(port, () => __awaiter(this, void 0, void 0, function* () {
    console.log('listening on port ' + port);
    // await startupUsqlApp((text:string) => console.log(text || ''));
}));
tv_1.queue.add({ job: undefined })
    .then(job => {
    console.log('redis server ok!');
    return job.remove();
})
    .catch(reason => {
    console.log('redis server error: ', reason);
});
//# sourceMappingURL=index.js.map