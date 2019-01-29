const bigNumber = 1000000000;

export function busQueuehour():number {
    return Math.floor(Date.now()/(3600*1000));
}

export function busQueueSeedFromHour(hour:number):number {
    return hour * bigNumber;
}

export function busQueueSeed():number {
    return Math.floor(Date.now()/(3600*1000)) * bigNumber;
}
