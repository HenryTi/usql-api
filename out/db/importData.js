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
const bufferSize = 7;
class ImportData {
    constructor() {
        this.header = {};
    }
    // entity: 'product';
    // entity: 'product-pack'
    static exec(runner, db, entity, div, schema, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let importData;
            let { type } = schema;
            switch (type) {
                case 'tuid':
                    importData = new ImportTuid();
                    break;
                case 'map':
                    importData = new ImportMap();
                    break;
            }
            importData.db = db;
            importData.entity = entity;
            importData.div = div;
            importData.schema = schema;
            importData.filePath = filePath;
            yield importData.importData();
        });
    }
    readLine() {
        let ret = [];
        let loop = true;
        while (loop) {
            let len = this.buffer.length;
            let cur, c = 0;
            let i = this.p;
            for (; i < len; i++) {
                c = this.buffer.charCodeAt(i);
                if (c === 65279)
                    continue; // UTF8-BOM
                if (c === 9) {
                    cur = i;
                    break;
                }
                if (c === 10) {
                    cur = i;
                    loop = false;
                    break;
                }
            }
            let val;
            if (i === len) {
                if (this.p === 0)
                    this.bufferPrev = this.bufferPrev + this.buffer;
                else
                    this.bufferPrev = this.buffer.substring(this.p);
                this.buffer = null; //this.rs.read(bufferSize);
                if (this.buffer === null) {
                    if (this.bufferPrev === '' || ret.length === 0)
                        return;
                    val = this.bufferPrev;
                    loop = false;
                }
            }
            else {
                if (this.p === 0) {
                    val = this.bufferPrev + this.buffer.substring(0, cur);
                    this.bufferPrev = '';
                }
                else {
                    val = this.buffer.substring(this.p, cur);
                }
                if (c === 10)
                    val = val.trim();
                this.p = cur + 1;
            }
            ret.push(val);
        }
        if (ret.length === 1 && ret[0] === '')
            return [];
        return ret;
    }
    to(type, val) {
        if (val === undefined || val === '')
            return undefined;
        switch (type) {
            default: return val;
            case 'tinyint':
            case 'smallint':
            case 'int':
            case 'bigint':
            case 'dec': return Number(val);
        }
    }
    buildHeader(line) {
        let len = line.length;
        for (let i = 0; i < len; i++) {
            this.header[line[i]] = i;
        }
    }
    importData() {
        return __awaiter(this, void 0, void 0, function* () {
            debugger;
            this.bufferPrev = '';
            this.buffer = yield readFileAsync(this.filePath, 'utf8');
            this.p = 0;
            // build header
            for (;;) {
                let line = this.readLine();
                if (line === undefined)
                    break;
                if (line.length === 0)
                    continue;
                this.buildHeader(line);
                break;
            }
            console.log(this.header);
            for (;;) {
                let line = this.readLine();
                if (line === undefined)
                    break;
                if (line.length === 0)
                    continue;
                yield this.saveItem(line);
            }
        });
    }
    saveItem(line) {
        return __awaiter(this, void 0, void 0, function* () {
            let fields = this.schema.call.fields;
            let values = [];
            for (let f of fields) {
                let { name, type, tuid } = f;
                let srcVal = line[this.header[name]];
                let val;
                if (tuid === undefined) {
                    val = this.to(type, srcVal);
                }
                else {
                    val = yield this.getTuidId(tuid, srcVal);
                }
                values.push(val);
            }
            console.log(values);
        });
    }
    getTuidId(tuid, srcVal) {
        return __awaiter(this, void 0, void 0, function* () {
            return srcVal;
        });
    }
}
exports.ImportData = ImportData;
class ImportTuid extends ImportData {
    saveItem(line) {
        const _super = Object.create(null, {
            saveItem: { get: () => super.saveItem }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.saveItem.call(this, line);
        });
    }
}
class ImportMap extends ImportData {
    saveItem(line) {
        const _super = Object.create(null, {
            saveItem: { get: () => super.saveItem }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.saveItem.call(this, line);
        });
    }
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
//# sourceMappingURL=importData.js.map