import { isDevelopment } from "../core";

export const debugUqs = isDevelopment === true?
    ['salestask']
    : undefined;

//export const bench = new Bench();
