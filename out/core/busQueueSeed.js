"use strict";
/*

export function busQueuehour():number {
    return Math.floor(Date.now()/(3600*1000));
}

export function busQueueSeedFromHour(hour:number):number {
    return hour * bigNumber;
}

export function busQueueHourFromSeed(seed:number):number {
    return seed / bigNumber;
}
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.busQueueSeed = void 0;
const bigNumber = 1000000000;
function busQueueSeed() {
    return Math.floor(Date.now() / (3600 * 1000)) * bigNumber;
}
exports.busQueueSeed = busQueueSeed;
//# sourceMappingURL=busQueueSeed.js.map