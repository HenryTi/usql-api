"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importData = void 0;
const tool_1 = require("../tool");
//import { getRunner } from "../db";
//import { prodRouterBuilder } from "../core";
function importData(net) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let runner = yield net.getRunner('biz_license');
            if (runner === undefined)
                return;
            let unit = 99;
            let user = 99;
            let source = '#';
            let files = [
                {
                    entity: 'vendor',
                    filePath: 'C:/Users/Henry/Desktop/Results.csv',
                },
                {
                    entity: 'vendorPercentage',
                    filePath: 'C:/Users/Henry/Desktop/map.csv',
                }
            ];
            for (let f of files) {
                let { entity, filePath } = f;
                if (filePath === undefined)
                    continue;
                yield runner.importData(unit, user, source, entity, filePath);
            }
            tool_1.logger.log('files imported!');
        }
        catch (err) {
            tool_1.logger.error(err);
        }
    });
}
exports.importData = importData;
//# sourceMappingURL=index.js.map