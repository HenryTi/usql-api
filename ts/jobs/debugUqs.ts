import { isDevelopment } from "../core";

export const debugUqs = isDevelopment === true?
    ['warehouse']
    : undefined;
