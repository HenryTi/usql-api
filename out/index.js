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
const start_1 = require("./start");
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.NODE_ENV) {
            console.error('NODE_ENV not defined, exit');
            process.exit();
        }
        console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);
        yield start_1.start();
        console.log('Tonva uq-api started!');
    });
})();
//# sourceMappingURL=index.js.map