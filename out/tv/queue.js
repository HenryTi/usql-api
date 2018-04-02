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
const bull = require("bull");
const config = require("config");
const sheetAct_1 = require("./sheetAct");
const unitx_1 = require("./unitx");
//export const queue = bull('job', 'redis://127.0.0.1:6379');
const bullConfig = config.get('bull');
exports.queue = bull(bullConfig.name, bullConfig.connection);
exports.queue.on("error", (error) => {
    console.log('queue server: ', error);
});
exports.queue.process(function (job, done) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = job.data;
        if (data === undefined) {
            done();
            return;
        }
        switch (data.job) {
            case 'sheetAct':
                yield sheetAct_1.sheetAct(data);
                done();
                return;
            case 'unitx':
                yield unitx_1.sendtoUnitx(data);
                done();
                return;
        }
        // job.data contains the custom data passed when the job was created
        // job.id contains id of this job.
        // transcode video asynchronously and report progress
        job.progress(42);
        // call done when finished
        done();
        // or give a error if error
        //done(new Error('error transcoding'));
        // or pass it a result
        //done(null, { framerate: 29.5  });
        // If the job throws an unhandled exception it is also handled correctly
        //throw new Error('some unexpected error');
    });
});
//# sourceMappingURL=queue.js.map