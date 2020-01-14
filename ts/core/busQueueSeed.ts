const bigNumber = 1000000000;

export function busQueuehour():number {
    return Math.floor(Date.now()/(3600*1000));
}

export function busQueueSeedFromHour(hour:number):number {
    return hour * bigNumber;
}

export function busQueueHourFromSeed(seed:number):number {
    return seed / bigNumber;
}

export function busQueueSeed():number {
    return Math.floor(Date.now()/(3600*1000)) * bigNumber;
}

export interface SheetQueueData {
    sheet: string;
    state: string;
    action: string;
    unit: number;
    user: number;
    id: number;
    flow: number;
}
