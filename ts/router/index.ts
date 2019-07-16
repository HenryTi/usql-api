//export * from './router';
export * from './setting';
export * from './open';

import { Router } from 'express';
import {buildAccessRouter} from './access';
import {buildActionRouter} from './action';
import {buildBookRouter} from './book';
import {buildHistoryRouter} from './history';
import {buildQueryRouter} from './query';
import {buildSchemaRouter} from './schema';
import {buildTuidRouter} from './tuid';
import {buildSheetRouter} from './sheet';
//import {router} from './router';
import {buildImportRouter} from './import';
import { RouterBuilder } from '../core';

//import settingRouter from './setting';

export function buildEntityRouter(router:Router, rb: RouterBuilder) {
    buildAccessRouter(router, rb);
    buildActionRouter(router, rb);
    buildBookRouter(router, rb);
    buildHistoryRouter(router, rb);
    buildQueryRouter(router, rb);
    buildSchemaRouter(router, rb);
    buildTuidRouter(router, rb);
    buildSheetRouter(router, rb);
    buildImportRouter(router, rb);
}


//settingRouter(router);
