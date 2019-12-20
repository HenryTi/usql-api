import * as config from 'config';
import * as fs from 'fs';
import * as path from 'path';
import { Router, Request, Response } from "express";
import * as multer from 'multer';
import { getResDbRunner } from './resDb';

export const router: Router = Router({ mergeParams: true });

const resPath = 'res-path';
let resFilesPath: string;
let upload: multer.Instance;
let uploadPath: string;
export function initResPath() {
    //let dir = __dirname;
    if (config.has(resPath) === false) {
        resFilesPath = path.resolve('../res-files');
    }
    else {
        resFilesPath = config.get<string>(resPath);
    }
    if (fs.existsSync(resFilesPath) === false) {
        fs.mkdirSync(resFilesPath);
    }
    uploadPath = resFilesPath + '/upload/';
    upload = multer({ dest:  uploadPath});
}

router.get('/hello', (req, res) => {
    res.end('hello! ' + req.method + '#' +  req.originalUrl);
});

router.get('/:resId', (req, res) => {
    let resId:string = req.params['resId'];
    let p = path.resolve(resFilesPath, resId.replace('-', '/'));
    res.setHeader('Cache-Control', 'max-age=31557600');
    let d = new Date;
    res.setHeader('Expires', new Date(d.getFullYear()+1, d.getMonth(), d.getDate()).toUTCString());
    res.sendFile(p);
});

router.post('/upload', (req, res) => {
    let s = req.body;
    upload.any()(req, res, async function(err) {
        if (err) {
            res.json({'error': 'error'});
            return;  
        }
        let file0 = req.files[0];
        let {filename, originalname, mimetype} = file0;
        let path = uploadPath + filename;
        let resDbRunner = await getResDbRunner();
        let ret = await resDbRunner.procCall('createItem', [originalname, mimetype]);
        let id = ret[0].id;
        let dir = String(Math.floor(id /10000));
        let file = String(10000 + (id % 10000)).substr(1);
        let dirPath = resFilesPath + '/' + dir;
        if (fs.existsSync(dirPath) === false) {
            fs.mkdirSync(dirPath);
        }
        let pos = (originalname as string).lastIndexOf('.');
        let suffix:string;
        if (pos >= 0) suffix = (originalname as string).substr(pos);
        let toPath = dirPath + '/' + file + suffix;
        await copyFile(path, toPath);
        res.json({
            ok: true,
            res: {id: dir + '-' + file + suffix}
        });
        return;
    });
});

async function copyFile(from: string, to: string):Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let source = fs.createReadStream(from);
        let dest = fs.createWriteStream(to);
        source.on('end', function() { /* copied */ resolve(); });
        source.on('error', function(err:any) { /* error */ reject(err); });
        source.pipe(dest);
    });
}
