"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("config");
const fs = require("fs");
const path = require("path");
const express_1 = require("express");
exports.router = express_1.Router({ mergeParams: true });
const imagePath = 'image-path';
let imgPath;
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
    res.sendFile(p);
});
//# sourceMappingURL=image.js.map