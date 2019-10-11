"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bigNumber = 1000000000;
function busQueuehour() {
    return Math.floor(Date.now() / (3600 * 1000));
}
exports.busQueuehour = busQueuehour;
function busQueueSeedFromHour(hour) {
    return hour * bigNumber;
}
exports.busQueueSeedFromHour = busQueueSeedFromHour;
function busQueueSeed() {
    return Math.floor(Date.now() / (3600 * 1000)) * bigNumber;
}
exports.busQueueSeed = busQueueSeed;
//# sourceMappingURL=busQueueSeed.js.map