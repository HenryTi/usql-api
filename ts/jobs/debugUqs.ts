import { isDevelopment } from "../core";

export const debugUqs = isDevelopment === true?
    ['salestask', 'order']
    : undefined;
