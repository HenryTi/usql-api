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
const config = require("config");
const fs = require("fs");
const path = require("path");
const express_1 = require("express");
const multer = require("multer");
exports.router = express_1.Router({ mergeParams: true });
const imagePath = 'image-path';
let imgPath;
let upload;
let uploadPath;
function initImgPath() {
    //let dir = __dirname;
    if (config.has(imagePath) === false) {
        imgPath = path.resolve('../res-images');
    }
    else {
        imgPath = config.get(imagePath);
    }
    if (fs.existsSync(imgPath) === false) {
        fs.mkdirSync(imgPath);
    }
    uploadPath = imgPath + '/upload/';
    upload = multer({ dest: uploadPath });
}
exports.initImgPath = initImgPath;
exports.router.get('/:imgId', (req, res) => {
    let imgId = req.params['imgId'];
    let n = Number.parseInt(imgId);
    if (isNaN(n) === true)
        return;
    if (n >= 1000000000)
        return;
    let v = String(1000000000 + n);
    let f1 = v.substr(1, 3);
    let f2 = v.substr(4, 3);
    let f3 = v.substr(7, 3);
    let p = path.resolve(imgPath, f1, f2, f3);
    //res.json({ok:true, res: p});
    res.setHeader('Cache-Control', 'max-age=31557600');
    let d = new Date;
    res.setHeader('Expires', new Date(d.getFullYear(), d.getMonth(), d.getDate()).toUTCString());
    res.sendFile(p);
});
exports.router.post('/upload', (req, res) => {
    upload.any()(req, res, function (err) {
        return __awaiter(this, void 0, void 0, function* () {
            if (err) {
                res.json({ 'error': 'error' });
                return;
            }
            let filename = uploadPath + req.file.filename;
        });
    });
});
function copyFile(from, to) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let source = fs.createReadStream(from);
            let dest = fs.createWriteStream(to);
            source.on('end', function () { /* copied */ resolve(); });
            source.on('error', function (err) { /* error */ reject(err); });
            source.pipe(dest);
        });
    });
}
//# sourceMappingURL=image.js.map