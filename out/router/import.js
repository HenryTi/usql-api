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
const fs = require("fs");
const config = require("config");
const multer = require("multer");
const router_1 = require("./router");
function default_1(router) {
    router.post('/import/', (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield uploadImport(req, res);
    }));
}
exports.default = default_1;
const uploadPath = config.get("uploadPath");
var upload = multer({ dest: uploadPath });
function uploadImport(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let userToken = req.user;
        let { db, id: userId, unit } = userToken;
        let runner = yield router_1.checkRunner(db, res);
        if (runner === undefined)
            return;
        let body = req.body;
        let { source, entity } = body;
        if (!source)
            source = '#';
        let out = true;
        function log(log) {
            if (out === false)
                return true;
            if (log === undefined)
                log = '\n';
            else
                log += '\n';
            if (res.write(log) === false) {
                throw 'response error';
            }
            return true;
        }
        upload.any()(req, res, function (err) {
            return __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    res.json({ 'error': 'error' });
                    return;
                }
                try {
                    let parseResult = yield eachUploadSourceFile(uploadPath, req.files, (fileContent, file) => {
                        try {
                            res.write('parsing ' + file + '\r\n');
                            res.write(fileContent);
                            //uqUpdator.parse(fileContent, file);
                        }
                        catch (err) {
                            res.write('parse error ' + JSON.stringify(err));
                        }
                    });
                }
                catch (err) {
                    log('import error: ');
                    log(err);
                }
                finally {
                    res.end();
                }
            });
        });
    });
}
function eachUploadSourceFile(uploadPath, files, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let f of files) {
            let filename = uploadPath + f.filename;
            let text = yield readFileAsync(filename, 'utf8');
            yield callback(text, f.originalname);
            fs.unlinkSync(filename);
        }
        return undefined;
    });
}
function readFileAsync(filename, code) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (resolve, reject) {
            try {
                fs.readFile(filename, code, function (err, buffer) {
                    if (err)
                        reject(err);
                    else
                        resolve(buffer);
                });
            }
            catch (err) {
                reject(err);
            }
        });
    });
}
;
//# sourceMappingURL=import.js.map