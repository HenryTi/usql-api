"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function buildLicense(result) {
    if (result.length !== 1)
        return result;
    let { userLimit, concurrentLimit, accountLimit, entityLimit, dateStart, monthLimit, dogType, ext } = result[0];
    return ['license 0--0--2 ' + userLimit
            + concurrentLimit + accountLimit + entityLimit
            + dateStart + monthLimit + dogType + ext];
}
exports.buildLicense = buildLicense;
//# sourceMappingURL=buildLicense.js.map