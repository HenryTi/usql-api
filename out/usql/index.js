"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UsqlApp {
    constructor(log) {
        this.log = log || ((text) => { });
        this.ok = true;
        //this.app = new App();
    }
    setLog(log) {
        this.log = log;
    }
}
exports.UsqlApp = UsqlApp;
//# sourceMappingURL=index.js.map