"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const local_1 = require("./core/local");
(function () {
    let i = 1;
    for (let item of local_1.locals) {
        if (item.length === 3)
            item[0] = i;
        else
            item.unshift(i);
        i++;
    }
    fs.writeFileSync('/newLocals', JSON.stringify(local_1.locals));
})();
//# sourceMappingURL=a.test.js.map